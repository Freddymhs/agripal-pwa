"use client";

import { useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  proyectosDAL,
  terrenosDAL,
  zonasDAL,
  plantasDAL,
  catalogoDAL,
  transaccionesDAL,
} from "@/lib/dal";
import { generateUUID, getCurrentTimestamp } from "@/lib/utils";
import { crearCatalogoInicial } from "@/lib/data/cultivos-arica";
import type { Proyecto, UUID } from "@/types";

interface EliminacionCascada {
  terrenos: number;
  zonas: number;
  plantas: number;
  cultivos: number;
}

interface UseProyectos {
  proyectos: Proyecto[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;

  crearProyecto: (data: {
    nombre: string;
    ubicacion: string;
  }) => Promise<Proyecto>;
  editarProyecto: (
    id: UUID,
    data: { nombre?: string; ubicacion_referencia?: string },
  ) => Promise<void>;
  eliminarProyecto: (id: UUID) => Promise<{ eliminados: EliminacionCascada }>;
  contarContenido: (id: UUID) => Promise<EliminacionCascada>;
}

const USUARIO_ID = "usuario-demo";

export function useProyectos(): UseProyectos {
  const proyectos = useLiveQuery(
    () => proyectosDAL.getByUsuarioId(USUARIO_ID),
    [],
  );

  const loading = proyectos === undefined;

  const crearProyecto = useCallback(
    async (data: { nombre: string; ubicacion: string }): Promise<Proyecto> => {
      const timestamp = getCurrentTimestamp();
      const nuevoProyecto: Proyecto = {
        id: generateUUID(),
        usuario_id: USUARIO_ID,
        nombre: data.nombre,
        ubicacion_referencia: data.ubicacion,
        created_at: timestamp,
        updated_at: timestamp,
      };

      await transaccionesDAL.crearProyectoConCatalogo(
        nuevoProyecto,
        crearCatalogoInicial(nuevoProyecto.id),
      );
      return nuevoProyecto;
    },
    [],
  );

  const editarProyecto = useCallback(
    async (
      id: UUID,
      data: { nombre?: string; ubicacion_referencia?: string },
    ): Promise<void> => {
      await proyectosDAL.update(id, {
        ...data,
        updated_at: getCurrentTimestamp(),
      });
    },
    [],
  );

  const contarContenido = useCallback(
    async (id: UUID): Promise<EliminacionCascada> => {
      const terrenos = await terrenosDAL.getByProyectoId(id);
      const terrenoIds = terrenos.map((t) => t.id);

      let zonasCount = 0;
      let plantasCount = 0;

      if (terrenoIds.length > 0) {
        const zonas = await zonasDAL.getByTerrenoIds(terrenoIds);
        zonasCount = zonas.length;
        const zonaIds = zonas.map((z) => z.id);

        if (zonaIds.length > 0) {
          plantasCount = await plantasDAL.countByZonaIds(zonaIds);
        }
      }

      const cultivosCount = await catalogoDAL.countByProyectoId(id);

      return {
        terrenos: terrenos.length,
        zonas: zonasCount,
        plantas: plantasCount,
        cultivos: cultivosCount,
      };
    },
    [],
  );

  const eliminarProyecto = useCallback(
    async (id: UUID): Promise<{ eliminados: EliminacionCascada }> => {
      const conteo = await contarContenido(id);
      await transaccionesDAL.eliminarProyectoCascade(id);
      return { eliminados: conteo };
    },
    [contarContenido],
  );

  return {
    proyectos: proyectos ?? [],
    loading,
    error: null,
    refetch: async () => {},

    crearProyecto,
    editarProyecto,
    eliminarProyecto,
    contarContenido,
  };
}
