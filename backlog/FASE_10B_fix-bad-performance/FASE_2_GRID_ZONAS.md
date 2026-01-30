# FASE 2: Grid Visual + Zonas (Graphics)

## Objetivo
Renderizar el grid visual (líneas 1m y 5m) y las zonas (rectángulos con color, labels, estanques) usando PixiJS Graphics. Sin plantas todavía.

## Prerequisitos
- FASE 1 completada (Application + pan/zoom funcionando)

## Archivos a Crear

### 1. `src/components/mapa/pixi/pixi-grid-layer.ts`

Clase que dibuja el grid visual usando PixiJS Graphics.

**Reemplaza:** `src/components/mapa/mapa-grid.tsx` (55 líneas, SVG patterns)

**Diferencia con SVG:**
- SVG usa `<pattern>` + `<defs>` → eficiente porque los patterns se repiten via GPU
- PixiJS usa `Graphics.moveTo/lineTo` → igualmente eficiente porque son líneas simples
- Para terreno 600×1000m: 600+1000 = 1,600 líneas de 1m + 120+200 = 320 de 5m → trivial para GPU

**Implementación:**
```typescript
export class PixiGridLayer {
  container: Container
  private grid1m: Graphics
  private grid5m: Graphics

  constructor() {
    this.container = new Container()
    this.grid1m = new Graphics()
    this.grid5m = new Graphics()
    this.container.addChild(this.grid1m)
    this.container.addChild(this.grid5m)
  }

  build(anchoMetros: number, altoMetros: number): void {
    const w = anchoMetros * PIXELS_POR_METRO
    const h = altoMetros * PIXELS_POR_METRO
    const step1m = PIXELS_POR_METRO
    const step5m = PIXELS_POR_METRO * 5

    // Grid 1m
    this.grid1m.clear()
    for (let x = 0; x <= w; x += step1m) {
      this.grid1m.moveTo(x, 0).lineTo(x, h)
    }
    for (let y = 0; y <= h; y += step1m) {
      this.grid1m.moveTo(0, y).lineTo(w, y)
    }
    this.grid1m.stroke({ color: 0x9ca3af, width: 0.5, alpha: 0.1 })

    // Grid 5m
    this.grid5m.clear()
    for (let x = 0; x <= w; x += step5m) {
      this.grid5m.moveTo(x, 0).lineTo(x, h)
    }
    for (let y = 0; y <= h; y += step5m) {
      this.grid5m.moveTo(0, y).lineTo(w, y)
    }
    this.grid5m.stroke({ color: 0x9ca3af, width: 1, alpha: 0.2 })
  }

  destroy(): void {
    this.grid1m.destroy()
    this.grid5m.destroy()
    this.container.destroy()
  }
}
```

---

### 2. `src/components/mapa/pixi/pixi-zonas-layer.ts`

Clase que renderiza todas las zonas como Graphics interactivos.

**Reemplaza:** `src/components/mapa/zona-rect.tsx` (182 líneas) - solo la parte de zona (rect + labels + estanque), NO las plantas

**Funcionalidades a replicar:**
1. Rectángulo con fill (color + alpha) y stroke
2. Borde negro punteado si zona seleccionada
3. Label con nombre (solo si `scale < 5` y `area >= 10m²`)
4. Mini label si zona pequeña (`scale < 8` y `area < 10m²`)
5. Estanque: barra de agua (fill cyan) + porcentaje texto
6. Click handler → `onZonaClick(zona)`

**Implementación:**
```typescript
export class PixiZonasLayer {
  container: Container
  private zonaGraphics: Map<string, Graphics> = new Map()
  private zonaLabels: Map<string, Text> = new Map()

  constructor() {
    this.container = new Container()
  }

  build(
    zonas: Zona[],
    zonaSeleccionadaId: string | null,
    scale: number,
    onZonaClick: (zona: Zona) => void
  ): void {
    this.clear()

    for (const zona of zonas) {
      const g = new Graphics()
      const x = zona.x * PIXELS_POR_METRO
      const y = zona.y * PIXELS_POR_METRO
      const w = zona.ancho * PIXELS_POR_METRO
      const h = zona.alto * PIXELS_POR_METRO
      const colorHex = COLORES_ZONA_HEX[zona.tipo] || 0x374151

      // Fill
      g.rect(x, y, w, h)
      g.fill({ color: colorHex, alpha: 0.5 })
      g.stroke({ color: colorHex, width: zona.id === zonaSeleccionadaId ? 3 : 1 })

      // Selección: borde adicional
      if (zona.id === zonaSeleccionadaId) {
        g.rect(x, y, w, h)
        g.stroke({ color: 0x000000, width: 2 })
      }

      // Estanque: barra de agua
      if (zona.tipo === 'estanque' && zona.estanque_config) {
        const cfg = zona.estanque_config
        const porcentaje = (cfg.nivel_actual_m3 / cfg.capacidad_m3) * 100
        const fillH = h * (porcentaje / 100)
        g.rect(x, y + h - fillH, w, fillH)
        g.fill({ color: 0x06b6d4, alpha: 0.3 + 0.5 * (porcentaje / 100) })
      }

      // Interactividad
      g.eventMode = 'static'
      g.cursor = 'pointer'
      g.hitArea = { contains: (px, py) => px >= x && px <= x+w && py >= y && py <= y+h }
      g.on('pointertap', () => onZonaClick(zona))

      this.container.addChild(g)
      this.zonaGraphics.set(zona.id, g)

      // Labels (adaptivos al zoom)
      const areaM2 = zona.ancho * zona.alto
      const showLabel = scale < 5 && areaM2 >= 10
      const showMiniLabel = scale < 8 && areaM2 < 10

      if (showLabel || showMiniLabel) {
        const fontSize = showMiniLabel ? Math.max(8, 12 / scale) : Math.max(10, 14 / scale)
        const text = new Text({
          text: zona.nombre,
          style: { fontSize, fill: 0x1f2937, fontFamily: 'sans-serif' }
        })
        text.position.set(x + w / 2, y + h / 2)
        text.anchor.set(0.5)
        this.container.addChild(text)
        this.zonaLabels.set(zona.id, text)
      }
    }
  }

  updateScale(scale: number, zonas: Zona[]): void {
    // Actualizar visibilidad/tamaño de labels según zoom
    for (const zona of zonas) {
      const label = this.zonaLabels.get(zona.id)
      if (label) {
        const areaM2 = zona.ancho * zona.alto
        const showLabel = scale < 5 && areaM2 >= 10
        const showMiniLabel = scale < 8 && areaM2 < 10
        label.visible = showLabel || showMiniLabel
        if (label.visible) {
          const fontSize = (showMiniLabel ? 12 : 14) / scale
          label.style.fontSize = Math.max(8, fontSize)
        }
      }
    }
  }

  clear(): void {
    this.zonaGraphics.forEach(g => g.destroy())
    this.zonaLabels.forEach(t => t.destroy())
    this.zonaGraphics.clear()
    this.zonaLabels.clear()
    this.container.removeChildren()
  }

  destroy(): void {
    this.clear()
    this.container.destroy()
  }
}
```

**Nota sobre Text en PixiJS v8:**
- `Text` es la opción para texto dinámico
- `BitmapText` es más rápido pero requiere pre-generar font atlas
- Para labels de zonas (< 20 textos), `Text` es suficiente

---

## Integración con pixi-mapa-terreno-inner.tsx

```typescript
// Dentro del componente:
const gridLayerRef = useRef<PixiGridLayer | null>(null)
const zonasLayerRef = useRef<PixiZonasLayer | null>(null)

useEffect(() => {
  if (!worldRef.current || !app) return

  // Grid
  const grid = new PixiGridLayer()
  grid.build(props.terreno.ancho_m, props.terreno.alto_m)
  worldRef.current.addChild(grid.container)
  gridLayerRef.current = grid

  // Zonas
  const zonasLayer = new PixiZonasLayer()
  worldRef.current.addChild(zonasLayer.container)
  zonasLayerRef.current = zonasLayer

  return () => {
    grid.destroy()
    zonasLayer.destroy()
  }
}, [app])

// Rebuild zonas cuando cambian
useEffect(() => {
  if (!zonasLayerRef.current) return
  zonasLayerRef.current.build(
    props.zonas,
    props.zonaSeleccionadaId || null,
    viewport.getScale(),
    (zona) => props.onZonaClick?.(zona)
  )
}, [props.zonas, props.zonaSeleccionadaId])
```

---

## Testing de Fase 2

| Test | Cómo verificar | Esperado |
|------|---------------|----------|
| Grid 1m | Zoom in > 2x | Líneas finas cada metro |
| Grid 5m | Zoom normal | Líneas más gruesas cada 5 metros |
| Zonas visibles | Crear zonas | Rectángulos con colores correctos |
| Zona seleccionada | Click en zona | Borde negro/grueso |
| Labels adaptativos | Zoom in/out | Labels aparecen/desaparecen según zoom |
| Estanque | Zona tipo estanque | Barra de agua cyan con nivel correcto |
| Click zona | Click en zona | `onZonaClick` se dispara, panel lateral muestra EditorZona |
| Render performance | DevTools Performance | < 16.6ms/frame con 10+ zonas |

## Resultado de esta Fase
Mapa con grid visual y zonas interactivas renderizadas via PixiJS Graphics. Visualmente idéntico al SVG actual pero sin plantas.
