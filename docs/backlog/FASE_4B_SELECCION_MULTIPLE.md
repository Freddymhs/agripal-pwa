# FASE 4B: Selección Múltiple de Plantas

**Status**: ✅ COMPLETADA
**Prioridad**: 🟡 Media
**Dependencias**: FASE_4
**Estimación**: 3-4 horas

---

## Objetivo

Permitir seleccionar múltiples plantas arrastrando un rectángulo de selección (estilo Windows/macOS) para realizar acciones en lote como cambiar estado o eliminar.

---

## Funcionalidad

### Activación

- Modo: "Seleccionar" (modo === 'ver')
- Acción: Click + arrastrar en área vacía o sobre plantas
- Visual: Rectángulo de selección semi-transparente azul

### Selección

- Plantas dentro del rectángulo quedan seleccionadas
- Indicador visual: borde especial o highlight en plantas seleccionadas
- Contador en UI: "X plantas seleccionadas"

### Acciones en Lote

Una vez seleccionadas múltiples plantas:

1. **Cambiar estado** (dropdown):
   - Semilla → Creciendo → Produciendo → Muerta

2. **Eliminar todas**:
   - Confirmación: "¿Eliminar X plantas?"

3. **Deseleccionar**:
   - Click fuera o botón "Cancelar selección"

---

## UI Propuesta

### Barra de acciones (aparece con selección múltiple)

```
┌─────────────────────────────────────────────────────┐
│ 🌱 12 plantas seleccionadas                         │
│ [Cambiar estado ▼] [Eliminar] [Cancelar]           │
└─────────────────────────────────────────────────────┘
```

### Rectángulo de selección

- Color: `rgba(59, 130, 246, 0.2)` (azul semi-transparente)
- Borde: `#3b82f6` (azul) punteado

---

## Tareas

### Tarea 1: Estado de Selección Múltiple

**Archivo**: `src/app/page.tsx` (modificar)

Agregar estados para manejar selección múltiple:

```typescript
const [plantasSeleccionadas, setPlantasSeleccionadas] = useState<string[]>([]);
const [selectionRect, setSelectionRect] = useState<{
  x: number;
  y: number;
  ancho: number;
  alto: number;
} | null>(null);
const [isSelecting, setIsSelecting] = useState(false);
```

---

### Tarea 2: Rectángulo de Selección en Mapa

**Archivo**: `src/components/mapa/mapa-terreno.tsx` (modificar)

- Detectar drag en modo 'ver' cuando no hay zona seleccionada
- Dibujar rectángulo azul semi-transparente mientras se arrastra
- Calcular plantas dentro del rectángulo al soltar

---

### Tarea 3: Indicador Visual de Plantas Seleccionadas

**Archivo**: `src/components/mapa/planta-marker.tsx` (modificar)

Agregar prop `isSelected` para mostrar borde especial:

```typescript
interface PlantaMarkerProps {
  // ... existentes
  isSelected?: boolean;
}
```

---

### Tarea 4: Barra de Acciones en Lote

**Archivo**: `src/components/plantas/acciones-lote.tsx` (crear)

Componente con:

- Contador: "X plantas seleccionadas"
- Dropdown: Cambiar estado
- Botón: Eliminar (con confirmación)
- Botón: Cancelar selección

---

### Tarea 5: Hook usePlantasLote

**Archivo**: `src/hooks/usePlantasLote.ts` (crear)

```typescript
export function usePlantasLote(onRefetch: () => void) {
  const cambiarEstadoMultiple = async (ids: string[], estado: EstadoPlanta) => {
    await Promise.all(
      ids.map((id) =>
        db.plantas.update(id, { estado, updated_at: getCurrentTimestamp() }),
      ),
    );
    onRefetch();
  };

  const eliminarMultiple = async (ids: string[]) => {
    await db.plantas.bulkDelete(ids);
    onRefetch();
  };

  return { cambiarEstadoMultiple, eliminarMultiple };
}
```

---

### Tarea 6: Integración en Página Principal

**Archivo**: `src/app/page.tsx` (modificar)

- Mostrar `AccionesLote` cuando hay plantas seleccionadas
- Conectar con `usePlantasLote`
- Manejar Escape para deseleccionar
- Click fuera deselecciona

---

## Criterios de Aceptación

- [x] Click + arrastrar en modo Seleccionar dibuja rectángulo de selección
- [x] Plantas dentro del rectángulo quedan seleccionadas visualmente
- [x] UI muestra contador de plantas seleccionadas
- [x] Botón "Cambiar estado" aplica a todas las seleccionadas
- [x] Botón "Eliminar" elimina todas con confirmación
- [x] Click fuera deselecciona todo
- [x] Tecla Escape deselecciona todo
- [x] Funciona correctamente con zoom/pan

---

## Notas

- Esta feature mejora significativamente la UX para manejo de muchas plantas
- Útil para marcar cosechas completas como "produciendo" o limpiar plantas muertas
- Considerar también selección con Ctrl+Click para agregar/quitar individualmente
