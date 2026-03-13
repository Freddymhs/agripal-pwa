import { supabase } from "@/lib/supabase/client";
import {
  serializarParaSupabase,
  deserializarDesdeSupabase,
} from "@/lib/supabase/schema";
import type { EntradaAgua } from "@/types";

const TABLA = "entradas_agua";

export const aguaDAL = {
  getEntradasByTerrenoId: async (terrenoId: string): Promise<EntradaAgua[]> => {
    const { data, error } = await supabase
      .from(TABLA)
      .select("*")
      .eq("terreno_id", terrenoId)
      .order("fecha", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) =>
      deserializarDesdeSupabase<EntradaAgua>(row),
    );
  },

  addEntrada: async (entrada: EntradaAgua): Promise<void> => {
    const payload = serializarParaSupabase(
      TABLA,
      entrada as unknown as Record<string, unknown>,
    );
    const { error } = await supabase.from(TABLA).insert(payload);
    if (error) throw error;
  },
};
