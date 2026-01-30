import RBush from 'rbush'
import type { Planta, Zona } from '@/types'
import { PIXELS_POR_METRO } from './pixi-constants'

interface PlantaBBox {
  minX: number
  minY: number
  maxX: number
  maxY: number
  plantaId: string
  planta: Planta
}

export class PixiHitTest {
  private tree: RBush<PlantaBBox>
  private zonas: Map<string, Zona> = new Map()

  constructor() {
    this.tree = new RBush<PlantaBBox>()
  }

  rebuild(
    plantas: Planta[],
    zonas: Zona[],
    cultivosEspaciado: Record<string, number>
  ): void {
    this.tree.clear()
    this.zonas = new Map(zonas.map(z => [z.id, z]))

    const items: PlantaBBox[] = []
    for (const planta of plantas) {
      const zona = this.zonas.get(planta.zona_id)
      if (!zona) continue

      const absX = (zona.x + planta.x) * PIXELS_POR_METRO
      const absY = (zona.y + planta.y) * PIXELS_POR_METRO
      const espaciado = cultivosEspaciado[planta.tipo_cultivo_id] || 3
      const r = (espaciado / 2) * PIXELS_POR_METRO

      items.push({
        minX: absX - r,
        minY: absY - r,
        maxX: absX + r,
        maxY: absY + r,
        plantaId: planta.id,
        planta,
      })
    }

    this.tree.load(items)
  }

  hitTestPoint(worldX: number, worldY: number, tolerancia: number = 5): Planta | null {
    const results = this.tree.search({
      minX: worldX - tolerancia,
      minY: worldY - tolerancia,
      maxX: worldX + tolerancia,
      maxY: worldY + tolerancia,
    })

    if (results.length === 0) return null

    let closest: PlantaBBox | null = null
    let closestDist = Infinity

    for (const item of results) {
      const zona = this.zonas.get(item.planta.zona_id)
      if (!zona) continue

      const cx = (zona.x + item.planta.x) * PIXELS_POR_METRO
      const cy = (zona.y + item.planta.y) * PIXELS_POR_METRO
      const dx = worldX - cx
      const dy = worldY - cy
      const distSq = dx * dx + dy * dy

      if (distSq < closestDist) {
        closestDist = distSq
        closest = item
      }
    }

    return closest?.planta || null
  }

  queryRect(minX: number, minY: number, maxX: number, maxY: number): Planta[] {
    const results = this.tree.search({ minX, minY, maxX, maxY })
    return results.map(r => r.planta)
  }

  destroy(): void {
    this.tree.clear()
    this.zonas.clear()
  }
}
