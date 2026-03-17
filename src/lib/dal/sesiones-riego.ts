import { supabase } from "@/lib/supabase/client";
import {
  serializarParaSupabase,
  deserializarDesdeSupabase,
} from "@/lib/supabase/schema";
import type { SesionRiego, UUID } from "@/types";

const TABLA = "sesiones_riego";

export const sesionesRiegoDAL = {
  getByZonaId: async (zonaId: UUID): Promise<SesionRiego[]> => {
    const { data, error } = await supabase
      .from(TABLA)
      .select("*")
      .eq("zona_id", zonaId)
      .order("fecha", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) =>
      deserializarDesdeSupabase<SesionRiego>(row),
    );
  },

  getByTerrenoId: async (terrenoId: UUID): Promise<SesionRiego[]> => {
    const { data, error } = await supabase
      .from(TABLA)
      .select("*")
      .eq("terreno_id", terrenoId)
      .order("fecha", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) =>
      deserializarDesdeSupabase<SesionRiego>(row),
    );
  },

  crear: async (
    sesion: Omit<
      SesionRiego,
      "id" | "created_at" | "updated_at" | "lastModified"
    >,
  ): Promise<SesionRiego> => {
    const payload = serializarParaSupabase(
      TABLA,
      sesion as unknown as Record<string, unknown>,
    );
    const { data, error } = await supabase
      .from(TABLA)
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return deserializarDesdeSupabase<SesionRiego>(data);
  },

  eliminar: async (sesionId: UUID): Promise<void> => {
    const { error } = await supabase.from(TABLA).delete().eq("id", sesionId);
    if (error) throw error;
  },
};
