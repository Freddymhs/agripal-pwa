"use client";

import { useEffect, useState, useCallback } from "react";
import { alertasDAL } from "@/lib/dal";
import { ejecutarMutacion } from "@/lib/helpers/dal-mutation";
import { sincronizarAlertas } from "@/lib/utils/alertas";
import { getCurrentTimestamp } from "@/lib/utils";
import { ESTADO_ALERTA, SEVERIDAD_ALERTA } from "@/lib/constants/entities";
import type {
  Alerta,
  Terreno,
  Zona,
  Planta,
  CatalogoCultivo,
  SueloTerreno,
  UUID,
} from "@/types";

interface UseAlertas {
  alertas: Alerta[];
  alertasCriticas: number;
  loading: boolean;

  refrescarAlertas: () => Promise<void>;
  resolverAlerta: (id: UUID, como: string) => Promise<void>;
  ignorarAlerta: (id: UUID) => Promise<void>;
}

export function useAlertas(
  terreno: Terreno | null,
  zonas: Zona[],
  plantas: Planta[],
  catalogoCultivos: CatalogoCultivo[],
  suelo?: SueloTerreno | null,
): UseAlertas {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);

  const refrescarAlertas = useCallback(async () => {
    if (!terreno) return;

    setLoading(true);
    const activas = await sincronizarAlertas(
      terreno,
      zonas,
      plantas,
      catalogoCultivos,
      suelo,
    );
    setAlertas(activas);
    setLoading(false);
  }, [terreno, zonas, plantas, catalogoCultivos, suelo]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- patrón useCallback+useEffect para inicialización reactiva; refrescarAlertas es estable y captura todas las deps transitivamente
    refrescarAlertas();
  }, [refrescarAlertas]);

  const resolverAlerta = useCallback(async (id: UUID, como: string) => {
    await ejecutarMutacion(
      () =>
        alertasDAL.update(id, {
          estado: ESTADO_ALERTA.RESUELTA,
          fecha_resolucion: getCurrentTimestamp(),
          como_se_resolvio: como,
          updated_at: getCurrentTimestamp(),
        }),
      "resolver alerta",
      () => setAlertas((prev) => prev.filter((a) => a.id !== id)),
    );
  }, []);

  const ignorarAlerta = useCallback(async (id: UUID) => {
    await ejecutarMutacion(
      () =>
        alertasDAL.update(id, {
          estado: ESTADO_ALERTA.IGNORADA,
          updated_at: getCurrentTimestamp(),
        }),
      "ignorar alerta",
      () => setAlertas((prev) => prev.filter((a) => a.id !== id)),
    );
  }, []);

  const alertasCriticas = alertas.filter(
    (a) => a.severidad === SEVERIDAD_ALERTA.CRITICAL,
  ).length;

  return {
    alertas,
    alertasCriticas,
    loading,
    refrescarAlertas,
    resolverAlerta,
    ignorarAlerta,
  };
}
