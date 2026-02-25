import type { SyncEntidad } from '@/types'

export const SYNC_ENTIDADES: SyncEntidad[] = [
  'proyecto',
  'terreno',
  'zona',
  'planta',
  'entrada_agua',
  'cosecha',
  'alerta',
]

export const RETRY_DELAYS = [1000, 5000, 30000, 120000, 300000]
export const MAX_RETRY_ATTEMPTS = 5
export const SYNC_CLEANUP_DAYS = 7
