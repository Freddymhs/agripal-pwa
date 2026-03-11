/**
 * Dexie hooks para auto-enqueue de sync.
 *
 * Intercepta TODAS las escrituras a las tablas sincronizables
 * (DALs, transactions, lo que sea) y encola automáticamente.
 */
import type { AgriPlanDB } from "@/lib/db";
import { ENTIDAD_POR_TABLA } from "./schema";
import type { SyncEntidad } from "@/types";

// Flag global: el sync engine lo activa durante pull para no re-encolar
let _suppressEnqueue = false;

export function suppressSyncEnqueue(value: boolean): void {
  _suppressEnqueue = value;
}

// Lazy import para evitar circular dependency (db → hooks → queue → db)
function enqueue(
  entidad: SyncEntidad,
  id: string,
  accion: "create" | "update" | "delete",
  datos: Record<string, unknown>,
): void {
  if (_suppressEnqueue) return;

  import("./enqueue")
    .then(({ enqueueIfSyncEnabled }) => {
      enqueueIfSyncEnabled(entidad, id, accion, datos);
    })
    .catch(() => {
      // Silent fail — sync is optional
    });
}

const TABLAS_SYNC = [
  "proyectos",
  "terrenos",
  "zonas",
  "plantas",
  "entradas_agua",
  "cosechas",
  "alertas",
  "catalogo_cultivos",
  "insumos_usuario",
] as const;

export function registerSyncHooks(database: AgriPlanDB): void {
  for (const tabla of TABLAS_SYNC) {
    const entidad = ENTIDAD_POR_TABLA[tabla];
    if (!entidad) continue;

    const table = database.table(tabla);

    table.hook("creating", function (_primKey, obj) {
      const record = obj as Record<string, unknown>;
      const id = record.id as string;
      if (id) {
        enqueue(entidad, id, "create", { ...record });
      }
    });

    table.hook("updating", function (modifications, primKey, obj) {
      const id = primKey as string;
      if (id) {
        // Merge full pre-modification object with the diff to avoid sending
        // partial datos to Supabase (which would overwrite the JSONB column with
        // only the changed fields, losing all other fields).
        const current = (obj ?? {}) as Record<string, unknown>;
        const mods = modifications as Record<string, unknown>;
        enqueue(entidad, id, "update", { ...current, ...mods });
      }
    });

    table.hook("deleting", function (primKey) {
      const id = primKey as string;
      if (id) {
        enqueue(entidad, id, "delete", {});
      }
    });
  }
}
