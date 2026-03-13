import { supabase } from "@/lib/supabase/client";
import {
  serializarParaSupabase,
  deserializarDesdeSupabase,
} from "@/lib/supabase/schema";
import type { InsumoUsuario } from "@/types";

const TABLA = "insumos_usuario";

export const insumosDAL = {
  getAll: async (): Promise<InsumoUsuario[]> => {
    const { data, error } = await supabase.from(TABLA).select("*");
    if (error) throw error;
    return (data ?? []).map((row) =>
      deserializarDesdeSupabase<InsumoUsuario>(row),
    );
  },

  getByTerrenoId: async (terrenoId: string): Promise<InsumoUsuario[]> => {
    const { data, error } = await supabase
      .from(TABLA)
      .select("*")
      .eq("terreno_id", terrenoId);
    if (error) throw error;
    return (data ?? []).map((row) =>
      deserializarDesdeSupabase<InsumoUsuario>(row),
    );
  },

  add: async (insumo: InsumoUsuario): Promise<void> => {
    const payload = serializarParaSupabase(
      TABLA,
      insumo as unknown as Record<string, unknown>,
    );
    const { error } = await supabase.from(TABLA).insert(payload);
    if (error) throw error;
  },

  update: async (
    id: string,
    changes: Partial<InsumoUsuario>,
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
};
