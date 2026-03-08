# FASE 6: Integración Completa con page.tsx

## Objetivo

Conectar el nuevo componente PixiJS con `page.tsx` reemplazando `MapaTerreno`. Verificar que TODAS las funcionalidades existentes siguen intactas sin regresiones.

## Prerequisitos

- FASES 1-5 completadas

## Estrategia: Reemplazo Directo

El nuevo `PixiMapaTerreno` expone la **misma interfaz de props** que `MapaTerreno`:

```typescript
interface MapaTerrenoProps {
  terreno: Terreno;
  zonas: Zona[];
  plantas: Planta[];
  zonaSeleccionadaId?: string | null;
  zonaPreview?: ZonaPreview | null;
  modo?: "ver" | "crear_zona" | "plantar";
  cultivosEspaciado?: Record<string, number>;
  plantasSeleccionadasIds?: string[];
  onZonaClick?: (zona: Zona) => void;
  onMapClick?: (x: number, y: number) => void;
  onPlantaClick?: (planta: Planta) => void;
  onZonaCreada?: (rect: {
    x: number;
    y: number;
    ancho: number;
    alto: number;
  }) => void;
  onSeleccionMultiple?: (plantaIds: string[]) => void;
  onMoverPlantasSeleccionadas?: (
    plantaId: string,
    deltaX: number,
    deltaY: number,
  ) => Promise<void>;
}
```

## Cambio en page.tsx

```diff
- import { MapaTerreno } from '@/components/mapa/mapa-terreno'
+ import { PixiMapaTerreno } from '@/components/mapa/pixi/pixi-mapa-terreno'

// En el JSX (única línea que cambia):
- <MapaTerreno
+ <PixiMapaTerreno
    terreno={terrenoActual}
    zonas={zonas}
    plantas={plantas}
    ...mismos props...
  />
```

**Rollback:** Si hay problemas, revertir es cambiar una línea de import.

---

## Checklist de Verificación Funcional

### A. Navegación del Mapa

- [ ] Pan con drag funciona suave (60 FPS)
- [ ] Zoom con wheel funciona con focal point
- [ ] Zoom con botones (+/-) funciona
- [ ] Reset view funciona
- [ ] Escala % se muestra correctamente
- [ ] Terreno se ve con borde correcto
- [ ] Grid 1m/5m visible

### B. Zonas

- [ ] Zonas visibles con colores correctos por tipo
- [ ] Click en zona → EditorZona aparece en panel lateral
- [ ] Zona seleccionada tiene borde destacado
- [ ] Labels de zona aparecen según zoom
- [ ] Estanques muestran nivel de agua
- [ ] Crear zona nueva → draw rect → NuevaZonaModal → zona creada
- [ ] Snap guides al crear zona
- [ ] Editar zona (mover) → preview verde/rojo
- [ ] Editar zona (redimensionar) → preview actualiza
- [ ] Eliminar zona → desaparece del mapa

### C. Plantas

- [ ] Plantas visibles con colores correctos por estado
- [ ] Plantas muertas muestran X
- [ ] Click planta → PlantaInfo en panel lateral
- [ ] Plantada seleccionada tiene borde azul
- [ ] Modo plantar → click en zona → planta creada
- [ ] Grid automático → 66k+ plantas a 60 FPS
- [ ] Hover planta → cursor pointer
- [ ] Min radius: plantas no desaparecen al alejar

### D. Operaciones en Lote

- [ ] Shift+drag → selección múltiple
- [ ] Rectángulo azul de selección visible
- [ ] AccionesLote aparece con conteo correcto
- [ ] Cambiar estado múltiple → colores actualizan
- [ ] Eliminar múltiple → plantas desaparecen
- [ ] Drag plantas seleccionadas → preview amarilla
- [ ] Drop → posiciones actualizadas correctamente
- [ ] Escape → deseleccionar

### E. Modos de Interacción

- [ ] Modo 'ver' → pan/zoom + selección
- [ ] Modo 'crear_zona' → draw rect + snap guides
- [ ] Modo 'plantar' → click para plantar
- [ ] Cambio entre modos funciona sin errores

### F. Edge Cases

- [ ] Cambiar terreno → recarga completa del canvas
- [ ] Agregar planta individual → aparece sin rebuild completo
- [ ] Eliminar planta → desaparece sin rebuild completo
- [ ] Zona sin plantas → se ve correctamente
- [ ] Terreno sin zonas → solo grid y borde
- [ ] Zoom extremo (0.3x) → todo visible
- [ ] Zoom extremo (20x) → detalle visible
- [ ] Resize browser → canvas se adapta
- [ ] PWA: app funciona offline

### G. Rendimiento

- [ ] 66,600 plantas: 60 FPS constante en pan/zoom
- [ ] Memory: < 20 MB para rendering
- [ ] `pnpm build` sin errores
- [ ] Sin memory leaks al navegar (DevTools Memory → Heap snapshot)

---

## Manejo de Estado: React vs PixiJS

**Principio clave:** Pan/zoom NUNCA pasan por React. Solo los cambios de datos (CRUD) causan re-renders.

```
ACCIONES QUE NO CAUSAN RE-RENDER:
├── Pan (drag)          → muta container.position directamente
├── Zoom (wheel)        → muta container.scale directamente
├── Hover               → cambia cursor CSS directamente
└── Draw overlays       → muta Graphics directamente

ACCIONES QUE CAUSAN RE-RENDER:
├── Crear/eliminar planta  → plantas[] cambia → rebuild ParticleContainer
├── Crear/eliminar zona    → zonas[] cambia → rebuild zonas layer
├── Seleccionar planta     → state cambia → update selección
├── Cambiar modo           → state cambia → cambiar handlers
└── Editar zona            → props preview → update overlay
```

---

## Notas de Implementación

### MapaControls

`MapaControls` es HTML overlay (no SVG/Canvas), así que se monta normalmente:

```typescript
<MapaControls
  onZoomIn={viewport.zoomIn}
  onZoomOut={viewport.zoomOut}
  onReset={viewport.resetView}
  scale={scaleDisplay}  // useState que se actualiza periódicamente
  hasSelection={!!props.zonaSeleccionadaId}
/>
```

**Problema:** `viewport.getScale()` es un ref, no un state → MapaControls no re-renderiza.

**Solución:** Actualizar un state `scaleDisplay` con throttle (100ms) desde un callback de viewport:

```typescript
const [scaleDisplay, setScaleDisplay] = useState(1);

// En el hook de viewport, emitir callback on scale change
useEffect(() => {
  const interval = setInterval(() => {
    setScaleDisplay(viewport.getScale());
  }, 100);
  return () => clearInterval(interval);
}, [viewport]);
```

### Info Panel (bottom-left)

El panel de información (área terreno, área usada, etc.) es HTML overlay y se mantiene igual.

### Mode Indicators (top-left)

Los indicadores de modo actual y coordenadas del cursor son HTML overlays.

---

## Testing de Fase 6

La testing de esta fase ES el checklist completo de arriba. Todas las casillas deben estar marcadas antes de considerar la fase completa.

## Resultado de esta Fase

Aplicación completamente funcional con PixiJS. Todas las funcionalidades de la versión SVG están replicadas con rendimiento de 60 FPS.
