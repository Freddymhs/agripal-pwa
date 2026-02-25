import type { Terreno, Zona, Planta } from '@/types'
import type { GridParams } from '@/lib/validations/planta'

export interface ZonaPreview {
  zonaId: string
  x: number
  y: number
  ancho: number
  alto: number
  esValida: boolean
}

export interface MapaTerrenoProps {
  terreno: Terreno
  zonas: Zona[]
  plantas: Planta[]
  zonaSeleccionadaId?: string | null
  zonaPreview?: ZonaPreview | null
  modo?: 'terreno' | 'zonas' | 'plantas' | 'crear_zona' | 'plantar'
  cultivosEspaciado?: Record<string, number>
  cultivosColores?: Record<string, number>
  plantasSeleccionadasIds?: string[]
  gridParams?: GridParams | null
  posicionesOcupadas?: Set<string>
  onZonaClick?: (zona: Zona) => void
  onMapClick?: (x: number, y: number) => void
  onPlantaClick?: (planta: Planta) => void
  onZonaCreada?: (rect: { x: number; y: number; ancho: number; alto: number }) => void
  onSeleccionMultiple?: (plantaIds: string[]) => void
  onMoverPlantasSeleccionadas?: (plantaId: string, deltaX: number, deltaY: number) => Promise<void>
}

export interface Point {
  x: number
  y: number
}

export const SNAP_THRESHOLD = 0.5

export const EMPTY_SET = new Set<string>()
export const EMPTY_RECORD_NUMBER: Record<string, number> = {}
export const EMPTY_RECORD_STRING: Record<string, number> = {}
export const EMPTY_STRING_ARRAY: string[] = []
