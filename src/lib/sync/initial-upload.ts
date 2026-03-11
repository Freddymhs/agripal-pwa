import { supabase } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { syncMetaDAL } from "@/lib/dal/sync-meta";
import { serializarParaSupabase } from "./schema";
import { suppressSyncEnqueue } from "./db-hooks";

export interface UploadProgress {
  tabla: string;
  total: number;
  done: number;
}

type ProgressCallback = (progress: UploadProgress) => void;

// Orden de inserción respeta FK: proyectos → terrenos → zonas → plantas → resto
// critica: true → falla aborta toda la activación
// critica: false → falla se loguea como warning pero la activación continúa
const TABLAS_EN_ORDEN = [
  { tabla: "proyectos", source: () => db.proyectos.toArray(), critica: true },
  { tabla: "terrenos", source: () => db.terrenos.toArray(), critica: true },
  { tabla: "zonas", source: () => db.zonas.toArray(), critica: true },
  { tabla: "plantas", source: () => db.plantas.toArray(), critica: true },
  {
    tabla: "entradas_agua",
    source: () => db.entradas_agua.toArray(),
    critica: false,
  },
  { tabla: "cosechas", source: () => db.cosechas.toArray(), critica: false },
  { tabla: "alertas", source: () => db.alertas.toArray(), critica: false },
  {
    tabla: "catalogo_cultivos",
    source: () => db.catalogo_cultivos.toArray(),
    critica: false,
  },
  {
    tabla: "insumos_usuario",
    source: () => db.insumos_usuario.toArray(),
    critica: false,
  },
] as const;

export async function ejecutarCargaInicial(
  onProgress?: ProgressCallback,
): Promise<void> {
  // Obtener el usuario autenticado para parchar usuario_id
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Debes iniciar sesión para activar la sincronización");
  }

  suppressSyncEnqueue(true);
  try {
    for (const { tabla, source, critica } of TABLAS_EN_ORDEN) {
      const rawRows = await source();

      if (rawRows.length === 0) continue;

      onProgress?.({ tabla, total: rawRows.length, done: 0 });

      const rows = (rawRows as unknown as Record<string, unknown>[]).map(
        (row) => serializarParaSupabase(tabla, row),
      );

      // Parchar usuario_id en proyectos con el ID real de Supabase Auth
      if (tabla === "proyectos") {
        for (const row of rows) {
          row.usuario_id = user.id;
        }
        // También actualizar en IndexedDB local
        for (const raw of rawRows) {
          const record = raw as unknown as Record<string, unknown>;
          if (record.usuario_id !== user.id) {
            await db.proyectos.update(record.id as string, {
              usuario_id: user.id,
            });
          }
        }
      }

      const { error } = await supabase
        .from(tabla)
        .upsert(rows, { onConflict: "id" });

      if (error) {
        if (critica) {
          logger.error(`Error en carga inicial [${tabla}]`, { error });
          throw new Error(`Error subiendo ${tabla}: ${error.message}`);
        }
        // Tabla no crítica: loguear y continuar (ej: alertas con FK huérfanas por RLS)
        logger.warn(`Advertencia en carga inicial [${tabla}] — omitida`, {
          error,
        });
        continue;
      }

      onProgress?.({ tabla, total: rawRows.length, done: rawRows.length });
      logger.info(`Carga inicial [${tabla}]: ${rawRows.length} registros`);
    }
  } finally {
    suppressSyncEnqueue(false);
  }

  await syncMetaDAL.setSyncHabilitado(true);

  // Pull inmediato: traer datos de Supabase → IndexedDB
  // (cubre el caso de IndexedDB vacío + datos en la nube)
  const { ejecutarSync, setAdapter, getAdapter } =
    await import("@/lib/sync/engine");
  if (!getAdapter()) {
    const { supabaseAdapter } = await import("@/lib/sync/adapters");
    setAdapter(supabaseAdapter);
  }
  const result = await ejecutarSync();
  logger.info("Pull tras carga inicial", {
    pulled: result.pulled,
    pushed: result.pushed,
  });
}
