import { ParticleContainer, Particle } from 'pixi.js'
import { PIXELS_POR_METRO, COLORES_ESTADO_PLANTA_HEX } from './pixi-constants'
import type { PixiTextureFactory } from './pixi-texture-factory'
import type { Planta, Zona } from '@/types'

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
    cultivosColores: Record<string, number>,
    seleccionadasIds: Set<string>,
    scale: number
  ): void {
    const particles = this.container.particleChildren
    if (particles.length > 0) {
      this.container.removeParticles(0, particles.length)
    }
    this.plantaIndexMap.clear()

    const zonasMap = new Map(zonas.map(z => [z.id, z]))

    for (let i = 0; i < plantas.length; i++) {
      const planta = plantas[i]
      const zona = zonasMap.get(planta.zona_id)
      if (!zona) continue

      const isSelected = seleccionadasIds.has(planta.id)
      const espaciado = cultivosEspaciado[planta.tipo_cultivo_id] || 3

      const absX = (zona.x + planta.x) * PIXELS_POR_METRO
      const absY = (zona.y + planta.y) * PIXELS_POR_METRO

      const realRadius = (espaciado / 2) * PIXELS_POR_METRO
      const minVisible = 1.5 / scale
      const visualRadius = Math.max(minVisible, realRadius)
      const particleScale = (visualRadius * 2) / 32

      const texture = this.textureFactory.getTexture(planta.estado, isSelected)
      const tint = cultivosColores[planta.tipo_cultivo_id]
        ?? COLORES_ESTADO_PLANTA_HEX[planta.estado]
        ?? 0x84cc16

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
      this.plantaIndexMap.set(planta.id, this.container.particleChildren.length - 1)
    }
  }

  updateSelection(seleccionadasIds: Set<string>, plantas: Planta[]): void {
    const particles = this.container.particleChildren

    for (let i = 0; i < plantas.length; i++) {
      if (i >= particles.length) break
      const planta = plantas[i]
      const particle = particles[i]
      const isSelected = seleccionadasIds.has(planta.id)
      particle.texture = this.textureFactory.getTexture(planta.estado, isSelected)
    }
  }

  destroy(): void {
    this.container.destroy()
    this.plantaIndexMap.clear()
  }
}
