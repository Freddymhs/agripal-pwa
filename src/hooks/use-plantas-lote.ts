"use client";

import { useCallback } from "react";
import { plantasDAL, transaccionesDAL } from "@/lib/dal";
import { ejecutarMutacion } from "@/lib/helpers/dal-mutation";
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
        throw new Error(`Estado "${estado}" no es un estado válido de planta`);
      }

      const timestamp = getCurrentTimestamp();
      await ejecutarMutacion(
        () =>
          transaccionesDAL.cambiarEstadoPlantasLote(ids, {
            estado,
            updated_at: timestamp,
          }),
        "cambiar estado plantas en lote",
        onRefetch,
      );
    },
    [onRefetch],
  );

  const eliminarMultiple = useCallback(
    async (ids: string[]) => {
      await ejecutarMutacion(
        () => plantasDAL.bulkDelete(ids),
        "eliminar plantas en lote",
        onRefetch,
      );
    },
    [onRefetch],
  );

  return {
    cambiarEstadoMultiple,
    eliminarMultiple,
  };
}
