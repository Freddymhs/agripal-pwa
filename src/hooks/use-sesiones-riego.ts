"use client";

import { useEffect, useCallback, useState } from "react";
import { logger } from "@/lib/logger";
import { sesionesRiegoDAL } from "@/lib/dal";
import type { SesionRiego, UUID } from "@/types";

interface UseSesionesRiego {
  sesiones: SesionRiego[];
  loading: boolean;
  refetch: () => void;
}

export function useSesionesRiego(
  zonaId: UUID | undefined,
  isManual: boolean,
): UseSesionesRiego {
  const [sesiones, setSesiones] = useState<SesionRiego[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSesiones = useCallback(async () => {
    if (!zonaId || !isManual) {
      setSesiones([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await sesionesRiegoDAL.getByZonaId(zonaId);
      setSesiones(data);
    } catch (err) {
      logger.error("Error cargando sesiones de riego", { error: err });
    } finally {
      setLoading(false);
    }
  }, [zonaId, isManual]);

  useEffect(() => {
    fetchSesiones();
  }, [fetchSesiones]);

  return { sesiones, loading, refetch: fetchSesiones };
}
