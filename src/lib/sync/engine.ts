import { getCurrentTimestamp } from '@/lib/utils'
import {
  obtenerPendientes,
  marcarSincronizando,
  marcarCompletado,
  marcarError,
  marcarConflicto,
  getTabla,
  getLastSyncAt,
  setLastSyncAt,
  limpiarColaAntigua,
} from './queue'
import type { SyncAdapter } from './types'
import type { SyncItem } from '@/types'
import { SYNC_ENTIDADES } from '@/types'

interface SyncResult {
  pushed: number
  pulled: number
  conflicts: number
  errors: number
}

let currentAdapter: SyncAdapter | null = null

export function setAdapter(adapter: SyncAdapter): void {
  currentAdapter = adapter
}

export function getAdapter(): SyncAdapter | null {
  return currentAdapter
}

export async function ejecutarSync(): Promise<SyncResult> {
  const result: SyncResult = { pushed: 0, pulled: 0, conflicts: 0, errors: 0 }

  if (!currentAdapter) {
    console.warn('No sync adapter configured')
    return result
  }

  const isAvailable = await currentAdapter.isAvailable()
  if (!isAvailable) {
    return result
  }

  try {
    const pushResult = await pushChanges()
    result.pushed = pushResult.success
    result.conflicts = pushResult.conflicts
    result.errors = pushResult.errors

    const pullResult = await pullChanges()
    result.pulled = pullResult.count

    await limpiarColaAntigua()
  } catch (error) {
    console.error('Error en sync engine:', error)
  }

  return result
}

async function pushChanges(): Promise<{ success: number; conflicts: number; errors: number }> {
  const pendientes = await obtenerPendientes()
  let success = 0
  let conflicts = 0
  let errors = 0

  if (!currentAdapter) return { success, conflicts, errors }

  for (const item of pendientes) {
    try {
      await marcarSincronizando(item.id)

      const response = await currentAdapter.push({
        entidad: item.entidad,
        entidadId: item.entidad_id,
        accion: item.accion,
        datos: item.datos,
      })

      if (response.conflict && response.serverData) {
        await marcarConflicto(item.id, response.serverData)
        conflicts++
        continue
      }

      if (!response.success) {
        throw new Error(response.error || 'Error desconocido')
      }

      if (item.accion !== 'delete' && response.data) {
        const tabla = getTabla(item.entidad)
        if (tabla) {
          const updateData = {
            ...response.data,
            lastModified: getCurrentTimestamp(),
          }
          await tabla.update(item.entidad_id, updateData as never)
        }
      }

      await marcarCompletado(item.id)
      success++
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
      await marcarError(item.id, errorMsg)
      errors++
    }
  }

  return { success, conflicts, errors }
}

async function pullChanges(): Promise<{ count: number }> {
  const lastSyncAt = await getLastSyncAt()
  let totalPulled = 0

  if (!currentAdapter) return { count: 0 }

  for (const entidad of SYNC_ENTIDADES) {
    try {
      const response = await currentAdapter.pull({
        entidad,
        since: lastSyncAt || undefined,
      })

      if (!response.success) continue
      if (!Array.isArray(response.data)) continue

      const tabla = getTabla(entidad)
      if (!tabla) continue

      for (const serverItem of response.data) {
        const id = serverItem.id as string
        const localItem = await tabla.get(id)

        if (!localItem) {
          const newItem = { ...serverItem, lastModified: serverItem.updated_at }
          await tabla.add(newItem as never)
          totalPulled++
          continue
        }

        const serverTime = new Date(serverItem.updated_at as string).getTime()
        const localTime = new Date((localItem as { lastModified?: string; updated_at?: string }).lastModified || (localItem as { updated_at?: string }).updated_at || 0).getTime()

        if (serverTime > localTime) {
          const updateData = {
            ...serverItem,
            lastModified: serverItem.updated_at,
          }
          await tabla.update(id, updateData as never)
          totalPulled++
        }
      }

      if (response.lastModified) {
        await setLastSyncAt(response.lastModified)
      }
    } catch (error) {
      console.error(`Error pulling ${entidad}:`, error)
    }
  }

  return { count: totalPulled }
}

export async function syncSingleItem(item: SyncItem): Promise<boolean> {
  if (!currentAdapter) return false

  try {
    await marcarSincronizando(item.id)

    const response = await currentAdapter.push({
      entidad: item.entidad,
      entidadId: item.entidad_id,
      accion: item.accion,
      datos: item.datos,
    })

    if (response.conflict && response.serverData) {
      await marcarConflicto(item.id, response.serverData)
      return false
    }

    if (!response.success) {
      throw new Error(response.error || 'Error')
    }

    await marcarCompletado(item.id)
    return true
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Error'
    await marcarError(item.id, errorMsg)
    return false
  }
}
