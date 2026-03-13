import { supabase } from "@/lib/supabase/client";
import {
  serializarParaSupabase,
  deserializarDesdeSupabase,
} from "@/lib/supabase/schema";
import type { Cosecha } from "@/types";

const TABLA = "cosechas";

export const cosechasDAL = {
  getByZonaId: async (zonaId: string): Promise<Cosecha[]> => {
    const { data, error } = await supabase
      .from(TABLA)
      .select("*")
      .eq("zona_id", zonaId);
    if (error) throw error;
    return (data ?? []).map((row) => deserializarDesdeSupabase<Cosecha>(row));
  },

  getByZonaIds: async (zonaIds: string[]): Promise<Cosecha[]> => {
    if (zonaIds.length === 0) return [];
    const { data, error } = await supabase
      .from(TABLA)
      .select("*")
      .in("zona_id", zonaIds);
    if (error) throw error;
    return (data ?? []).map((row) => deserializarDesdeSupabase<Cosecha>(row));
  },

  add: async (cosecha: Cosecha): Promise<void> => {
    const payload = serializarParaSupabase(
      TABLA,
      cosecha as unknown as Record<string, unknown>,
    );
    const { error } = await supabase.from(TABLA).insert(payload);
    if (error) throw error;
  },

  update: async (id: string, changes: Partial<Cosecha>): Promise<void> => {
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
