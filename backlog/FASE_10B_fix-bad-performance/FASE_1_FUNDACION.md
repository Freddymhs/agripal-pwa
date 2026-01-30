# FASE 1: Fundación PixiJS (Canvas vacío + Pan/Zoom)

## Objetivo
Montar una Application de PixiJS v8 dentro del layout existente con pan/zoom funcional, sin renderizar contenido todavía. Verificar que el canvas WebGL se monta, redimensiona y destruye correctamente.

## Dependencias
```bash
pnpm add pixi.js@^8 rbush @types/rbush
```

## Archivos a Crear

### 1. `src/components/mapa/pixi/pixi-constants.ts`

Constantes compartidas por todos los módulos PixiJS.

```typescript
export const PIXELS_POR_METRO = 10
export const MIN_SCALE = 0.3
export const MAX_SCALE = 20
export const BG_COLOR = 0xf0f8f0

export const COLORES_ESTADO_PLANTA_HEX: Record<string, number> = {
  plantada: 0x84cc16,
  creciendo: 0x22c55e,
  produciendo: 0xf59e0b,
  muerta: 0x6b7280,
}

export const COLORES_ZONA_HEX: Record<string, number> = {
  cultivo: 0x22c55e,
  bodega: 0xa16207,
  casa: 0x3b82f6,
  camino: 0x6b7280,
  decoracion: 0xa855f7,
  estanque: 0x06b6d4,
  otro: 0x374151,
}

export const COLOR_SELECCION = 0x3b82f6
export const COLOR_SNAP = 0xf97316
export const COLOR_PREVIEW_VALIDA = 0x22c55e
export const COLOR_PREVIEW_INVALIDA = 0xef4444
export const COLOR_BORDE_TERRENO = 0x94a3b8
export const COLOR_HOVER = 0xfbbf24
```

---

### 2. `src/components/mapa/pixi/use-pixi-app.ts`

Hook que crea y destruye la instancia de PixiJS Application.

**Responsabilidades:**
- Crear `new Application()` y llamar `await app.init()`
- Append `app.canvas` al div contenedor
- Manejar resize con `ResizeObserver`
- Cleanup completo al desmontar

**API de PixiJS v8:**
```typescript
import { Application } from 'pixi.js'

const app = new Application()
await app.init({
  width: containerWidth,
  height: containerHeight,
  backgroundColor: BG_COLOR,
  antialias: true,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
  preference: 'webgl',  // WebGL2 preferido
})
```

**Interface del hook:**
```typescript
function usePixiApp(containerRef: RefObject<HTMLDivElement | null>): {
  app: Application | null
  isReady: boolean
}
```

**Notas importantes:**
- `app.init()` es async (cambio de v7 a v8)
- `resolution: devicePixelRatio` para HiDPI/Retina
- `autoDensity: true` escala el CSS del canvas automáticamente
- ResizeObserver debe llamar `app.renderer.resize(newW, newH)`

---

### 3. `src/components/mapa/pixi/use-pixi-viewport.ts`

Hook que maneja pan/zoom directamente sobre un Container de PixiJS.

**Diferencia CLAVE vs `useMapControls.ts` actual:**
- El hook actual guarda `scale` y `offset` en React state → cada cambio causa re-render
- El nuevo hook muta directamente `container.position` y `container.scale` → 0 React re-renders durante pan/zoom
- Solo expone `scale` como ref para que MapaControls muestre el porcentaje

**Interface del hook:**
```typescript
function usePixiViewport(
  app: Application | null,
  worldContainer: Container | null,
  options?: { minScale?: number; maxScale?: number }
): {
  scaleRef: MutableRefObject<number>
  offsetRef: MutableRefObject<{ x: number; y: number }>
  zoomIn: () => void
  zoomOut: () => void
  resetView: () => void
  getScale: () => number
}
```

**Eventos (registrados directamente en app.stage):**
- `wheel` → zoom: `worldContainer.scale.set(newScale)`, ajustar position para zoom focal
- `pointerdown` → iniciar pan: guardar `lastPos`
- `globalpointermove` → pan: calcular delta, `worldContainer.position.set(newX, newY)`
- `pointerup` / `pointerupoutside` → terminar pan

**Zoom con punto focal (mantener posición del cursor estable):**
```typescript
const worldPos = worldContainer.toLocal(event.global)
worldContainer.scale.set(newScale)
const newScreenPos = worldContainer.toGlobal(worldPos)
worldContainer.position.x -= (newScreenPos.x - event.global.x)
worldContainer.position.y -= (newScreenPos.y - event.global.y)
```

---

### 4. `src/components/mapa/pixi/pixi-mapa-terreno-inner.tsx`

Componente React interno que orquesta todo PixiJS. Se carga con `dynamic({ ssr: false })`.

**Estructura:**
```typescript
'use client'

export function PixiMapaTerrenoInner(props: MapaTerrenoProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { app, isReady } = usePixiApp(containerRef)
  const worldRef = useRef<Container | null>(null)

  // Crear world container una vez
  useEffect(() => {
    if (!app) return
    const world = new Container()
    app.stage.addChild(world)
    worldRef.current = world
    return () => { app.stage.removeChild(world) }
  }, [app])

  const viewport = usePixiViewport(app, worldRef.current)

  // Terreno border
  useEffect(() => {
    if (!worldRef.current) return
    const border = new Graphics()
    const w = props.terreno.ancho_m * PIXELS_POR_METRO
    const h = props.terreno.alto_m * PIXELS_POR_METRO
    border.rect(0, 0, w, h)
    border.stroke({ color: COLOR_BORDE_TERRENO, width: 2 })
    worldRef.current.addChild(border)
    return () => { worldRef.current?.removeChild(border); border.destroy() }
  }, [props.terreno, app])

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />
      {/* HTML Overlays */}
      <MapaControls
        onZoomIn={viewport.zoomIn}
        onZoomOut={viewport.zoomOut}
        onReset={viewport.resetView}
        scale={viewport.getScale()}
        hasSelection={!!props.zonaSeleccionadaId}
      />
      {/* Info panel, mode indicators - HTML absoluto */}
    </div>
  )
}
```

---

### 5. `src/components/mapa/pixi/pixi-mapa-terreno.tsx`

Wrapper con `next/dynamic` para evitar SSR.

```typescript
import dynamic from 'next/dynamic'

const PixiMapaTerrenoInner = dynamic(
  () => import('./pixi-mapa-terreno-inner').then(m => ({ default: m.PixiMapaTerrenoInner })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-green-50 flex items-center justify-center">
        <span className="text-gray-400">Cargando mapa...</span>
      </div>
    ),
  }
)

export { PixiMapaTerrenoInner as PixiMapaTerreno }
```

---

## Testing de Fase 1

| Test | Cómo verificar | Esperado |
|------|---------------|----------|
| Canvas WebGL se monta | Abrir app, ver canvas en el DOM | Canvas visible con fondo verde claro |
| Pan funciona | Drag con mouse | Movimiento suave a 60 FPS |
| Zoom funciona | Scroll wheel | Zoom in/out entre 0.3x - 20x a 60 FPS |
| Zoom focal | Scroll sobre un punto | El punto bajo el cursor se mantiene fijo |
| Resize | Cambiar tamaño del browser | Canvas se ajusta sin distorsión |
| Destrucción limpia | Navegar fuera y volver | Sin memory leaks (DevTools Memory) |
| MapaControls | Click en +/-/reset | Zoom funciona desde botones |
| SSR | `pnpm build` | Sin errores de `window is not defined` |
| Borde terreno | Visual | Rectángulo del terreno visible con borde gris |

## Resultado de esta Fase
Un canvas WebGL vacío con borde del terreno, pan/zoom suave, y controles HTML overlay. Base para construir las fases siguientes.
