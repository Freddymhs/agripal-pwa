# FASE 4: Hit Testing con RBush (Interacciones de Plantas)

## Objetivo

Implementar click, hover y selección rectangular para plantas usando spatial indexing con RBush, ya que ParticleContainer NO soporta eventos nativos.

## Prerequisitos

- FASE 3 completada (plantas renderizando a 60 FPS)

## Por qué RBush

**El problema:** ParticleContainer usa objetos `Particle` ligeros que NO son DisplayObjects → no tienen `eventMode`, no tienen `on('click')`, no tienen hit area. Los eventos deben manejarse manualmente.

**Solución naive (O(n)):**

```typescript
// Para cada click, recorrer 66,600 plantas y calcular distancia
plantas.forEach(planta => {
  const dist = Math.sqrt((clickX - planta.x)² + (clickY - planta.y)²)
  if (dist < radius) found = planta
})
// ~66,600 operaciones por click → ~2ms, aceptable para click
// PERO para hover (60 veces/segundo) → 120ms/segundo, pesado
```

**Solución con RBush (O(log n)):**

```typescript
// RBush es un R-tree espacial optimizado
// Búsqueda: O(log n) → < 0.1ms para 66k plantas
// Construcción: O(n log n) → ~30ms para 66k plantas (una vez)
// Memoria: ~2MB para 66k entradas
```

---

## Archivos a Crear

### 1. `src/components/mapa/pixi/pixi-hit-test.ts`

```typescript
import RBush from "rbush";
import type { Planta, Zona } from "@/types";
import { PIXELS_POR_METRO } from "./pixi-constants";

interface PlantaBBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  plantaId: string;
  planta: Planta;
}

export class PixiHitTest {
  private tree: RBush<PlantaBBox>;
  private zonas: Map<string, Zona> = new Map();

  constructor() {
    this.tree = new RBush<PlantaBBox>();
  }

  rebuild(
    plantas: Planta[],
    zonas: Zona[],
    cultivosEspaciado: Record<string, number>,
  ): void {
    this.tree.clear();
    this.zonas = new Map(zonas.map((z) => [z.id, z]));

    const items: PlantaBBox[] = [];
    for (const planta of plantas) {
      const zona = this.zonas.get(planta.zona_id);
      if (!zona) continue;

      const absX = (zona.x + planta.x) * PIXELS_POR_METRO;
      const absY = (zona.y + planta.y) * PIXELS_POR_METRO;
      const espaciado = cultivosEspaciado[planta.tipo_cultivo_id] || 3;
      const r = (espaciado / 2) * PIXELS_POR_METRO;

      items.push({
        minX: absX - r,
        minY: absY - r,
        maxX: absX + r,
        maxY: absY + r,
        plantaId: planta.id,
        planta,
      });
    }

    // bulk load es mucho más rápido que insertar uno por uno
    this.tree.load(items);
  }

  /**
   * Encuentra la planta bajo un punto en coordenadas world (pixels).
   * Retorna null si no hay planta.
   */
  hitTestPoint(
    worldX: number,
    worldY: number,
    tolerancia: number = 5,
  ): Planta | null {
    const results = this.tree.search({
      minX: worldX - tolerancia,
      minY: worldY - tolerancia,
      maxX: worldX + tolerancia,
      maxY: worldY + tolerancia,
    });

    if (results.length === 0) return null;

    // Si hay múltiples hits, retornar la más cercana al punto
    let closest: PlantaBBox | null = null;
    let closestDist = Infinity;

    for (const item of results) {
      const zona = this.zonas.get(item.planta.zona_id);
      if (!zona) continue;

      const cx = (zona.x + item.planta.x) * PIXELS_POR_METRO;
      const cy = (zona.y + item.planta.y) * PIXELS_POR_METRO;
      const dx = worldX - cx;
      const dy = worldY - cy;
      const distSq = dx * dx + dy * dy;

      if (distSq < closestDist) {
        closestDist = distSq;
        closest = item;
      }
    }

    return closest?.planta || null;
  }

  /**
   * Encuentra todas las plantas dentro de un rectángulo (coordenadas world pixels).
   * Usado para selección múltiple con Shift+drag.
   */
  queryRect(minX: number, minY: number, maxX: number, maxY: number): Planta[] {
    const results = this.tree.search({ minX, minY, maxX, maxY });
    return results.map((r) => r.planta);
  }

  /**
   * Encuentra la zona bajo un punto (para modo plantar).
   */
  hitTestZona(worldX: number, worldY: number, zonas: Zona[]): Zona | null {
    const metrosX = worldX / PIXELS_POR_METRO;
    const metrosY = worldY / PIXELS_POR_METRO;

    for (const zona of zonas) {
      if (
        metrosX >= zona.x &&
        metrosX <= zona.x + zona.ancho &&
        metrosY >= zona.y &&
        metrosY <= zona.y + zona.alto
      ) {
        return zona;
      }
    }
    return null;
  }

  destroy(): void {
    this.tree.clear();
    this.zonas.clear();
  }
}
```

---

## Integración: Event Handlers en pixi-mapa-terreno-inner.tsx

### Conversión de coordenadas screen → world

```typescript
function screenToWorld(
  screenX: number,
  screenY: number,
  worldContainer: Container,
): { x: number; y: number } {
  return worldContainer.toLocal({ x: screenX, y: screenY });
}
```

### Click en planta

```typescript
// En el stage de PixiJS (NO en React)
app.stage.on("pointertap", (e) => {
  if (modo !== "ver") return; // Solo en modo ver

  const worldPos = screenToWorld(e.global.x, e.global.y, worldRef.current!);
  const planta = hitTestRef.current?.hitTestPoint(worldPos.x, worldPos.y);

  if (planta) {
    props.onPlantaClick?.(planta);
  }
});
```

### Hover (throttled a 60fps)

```typescript
let lastHoveredId: string | null = null;

app.stage.on("pointermove", (e) => {
  if (isPanning) return; // No hover durante pan

  const worldPos = screenToWorld(e.global.x, e.global.y, worldRef.current!);
  const planta = hitTestRef.current?.hitTestPoint(worldPos.x, worldPos.y);

  const newId = planta?.id || null;
  if (newId !== lastHoveredId) {
    lastHoveredId = newId;
    // Cambiar cursor
    app.canvas.style.cursor = planta ? "pointer" : "default";
    // Opcionalmente: highlight visual (cambiar tint de la partícula)
  }
});
```

### Selección múltiple (Shift+drag)

```typescript
let selectionStart: Point | null = null;
let isSelecting = false;

app.stage.on("pointerdown", (e) => {
  if (e.shiftKey && modo === "ver") {
    isSelecting = true;
    selectionStart = screenToWorld(e.global.x, e.global.y, worldRef.current!);
  }
});

app.stage.on("pointermove", (e) => {
  if (!isSelecting || !selectionStart) return;

  const current = screenToWorld(e.global.x, e.global.y, worldRef.current!);

  // Dibujar rectángulo de selección (via overlay layer - Fase 5)
  overlayRef.current?.drawSelectionRect(
    selectionStart,
    current,
    viewport.getScale(),
  );
});

app.stage.on("pointerup", (e) => {
  if (!isSelecting || !selectionStart) return;

  const end = screenToWorld(e.global.x, e.global.y, worldRef.current!);

  // Query RBush por rectángulo
  const minX = Math.min(selectionStart.x, end.x);
  const minY = Math.min(selectionStart.y, end.y);
  const maxX = Math.max(selectionStart.x, end.x);
  const maxY = Math.max(selectionStart.y, end.y);

  const plantasEnRect =
    hitTestRef.current?.queryRect(minX, minY, maxX, maxY) || [];
  const ids = plantasEnRect.map((p) => p.id);

  props.onSeleccionMultiple?.(ids);

  isSelecting = false;
  selectionStart = null;
  overlayRef.current?.clearSelectionRect();
});
```

### Modo plantar (click para plantar)

```typescript
app.stage.on("pointertap", (e) => {
  if (modo !== "plantar") return;

  const worldPos = screenToWorld(e.global.x, e.global.y, worldRef.current!);
  const metrosX = worldPos.x / PIXELS_POR_METRO;
  const metrosY = worldPos.y / PIXELS_POR_METRO;

  props.onMapClick?.(metrosX, metrosY);
});
```

---

## Performance del Hit Testing

| Operación                 | Complejidad   | Tiempo (66k plantas)   |
| ------------------------- | ------------- | ---------------------- |
| Rebuild RBush (bulk load) | O(n log n)    | ~30ms                  |
| Hit test punto            | O(log n)      | < 0.1ms                |
| Query rectángulo          | O(log n + k)  | < 1ms (k = resultados) |
| Hover (60 calls/sec)      | O(log n) × 60 | ~6ms/segundo total     |

---

## Testing de Fase 4

| Test                 | Cómo verificar                   | Esperado                                       |
| -------------------- | -------------------------------- | ---------------------------------------------- |
| Click planta         | Click sobre planta               | `onPlantaClick` se dispara, PlantaInfo aparece |
| Click fuera          | Click en área vacía              | Deselecciona planta                            |
| Hover cursor         | Mover mouse sobre planta         | Cursor cambia a pointer                        |
| Shift+drag selección | Shift + drag en área con plantas | `onSeleccionMultiple` con IDs correctos        |
| Modo plantar click   | Modo plantar + click en zona     | `onMapClick` con coordenadas correctas         |
| Hit test performance | Console.time en hit test         | < 0.1ms por query                              |
| Rebuild performance  | Console.time en rebuild          | < 50ms para 66k plantas                        |

## Resultado de esta Fase

Interacción completa con plantas: click individual, hover, selección múltiple rectangular. Todo a 60 FPS gracias a RBush spatial indexing.
