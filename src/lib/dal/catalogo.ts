import { supabase } from "@/lib/supabase/client";
import {
  serializarParaSupabase,
  deserializarDesdeSupabase,
} from "@/lib/supabase/schema";
import { getCurrentTimestamp } from "@/lib/utils";
import type { CatalogoCultivo } from "@/types";

const TABLA = "catalogo_cultivos";

export const catalogoDAL = {
  getByProyectoId: async (proyectoId: string): Promise<CatalogoCultivo[]> => {
    const { data, error } = await supabase
      .from(TABLA)
      .select("*, catalogo_cultivos_config(tipo, origen)")
      .eq("proyecto_id", proyectoId);
    if (error) throw error;
    return (data ?? []).map((row) => {
      const configRaw = row.catalogo_cultivos_config;
      const config = Array.isArray(configRaw) ? configRaw[0] : configRaw;
      const rowSinConfig = Object.fromEntries(
        Object.entries(row as Record<string, unknown>).filter(
          ([k]) => k !== "catalogo_cultivos_config",
        ),
      );
      return deserializarDesdeSupabase<CatalogoCultivo>({
        ...rowSinConfig,
        tipo: (config as { tipo?: string } | null)?.tipo ?? undefined,
      });
    });
  },

  countByProyectoId: async (proyectoId: string): Promise<number> => {
    const { count, error } = await supabase
      .from(TABLA)
      .select("*", { count: "exact", head: true })
      .eq("proyecto_id", proyectoId);
    if (error) throw error;
    return count ?? 0;
  },

  add: async (cultivo: CatalogoCultivo): Promise<void> => {
    const payload = serializarParaSupabase(
      TABLA,
      cultivo as unknown as Record<string, unknown>,
    );
    const { error } = await supabase.from(TABLA).insert(payload);
    if (error) throw error;
  },

  update: async (
    id: string,
    changes: Partial<CatalogoCultivo>,
  ): Promise<void> => {
    const payload = serializarParaSupabase(TABLA, { id, ...changes } as Record<
      string,
      unknown
    >);
    const newDatos = payload.datos as Record<string, unknown> | undefined;

    if (newDatos && Object.keys(newDatos).length > 0) {
      const { data: current } = await supabase
        .from(TABLA)
        .select("datos")
        .eq("id", id)
        .single();
      payload.datos = { ...((current?.datos as object) ?? {}), ...newDatos };
    }

    const { error } = await supabase.from(TABLA).update(payload).eq("id", id);
    if (error) throw error;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from(TABLA).delete().eq("id", id);
    if (error) throw error;
  },

  marcarOrigenUsuario: async (cultivoId: string): Promise<void> => {
    const { error } = await supabase
      .from("catalogo_cultivos_config")
      .update({ origen: "usuario", updated_at: getCurrentTimestamp() })
      .eq("cultivo_id", cultivoId);
    if (error) throw error;
  },

  deleteByProyectoId: async (proyectoId: string): Promise<void> => {
    const { error } = await supabase
      .from(TABLA)
      .delete()
      .eq("proyecto_id", proyectoId);
    if (error) throw error;
  },
};
