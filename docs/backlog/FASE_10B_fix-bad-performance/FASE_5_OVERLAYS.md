# FASE 5: Overlays (Selección, Snap Guides, Previews)

## Objetivo

Implementar todos los overlays visuales interactivos: rectángulo de selección, snap guides, zona preview, draw preview de zona nueva, y preview de movimiento de plantas.

## Prerequisitos

- FASE 4 completada (hit testing funcional)

## Funcionalidades a replicar del SVG actual

### En mapa-terreno.tsx (SVG actual):

1. **Rectángulo de selección** (Shift+drag en modo 'ver')
   - Rectángulo azul semitransparente con borde punteado
   - Muestra mientras arrastra

2. **Snap guides** (modo 'crear_zona')
   - Líneas naranja punteadas vertical/horizontal
   - Aparecen cuando el cursor está cerca de bordes de zonas/terreno
   - Threshold: 0.5m

3. **Zona preview** (desde EditorZona)
   - Rectángulo punteado verde (válida) o rojo (inválida)
   - Muestra preview de posición/tamaño al editar zona

4. **Draw zona nueva** (modo 'crear_zona')
   - Rectángulo verde semitransparente mientras se dibuja
   - Muestra dimensiones en metros (texto)

5. **Plants drag preview** (arrastrando plantas seleccionadas)
   - Círculos amarillos semitransparentes en posiciones destino
   - Preview de movimiento antes de confirmar

---

## Archivos a Crear

### 1. `src/components/mapa/pixi/pixi-overlay-layer.ts`

```typescript
import { Container, Graphics, Text } from "pixi.js";
import {
  PIXELS_POR_METRO,
  COLOR_SELECCION,
  COLOR_SNAP,
  COLOR_PREVIEW_VALIDA,
  COLOR_PREVIEW_INVALIDA,
  COLOR_HOVER,
} from "./pixi-constants";

export class PixiOverlayLayer {
  container: Container;
  private selectionGraphics: Graphics;
  private snapGraphics: Graphics;
  private zonaPreviewGraphics: Graphics;
  private drawZonaGraphics: Graphics;
  private plantaPreviewGraphics: Graphics;
  private dimensionText: Text;

  constructor() {
    this.container = new Container();

    this.selectionGraphics = new Graphics();
    this.snapGraphics = new Graphics();
    this.zonaPreviewGraphics = new Graphics();
    this.drawZonaGraphics = new Graphics();
    this.plantaPreviewGraphics = new Graphics();
    this.dimensionText = new Text({
      text: "",
      style: { fontSize: 14, fill: 0x1f2937, fontFamily: "monospace" },
    });
    this.dimensionText.visible = false;

    this.container.addChild(this.selectionGraphics);
    this.container.addChild(this.snapGraphics);
    this.container.addChild(this.zonaPreviewGraphics);
    this.container.addChild(this.drawZonaGraphics);
    this.container.addChild(this.plantaPreviewGraphics);
    this.container.addChild(this.dimensionText);
  }

  // ─────────────────────────────────────────────
  // 1. RECTÁNGULO DE SELECCIÓN (Shift+drag)
  // ─────────────────────────────────────────────
  drawSelectionRect(
    start: { x: number; y: number },
    current: { x: number; y: number },
    scale: number,
  ): void {
    const g = this.selectionGraphics;
    g.clear();

    const x = Math.min(start.x, current.x);
    const y = Math.min(start.y, current.y);
    const w = Math.abs(current.x - start.x);
    const h = Math.abs(current.y - start.y);

    // Fill semitransparente
    g.rect(x, y, w, h);
    g.fill({ color: COLOR_SELECCION, alpha: 0.15 });

    // Borde (adaptado al zoom)
    g.rect(x, y, w, h);
    g.stroke({ color: COLOR_SELECCION, width: 2 / scale });
  }

  clearSelectionRect(): void {
    this.selectionGraphics.clear();
  }

  // ─────────────────────────────────────────────
  // 2. SNAP GUIDES (modo crear_zona)
  // ─────────────────────────────────────────────
  drawSnapGuides(
    verticalX: number | null,
    horizontalY: number | null,
    terrenoAncho: number,
    terrenoAlto: number,
    scale: number,
  ): void {
    const g = this.snapGraphics;
    g.clear();

    const maxW = terrenoAncho * PIXELS_POR_METRO;
    const maxH = terrenoAlto * PIXELS_POR_METRO;
    const lineWidth = 1.5 / scale;

    if (verticalX !== null) {
      const x = verticalX * PIXELS_POR_METRO;
      g.moveTo(x, 0).lineTo(x, maxH);
      g.stroke({ color: COLOR_SNAP, width: lineWidth, alpha: 0.8 });
    }

    if (horizontalY !== null) {
      const y = horizontalY * PIXELS_POR_METRO;
      g.moveTo(0, y).lineTo(maxW, y);
      g.stroke({ color: COLOR_SNAP, width: lineWidth, alpha: 0.8 });
    }
  }

  clearSnapGuides(): void {
    this.snapGraphics.clear();
  }

  // ─────────────────────────────────────────────
  // 3. ZONA PREVIEW (desde EditorZona)
  // ─────────────────────────────────────────────
  drawZonaPreview(
    preview: {
      x: number;
      y: number;
      ancho: number;
      alto: number;
      esValida: boolean;
    },
    scale: number,
  ): void {
    const g = this.zonaPreviewGraphics;
    g.clear();

    const x = preview.x * PIXELS_POR_METRO;
    const y = preview.y * PIXELS_POR_METRO;
    const w = preview.ancho * PIXELS_POR_METRO;
    const h = preview.alto * PIXELS_POR_METRO;
    const color = preview.esValida
      ? COLOR_PREVIEW_VALIDA
      : COLOR_PREVIEW_INVALIDA;

    g.rect(x, y, w, h);
    g.fill({ color, alpha: 0.2 });
    g.rect(x, y, w, h);
    g.stroke({ color, width: 2 / scale });
  }

  clearZonaPreview(): void {
    this.zonaPreviewGraphics.clear();
  }

  // ─────────────────────────────────────────────
  // 4. DRAW ZONA NUEVA (modo crear_zona)
  // ─────────────────────────────────────────────
  drawCreateZona(
    start: { x: number; y: number },
    current: { x: number; y: number },
    scale: number,
  ): void {
    const g = this.drawZonaGraphics;
    g.clear();

    const x = Math.min(start.x, current.x);
    const y = Math.min(start.y, current.y);
    const w = Math.abs(current.x - start.x);
    const h = Math.abs(current.y - start.y);

    g.rect(x, y, w, h);
    g.fill({ color: COLOR_PREVIEW_VALIDA, alpha: 0.2 });
    g.rect(x, y, w, h);
    g.stroke({ color: COLOR_PREVIEW_VALIDA, width: 2 / scale });

    // Texto con dimensiones
    const anchoM = (w / PIXELS_POR_METRO).toFixed(1);
    const altoM = (h / PIXELS_POR_METRO).toFixed(1);
    this.dimensionText.text = `${anchoM}m × ${altoM}m`;
    this.dimensionText.position.set(x + w / 2, y + h / 2);
    this.dimensionText.anchor.set(0.5);
    this.dimensionText.style.fontSize = Math.max(10, 14 / scale);
    this.dimensionText.visible = true;
  }

  clearCreateZona(): void {
    this.drawZonaGraphics.clear();
    this.dimensionText.visible = false;
  }

  // ─────────────────────────────────────────────
  // 5. PLANTAS DRAG PREVIEW
  // ─────────────────────────────────────────────
  drawPlantasPreview(
    plantasPreview: Map<string, { x: number; y: number }>,
    scale: number,
    radius: number = 5,
  ): void {
    const g = this.plantaPreviewGraphics;
    g.clear();

    for (const [, pos] of plantasPreview) {
      const px = pos.x * PIXELS_POR_METRO;
      const py = pos.y * PIXELS_POR_METRO;
      const r = Math.max(1.5 / scale, radius);

      g.circle(px, py, r);
      g.fill({ color: COLOR_HOVER, alpha: 0.6 });
      g.circle(px, py, r);
      g.stroke({ color: COLOR_HOVER, width: 1 / scale });
    }
  }

  clearPlantasPreview(): void {
    this.plantaPreviewGraphics.clear();
  }

  // ─────────────────────────────────────────────
  // CLEAR ALL
  // ─────────────────────────────────────────────
  clearAll(): void {
    this.clearSelectionRect();
    this.clearSnapGuides();
    this.clearZonaPreview();
    this.clearCreateZona();
    this.clearPlantasPreview();
  }

  destroy(): void {
    this.selectionGraphics.destroy();
    this.snapGraphics.destroy();
    this.zonaPreviewGraphics.destroy();
    this.drawZonaGraphics.destroy();
    this.plantaPreviewGraphics.destroy();
    this.dimensionText.destroy();
    this.container.destroy();
  }
}
```

---

## Integración: Lógica de Snap Guides

La lógica de snap guides actual en `mapa-terreno.tsx` usa un `useMemo` para calcular guías basadas en los bordes del terreno y zonas existentes. Esta lógica se puede extraer y reusar:

```typescript
function calcularSnapGuides(
  cursorMetros: { x: number; y: number },
  terreno: Terreno,
  zonas: Zona[],
  threshold: number = 0.5,
): { verticalX: number | null; horizontalY: number | null } {
  const edgesX: number[] = [0, terreno.ancho_m];
  const edgesY: number[] = [0, terreno.alto_m];

  for (const zona of zonas) {
    edgesX.push(zona.x, zona.x + zona.ancho);
    edgesY.push(zona.y, zona.y + zona.alto);
  }

  let closestX: number | null = null;
  let minDistX = threshold;

  for (const edge of edgesX) {
    const dist = Math.abs(cursorMetros.x - edge);
    if (dist < minDistX) {
      minDistX = dist;
      closestX = edge;
    }
  }

  let closestY: number | null = null;
  let minDistY = threshold;

  for (const edge of edgesY) {
    const dist = Math.abs(cursorMetros.y - edge);
    if (dist < minDistY) {
      minDistY = dist;
      closestY = edge;
    }
  }

  return { verticalX: closestX, horizontalY: closestY };
}
```

---

## Lógica de Drag de Plantas

La lógica de arrastre de plantas seleccionadas se mantiene como React state en `pixi-mapa-terreno-inner.tsx`:

```typescript
const [isDraggingPlants, setIsDraggingPlants] = useState(false);
const dragStartRef = useRef<{ x: number; y: number } | null>(null);

// En pointerdown (si hay plantas seleccionadas y click sobre una de ellas):
if (
  seleccionadasIds.length > 0 &&
  clickedPlanta &&
  seleccionadasIds.includes(clickedPlanta.id)
) {
  setIsDraggingPlants(true);
  dragStartRef.current = worldPos;
}

// En pointermove (si isDraggingPlants):
const deltaX = (currentWorldPos.x - dragStartRef.current.x) / PIXELS_POR_METRO;
const deltaY = (currentWorldPos.y - dragStartRef.current.y) / PIXELS_POR_METRO;

// Calcular preview positions
const preview = new Map<string, { x: number; y: number }>();
for (const id of seleccionadasIds) {
  const planta = plantasMap.get(id);
  if (planta) {
    const zona = zonasMap.get(planta.zona_id);
    if (zona) {
      preview.set(id, {
        x: zona.x + planta.x + deltaX,
        y: zona.y + planta.y + deltaY,
      });
    }
  }
}
overlayRef.current?.drawPlantasPreview(preview, viewport.getScale());

// En pointerup:
props.onMoverPlantasSeleccionadas?.(plantaId, deltaX, deltaY);
setIsDraggingPlants(false);
overlayRef.current?.clearPlantasPreview();
```

---

## Testing de Fase 5

| Test                 | Cómo verificar                         | Esperado                           |
| -------------------- | -------------------------------------- | ---------------------------------- |
| Rectángulo selección | Shift+drag en modo ver                 | Rectángulo azul semitransparente   |
| Snap guides          | Modo crear_zona, cursor cerca de borde | Líneas naranja                     |
| Snap threshold       | Mover cursor a 0.4m de borde           | Guide aparece; a 0.6m desaparece   |
| Zona preview         | Editar posición en EditorZona          | Rect punteado verde/rojo           |
| Draw zona nueva      | Modo crear_zona + drag                 | Rect verde + texto dimensiones     |
| Plantas preview      | Drag plantas seleccionadas             | Círculos amarillos en destino      |
| Clear overlays       | Terminar cada acción                   | Overlays desaparecen correctamente |
| Performance          | DevTools durante overlays activos      | < 16.6ms/frame                     |

## Resultado de esta Fase

Todos los overlays visuales del SVG original están replicados en PixiJS Graphics. La experiencia visual es idéntica a la versión SVG pero con 60 FPS.
