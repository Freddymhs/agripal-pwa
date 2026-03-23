import { supabase } from "@/lib/supabase/client";
import {
  serializarParaSupabase,
  deserializarDesdeSupabase,
} from "@/lib/supabase/schema";
import type { Planta } from "@/types";

const TABLA = "plantas";
const PAGE_SIZE = 1000;

/** Pagina automáticamente queries que pueden exceder el límite de 1000 filas de Supabase */
async function fetchPaginado(
  buildQuery: (
    from: number,
    to: number,
  ) => PromiseLike<{
    data: Record<string, unknown>[] | null;
    error: { message: string } | null;
  }>,
): Promise<Planta[]> {
  const all: Planta[] = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await buildQuery(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    const rows = data ?? [];
    for (const row of rows) {
      all.push(deserializarDesdeSupabase<Planta>(row));
    }
    if (rows.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return all;
}

export const plantasDAL = {
  getAll: async (): Promise<Planta[]> => {
    return fetchPaginado((from, to) =>
      supabase.from(TABLA).select("*").range(from, to),
    );
  },

  getByZonaId: async (zonaId: string): Promise<Planta[]> => {
    return fetchPaginado((from, to) =>
      supabase.from(TABLA).select("*").eq("zona_id", zonaId).range(from, to),
    );
  },

  getByZonaIds: async (zonaIds: string[]): Promise<Planta[]> => {
    if (zonaIds.length === 0) return [];
    return fetchPaginado((from, to) =>
      supabase.from(TABLA).select("*").in("zona_id", zonaIds).range(from, to),
    );
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
