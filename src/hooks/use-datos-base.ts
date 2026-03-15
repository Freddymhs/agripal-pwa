"use client";

import { useState, useEffect, useCallback } from "react";
import { baseDataDAL } from "@/lib/dal";
import { logger } from "@/lib/logger";
import type { FuenteAgua, UUID } from "@/types";
import type { Enmienda } from "@/lib/data/enmiendas-suelo";
import type { TecnicaMejora } from "@/lib/data/tecnicas-mejora";
import type { VariedadCultivo } from "@/lib/data/variedades";
import type { DatosMercado } from "@/lib/data/mercado";
import type { InsumoCatalogo, ClimaProyectoRow } from "@/lib/dal/base-data";

export interface DatosBase {
  insumos: InsumoCatalogo[];
  enmiendas: Enmienda[];
  tecnicas: TecnicaMejora[];
  clima: ClimaProyectoRow[];
  fuentesAgua: FuenteAgua[];
  variedades: VariedadCultivo[];
  precios: DatosMercado[];
}

const DATOS_BASE_VACIOS: DatosBase = {
  insumos: [],
  enmiendas: [],
  tecnicas: [],
  clima: [],
  fuentesAgua: [],
  variedades: [],
  precios: [],
};

export function useDatosBase(proyectoId: UUID | null) {
  const [datosBase, setDatosBase] = useState<DatosBase>(DATOS_BASE_VACIOS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDatosBase = useCallback(async () => {
    if (!proyectoId) {
      setDatosBase(DATOS_BASE_VACIOS);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [
        insumos,
        enmiendas,
        tecnicas,
        clima,
        fuentesAgua,
        variedades,
        precios,
      ] = await Promise.all([
        baseDataDAL.getInsumosByProyectoId(proyectoId),
        baseDataDAL.getEnmiendasByProyectoId(proyectoId),
        baseDataDAL.getTecnicasByProyectoId(proyectoId),
        baseDataDAL.getClimaByProyectoId(proyectoId),
        baseDataDAL.getFuentesAguaByProyectoId(proyectoId),
        baseDataDAL.getVariedadesGlobales(),
        baseDataDAL.getPreciosGlobales(),
      ]);

      setDatosBase({
        insumos,
        enmiendas,
        tecnicas,
        clima,
        fuentesAgua,
        variedades,
        precios,
      });
    } catch (err) {
      const e =
        err instanceof Error ? err : new Error("Error cargando datos base");
      logger.error("Error cargando datos base", {
        error: { message: e.message },
      });
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [proyectoId]);

  useEffect(() => {
    fetchDatosBase();
  }, [fetchDatosBase]);

  return {
    datosBase,
    loadingDatosBase: loading,
    errorDatosBase: error,
    recargarDatosBase: fetchDatosBase,
  };
}
