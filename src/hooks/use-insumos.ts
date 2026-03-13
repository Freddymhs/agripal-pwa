"use client";

import { useCallback, useEffect, useState } from "react";
import { insumosDAL } from "@/lib/dal";
import { generateUUID, getCurrentTimestamp } from "@/lib/utils";
import { ejecutarMutacion } from "@/lib/helpers/dal-mutation";
import { logger } from "@/lib/logger";
import type { InsumoUsuario, UUID } from "@/types";

interface UseInsumos {
  insumos: InsumoUsuario[];
  loading: boolean;
  agregarInsumo: (
    data: Omit<InsumoUsuario, "id" | "created_at" | "updated_at">,
  ) => Promise<InsumoUsuario>;
  eliminarInsumo: (id: UUID) => Promise<void>;
}

export function useInsumos(terrenoId: UUID | null): UseInsumos {
  const [insumos, setInsumos] = useState<InsumoUsuario[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInsumos = useCallback(async () => {
    if (!terrenoId) {
      setInsumos([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await insumosDAL.getByTerrenoId(terrenoId);
      setInsumos(data);
    } catch (err) {
      logger.error("Error cargando insumos", { error: err });
    } finally {
      setLoading(false);
    }
  }, [terrenoId]);

  useEffect(() => {
    fetchInsumos();
  }, [fetchInsumos]);

  const agregarInsumo = useCallback(
    async (
      data: Omit<InsumoUsuario, "id" | "created_at" | "updated_at">,
    ): Promise<InsumoUsuario> => {
      if (!terrenoId) throw new Error("No hay terreno seleccionado");

      const timestamp = getCurrentTimestamp();
      const nuevo: InsumoUsuario = {
        ...data,
        id: generateUUID(),
        created_at: timestamp,
        updated_at: timestamp,
      };

      await ejecutarMutacion(
        () => insumosDAL.add(nuevo),
        "agregando insumo",
        fetchInsumos,
      );
      return nuevo;
    },
    [terrenoId, fetchInsumos],
  );

  const eliminarInsumo = useCallback(
    async (id: UUID): Promise<void> => {
      await ejecutarMutacion(
        () => insumosDAL.delete(id),
        "eliminando insumo",
        fetchInsumos,
      );
    },
    [fetchInsumos],
  );

  return {
    insumos,
    loading,
    agregarInsumo,
    eliminarInsumo,
  };
}
