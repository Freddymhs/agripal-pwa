"use client";

import { useEffect, useCallback, useMemo, useRef, useState } from "react";
import { logger } from "@/lib/logger";
import { aguaDAL, transaccionesDAL, zonasDAL } from "@/lib/dal";
import { ejecutarMutacion } from "@/lib/helpers/dal-mutation";
import { generateUUID, getCurrentTimestamp } from "@/lib/utils";
import { ESTADO_AGUA } from "@/lib/constants/entities";
import { filtrarEstanques } from "@/lib/utils/helpers-cultivo";
import {
  calcularConsumoRealTerreno,
  calcularStockEstanques,
  determinarEstadoAgua,
  type OpcionesConsumoAgua,
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

interface RecargaConfig {
  frecuencia_dias: number;
  cantidad_litros: number;
  costo_transporte_clp?: number;
  proveedor_id?: string;
}

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
  configurarRecarga: (estanqueId: UUID, config: RecargaConfig) => Promise<void>;
  quitarRecarga: (estanqueId: UUID) => Promise<void>;
}

export function useAgua(
  terreno: Terreno | null,
  zonas: Zona[],
  plantas: Planta[],
  catalogoCultivos: CatalogoCultivo[],
  onRefetch: () => void,
  opcionesConsumoAgua?: OpcionesConsumoAgua,
): UseAgua {
  const terrenoId = terreno?.id ?? "";
  const [entradas, setEntradas] = useState<EntradaAgua[]>([]);
  const [loadingEntradas, setLoadingEntradas] = useState(true);

  const fetchEntradas = useCallback(async () => {
    if (!terreno) {
      setEntradas([]);
      setLoadingEntradas(false);
      return;
    }
    try {
      setLoadingEntradas(true);
      const data = await aguaDAL.getEntradasByTerrenoId(terrenoId);
      setEntradas(data);
    } catch (err) {
      logger.error("Error cargando entradas de agua", { error: err });
    } finally {
      setLoadingEntradas(false);
    }
  }, [terreno, terrenoId]);

  useEffect(() => {
    fetchEntradas();
  }, [fetchEntradas]);

  const estanques = useMemo(() => filtrarEstanques(zonas), [zonas]);

  const stock = useMemo(() => calcularStockEstanques(estanques), [estanques]);
  const aguaTotalEstanques = stock.aguaTotal;
  const capacidadTotalEstanques = stock.capacidadTotal;

  const descuentoAplicado = useRef(false);

  useEffect(() => {
    descuentoAplicado.current = false;
  }, [terreno?.id]);

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
        logger.error("Error aplicando descuento automatico de agua", {
          error: err,
        });
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
        ? calcularConsumoRealTerreno(
            zonas,
            plantas,
            catalogoCultivos,
            undefined,
            opcionesConsumoAgua,
          )
        : 0,
    [terreno, zonas, plantas, catalogoCultivos, opcionesConsumoAgua],
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
            new Date(now),
            updatedConfig.recarga.frecuencia_dias,
          ).toISOString(),
        };
      }

      await ejecutarMutacion(
        () =>
          transaccionesDAL.registrarEntradaAgua(
            entrada,
            data.estanque_id,
            { estanque_config: updatedConfig, updated_at: now },
            terreno.id,
            { ultima_simulacion_agua: now },
          ),
        "registrando entrada de agua",
        async () => {
          emitZonaUpdated(data.estanque_id);
          await fetchEntradas();
          onRefetch();
        },
      );

      return entrada;
    },
    [terreno, estanques, onRefetch, fetchEntradas],
  );

  const configurarRecarga = useCallback(
    async (estanqueId: UUID, config: RecargaConfig) => {
      const estanque = estanques.find((e) => e.id === estanqueId);
      if (!estanque?.estanque_config) return;

      if (
        typeof config.frecuencia_dias !== "number" ||
        config.frecuencia_dias <= 0
      ) {
        logger.error(
          "Validación recarga fallida: frecuencia_dias debe ser mayor a 0",
        );
        return;
      }
      if (
        typeof config.cantidad_litros !== "number" ||
        config.cantidad_litros <= 0
      ) {
        logger.error(
          "Validación recarga fallida: cantidad_litros debe ser mayor a 0",
        );
        return;
      }

      const now = getCurrentTimestamp();
      const proximaRecarga = addDays(
        new Date(now),
        config.frecuencia_dias,
      ).toISOString();

      const zonaFresca = await zonasDAL.getById(estanqueId);
      const configFresca =
        zonaFresca?.estanque_config ?? estanque.estanque_config;

      await ejecutarMutacion(
        () =>
          zonasDAL.update(estanqueId, {
            estanque_config: {
              ...configFresca,
              proveedor_id: config.proveedor_id ?? configFresca.proveedor_id,
              recarga: {
                frecuencia_dias: config.frecuencia_dias,
                cantidad_litros: config.cantidad_litros,
                ultima_recarga: now,
                proxima_recarga: proximaRecarga,
                costo_transporte_clp: config.costo_transporte_clp,
              },
            },
            updated_at: now,
          }),
        "configurar recarga estanque",
        async () => {
          emitZonaUpdated(estanqueId);
          onRefetch();
        },
      );
    },
    [estanques, onRefetch],
  );

  const quitarRecarga = useCallback(
    async (estanqueId: UUID) => {
      const estanque = estanques.find((e) => e.id === estanqueId);
      if (!estanque?.estanque_config) return;

      const zonaFresca = await zonasDAL.getById(estanqueId);
      const configFresca =
        zonaFresca?.estanque_config ?? estanque.estanque_config;

      await ejecutarMutacion(
        () =>
          zonasDAL.update(estanqueId, {
            estanque_config: {
              ...configFresca,
              recarga: null,
            },
            updated_at: getCurrentTimestamp(),
          }),
        "quitar recarga estanque",
        async () => {
          emitZonaUpdated(estanqueId);
          onRefetch();
        },
      );
    },
    [estanques, onRefetch],
  );

  return {
    entradas,
    consumoSemanal,
    aguaTotalEstanques,
    capacidadTotalEstanques,
    estadoAgua,
    loading: loadingEntradas,
    registrarEntrada,
    configurarRecarga,
    quitarRecarga,
  };
}
