"use client";

import { useState, useEffect, useCallback } from "react";
import { baseDataDAL } from "@/lib/dal";
import { logger } from "@/lib/logger";
import type { FuenteAgua, UUID } from "@/types";
import type { Enmienda } from "@/lib/data/enmiendas-suelo";
import type { TecnicaMejora } from "@/lib/data/tecnicas-mejora";
import type { VariedadCultivo } from "@/lib/data/tipos-variedades";
import type { PrecioMayorista, MercadoDetalle } from "@/lib/data/tipos-mercado";
import type { ClimaBase } from "@/lib/dal/base-data";

export interface DatosBase {
  enmiendas: Enmienda[];
  tecnicas: TecnicaMejora[];
  clima: ClimaBase[];
  fuentesAgua: FuenteAgua[];
  variedades: VariedadCultivo[];
  precios: PrecioMayorista[];
  mercadoDetalle: MercadoDetalle[];
}

const DATOS_BASE_VACIOS: DatosBase = {
  enmiendas: [],
  tecnicas: [],
  clima: [],
  fuentesAgua: [],
  variedades: [],
  precios: [],
  mercadoDetalle: [],
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

      const [enmiendas, tecnicas, clima, fuentesAgua, variedades, precios] =
        await Promise.all([
          baseDataDAL.getEnmiendasByProyectoId(proyectoId),
          baseDataDAL.getTecnicasByProyectoId(proyectoId),
          baseDataDAL.getClimasDisponibles(),
          baseDataDAL.getFuentesAguaByProyectoId(proyectoId),
          baseDataDAL.getVariedadesGlobales(),
          baseDataDAL.getPreciosMayoristas(),
        ]);

      const preciosIds = precios.map((p) => p.id);
      const mercadoDetalle = await baseDataDAL.getMercadoDetalle(preciosIds);

      setDatosBase({
        enmiendas,
        tecnicas,
        clima,
        fuentesAgua,
        variedades,
        precios,
        mercadoDetalle,
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
