"use client";

import { useEffect, useState, useCallback } from "react";
import { logger } from "@/lib/logger";
import { alertasDAL } from "@/lib/dal";
import { sincronizarAlertas } from "@/lib/utils/alertas";
import { getCurrentTimestamp } from "@/lib/utils";
import type {
  Alerta,
  Terreno,
  Zona,
  Planta,
  CatalogoCultivo,
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
    );
    setAlertas(activas);
    setLoading(false);
  }, [terreno, zonas, plantas, catalogoCultivos]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- patrón useCallback+useEffect para inicialización reactiva; refrescarAlertas es estable y captura todas las deps transitivamente
    refrescarAlertas();
  }, [refrescarAlertas]);

  const resolverAlerta = useCallback(async (id: UUID, como: string) => {
    try {
      await alertasDAL.update(id, {
        estado: "resuelta",
        fecha_resolucion: getCurrentTimestamp(),
        como_se_resolvio: como,
        updated_at: getCurrentTimestamp(),
      });
      setAlertas((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      logger.error("Error resolviendo alerta", { error: err });
    }
  }, []);

  const ignorarAlerta = useCallback(async (id: UUID) => {
    try {
      await alertasDAL.update(id, {
        estado: "ignorada",
        updated_at: getCurrentTimestamp(),
      });
      setAlertas((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      logger.error("Error ignorando alerta", { error: err });
    }
  }, []);

  const alertasCriticas = alertas.filter(
    (a) => a.severidad === "critical",
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
