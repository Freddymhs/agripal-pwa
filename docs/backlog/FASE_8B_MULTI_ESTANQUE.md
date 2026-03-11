# FASE 8B: Multi-Estanque — Asignación por Zona de Cultivo

**Status**: ✅ Completada (2026-03-10)
**Prioridad**: 🟡 Media
**Dependencias**: FASE_8A (estanques físicos ✅), FASE_13 (schema Supabase ✅)

---

## Objetivo

Permitir que cada zona de cultivo indique **desde qué estanque se riega**. Hoy el consumo
descuenta del pool global del terreno (`agua_actual_m3`). En terrenos con 2+ estanques
independientes (ej: uno para cultivo norte, otro para cultivo sur), esto no refleja la
realidad operativa.

---

## Problema que Resuelve

Un terreno real puede tener:

- Estanque A (50 m³) → riega Zona Olivar
- Estanque B (20 m³) → riega Zona Limoneros

Hoy la app suma ambos y descuenta del total, sin distinguir. Si el Estanque B se vacía,
la app no lo alerta correctamente porque el agua global sigue siendo suficiente.

**Confirmado como GAP-01 en TC-018 (tests E2E FASE_13, 2026-03-10).**

---

## Reglas de Negocio

1. Una zona de cultivo puede tener un `estanque_id` opcional (el estanque que la riega)
2. Si no tiene `estanque_id`, el comportamiento actual se mantiene (pool global)
3. El consumo semanal de la zona descuenta del nivel del estanque asignado
4. Las alertas de escasez de agua se evalúan por estanque, no solo por terreno
5. El planificador 12 meses considera la capacidad individual de cada estanque

---

## Tareas

### Tarea 1: Actualizar tipo `Zona`

**Archivo**: `src/types/index.ts`

Agregar campo opcional:

```typescript
export interface Zona {
  // ... campos existentes ...
  estanque_id?: UUID; // Solo para zonas tipo 'cultivo' — el estanque que las riega
}
```

---

### Tarea 2: UI en panel edición de zona

**Archivo**: `src/components/mapa/zona-cultivo-panel.tsx`

Cuando el tipo de zona es `cultivo`, mostrar un selector "¿Qué estanque riega esta zona?":

```tsx
// Solo si hay estanques en el terreno
const estanquesDisponibles = zonas.filter((z) => z.tipo === TIPO_ZONA.ESTANQUE);

{
  estanquesDisponibles.length > 0 && (
    <div>
      <label>Estanque de riego</label>
      <select
        value={zonaEditando.estanque_id ?? ""}
        onChange={(e) =>
          actualizarZona({ estanque_id: e.target.value || undefined })
        }
      >
        <option value="">Sin asignar (usa pool global)</option>
        {estanquesDisponibles.map((e) => (
          <option key={e.id} value={e.id}>
            {e.nombre} ({e.estanque_config?.nivel_actual_m3 ?? 0} /
            {e.estanque_config?.capacidad_m3 ?? 0} m³)
          </option>
        ))}
      </select>
    </div>
  );
}
```

---

### Tarea 3: Lógica de consumo per-estanque

**Archivo**: `src/hooks/use-project-dashboard.ts`

Al calcular consumo semanal, agrupar por estanque y descontar del nivel correspondiente:

```typescript
// Consumo por zona → descontar del estanque asignado o del pool global
zonas
  .filter((z) => z.tipo === TIPO_ZONA.CULTIVO)
  .forEach((zona) => {
    const consumoZona = calcularConsumoZona(zona, plantas, cultivos);
    if (zona.estanque_id) {
      // Descontar del estanque asignado
      const estanque = zonas.find((z) => z.id === zona.estanque_id);
      if (estanque?.estanque_config) {
        estanque.estanque_config.nivel_actual_m3 -= consumoZona;
      }
    } else {
      // Fallback: descontar del pool global
      aguaGlobal -= consumoZona;
    }
  });
```

---

### Tarea 4: Alertas per-estanque

**Archivo**: `src/lib/utils/alertas.ts`

Agregar evaluación de alerta `agua_critica` por estanque individual:

```typescript
// Para cada estanque con zonas asignadas, calcular días de agua restantes
estanquesConZonas.forEach(({ estanque, zonasAsignadas }) => {
  const consumoSemanal = zonasAsignadas.reduce(
    (sum, z) => sum + calcularConsumoZona(z, plantas, cultivos),
    0,
  );
  const diasRestantes =
    (estanque.estanque_config.nivel_actual_m3 / consumoSemanal) * 7;
  if (diasRestantes < UMBRAL_DIAS_CRITICO) {
    alertas.push({
      tipo: "agua_critica",
      zona_id: estanque.id,
      mensaje: `${estanque.nombre}: ${diasRestantes.toFixed(0)} días de agua restantes`,
    });
  }
});
```

---

### Tarea 5: Migración schema Supabase

**Archivo**: `supabase/migrations/` (nueva migración)

```sql
ALTER TABLE zonas ADD COLUMN estanque_id UUID REFERENCES zonas(id) ON DELETE SET NULL;
```

También agregar a la tabla `sync_queue` el campo en el payload (ya se sincroniza automáticamente
via Dexie hooks al ser parte de `Zona`).

---

### Tarea 6: Tests

Actualizar **TC-018** en `docs/tests/e2e/specs/TC-018-multi-estanque.md`:

- Crear 2 estanques en el terreno
- Asignar zonas de cultivo a estanques distintos
- Verificar que el consumo descuenta correctamente de cada estanque
- Verificar alerta cuando un estanque individual llega a < 7 días

---

## Criterios de Éxito

- [ ] Zona de cultivo puede seleccionar estanque fuente desde su panel de edición
- [ ] El consumo semanal descuenta del estanque asignado, no del pool global
- [ ] Una alerta de `agua_critica` se genera cuando el estanque asignado llega a < 7 días
- [ ] Zonas sin estanque asignado mantienen comportamiento actual (pool global)
- [ ] Campo sincroniza correctamente con Supabase via Dexie hooks
- [ ] TC-018 pasa sin GAP-01

---

## Notas

- Esta fase NO requiere cambiar el modelo visual del mapa — los estanques ya se muestran como zonas físicas (FASE_8A)
- El impacto es bajo en terrenos con 1 solo estanque (comportamiento sin cambios)
- Prioridad sube si el usuario reporta que sus dos estanques no se monitorean correctamente
