"use client";

import { useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { insumosDAL } from "@/lib/dal";
import { generateUUID, getCurrentTimestamp } from "@/lib/utils";
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
  const insumos = useLiveQuery(async () => {
    if (!terrenoId) return [];
    return insumosDAL.getByTerrenoId(terrenoId);
  }, [terrenoId]);

  const loading = insumos === undefined;

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

      await insumosDAL.add(nuevo);
      return nuevo;
    },
    [terrenoId],
  );

  const eliminarInsumo = useCallback(async (id: UUID): Promise<void> => {
    await insumosDAL.delete(id);
  }, []);

  return {
    insumos: insumos ?? [],
    loading,
    agregarInsumo,
    eliminarInsumo,
  };
}
