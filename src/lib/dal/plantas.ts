import { supabase } from "@/lib/supabase/client";
import {
  serializarParaSupabase,
  deserializarDesdeSupabase,
} from "@/lib/supabase/schema";
import type { Planta } from "@/types";

const TABLA = "plantas";

export const plantasDAL = {
  getAll: async (): Promise<Planta[]> => {
    const { data, error } = await supabase.from(TABLA).select("*");
    if (error) throw error;
    return (data ?? []).map((row) => deserializarDesdeSupabase<Planta>(row));
  },

  getByZonaId: async (zonaId: string): Promise<Planta[]> => {
    const { data, error } = await supabase
      .from(TABLA)
      .select("*")
      .eq("zona_id", zonaId);
    if (error) throw error;
    return (data ?? []).map((row) => deserializarDesdeSupabase<Planta>(row));
  },

  getByZonaIds: async (zonaIds: string[]): Promise<Planta[]> => {
    if (zonaIds.length === 0) return [];
    const { data, error } = await supabase
      .from(TABLA)
      .select("*")
      .in("zona_id", zonaIds);
    if (error) throw error;
    return (data ?? []).map((row) => deserializarDesdeSupabase<Planta>(row));
  },

  countByZonaIds: async (zonaIds: string[]): Promise<number> => {
    if (zonaIds.length === 0) return 0;
    const { count, error } = await supabase
      .from(TABLA)
      .select("*", { count: "exact", head: true })
      .in("zona_id", zonaIds);
    if (error) throw error;
    return count ?? 0;
  },

  getByZonaIdFiltered: async (
    zonaId: string,
    predicate: (p: Planta) => boolean,
  ): Promise<Planta[]> => {
    const all = await plantasDAL.getByZonaId(zonaId);
    return all.filter(predicate);
  },

  add: async (planta: Planta): Promise<void> => {
    const payload = serializarParaSupabase(
      TABLA,
      planta as unknown as Record<string, unknown>,
    );
    const { error } = await supabase.from(TABLA).insert(payload);
    if (error) throw error;
  },

  bulkAdd: async (plantas: Planta[]): Promise<void> => {
    if (plantas.length === 0) return;
    const payloads = plantas.map((p) =>
      serializarParaSupabase(TABLA, p as unknown as Record<string, unknown>),
    );
    const { error } = await supabase.from(TABLA).insert(payloads);
    if (error) throw error;
  },

  update: async (id: string, changes: Partial<Planta>): Promise<void> => {
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

  bulkDelete: async (ids: string[]): Promise<void> => {
    if (ids.length === 0) return;
    const { error } = await supabase.from(TABLA).delete().in("id", ids);
    if (error) throw error;
  },

  deleteByZonaIds: async (zonaIds: string[]): Promise<void> => {
    if (zonaIds.length === 0) return;
    const { error } = await supabase
      .from(TABLA)
      .delete()
      .in("zona_id", zonaIds);
    if (error) throw error;
  },
};
