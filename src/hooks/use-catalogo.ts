"use client";

import { useCallback, useEffect, useState } from "react";
import { catalogoDAL, plantasDAL } from "@/lib/dal";
import { generateUUID, getCurrentTimestamp } from "@/lib/utils";
import { ejecutarMutacion } from "@/lib/helpers/dal-mutation";
import { logger } from "@/lib/logger";
import type { CatalogoCultivo, UUID } from "@/types";

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
  const [cultivos, setCultivos] = useState<CatalogoCultivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCatalogo = useCallback(async () => {
    if (!proyectoId) {
      setCultivos([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await catalogoDAL.getByProyectoId(proyectoId);
      setCultivos(data);
      setError(null);
    } catch (err) {
      const e =
        err instanceof Error ? err : new Error("Error cargando catálogo");
      logger.error("Error cargando catálogo", {
        error: { message: e.message },
      });
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [proyectoId]);

  useEffect(() => {
    fetchCatalogo();
  }, [fetchCatalogo]);

  const agregarCultivo = useCallback(
    async (
      data: Omit<
        CatalogoCultivo,
        "id" | "proyecto_id" | "created_at" | "updated_at"
      >,
    ): Promise<CatalogoCultivo> => {
      if (!proyectoId) throw new Error("No hay proyecto seleccionado");

      const nuevo: CatalogoCultivo = {
        ...data,
        id: generateUUID(),
        proyecto_id: proyectoId,
        created_at: getCurrentTimestamp(),
        updated_at: getCurrentTimestamp(),
      };

      await ejecutarMutacion(
        () => catalogoDAL.add(nuevo),
        "agregando cultivo",
        fetchCatalogo,
      );
      return nuevo;
    },
    [proyectoId, fetchCatalogo],
  );

  const actualizarCultivo = useCallback(
    async (id: UUID, cambios: Partial<CatalogoCultivo>): Promise<void> => {
      await ejecutarMutacion(
        async () => {
          await catalogoDAL.update(id, {
            ...cambios,
            updated_at: getCurrentTimestamp(),
          });
          await catalogoDAL.marcarOrigenUsuario(id);
        },
        "actualizando cultivo",
        fetchCatalogo,
      );
    },
    [fetchCatalogo],
  );

  const eliminarCultivo = useCallback(
    async (id: UUID): Promise<void> => {
      const todasPlantas = await plantasDAL.getAll();
      const plantasUsandoCultivo = todasPlantas.filter(
        (p) => p.tipo_cultivo_id === id,
      );
      if (plantasUsandoCultivo.length > 0) {
        throw new Error(
          `No se puede eliminar: ${plantasUsandoCultivo.length} planta(s) usan este cultivo. Elimina o cambia las plantas primero.`,
        );
      }
      await ejecutarMutacion(
        () => catalogoDAL.delete(id),
        "eliminando cultivo",
        fetchCatalogo,
      );
    },
    [fetchCatalogo],
  );

  const obtenerCultivo = useCallback(
    (id: UUID) => {
      return cultivos.find((c) => c.id === id);
    },
    [cultivos],
  );

  return {
    cultivos,
    loading,
    error,
    agregarCultivo,
    actualizarCultivo,
    eliminarCultivo,
    obtenerCultivo,
  };
}
