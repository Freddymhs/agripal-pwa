"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { alertasDAL } from "@/lib/dal";
import { ejecutarMutacion } from "@/lib/helpers/dal-mutation";
import { sincronizarAlertas } from "@/lib/utils/alertas";
import { getCurrentTimestamp } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { ESTADO_ALERTA, SEVERIDAD_ALERTA } from "@/lib/constants/entities";
import type { OpcionesConsumoAgua } from "@/lib/utils/agua";
import type {
  Alerta,
  Terreno,
  Zona,
  Planta,
  CatalogoCultivo,
  SueloTerreno,
  UUID,
  ProveedorAgua,
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
  datosListos?: boolean,
  climaBaseId?: string | null,
  proveedoresAgua?: ProveedorAgua[],
  proyectoId?: string,
  opcionesConsumoAgua?: OpcionesConsumoAgua,
): UseAlertas {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  // Cancela ejecuciones anteriores si llega una nueva antes de que termine
  const syncIdRef = useRef(0);

  const refrescarAlertas = useCallback(async () => {
    if (!terreno || datosListos === false) {
      setLoading(false);
      return;
    }

    const syncId = ++syncIdRef.current;
    const isCurrent = () => syncId === syncIdRef.current;

    setLoading(true);
    try {
      const activas = await sincronizarAlertas(
        terreno,
        zonas,
        plantas,
        catalogoCultivos,
        suelo,
        climaBaseId,
        isCurrent,
        proveedoresAgua,
        proyectoId,
        undefined,
        opcionesConsumoAgua,
      );

      // Si llegó una ejecución más reciente mientras esperábamos, descartar resultado
      if (!isCurrent()) return;

      setAlertas(activas);
    } catch (err) {
      logger.error(
        "Error al sincronizar alertas",
        err instanceof Error ? { message: err.message } : undefined,
      );
      if (!isCurrent()) return;
      setAlertas([]);
    } finally {
      if (syncId === syncIdRef.current) {
        setLoading(false);
      }
    }
  }, [
    terreno,
    zonas,
    plantas,
    catalogoCultivos,
    suelo,
    datosListos,
    climaBaseId,
    proveedoresAgua,
    proyectoId,
    opcionesConsumoAgua,
  ]);

  useEffect(() => {
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
