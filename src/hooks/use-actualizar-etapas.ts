"use client";

import { useEffect, useRef } from "react";
import { logger } from "@/lib/logger";
import { transaccionesDAL } from "@/lib/dal";
import { calcularEtapaActual } from "@/lib/data/duracion-etapas";
import { getCurrentTimestamp } from "@/lib/utils";
import type { Planta, CatalogoCultivo } from "@/types";
import { ESTADO_PLANTA } from "@/lib/constants/entities";

const INTERVALO_ACTUALIZACION_MS = 1000 * 60 * 60 * 24;

export function useActualizarEtapas(
  plantas: Planta[],
  catalogoCultivos: CatalogoCultivo[],
  onRefetch: () => void,
) {
  const ultimaActualizacion = useRef<number>(0);

  useEffect(() => {
    if (!plantas.length || !catalogoCultivos.length) return;

    let cancelled = false;

    async function actualizar() {
      const ahora = Date.now();
      if (ahora - ultimaActualizacion.current < 1000 * 60 * 5) return;
      if (cancelled) return;

      const timestamp = getCurrentTimestamp();
      const actualizaciones: Array<{ id: string; cambios: Partial<Planta> }> = [];

      for (const planta of plantas) {
        if (planta.estado === ESTADO_PLANTA.MUERTA || !planta.fecha_plantacion) continue;

        const cultivo = catalogoCultivos.find(
          (c) => c.id === planta.tipo_cultivo_id,
        );
        if (!cultivo) continue;

        const etapaCalculada = calcularEtapaActual(
          cultivo.nombre,
          new Date(planta.fecha_plantacion),
        );

        if (etapaCalculada !== planta.etapa_actual) {
          actualizaciones.push({
            id: planta.id,
            cambios: {
              etapa_actual: etapaCalculada,
              fecha_cambio_etapa: timestamp,
              updated_at: timestamp,
            },
          });
        }
      }

      if (actualizaciones.length === 0) {
        ultimaActualizacion.current = ahora;
        return;
      }

      try {
        if (cancelled) return;
        await transaccionesDAL.actualizarEtapasLote(actualizaciones);
      } catch (err) {
        logger.error("Error actualizando etapas", { error: err });
        return;
      }

      ultimaActualizacion.current = ahora;
      if (!cancelled) {
        onRefetch();
      }
    }

    actualizar();
    const interval = setInterval(actualizar, INTERVALO_ACTUALIZACION_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [plantas, catalogoCultivos, onRefetch]);
}

export function actualizarEtapasSync(
  plantas: Planta[],
  catalogoCultivos: CatalogoCultivo[],
): { plantaId: string; etapaNueva: string }[] {
  const cambios: { plantaId: string; etapaNueva: string }[] = [];

  for (const planta of plantas) {
    if (planta.estado === ESTADO_PLANTA.MUERTA || !planta.fecha_plantacion) continue;

    const cultivo = catalogoCultivos.find(
      (c) => c.id === planta.tipo_cultivo_id,
    );
    if (!cultivo) continue;

    const etapaCalculada = calcularEtapaActual(
      cultivo.nombre,
      new Date(planta.fecha_plantacion),
    );

    if (etapaCalculada !== planta.etapa_actual) {
      cambios.push({
        plantaId: planta.id,
        etapaNueva: etapaCalculada,
      });
    }
  }

  return cambios;
}
