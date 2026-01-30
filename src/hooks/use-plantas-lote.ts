"use client";

import { useCallback } from "react";
import { plantasDAL } from "@/lib/dal";
import { getCurrentTimestamp } from "@/lib/utils";
import type { EstadoPlanta } from "@/types";

interface UsePlantasLote {
  cambiarEstadoMultiple: (ids: string[], estado: EstadoPlanta) => Promise<void>;
  eliminarMultiple: (ids: string[]) => Promise<void>;
}

export function usePlantasLote(onRefetch: () => void): UsePlantasLote {
  const cambiarEstadoMultiple = useCallback(
    async (ids: string[], estado: EstadoPlanta) => {
      const timestamp = getCurrentTimestamp();
      try {
        await Promise.all(
          ids.map((id) =>
            plantasDAL.update(id, {
              estado,
              updated_at: timestamp,
            }),
          ),
        );
      } catch (err) {
        console.error("Error actualizando plantas en lote:", err);
        throw err;
      }
      onRefetch();
    },
    [onRefetch],
  );

  const eliminarMultiple = useCallback(
    async (ids: string[]) => {
      try {
        await plantasDAL.bulkDelete(ids);
      } catch (err) {
        console.error("Error eliminando plantas en lote:", err);
        throw err;
      }
      onRefetch();
    },
    [onRefetch],
  );

  return {
    cambiarEstadoMultiple,
    eliminarMultiple,
  };
}
