# FASE 8A: Estanques de Agua

**Status**: ✅ COMPLETADA
**Prioridad**: 🔴 Alta (bloquea FASE_8)
**Dependencias**: FASE_7

---

## Objetivo

Representar físicamente los estanques de agua dentro del terreno. El estanque es donde se almacena el agua que llega (camión aljibe, pozo, etc.) y desde donde se distribuye al riego.

---

## Problema que Resuelve

Actualmente el agua existe "mágicamente" en `terreno.agua_actual_m3` sin representación física. En la realidad:

1. El agua llega (camión aljibe, pozo, etc.)
2. Se deposita en un **estanque físico** dentro del lote
3. Ese estanque **ocupa espacio real** (no puedes plantar ahí)
4. De ahí se distribuye al sistema de riego

---

## Reglas de Negocio

1. **Estanque es una zona física** - Se dibuja en el mapa como cualquier otra zona
2. **Ocupa espacio** - No se pueden colocar plantas en zona tipo estanque
3. **Capacidad definida** - Cada estanque tiene capacidad máxima en m³
4. **Nivel actual** - Cuánta agua tiene actualmente
5. **Fuente asociada** - De dónde viene el agua (proveedor, pozo, río)
6. **Múltiples estanques** - Un terreno puede tener varios estanques
7. **Agua del terreno** - `agua_actual_m3` = suma de todos los estanques
8. **Entradas de agua** - Van a un estanque específico, no al terreno genérico

---

## Tareas

### Tarea 1: Agregar TipoZona 'estanque'
**Archivo**: `src/types/index.ts` (modificar)

**Cambios:**
1. Agregar `'estanque'` a `TipoZona`
2. Agregar color cyan/azul a `COLORES_ZONA`
3. Crear interface `EstanqueConfig`:

```typescript
export interface EstanqueConfig {
  capacidad_m3: MetrosCubicos
  nivel_actual_m3: MetrosCubicos
  fuente_id?: string  // ID del proveedor o fuente
  material?: 'plastico' | 'cemento' | 'geomembrana' | 'metalico'
  tiene_tapa?: boolean
  tiene_filtro?: boolean
}
```

4. Agregar campo opcional a Zona:
```typescript
estanque_config?: EstanqueConfig
```

---

### Tarea 2: Actualizar Componente de Creación de Zonas
**Archivo**: `src/components/zonas/ZonaForm.tsx` (modificar)

**Cambios:**
1. Agregar "Estanque" a las opciones de tipo de zona
2. Si tipo === 'estanque', mostrar campos adicionales:
   - Capacidad (m³) - requerido
   - Material (select)
   - ¿Tiene tapa? (checkbox)
   - ¿Tiene filtro? (checkbox)
3. Calcular nivel_actual_m3 = 0 al crear (vacío)

---

### Tarea 3: Actualizar Visualización del Mapa
**Archivo**: `src/components/mapa/ZonaRect.tsx` (modificar)

**Cambios:**
1. Si zona.tipo === 'estanque':
   - Mostrar nivel de agua visualmente (barra o porcentaje)
   - Color de fondo que refleje el nivel (más oscuro = más lleno)
   - Icono de agua o ondas
2. Mostrar capacidad y nivel en tooltip/etiqueta

---

### Tarea 4: Hook useEstanques
**Archivo**: `src/hooks/useEstanques.ts` (crear)

```typescript
interface UseEstanques {
  estanques: Zona[]  // zonas tipo estanque
  aguaTotalDisponible: number  // suma de capacidades
  aguaTotalActual: number  // suma de niveles actuales

  agregarAgua: (estanqueId: UUID, cantidad: number) => Promise<void>
  transferirAgua: (origenId: UUID, destinoId: UUID, cantidad: number) => Promise<void>
  obtenerEstanquePrincipal: () => Zona | null
}
```

---

### Tarea 5: Modificar Entradas de Agua
**Archivo**: `src/types/index.ts` (modificar)

**Cambios en EntradaAgua:**
```typescript
export interface EntradaAgua {
  // ... campos existentes ...
  estanque_id?: UUID  // A qué estanque fue el agua
}
```

---

### Tarea 6: Actualizar Hook useAgua
**Archivo**: `src/hooks/useAgua.ts` (modificar)

**Cambios:**
1. `registrarEntrada` ahora recibe `estanque_id`
2. Actualiza `nivel_actual_m3` del estanque, no `agua_actual_m3` del terreno
3. Agregar función para calcular agua total del terreno (suma estanques)

---

### Tarea 7: INTEGRACIÓN - Panel de Estanques
**Archivo**: `src/components/agua/PanelEstanques.tsx` (crear)

**Funcionalidad:**
1. Lista de estanques del terreno con nivel visual
2. Botón "Agregar Agua" por estanque
3. Ver historial de entradas por estanque
4. Resumen total: agua disponible vs capacidad total

---

## Criterios de Aceptación

- [ ] Se puede crear zona tipo "estanque" desde el mapa
- [ ] Estanque muestra capacidad y nivel visualmente
- [ ] No se pueden colocar plantas en zonas estanque
- [ ] Entradas de agua van a estanque específico
- [ ] Agua total del terreno = suma de niveles de estanques
- [ ] Panel muestra todos los estanques con sus niveles
- [ ] Al seleccionar estanque se puede agregar agua

---

## Migración de Datos

Si ya existen terrenos con `agua_actual_m3 > 0`:
- Crear estanque "default" automáticamente
- Transferir agua_actual_m3 al estanque default
- Marcar para que usuario configure después

---

## Siguiente Fase

**FASE_8** - Control de Agua (ahora usa estanques)
