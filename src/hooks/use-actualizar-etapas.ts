"use client";

import { useEffect, useRef } from "react";
import { plantasDAL } from "@/lib/dal";
import { calcularEtapaActual } from "@/lib/data/duracion-etapas";
import { getCurrentTimestamp } from "@/lib/utils";
import type { Planta, CatalogoCultivo } from "@/types";

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

      let cambios = 0;

      try {
        for (const planta of plantas) {
          if (cancelled) return;
          if (planta.estado === "muerta" || !planta.fecha_plantacion) continue;

          const cultivo = catalogoCultivos.find(
            (c) => c.id === planta.tipo_cultivo_id,
          );
          if (!cultivo) continue;

          const etapaCalculada = calcularEtapaActual(
            cultivo.nombre,
            new Date(planta.fecha_plantacion),
          );

          if (etapaCalculada !== planta.etapa_actual) {
            await plantasDAL.update(planta.id, {
              etapa_actual: etapaCalculada,
              fecha_cambio_etapa: getCurrentTimestamp(),
              updated_at: getCurrentTimestamp(),
            });
            cambios++;
          }
        }
      } catch (err) {
        console.error("Error actualizando etapas:", err);
        return;
      }

      ultimaActualizacion.current = ahora;

      if (cambios > 0 && !cancelled) {
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
    if (planta.estado === "muerta" || !planta.fecha_plantacion) continue;

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
