import { agregarACola } from "./queue";
import { getSyncHabilitado } from "./sync-state";
import { logger } from "@/lib/logger";
import type { SyncEntidad, SyncAccion, UUID } from "@/types";

/**
 * Encola un cambio para sync solo si el sync está habilitado.
 * Fire-and-forget: no bloquea la operación local.
 *
 * Usa getSyncHabilitado() (síncrono, in-memory) en lugar de leer IndexedDB,
 * para evitar conflictos de transacción cuando se llama desde Dexie hooks.
 *
 * setTimeout(fn, 0) escapa la PSD zone de Dexie de forma garantizada.
 * Dexie propaga su zona a través de microtasks (Promise.then), pero NO
 * a través de macrotasks (setTimeout). Esto permite abrir una nueva
 * transacción en sync_queue sin heredar la zona inactiva del hook original.
 */
export function enqueueIfSyncEnabled(
  entidad: SyncEntidad,
  entidadId: UUID,
  accion: SyncAccion,
  datos: Record<string, unknown>,
): void {
  if (!getSyncHabilitado()) return;

  // Snapshot datos para evitar mutaciones después del timeout
  const datosCopy = { ...datos };

  setTimeout(() => {
    agregarACola(entidad, entidadId, accion, datosCopy).catch((err) => {
      logger.error("Error encolando sync", { entidad, entidadId, accion, err });
    });
  }, 0);
}
