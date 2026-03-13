import { supabase } from "@/lib/supabase/client";
import {
  serializarParaSupabase,
  deserializarDesdeSupabase,
} from "@/lib/supabase/schema";
import type { Alerta } from "@/types";
import { ESTADO_ALERTA } from "@/lib/constants/entities";

const TABLA = "alertas";

export const alertasDAL = {
  getActiveByTerrenoId: async (terrenoId: string): Promise<Alerta[]> => {
    const { data, error } = await supabase
      .from(TABLA)
      .select("*")
      .eq("terreno_id", terrenoId)
      .eq("estado", ESTADO_ALERTA.ACTIVA);
    if (error) throw error;
    return (data ?? []).map((row) => deserializarDesdeSupabase<Alerta>(row));
  },

  add: async (alerta: Alerta): Promise<void> => {
    const payload = serializarParaSupabase(
      TABLA,
      alerta as unknown as Record<string, unknown>,
    );
    const { error } = await supabase.from(TABLA).insert(payload);
    if (error) throw error;
  },

  update: async (id: string, changes: Partial<Alerta>): Promise<void> => {
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
};
