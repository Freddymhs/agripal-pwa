import { supabase } from "@/lib/supabase/client";
import {
  deserializarDesdeSupabase,
  serializarParaSupabase,
} from "@/lib/supabase/schema";
import { logger } from "@/lib/logger";
import type { TareaGantt } from "@/types";

const TABLA = "tareas_gantt";

export const tareasGanttDAL = {
  getByTerrenoId: async (terrenoId: string): Promise<TareaGantt[]> => {
    try {
      const { data, error } = await supabase
        .from(TABLA)
        .select("*")
        .eq("terreno_id", terrenoId);
      if (error) throw error;
      return (data ?? []).map((row) =>
        deserializarDesdeSupabase<TareaGantt>(row),
      );
    } catch (error) {
      logger.error("Error DAL tareas_gantt.getByTerrenoId", {
        error,
        terrenoId,
      });
      throw error;
    }
  },

  add: async (tarea: TareaGantt): Promise<void> => {
    try {
      const payload = serializarParaSupabase(
        TABLA,
        tarea as unknown as Record<string, unknown>,
      );
      const { error } = await supabase.from(TABLA).insert(payload);
      if (error) throw error;
    } catch (error) {
      logger.error("Error DAL tareas_gantt.add", {
        error,
        tareaId: tarea.id,
        proyectoId: tarea.proyecto_id,
        terrenoId: tarea.terreno_id,
      });
      throw error;
    }
  },

  update: async (id: string, changes: Partial<TareaGantt>): Promise<void> => {
    try {
      const payload = serializarParaSupabase(TABLA, {
        id,
        ...changes,
      } as Record<string, unknown>);
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
    } catch (error) {
      logger.error("Error DAL tareas_gantt.update", { error, id, changes });
      throw error;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase.from(TABLA).delete().eq("id", id);
      if (error) throw error;
    } catch (error) {
      logger.error("Error DAL tareas_gantt.delete", { error, id });
      throw error;
    }
  },
};
