# FASE 3: Plantas con ParticleContainer (Core Performance)

## Objetivo
Renderizar 66,600+ plantas a 60 FPS usando PixiJS v8 ParticleContainer con partículas WebGL.

## Prerequisitos
- FASE 1 + FASE 2 completadas

## Por qué ParticleContainer

**Benchmarks oficiales PixiJS v8 (MacBook Pro M3):**
| Renderer | 60 FPS limit |
|----------|-------------|
| Sprites + Container | 200,000 |
| **Particles + ParticleContainer** | **1,000,000** |
| SVG DOM (actual) | ~5,000 |

Nuestro caso (66,600 plantas) está muy por debajo del límite de ParticleContainer.

## API de ParticleContainer v8

**Cambios críticos vs v7:**
- Ya NO acepta Sprites como hijos
- Usa objetos `Particle` (ligeros, no son DisplayObject)
- `addParticle()` en lugar de `addChild()`
- `particleChildren` en lugar de `children`
- Propiedades: position, scale, rotation, tint, alpha, texture
- NO soporta: filters, masks, children anidados, eventos nativos

```typescript
import { ParticleContainer, Particle, Texture } from 'pixi.js'

const container = new ParticleContainer({
  dynamicProperties: {
    position: true,   // Cambia cada frame (pan mueve todo)
    vertex: true,     // Cambia con zoom (scale de partículas)
    rotation: false,  // Nunca rota
    color: true,      // Cambia al seleccionar/cambiar estado (tint)
  }
})

const particle = new Particle({
  texture: circleTexture,
  x: 200,
  y: 100,
  scaleX: 1,
  scaleY: 1,
  tint: 0x84cc16,
  alpha: 1,
})

container.addParticle(particle)
```

---

## Archivos a Crear

### 1. `src/components/mapa/pixi/pixi-texture-factory.ts`

Genera y cachea texturas de círculos para los distintos estados visuales de plantas.

**Por qué texturas pre-generadas:**
- ParticleContainer requiere que todas las partículas compartan la misma texture source
- Diferenciamos estados via `tint` del Particle (color)
- Para muerta (X) y seleccionada (borde), necesitamos texturas diferentes

**Estrategia de texturas:**
```
Textura 1: "circle-normal"    → Círculo blanco sólido (16x16)
                                El tint define el color final
Textura 2: "circle-dead"      → Círculo blanco + X blanca (16x16)
                                Para plantas muertas
Textura 3: "circle-selected"  → Círculo blanco + borde azul (18x18)
                                Para plantas seleccionadas
Textura 4: "circle-dead-sel"  → Círculo + X + borde (18x18)
                                Para muerta + seleccionada
```

**IMPORTANTE - Limitación de ParticleContainer:**
Todas las partículas deben compartir la misma texture SOURCE (atlas/spritesheet). Solución: generar las 4 variantes en un único atlas de textura.

**Implementación:**
```typescript
export class PixiTextureFactory {
  private textures: Map<string, Texture> = new Map()

  async init(renderer: Renderer): Promise<void> {
    // Crear canvas offscreen con las 4 variantes
    const size = 32 // 32x32 pixels por variante
    const g = new Graphics()

    // Normal: círculo sólido blanco
    g.circle(size/2, size/2, size/2 - 2)
    g.fill(0xffffff)
    this.textures.set('normal', renderer.generateTexture(g))
    g.clear()

    // Muerta: círculo + X
    g.circle(size/2, size/2, size/2 - 2)
    g.fill(0xffffff)
    g.moveTo(size*0.25, size*0.25).lineTo(size*0.75, size*0.75)
    g.moveTo(size*0.75, size*0.25).lineTo(size*0.25, size*0.75)
    g.stroke({ color: 0xffffff, width: 2 })
    this.textures.set('muerta', renderer.generateTexture(g))
    g.clear()

    // Seleccionada: círculo + borde azul
    g.circle(size/2, size/2, size/2 - 2)
    g.fill(0xffffff)
    g.circle(size/2, size/2, size/2 - 1)
    g.stroke({ color: 0x3b82f6, width: 2 })
    this.textures.set('selected', renderer.generateTexture(g))
    g.clear()

    // Muerta + Seleccionada
    g.circle(size/2, size/2, size/2 - 2)
    g.fill(0xffffff)
    g.moveTo(size*0.25, size*0.25).lineTo(size*0.75, size*0.75)
    g.moveTo(size*0.75, size*0.25).lineTo(size*0.25, size*0.75)
    g.stroke({ color: 0xffffff, width: 2 })
    g.circle(size/2, size/2, size/2 - 1)
    g.stroke({ color: 0x3b82f6, width: 2 })
    this.textures.set('muerta-selected', renderer.generateTexture(g))

    g.destroy()
  }

  getTexture(estado: string, isSelected: boolean): Texture {
    if (estado === 'muerta' && isSelected) return this.textures.get('muerta-selected')!
    if (estado === 'muerta') return this.textures.get('muerta')!
    if (isSelected) return this.textures.get('selected')!
    return this.textures.get('normal')!
  }

  destroy(): void {
    this.textures.forEach(t => t.destroy(true))
    this.textures.clear()
  }
}
```

---

### 2. `src/components/mapa/pixi/pixi-plantas-layer.ts`

Clase principal que maneja el ParticleContainer con 66k+ plantas.

**Implementación:**
```typescript
export class PixiPlantasLayer {
  container: ParticleContainer
  private plantaIndexMap: Map<string, number> = new Map()
  private textureFactory: PixiTextureFactory

  constructor(textureFactory: PixiTextureFactory) {
    this.textureFactory = textureFactory
    this.container = new ParticleContainer({
      dynamicProperties: {
        position: true,
        vertex: true,
        rotation: false,
        color: true,
      }
    })
  }

  rebuild(
    plantas: Planta[],
    zonas: Zona[],
    cultivosEspaciado: Record<string, number>,
    seleccionadasIds: Set<string>,
    scale: number
  ): void {
    // Limpiar
    this.container.removeParticles(0, this.container.particleChildren.length)
    this.plantaIndexMap.clear()

    // Mapa de zonas para lookup rápido
    const zonasMap = new Map(zonas.map(z => [z.id, z]))

    for (let i = 0; i < plantas.length; i++) {
      const planta = plantas[i]
      const zona = zonasMap.get(planta.zona_id)
      if (!zona) continue

      const isSelected = seleccionadasIds.has(planta.id)
      const espaciado = cultivosEspaciado[planta.tipo_cultivo_id] || 3

      // Posición absoluta en pixels
      const absX = (zona.x + planta.x) * PIXELS_POR_METRO
      const absY = (zona.y + planta.y) * PIXELS_POR_METRO

      // Radio visual (con mínimo visible)
      const realRadius = (espaciado / 2) * PIXELS_POR_METRO
      const minVisible = 1.5 / scale
      const visualRadius = Math.max(minVisible, realRadius)

      // Scale del particle (textura es 32px, queremos visualRadius*2 px)
      const particleScale = (visualRadius * 2) / 32

      const texture = this.textureFactory.getTexture(planta.estado, isSelected)
      const tint = COLORES_ESTADO_PLANTA_HEX[planta.estado] || 0x84cc16

      const particle = new Particle({
        texture,
        x: absX,
        y: absY,
        scaleX: particleScale,
        scaleY: particleScale,
        tint,
        alpha: 1,
        anchorX: 0.5,
        anchorY: 0.5,
      })

      this.container.addParticle(particle)
      this.plantaIndexMap.set(planta.id, i)
    }
  }

  updateSelection(seleccionadasIds: Set<string>, plantas: Planta[]): void {
    // Solo actualizar partículas que cambiaron de selección
    const particles = this.container.particleChildren

    for (let i = 0; i < plantas.length; i++) {
      if (i >= particles.length) break
      const planta = plantas[i]
      const particle = particles[i]
      const isSelected = seleccionadasIds.has(planta.id)

      particle.texture = this.textureFactory.getTexture(planta.estado, isSelected)
    }
  }

  updateScale(scale: number, plantas: Planta[], cultivosEspaciado: Record<string, number>): void {
    const particles = this.container.particleChildren
    const minVisible = 1.5 / scale

    for (let i = 0; i < plantas.length; i++) {
      if (i >= particles.length) break
      const espaciado = cultivosEspaciado[plantas[i].tipo_cultivo_id] || 3
      const realRadius = (espaciado / 2) * PIXELS_POR_METRO
      const visualRadius = Math.max(minVisible, realRadius)
      const particleScale = (visualRadius * 2) / 32

      particles[i].scaleX = particleScale
      particles[i].scaleY = particleScale
    }
  }

  destroy(): void {
    this.container.destroy()
    this.plantaIndexMap.clear()
  }
}
```

---

## Integración con pixi-mapa-terreno-inner.tsx

```typescript
const textureFactoryRef = useRef<PixiTextureFactory | null>(null)
const plantasLayerRef = useRef<PixiPlantasLayer | null>(null)

// Init textures (una vez)
useEffect(() => {
  if (!app) return
  const factory = new PixiTextureFactory()
  factory.init(app.renderer).then(() => {
    textureFactoryRef.current = factory
    // Ahora podemos crear el layer de plantas
    const layer = new PixiPlantasLayer(factory)
    worldRef.current?.addChild(layer.container)
    plantasLayerRef.current = layer
  })
  return () => { factory.destroy() }
}, [app])

// Rebuild plantas cuando cambian
useEffect(() => {
  if (!plantasLayerRef.current) return
  const selSet = new Set(props.plantasSeleccionadasIds || [])
  plantasLayerRef.current.rebuild(
    props.plantas,
    props.zonas,
    props.cultivosEspaciado || {},
    selSet,
    viewport.getScale()
  )
}, [props.plantas, props.zonas])

// Update selección
useEffect(() => {
  if (!plantasLayerRef.current) return
  const selSet = new Set(props.plantasSeleccionadasIds || [])
  plantasLayerRef.current.updateSelection(selSet, props.plantas)
}, [props.plantasSeleccionadasIds])
```

---

## Consideraciones de Performance

### Rebuild vs Update incremental
- **Rebuild completo** (66k partículas): ~30-50ms → aceptable (ocurre solo al crear/eliminar plantas)
- **Update selección** (cambiar textura de N partículas): < 1ms
- **Update scale** (zoom): Recalcular scale de 66k partículas en JS loop: ~5ms
- **Pan** (cada frame): 0ms de JS, GPU mueve todo via transform

### Memory
```
66,600 partículas × ~80 bytes/particle = ~5.3 MB
4 texturas × 32×32×4 bytes = ~16 KB
RBush index: ~2 MB
────────────────────────────────
TOTAL: ~7.3 MB (vs ~89 MB en SVG)
```

### GPU Draw Calls
```
ParticleContainer: 1 draw call para TODAS las partículas del mismo texture source
Grid Graphics: 2 draw calls
Zonas Graphics: ~10 draw calls
────────────────────────────────
TOTAL: ~13 draw calls (vs 266,400 en SVG)
```

---

## Testing de Fase 3

| Test | Cómo verificar | Esperado |
|------|---------------|----------|
| 66k plantas renderizan | Plantar grid 66,600 | Todas visibles en el mapa |
| 60 FPS durante pan | DevTools Performance, drag mapa | Frame time < 16.6ms |
| 60 FPS durante zoom | DevTools Performance, wheel | Frame time < 16.6ms |
| Colores correctos | Visual | Verde lime (plantada), verde (creciendo), ámbar (produciendo), gris (muerta) |
| X en muertas | Cambiar planta a muerta | X visible sobre el círculo |
| Borde selección | Click planta | Borde azul aparece |
| Min radius zoom out | Alejar mucho | Plantas no desaparecen, mantienen tamaño mínimo |
| Memory | DevTools Memory | < 15 MB total para rendering |
| Rebuild time | Console time | < 100ms para 66k rebuild |

## Resultado de esta Fase
66,600+ plantas renderizadas a 60 FPS constante via WebGL. El problema principal de performance está resuelto. Las siguientes fases agregan interactividad.
