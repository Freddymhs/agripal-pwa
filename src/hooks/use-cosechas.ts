"use client";

import { useEffect, useCallback, useMemo, useState } from "react";
import { logger } from "@/lib/logger";
import { cosechasDAL } from "@/lib/dal";
import { ejecutarMutacion } from "@/lib/helpers/dal-mutation";
import { generateUUID, getCurrentTimestamp } from "@/lib/utils";
import type { Cosecha, CalidadCosecha, Zona, UUID } from "@/types";

interface RegistroCosechaInput {
  zona_id: UUID;
  tipo_cultivo_id: UUID;
  fecha: string;
  cantidad_kg: number;
  calidad: CalidadCosecha;
  vendido: boolean;
  precio_venta_clp?: number;
  destino?: string;
  notas?: string;
}

interface ResumenMes {
  totalKg: number;
  totalIngreso: number;
  cantidadRegistros: number;
}

interface UseCosechas {
  cosechas: Cosecha[];
  loading: boolean;
  resumenMesActual: ResumenMes;
  registrarCosecha: (data: RegistroCosechaInput) => Promise<Cosecha>;
  eliminarCosecha: (id: UUID) => Promise<void>;
}

export function useCosechas(zonas: Zona[], onRefetch: () => void): UseCosechas {
  const [cosechas, setCosechas] = useState<Cosecha[]>([]);
  const [loading, setLoading] = useState(true);

  const zonaIds = useMemo(() => zonas.map((z) => z.id), [zonas]);

  const fetchCosechas = useCallback(async () => {
    if (zonaIds.length === 0) {
      setCosechas([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await cosechasDAL.getByZonaIds(zonaIds);
      setCosechas(data);
    } catch (err) {
      logger.error("Error cargando cosechas", { error: err });
    } finally {
      setLoading(false);
    }
  }, [zonaIds]);

  useEffect(() => {
    fetchCosechas();
  }, [fetchCosechas]);

  const resumenMesActual = useMemo<ResumenMes>(() => {
    const ahora = new Date();
    const mesActual = ahora.getMonth();
    const añoActual = ahora.getFullYear();

    const delMes = cosechas.filter((c) => {
      const fecha = new Date(c.fecha);
      return (
        fecha.getMonth() === mesActual && fecha.getFullYear() === añoActual
      );
    });

    return {
      totalKg: delMes.reduce((sum, c) => sum + c.cantidad_kg, 0),
      totalIngreso: delMes.reduce(
        (sum, c) =>
          sum +
          (c.vendido && c.precio_venta_clp
            ? c.precio_venta_clp * c.cantidad_kg
            : 0),
        0,
      ),
      cantidadRegistros: delMes.length,
    };
  }, [cosechas]);

  const registrarCosecha = useCallback(
    async (data: RegistroCosechaInput): Promise<Cosecha> => {
      const now = getCurrentTimestamp();
      const cosecha: Cosecha = {
        id: generateUUID(),
        zona_id: data.zona_id,
        tipo_cultivo_id: data.tipo_cultivo_id,
        fecha: data.fecha,
        cantidad_kg: data.cantidad_kg,
        calidad: data.calidad,
        vendido: data.vendido,
        precio_venta_clp: data.vendido ? data.precio_venta_clp : undefined,
        destino: data.vendido ? data.destino : undefined,
        notas: data.notas ?? "",
        created_at: now,
      };

      await ejecutarMutacion(
        () => cosechasDAL.add(cosecha),
        "registrando cosecha",
        async () => {
          await fetchCosechas();
          onRefetch();
        },
      );

      return cosecha;
    },
    [fetchCosechas, onRefetch],
  );

  const eliminarCosecha = useCallback(
    async (id: UUID): Promise<void> => {
      await ejecutarMutacion(
        () => cosechasDAL.delete(id),
        "eliminando cosecha",
        async () => {
          await fetchCosechas();
          onRefetch();
        },
      );
    },
    [fetchCosechas, onRefetch],
  );

  return {
    cosechas,
    loading,
    resumenMesActual,
    registrarCosecha,
    eliminarCosecha,
  };
}
