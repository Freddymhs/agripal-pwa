import { supabase } from "@/lib/supabase/client";
import {
  serializarParaSupabase,
  deserializarDesdeSupabase,
} from "@/lib/supabase/schema";
import type { Zona } from "@/types";

const TABLA = "zonas";

export const zonasDAL = {
  getById: async (id: string): Promise<Zona | null> => {
    const { data, error } = await supabase
      .from(TABLA)
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data ? deserializarDesdeSupabase<Zona>(data) : null;
  },

  getByTerrenoId: async (terrenoId: string): Promise<Zona[]> => {
    const { data, error } = await supabase
      .from(TABLA)
      .select("*")
      .eq("terreno_id", terrenoId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((row) => deserializarDesdeSupabase<Zona>(row));
  },

  getByTerrenoIds: async (terrenoIds: string[]): Promise<Zona[]> => {
    if (terrenoIds.length === 0) return [];
    const { data, error } = await supabase
      .from(TABLA)
      .select("*")
      .in("terreno_id", terrenoIds)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((row) => deserializarDesdeSupabase<Zona>(row));
  },

  add: async (zona: Zona): Promise<void> => {
    const payload = serializarParaSupabase(
      TABLA,
      zona as unknown as Record<string, unknown>,
    );
    const { error } = await supabase.from(TABLA).insert(payload);
    if (error) throw error;
  },

  update: async (id: string, changes: Partial<Zona>): Promise<void> => {
    const payload = serializarParaSupabase(TABLA, { id, ...changes } as Record<
      string,
      unknown
    >);
    const newDatos = payload.datos as Record<string, unknown> | undefined;

    if (newDatos && Object.keys(newDatos).length > 0) {
      // Merge JSONB datos to avoid overwriting fields not included in `changes`
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

  deleteByTerrenoId: async (terrenoId: string): Promise<void> => {
    const { error } = await supabase
      .from(TABLA)
      .delete()
      .eq("terreno_id", terrenoId);
    if (error) throw error;
  },

  deleteByTerrenoIds: async (terrenoIds: string[]): Promise<void> => {
    if (terrenoIds.length === 0) return;
    const { error } = await supabase
      .from(TABLA)
      .delete()
      .in("terreno_id", terrenoIds);
    if (error) throw error;
  },
};
