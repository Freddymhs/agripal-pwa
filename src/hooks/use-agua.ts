"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { logger } from "@/lib/logger";
import { aguaDAL, transaccionesDAL } from "@/lib/dal";
import { generateUUID, getCurrentTimestamp } from "@/lib/utils";
import { TIPO_ZONA, ESTADO_AGUA } from "@/lib/constants/entities";
import { filtrarEstanques } from "@/lib/utils/helpers-cultivo";
import {
  calcularConsumoRealTerreno,
  calcularStockEstanques,
  determinarEstadoAgua,
} from "@/lib/utils/agua";
import { aplicarDescuentoAutomaticoAgua } from "@/lib/utils/agua-descuento";
import { emitZonaUpdated } from "@/lib/events/zona-events";
import { addDays } from "date-fns";
import type {
  EntradaAgua,
  Terreno,
  Zona,
  Planta,
  CatalogoCultivo,
  EstadoAgua,
  UUID,
} from "@/types";

interface UseAgua {
  entradas: EntradaAgua[];
  consumoSemanal: number;
  aguaTotalEstanques: number;
  capacidadTotalEstanques: number;
  estadoAgua: EstadoAgua;
  loading: boolean;

  registrarEntrada: (data: {
    estanque_id: UUID;
    cantidad_m3: number;
    costo_clp?: number;
    proveedor?: string;
    notas?: string;
  }) => Promise<EntradaAgua>;
}

export function useAgua(
  terreno: Terreno | null,
  zonas: Zona[],
  plantas: Planta[],
  catalogoCultivos: CatalogoCultivo[],
  onRefetch: () => void,
): UseAgua {
  const [entradas, setEntradas] = useState<EntradaAgua[]>([]);
  const [loading, setLoading] = useState(true);

  const estanques = useMemo(() => {
    return filtrarEstanques(zonas);
  }, [zonas]);

  const stock = useMemo(() => calcularStockEstanques(estanques), [estanques]);
  const aguaTotalEstanques = stock.aguaTotal;
  const capacidadTotalEstanques = stock.capacidadTotal;

  const descuentoAplicado = useRef(false);

  useEffect(() => {
    if (!terreno) return;

    const cancelledRef = { current: false };
    const terrenoId = terreno.id;

    async function cargar() {
      setLoading(true);
      try {
        const data = await aguaDAL.getEntradasByTerrenoId(terrenoId);
        if (!cancelledRef.current) {
          setEntradas(data);
        }
      } catch (err) {
        logger.error("Error cargando entradas de agua", { error: err });
      } finally {
        if (!cancelledRef.current) {
          setLoading(false);
        }
      }
    }

    cargar();

    return () => {
      cancelledRef.current = true;
    };
  }, [terreno]);

  useEffect(() => {
    if (!terreno || estanques.length === 0 || descuentoAplicado.current) return;

    const cancelledRef = { current: false };
    const terrenoCapture = terreno;

    async function ejecutarDescuento() {
      try {
        const resultado = await aplicarDescuentoAutomaticoAgua(
          terrenoCapture,
          estanques,
          zonas,
          plantas,
          catalogoCultivos,
          cancelledRef,
        );

        descuentoAplicado.current = resultado.aplicado;
        if (resultado.aplicado && !cancelledRef.current) {
          onRefetch();
        }
      } catch (err) {
        logger.error("Error aplicando descuento automatico de agua", { error: err });
        descuentoAplicado.current = false;
      }
    }

    ejecutarDescuento();

    return () => {
      cancelledRef.current = true;
    };
  }, [terreno, estanques, zonas, plantas, catalogoCultivos, onRefetch]);

  const consumoSemanal = useMemo(
    () =>
      terreno
        ? calcularConsumoRealTerreno(zonas, plantas, catalogoCultivos)
        : 0,
    [terreno, zonas, plantas, catalogoCultivos],
  );

  const estadoAgua = useMemo(() => {
    if (!terreno) return ESTADO_AGUA.OK;
    const aguaDisponible =
      estanques.length > 0 ? aguaTotalEstanques : terreno.agua_actual_m3;
    return determinarEstadoAgua(aguaDisponible, consumoSemanal);
  }, [terreno, estanques.length, aguaTotalEstanques, consumoSemanal]);

  const registrarEntrada = useCallback(
    async (data: {
      estanque_id: UUID;
      cantidad_m3: number;
      costo_clp?: number;
      proveedor?: string;
      notas?: string;
    }) => {
      if (!terreno) throw new Error("No hay terreno");

      const estanque = estanques.find((e) => e.id === data.estanque_id);
      if (!estanque || !estanque.estanque_config) {
        throw new Error("Estanque no encontrado");
      }

      const { capacidad_m3, nivel_actual_m3 } = estanque.estanque_config;
      const espacioDisponible = capacidad_m3 - nivel_actual_m3;
      const cantidadReal = Math.min(data.cantidad_m3, espacioDisponible);

      const entrada: EntradaAgua = {
        id: generateUUID(),
        terreno_id: terreno.id,
        estanque_id: data.estanque_id,
        fecha: getCurrentTimestamp(),
        cantidad_m3: cantidadReal,
        costo_clp: data.costo_clp,
        proveedor: data.proveedor,
        notas: data.notas || "",
        created_at: getCurrentTimestamp(),
      };

      const nuevoNivel = nivel_actual_m3 + cantidadReal;
      const now = getCurrentTimestamp();

      const updatedConfig = {
        ...estanque.estanque_config,
        nivel_actual_m3: nuevoNivel,
      };

      if (updatedConfig.recarga?.frecuencia_dias) {
        updatedConfig.recarga = {
          ...updatedConfig.recarga,
          ultima_recarga: now,
          proxima_recarga: addDays(
            new Date(),
            updatedConfig.recarga.frecuencia_dias,
          ).toISOString(),
        };
      }

      await transaccionesDAL.registrarEntradaAgua(
        entrada,
        data.estanque_id,
        { estanque_config: updatedConfig, updated_at: now },
        terreno.id,
        { ultima_simulacion_agua: now },
      );

      emitZonaUpdated(data.estanque_id);
      setEntradas((prev) => [entrada, ...prev]);
      onRefetch();

      return entrada;
    },
    [terreno, estanques, onRefetch],
  );

  return {
    entradas,
    consumoSemanal,
    aguaTotalEstanques,
    capacidadTotalEstanques,
    estadoAgua,
    loading,
    registrarEntrada,
  };
}
