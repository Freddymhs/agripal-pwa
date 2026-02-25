import type { CatalogoCultivo, UUID } from '@/types'
import { generateUUID, getCurrentTimestamp } from '@/lib/utils'
import cultivosData from '../../../data/static/cultivos/arica.json'

export const CULTIVOS_ARICA: CatalogoCultivo[] = cultivosData as CatalogoCultivo[]
export const CATALOGO_DEFAULT = CULTIVOS_ARICA

export function obtenerCultivo(id: UUID): CatalogoCultivo | undefined {
  return CULTIVOS_ARICA.find(c => c.id === id)
}

export function crearCatalogoInicial(proyectoId: UUID): CatalogoCultivo[] {
  const timestamp = getCurrentTimestamp()
  return CULTIVOS_ARICA.map(cultivo => ({
    ...cultivo,
    id: generateUUID(),
    proyecto_id: proyectoId,
    created_at: timestamp,
    updated_at: timestamp,
  }))
}
