import { supabase } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";
import type {
  SyncAdapter,
  SyncRequest,
  SyncResponse,
  PullRequest,
  PullResponse,
} from "./types";
import {
  TABLA_POR_ENTIDAD,
  serializarParaSupabase,
  deserializarDesdeSupabase,
} from "./schema";

export class SupabaseAdapter implements SyncAdapter {
  async push(request: SyncRequest): Promise<SyncResponse> {
    const tabla = TABLA_POR_ENTIDAD[request.entidad];
    if (!tabla) {
      return {
        success: false,
        error: `Entidad desconocida: ${request.entidad}`,
      };
    }

    try {
      if (request.accion === "delete") {
        const { error } = await supabase
          .from(tabla)
          .delete()
          .eq("id", request.entidadId);

        if (error) throw error;
        return { success: true };
      }

      const payload = serializarParaSupabase(tabla, {
        ...request.datos,
        id: request.entidadId,
      });

      const { data, error } = await supabase
        .from(tabla)
        .upsert(payload, { onConflict: "id" })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: deserializarDesdeSupabase(data as Record<string, unknown>),
      };
    } catch (err) {
      logger.error(`SupabaseAdapter.push error [${request.entidad}]`, { err });
      return {
        success: false,
        error: err instanceof Error ? err.message : "Error desconocido",
      };
    }
  }

  async pull(request: PullRequest): Promise<PullResponse> {
    const tabla = TABLA_POR_ENTIDAD[request.entidad];
    if (!tabla) {
      return {
        success: false,
        data: [],
        error: `Entidad desconocida: ${request.entidad}`,
      };
    }

    try {
      let query = supabase.from(tabla).select("*");

      if (request.since) {
        query = query.gt("updated_at", request.since);
      }

      const { data, error } = await query;

      if (error) throw error;

      const rawRows = (data ?? []) as Record<string, unknown>[];
      const rows = rawRows.map(deserializarDesdeSupabase);

      const lastModified =
        rawRows.length > 0
          ? rawRows.reduce(
              (max, row) =>
                (row.updated_at as string) > max
                  ? (row.updated_at as string)
                  : max,
              rawRows[0].updated_at as string,
            )
          : undefined;

      return {
        success: true,
        data: rows,
        lastModified,
      };
    } catch (err) {
      logger.error(`SupabaseAdapter.pull error [${request.entidad}]`, { err });
      return {
        success: false,
        data: [],
        error: err instanceof Error ? err.message : "Error desconocido",
      };
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return !!session;
    } catch {
      return false;
    }
  }
}

export const supabaseAdapter = new SupabaseAdapter();
