"use client";

import { useCallback } from "react";
import { logger } from "@/lib/logger";
import { plantasDAL, transaccionesDAL } from "@/lib/dal";
import { getCurrentTimestamp } from "@/lib/utils";
import { validarEstadoPlanta } from "@/lib/validations/planta";
import type { EstadoPlanta } from "@/types";

interface UsePlantasLote {
  cambiarEstadoMultiple: (ids: string[], estado: EstadoPlanta) => Promise<void>;
  eliminarMultiple: (ids: string[]) => Promise<void>;
}

export function usePlantasLote(onRefetch: () => void): UsePlantasLote {
  const cambiarEstadoMultiple = useCallback(
    async (ids: string[], estado: EstadoPlanta) => {
      if (!validarEstadoPlanta(estado)) {
        throw new Error(`Estado "${estado}" no es un estado válido de planta`)
      }

      const timestamp = getCurrentTimestamp();
      try {
        await transaccionesDAL.cambiarEstadoPlantasLote(ids, {
          estado,
          updated_at: timestamp,
        });
      } catch (err) {
        logger.error("Error actualizando plantas en lote", { error: err });
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
        logger.error("Error eliminando plantas en lote", { error: err });
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
