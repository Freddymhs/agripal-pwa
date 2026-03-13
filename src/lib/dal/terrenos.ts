import { supabase } from "@/lib/supabase/client";
import {
  serializarParaSupabase,
  deserializarDesdeSupabase,
} from "@/lib/supabase/schema";
import type { Terreno } from "@/types";

const TABLA = "terrenos";

export const terrenosDAL = {
  getAll: async (): Promise<Terreno[]> => {
    const { data, error } = await supabase.from(TABLA).select("*");
    if (error) throw error;
    return (data ?? []).map((row) => deserializarDesdeSupabase<Terreno>(row));
  },

  getById: async (id: string): Promise<Terreno | undefined> => {
    const { data, error } = await supabase
      .from(TABLA)
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? deserializarDesdeSupabase<Terreno>(data) : undefined;
  },

  getByProyectoId: async (proyectoId: string): Promise<Terreno[]> => {
    const { data, error } = await supabase
      .from(TABLA)
      .select("*")
      .eq("proyecto_id", proyectoId);
    if (error) throw error;
    return (data ?? []).map((row) => deserializarDesdeSupabase<Terreno>(row));
  },

  add: async (terreno: Terreno): Promise<void> => {
    const payload = serializarParaSupabase(
      TABLA,
      terreno as unknown as Record<string, unknown>,
    );
    const { error } = await supabase.from(TABLA).insert(payload);
    if (error) throw error;
  },

  update: async (id: string, changes: Partial<Terreno>): Promise<void> => {
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

  deleteByProyectoId: async (proyectoId: string): Promise<void> => {
    const { error } = await supabase
      .from(TABLA)
      .delete()
      .eq("proyecto_id", proyectoId);
    if (error) throw error;
  },
};
