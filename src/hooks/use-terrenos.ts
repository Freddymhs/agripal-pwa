"use client";

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { terrenosDAL, zonasDAL, plantasDAL, transaccionesDAL } from "@/lib/dal";
import { generateUUID, getCurrentTimestamp } from "@/lib/utils";
import type { Terreno, UUID } from "@/types";
import { SUELO_DEFAULT_AZAPA } from "@/lib/data";
import { QUERY_KEYS } from "@/lib/constants/query-keys";

interface EliminacionCascada {
  zonas: number;
  plantas: number;
}

interface UseTerrenos {
  terrenos: Terreno[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;

  crearTerreno: (data: {
    proyecto_id: UUID;
    nombre: string;
    ancho_m: number;
    alto_m: number;
  }) => Promise<Terreno>;

  editarTerreno: (
    id: UUID,
    data: {
      nombre?: string;
      ancho_m?: number;
      alto_m?: number;
    },
  ) => Promise<{ error?: string }>;

  actualizarTerreno: (id: UUID, data: Partial<Terreno>) => Promise<void>;

  eliminarTerreno: (id: UUID) => Promise<{ eliminados: EliminacionCascada }>;

  contarContenido: (id: UUID) => Promise<EliminacionCascada>;
}

export function useTerrenos(proyectoId: UUID | null): UseTerrenos {
  const queryClient = useQueryClient();

  const {
    data: terrenos = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.terrenos(proyectoId!),
    queryFn: async () =>
      proyectoId ? await terrenosDAL.getByProyectoId(proyectoId) : [],
    enabled: !!proyectoId,
  });

  const crearTerrenoMutation = useMutation({
    mutationFn: async (data: {
      proyecto_id: UUID;
      nombre: string;
      ancho_m: number;
      alto_m: number;
    }): Promise<Terreno> => {
      const timestamp = getCurrentTimestamp();
      const nuevoTerreno: Terreno = {
        id: generateUUID(),
        proyecto_id: data.proyecto_id,
        nombre: data.nombre,
        ancho_m: data.ancho_m,
        alto_m: data.alto_m,
        area_m2: data.ancho_m * data.alto_m,
        agua_disponible_m3: 0,
        agua_actual_m3: 0,
        sistema_riego: {
          litros_hora: 0,
          descuento_auto: false,
          ultima_actualizacion: timestamp,
        },
        suelo: SUELO_DEFAULT_AZAPA,
        ultima_simulacion_agua: timestamp,
        created_at: timestamp,
        updated_at: timestamp,
      };

      await terrenosDAL.add(nuevoTerreno);
      return nuevoTerreno;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.terrenos(proyectoId!),
      });
    },
  });

  const editarTerrenoMutation = useMutation({
    mutationFn: async (params: {
      id: UUID;
      data: { nombre?: string; ancho_m?: number; alto_m?: number };
    }): Promise<{ error?: string }> => {
      const terreno = await terrenosDAL.getById(params.id);
      if (!terreno) {
        return { error: "Terreno no encontrado" };
      }

      const nuevoAncho = params.data.ancho_m ?? terreno.ancho_m;
      const nuevoAlto = params.data.alto_m ?? terreno.alto_m;

      if (
        params.data.ancho_m !== undefined ||
        params.data.alto_m !== undefined
      ) {
        const zonas = await zonasDAL.getByTerrenoId(params.id);
        for (const zona of zonas) {
          if (zona.x + zona.ancho > nuevoAncho) {
            return {
              error: `La zona "${zona.nombre}" excedería el nuevo ancho del terreno`,
            };
          }
          if (zona.y + zona.alto > nuevoAlto) {
            return {
              error: `La zona "${zona.nombre}" excedería el nuevo alto del terreno`,
            };
          }
        }
      }

      const updates: Partial<Terreno> = {
        ...params.data,
        updated_at: getCurrentTimestamp(),
      };

      if (
        params.data.ancho_m !== undefined ||
        params.data.alto_m !== undefined
      ) {
        updates.area_m2 = nuevoAncho * nuevoAlto;
      }

      await terrenosDAL.update(params.id, updates);
      return {};
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.terrenos(proyectoId!),
      });
    },
  });

  const actualizarTerrenoMutation = useMutation({
    mutationFn: async (params: { id: UUID; data: Partial<Terreno> }) => {
      const updates = {
        ...params.data,
        updated_at: getCurrentTimestamp(),
      };
      delete updates.id;
      delete updates.proyecto_id;
      delete updates.created_at;

      await terrenosDAL.update(params.id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.terrenos(proyectoId!),
      });
    },
  });

  const eliminarTerrenoMutation = useMutation({
    mutationFn: async (id: UUID) => {
      const conteo = await contarContenido(id);
      await transaccionesDAL.eliminarTerrenoCascade(id);
      return { eliminados: conteo };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.terrenos(proyectoId!),
      });
    },
  });

  const contarContenido = useCallback(
    async (id: UUID): Promise<EliminacionCascada> => {
      const zonas = await zonasDAL.getByTerrenoId(id);
      const zonaIds = zonas.map((z) => z.id);

      const plantasCount =
        zonaIds.length > 0 ? await plantasDAL.countByZonaIds(zonaIds) : 0;

      return {
        zonas: zonas.length,
        plantas: plantasCount,
      };
    },
    [],
  );

  return {
    terrenos,
    loading: isLoading,
    error: error instanceof Error ? error : null,
    refetch: () => refetch().then(() => Promise.resolve()),
    crearTerreno: (data) => crearTerrenoMutation.mutateAsync(data),
    editarTerreno: (id, data) =>
      editarTerrenoMutation.mutateAsync({ id, data }),
    actualizarTerreno: (id, data) =>
      actualizarTerrenoMutation.mutateAsync({ id, data }),
    eliminarTerreno: (id) => eliminarTerrenoMutation.mutateAsync(id),
    contarContenido,
  };
}
