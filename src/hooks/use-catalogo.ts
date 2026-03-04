"use client";

import { useCallback, useEffect, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { catalogoDAL, plantasDAL, transaccionesDAL } from "@/lib/dal";
import { generateUUID, getCurrentTimestamp } from "@/lib/utils";
import { crearCatalogoInicial } from "@/lib/data/cultivos-arica";
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
  const seeded = useRef(false);

  useEffect(() => {
    if (!proyectoId) return;
    seeded.current = false;

    const seed = async () => {
      const data = await catalogoDAL.getByProyectoId(proyectoId);
      if (data.length === 0 && !seeded.current) {
        seeded.current = true;
        const cultivosIniciales = crearCatalogoInicial(proyectoId);
        await transaccionesDAL.seedCatalogo(cultivosIniciales);
      }
    };
    seed();
  }, [proyectoId]);

  const cultivos = useLiveQuery(async () => {
    if (!proyectoId) return [];
    return catalogoDAL.getByProyectoId(proyectoId);
  }, [proyectoId]);

  const loading = cultivos === undefined;

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

      await catalogoDAL.add(nuevo);
      return nuevo;
    },
    [proyectoId],
  );

  const actualizarCultivo = useCallback(
    async (id: UUID, cambios: Partial<CatalogoCultivo>): Promise<void> => {
      await catalogoDAL.update(id, {
        ...cambios,
        updated_at: getCurrentTimestamp(),
      });
    },
    [],
  );

  const eliminarCultivo = useCallback(async (id: UUID): Promise<void> => {
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
  }, []);

  const obtenerCultivo = useCallback(
    (id: UUID) => {
      return (cultivos ?? []).find((c) => c.id === id);
    },
    [cultivos],
  );

  return {
    cultivos: cultivos ?? [],
    loading,
    error: null,
    agregarCultivo,
    actualizarCultivo,
    eliminarCultivo,
    obtenerCultivo,
  };
}
