"use client";

import { useCallback, useEffect, useState } from "react";
import {
  proyectosDAL,
  terrenosDAL,
  zonasDAL,
  plantasDAL,
  catalogoDAL,
  transaccionesDAL,
} from "@/lib/dal";
import { generateUUID, getCurrentTimestamp } from "@/lib/utils";
import { SUELO_DEFAULT_AZAPA } from "@/lib/data";
import { useAuthContext } from "@/components/providers/auth-provider";
import { ejecutarMutacion } from "@/lib/helpers/dal-mutation";
import { logger } from "@/lib/logger";
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

export function useProyectos(): UseProyectos {
  const { user, loading: authLoading } = useAuthContext();
  const usuarioId = user?.id ?? "sin-sesion";

  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProyectos = useCallback(async () => {
    if (!user) {
      setProyectos([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await proyectosDAL.getByUsuarioId(usuarioId);
      setProyectos(data);
      setError(null);
    } catch (err) {
      const e =
        err instanceof Error ? err : new Error("Error cargando proyectos");
      logger.error("Error cargando proyectos", {
        error: { message: e.message },
      });
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [user, usuarioId]);

  useEffect(() => {
    fetchProyectos();
  }, [fetchProyectos]);

  const crearProyecto = useCallback(
    async (data: { nombre: string; ubicacion: string }): Promise<Proyecto> => {
      if (authLoading || !user)
        throw new Error("Debes iniciar sesión para crear un proyecto.");
      const timestamp = getCurrentTimestamp();
      const nuevoProyecto: Proyecto = {
        id: generateUUID(),
        usuario_id: user.id,
        nombre: data.nombre,
        ubicacion_referencia: data.ubicacion,
        suelo: SUELO_DEFAULT_AZAPA,
        created_at: timestamp,
        updated_at: timestamp,
      };

      await ejecutarMutacion(
        () => proyectosDAL.add(nuevoProyecto),
        "creando proyecto",
        fetchProyectos,
      );
      return nuevoProyecto;
    },
    [user, authLoading, fetchProyectos],
  );

  const editarProyecto = useCallback(
    async (
      id: UUID,
      data: { nombre?: string; ubicacion_referencia?: string },
    ): Promise<void> => {
      await ejecutarMutacion(
        () =>
          proyectosDAL.update(id, {
            ...data,
            updated_at: getCurrentTimestamp(),
          }),
        "editando proyecto",
        fetchProyectos,
      );
    },
    [fetchProyectos],
  );

  const contarContenido = useCallback(
    async (id: UUID): Promise<EliminacionCascada> => {
      const terrenos = await terrenosDAL.getByProyectoId(id);
      const terrenoIds = terrenos.map((t) => t.id);

      const { zonasCount, plantasCount } =
        terrenoIds.length > 0
          ? await (async () => {
              const zonas = await zonasDAL.getByTerrenoIds(terrenoIds);
              const zonaIds = zonas.map((z) => z.id);
              const plantas =
                zonaIds.length > 0
                  ? await plantasDAL.countByZonaIds(zonaIds)
                  : 0;
              return { zonasCount: zonas.length, plantasCount: plantas };
            })()
          : { zonasCount: 0, plantasCount: 0 };

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
      await ejecutarMutacion(
        () => transaccionesDAL.eliminarProyectoCascade(id),
        "eliminando proyecto",
        fetchProyectos,
      );
      return { eliminados: conteo };
    },
    [contarContenido, fetchProyectos],
  );

  return {
    proyectos,
    loading,
    error,
    refetch: fetchProyectos,
    crearProyecto,
    editarProyecto,
    eliminarProyecto,
    contarContenido,
  };
}
