import { getCurrentTimestamp } from '@/lib/utils'
import { db } from '@/lib/db'
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

const SYNC_TIMEOUT_MS = 30_000
const PULL_TIMEOUT_MS = 60_000

interface SyncResult {
  pushed: number
  pulled: number
  conflicts: number
  errors: number
}

const adapterRef: { current: SyncAdapter | null } = { current: null }

export function setAdapter(adapter: SyncAdapter): void {
  adapterRef.current = adapter
}

export function getAdapter(): SyncAdapter | null {
  return adapterRef.current
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout: ${label} (${ms}ms)`)), ms)
    promise.then(
      (value) => { clearTimeout(timer); resolve(value) },
      (err) => { clearTimeout(timer); reject(err) }
    )
  })
}

export async function recuperarItemsHuerfanos(): Promise<number> {
  const huerfanos = await db.sync_queue
    .where('estado')
    .equals('sincronizando')
    .toArray()

  for (const item of huerfanos) {
    await db.sync_queue.update(item.id, {
      estado: 'pendiente',
      updated_at: getCurrentTimestamp(),
    })
  }

  return huerfanos.length
}

export async function ejecutarSync(): Promise<SyncResult> {
  const result: SyncResult = { pushed: 0, pulled: 0, conflicts: 0, errors: 0 }
  const adapter = adapterRef.current

  if (!adapter) {
    console.warn('No sync adapter configured')
    return result
  }

  const isAvailable = await adapter.isAvailable()
  if (!isAvailable) {
    return result
  }

  if (typeof navigator !== 'undefined' && 'locks' in navigator) {
    return navigator.locks.request('agriplan-sync', { ifAvailable: true }, async (lock) => {
      if (!lock) return result
      return ejecutarSyncInternal(adapter, result)
    })
  }

  return ejecutarSyncInternal(adapter, result)
}

async function ejecutarSyncInternal(adapter: SyncAdapter, result: SyncResult): Promise<SyncResult> {
  await recuperarItemsHuerfanos()

  try {
    const pushResult = await pushChanges(adapter)
    result.pushed = pushResult.success
    result.conflicts = pushResult.conflicts
    result.errors = pushResult.errors

    const pullResult = await pullChanges(adapter)
    result.pulled = pullResult.count
  } catch (error) {
    console.error('Error en sync engine:', error)
  }

  try {
    await limpiarColaAntigua()
  } catch (cleanupError) {
    console.error('Error en limpieza de cola:', cleanupError)
  }

  return result
}

async function pushChanges(adapter: SyncAdapter): Promise<{ success: number; conflicts: number; errors: number }> {
  const pendientes = await obtenerPendientes()
  let success = 0
  let conflicts = 0
  let errors = 0

  for (const item of pendientes) {
    try {
      await marcarSincronizando(item.id)

      const response = await withTimeout(
        adapter.push({
          entidad: item.entidad,
          entidadId: item.entidad_id,
          accion: item.accion,
          datos: item.datos,
        }),
        SYNC_TIMEOUT_MS,
        `push ${item.entidad}`
      )

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
          await db.transaction('rw', [db.sync_queue, tabla], async () => {
            const updateData = {
              ...response.data,
              lastModified: getCurrentTimestamp(),
            }
            await tabla.update(item.entidad_id, updateData as never)
            await marcarCompletado(item.id)
          })
          success++
          continue
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

async function pullChanges(adapter: SyncAdapter): Promise<{ count: number }> {
  const lastSyncAt = await getLastSyncAt()
  let totalPulled = 0
  let maxTimestamp: string | null = null
  let allSuccess = true

  for (const entidad of SYNC_ENTIDADES) {
    try {
      const response = await withTimeout(
        adapter.pull({
          entidad,
          since: lastSyncAt || undefined,
        }),
        PULL_TIMEOUT_MS,
        `pull ${entidad}`
      )

      if (!response.success) continue
      if (!Array.isArray(response.data)) continue

      const tabla = getTabla(entidad)
      if (!tabla) continue

      for (const serverItem of response.data) {
        const id = serverItem.id as string

        const pendingQueueItem = await db.sync_queue
          .where('[entidad+entidad_id]')
          .equals([entidad, id])
          .first()

        if (pendingQueueItem && ['pendiente', 'error', 'sincronizando'].includes(pendingQueueItem.estado)) {
          continue
        }

        const localItem = await tabla.get(id)

        if (!localItem) {
          const newItem = { ...serverItem, lastModified: serverItem.updated_at }
          await tabla.add(newItem as never)
          totalPulled++
          continue
        }

        const serverTime = new Date(serverItem.updated_at as string).getTime()
        if (isNaN(serverTime)) continue

        const localRecord = localItem as { lastModified?: string; updated_at?: string }
        const rawLocalTime = new Date(localRecord.lastModified || localRecord.updated_at || '').getTime()
        const safeLocalTime = isNaN(rawLocalTime) ? 0 : rawLocalTime

        if (serverTime > safeLocalTime) {
          const updateData = {
            ...serverItem,
            lastModified: serverItem.updated_at,
          }
          await tabla.update(id, updateData as never)
          totalPulled++
        }
      }

      if (response.lastModified) {
        if (!maxTimestamp || response.lastModified > maxTimestamp) {
          maxTimestamp = response.lastModified
        }
      }
    } catch (error) {
      console.error(`Error pulling ${entidad}:`, error)
      allSuccess = false
    }
  }

  if (allSuccess && maxTimestamp) {
    await setLastSyncAt(maxTimestamp)
  }

  return { count: totalPulled }
}

export async function syncSingleItem(item: SyncItem): Promise<boolean> {
  const adapter = adapterRef.current
  if (!adapter) return false

  try {
    await marcarSincronizando(item.id)

    const response = await withTimeout(
      adapter.push({
        entidad: item.entidad,
        entidadId: item.entidad_id,
        accion: item.accion,
        datos: item.datos,
      }),
      SYNC_TIMEOUT_MS,
      `syncSingle ${item.entidad}`
    )

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
