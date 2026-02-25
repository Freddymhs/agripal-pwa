import { logger } from '@/lib/logger'
import { db } from '@/lib/db'
import { generateUUID, getCurrentTimestamp } from '@/lib/utils'
import type { SyncItem, SyncEntidad, SyncAccion, UUID } from '@/types'
import { RETRY_DELAYS, MAX_RETRY_ATTEMPTS, SYNC_CLEANUP_DAYS } from '@/lib/constants/sync'

export async function agregarACola(
  entidad: SyncEntidad,
  entidadId: UUID,
  accion: SyncAccion,
  datos: Record<string, unknown>
): Promise<SyncItem> {
  return db.transaction('rw', db.sync_queue, async () => {
    const existente = await db.sync_queue
      .where('[entidad+entidad_id]')
      .equals([entidad, entidadId])
      .first()

    if (existente && existente.estado !== 'conflicto') {
      const newAccion = accion === 'delete' ? 'delete' : existente.accion === 'create' ? 'create' : accion
      const updatedAt = getCurrentTimestamp()

      await db.sync_queue.update(existente.id, {
        accion: newAccion,
        datos: { ...existente.datos, ...datos },
        estado: 'pendiente',
        updated_at: updatedAt,
      })

      return {
        ...existente,
        accion: newAccion,
        datos: { ...existente.datos, ...datos },
        estado: 'pendiente' as const,
        updated_at: updatedAt,
      }
    }

    const item: SyncItem = {
      id: generateUUID(),
      entidad,
      entidad_id: entidadId,
      accion,
      datos,
      estado: 'pendiente',
      intentos: 0,
      created_at: getCurrentTimestamp(),
      updated_at: getCurrentTimestamp(),
    }

    await db.sync_queue.add(item)
    return item
  })
}

export async function obtenerPendientes(): Promise<SyncItem[]> {
  const ahora = getCurrentTimestamp()
  return db.sync_queue
    .where('estado')
    .anyOf(['pendiente', 'error'])
    .filter(item => {
      if (item.estado === 'error' && item.intentos >= MAX_RETRY_ATTEMPTS) return false
      return !item.nextRetryAt || item.nextRetryAt <= ahora
    })
    .toArray()
}

export async function obtenerConflictos(): Promise<SyncItem[]> {
  return db.sync_queue.where('estado').equals('conflicto').toArray()
}

export async function contarPendientes(): Promise<number> {
  return db.sync_queue
    .where('estado')
    .anyOf(['pendiente', 'error'])
    .filter(item => {
      if (item.estado === 'error' && item.intentos >= MAX_RETRY_ATTEMPTS) return false
      return true
    })
    .count()
}

export async function marcarSincronizando(id: UUID): Promise<void> {
  await db.sync_queue.update(id, {
    estado: 'sincronizando',
    updated_at: getCurrentTimestamp(),
  })
}

export async function marcarCompletado(id: UUID): Promise<void> {
  await db.sync_queue.delete(id)
}

export async function marcarError(id: UUID, error: string): Promise<void> {
  const item = await db.sync_queue.get(id)
  if (!item) return

  const intentos = item.intentos + 1

  if (intentos >= MAX_RETRY_ATTEMPTS) {
    await db.sync_queue.update(id, {
      estado: 'error',
      error: `Max intentos alcanzado: ${error}`,
      intentos,
      nextRetryAt: undefined,
      updated_at: getCurrentTimestamp(),
    })
    return
  }

  const baseDelay = RETRY_DELAYS[Math.min(intentos - 1, RETRY_DELAYS.length - 1)]
  const jitter = Math.random() * baseDelay * 0.3
  const nextRetryAt = new Date(Date.now() + baseDelay + jitter).toISOString()

  await db.sync_queue.update(id, {
    estado: 'error',
    error,
    intentos,
    nextRetryAt,
    updated_at: getCurrentTimestamp(),
  })
}

export async function marcarConflicto(
  id: UUID,
  datosServidor: Record<string, unknown>
): Promise<void> {
  await db.sync_queue.update(id, {
    estado: 'conflicto',
    datos_servidor: datosServidor,
    updated_at: getCurrentTimestamp(),
  })
}

export async function resolverConflicto(
  id: UUID,
  decision: 'local' | 'servidor'
): Promise<void> {
  const item = await db.sync_queue.get(id)
  if (!item) return

  if (decision === 'local') {
    await db.sync_queue.update(id, {
      estado: 'pendiente',
      resuelto_por: 'local',
      intentos: 0,
      nextRetryAt: undefined,
      updated_at: getCurrentTimestamp(),
    })
  } else {
    if (item.datos_servidor) {
      const tabla = getTabla(item.entidad)
      if (tabla) {
        try {
          const updateData = {
            ...item.datos_servidor,
            id: item.entidad_id,
            lastModified: getCurrentTimestamp(),
          }
          await tabla.put(updateData as never)
        } catch (err) {
          logger.error('Error applying server data during conflict resolution', { error: err instanceof Error ? { message: err.message } : { err } })
        }
      }
    }
    await db.sync_queue.delete(id)
  }
}

export function getTabla(entidad: SyncEntidad) {
  const tablas = {
    proyecto: db.proyectos,
    terreno: db.terrenos,
    zona: db.zonas,
    planta: db.plantas,
    entrada_agua: db.entradas_agua,
    cosecha: db.cosechas,
    alerta: db.alertas,
  }
  return tablas[entidad]
}

export async function limpiarColaAntigua(): Promise<number> {
  const limite = new Date(Date.now() - SYNC_CLEANUP_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const antiguos = await db.sync_queue
    .where('created_at')
    .below(limite)
    .filter(item => item.estado === 'error' && item.intentos >= MAX_RETRY_ATTEMPTS)
    .toArray()

  for (const item of antiguos) {
    await db.sync_queue.delete(item.id)
  }

  return antiguos.length
}

export async function getLastSyncAt(): Promise<string | null> {
  const meta = await db.sync_meta.get('lastSyncAt')
  return meta?.value || null
}

export async function setLastSyncAt(timestamp: string): Promise<void> {
  await db.sync_meta.put({ key: 'lastSyncAt', value: timestamp })
}
