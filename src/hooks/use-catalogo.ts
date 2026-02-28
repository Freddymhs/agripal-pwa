"use client";

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { catalogoDAL, plantasDAL, transaccionesDAL } from "@/lib/dal";
import { generateUUID, getCurrentTimestamp } from "@/lib/utils";
import { crearCatalogoInicial } from "@/lib/data/cultivos-arica";
import type { CatalogoCultivo, UUID } from "@/types";
import { QUERY_KEYS } from "@/lib/constants/query-keys";

interface UseCatalogo {
  cultivos: CatalogoCultivo[];
  loading: boolean;
  error: Error | null;

  agregarCultivo: (
    data: Omit<
      CatalogoCultivo,
      "id" | "proyecto_id" | "created_at" | "updated_at"
    >,
  ) => Promise<CatalogoCultivo>;
  actualizarCultivo: (
    id: UUID,
    cambios: Partial<CatalogoCultivo>,
  ) => Promise<void>;
  eliminarCultivo: (id: UUID) => Promise<void>;
  obtenerCultivo: (id: UUID) => CatalogoCultivo | undefined;
}

export function useCatalogo(proyectoId: UUID | null): UseCatalogo {
  const queryClient = useQueryClient();

  const {
    data: cultivos = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: QUERY_KEYS.catalogo(proyectoId!),
    queryFn: async () => {
      if (!proyectoId) return [];

      const data = await catalogoDAL.getByProyectoId(proyectoId);

      if (data.length === 0) {
        const cultivosIniciales = crearCatalogoInicial(proyectoId);
        await transaccionesDAL.seedCatalogo(cultivosIniciales);
        return cultivosIniciales;
      }

      return data;
    },
    enabled: !!proyectoId,
  });

  const agregarCultivoMutation = useMutation({
    mutationFn: async (
      data: Omit<
        CatalogoCultivo,
        "id" | "proyecto_id" | "created_at" | "updated_at"
      >,
    ) => {
      if (!proyectoId) {
        throw new Error("No hay proyecto seleccionado");
      }

      const nuevo: CatalogoCultivo = {
        ...data,
        id: generateUUID(),
        proyecto_id: proyectoId,
        created_at: getCurrentTimestamp(),
        updated_at: getCurrentTimestamp(),
      };

      await catalogoDAL.add(nuevo);
      return nuevo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.catalogo(proyectoId!),
      });
    },
  });

  const actualizarCultivoMutation = useMutation({
    mutationFn: async (params: {
      id: UUID;
      cambios: Partial<CatalogoCultivo>;
    }) => {
      await catalogoDAL.update(params.id, {
        ...params.cambios,
        updated_at: getCurrentTimestamp(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.catalogo(proyectoId!),
      });
    },
  });

  const eliminarCultivoMutation = useMutation({
    mutationFn: async (id: UUID) => {
      const todasPlantas = await plantasDAL.getAll();
      const plantasUsandoCultivo = todasPlantas.filter(
        (p) => p.tipo_cultivo_id === id,
      );
      if (plantasUsandoCultivo.length > 0) {
        throw new Error(
          `No se puede eliminar: ${plantasUsandoCultivo.length} planta(s) usan este cultivo. Elimina o cambia las plantas primero.`,
        );
      }
      await catalogoDAL.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.catalogo(proyectoId!),
      });
    },
  });

  const obtenerCultivo = useCallback(
    (id: UUID) => {
      return cultivos.find((c) => c.id === id);
    },
    [cultivos],
  );

  return {
    cultivos,
    loading: isLoading,
    error: error instanceof Error ? error : null,
    agregarCultivo: (data) => agregarCultivoMutation.mutateAsync(data),
    actualizarCultivo: (id, cambios) =>
      actualizarCultivoMutation.mutateAsync({ id, cambios }),
    eliminarCultivo: (id) => eliminarCultivoMutation.mutateAsync(id),
    obtenerCultivo,
  };
}
