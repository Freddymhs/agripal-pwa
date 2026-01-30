import type { CatalogoCultivo, UUID } from '@/types'
import cultivosData from '../../../data/static/cultivos/arica.json'

export const CULTIVOS_ARICA: CatalogoCultivo[] = cultivosData as CatalogoCultivo[]

export function obtenerCultivo(id: UUID): CatalogoCultivo | undefined {
  return CULTIVOS_ARICA.find(c => c.id === id)
}
