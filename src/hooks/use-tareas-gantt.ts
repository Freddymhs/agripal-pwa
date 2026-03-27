"use client";

import { useCallback, useEffect, useState } from "react";
import { tareasGanttDAL } from "@/lib/dal";
import { ejecutarMutacion } from "@/lib/helpers/dal-mutation";
import { logger } from "@/lib/logger";
import { generateUUID, getCurrentTimestamp } from "@/lib/utils";
import type { TareaGantt, TareaGanttColor, UUID } from "@/types";

interface UseTareasGanttParams {
  usuarioId?: UUID;
  proyectoId?: UUID;
  terrenoId?: UUID;
}

interface UseTareasGantt {
  tareas: TareaGantt[];
  loading: boolean;
  crearTarea: (data: {
    titulo: string;
    fecha_inicio: string;
    fecha_fin: string;
    color: TareaGanttColor;
  }) => Promise<{ tarea?: TareaGantt; error?: string }>;
  actualizarTarea: (
    id: UUID,
    changes: Partial<
      Pick<TareaGantt, "titulo" | "fecha_inicio" | "fecha_fin" | "color">
    >,
  ) => Promise<{ error?: string }>;
}

export function useTareasGantt({
  usuarioId,
  proyectoId,
  terrenoId,
}: UseTareasGanttParams): UseTareasGantt {
  const [tareas, setTareas] = useState<TareaGantt[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTareas = useCallback(async () => {
    if (!terrenoId) {
      setTareas([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await tareasGanttDAL.getByTerrenoId(terrenoId);
      setTareas(data);
    } catch (err) {
      logger.error("Error cargando tareas Gantt", { error: err });
    } finally {
      setLoading(false);
    }
  }, [terrenoId]);

  useEffect(() => {
    fetchTareas();
  }, [fetchTareas]);

  const crearTarea = useCallback(
    async (data: {
      titulo: string;
      fecha_inicio: string;
      fecha_fin: string;
      color: TareaGanttColor;
    }) => {
      if (!usuarioId || !proyectoId || !terrenoId) {
        return { error: "No hay usuario, terreno o proyecto activo." };
      }

      const now = getCurrentTimestamp();
      const tarea: TareaGantt = {
        id: generateUUID(),
        usuario_id: usuarioId,
        proyecto_id: proyectoId,
        terreno_id: terrenoId,
        titulo: data.titulo,
        fecha_inicio: data.fecha_inicio,
        fecha_fin: data.fecha_fin,
        color: data.color,
        created_at: now,
        updated_at: now,
      };

      try {
        await ejecutarMutacion(
          () => tareasGanttDAL.add(tarea),
          "creando tarea Gantt",
          fetchTareas,
        );
        return { tarea };
      } catch (err) {
        return {
          error: err instanceof Error ? err.message : "Error al crear tarea",
        };
      }
    },
    [fetchTareas, usuarioId, proyectoId, terrenoId],
  );

  const actualizarTarea = useCallback(
    async (
      id: UUID,
      changes: Partial<
        Pick<TareaGantt, "titulo" | "fecha_inicio" | "fecha_fin" | "color">
      >,
    ) => {
      try {
        await ejecutarMutacion(
          () =>
            tareasGanttDAL.update(id, {
              ...changes,
              updated_at: getCurrentTimestamp(),
            }),
          "actualizando tarea Gantt",
          fetchTareas,
        );
        return {};
      } catch (err) {
        return {
          error:
            err instanceof Error ? err.message : "Error al actualizar tarea",
        };
      }
    },
    [fetchTareas],
  );

  return { tareas, loading, crearTarea, actualizarTarea };
}
