"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { aguaDAL, terrenosDAL, transaccionesDAL } from "@/lib/dal";
import { generateUUID, getCurrentTimestamp } from "@/lib/utils";
import {
  calcularConsumoRealTerreno,
  calcularStockEstanques,
  calcularDescuentoAutomatico,
  determinarEstadoAgua,
} from "@/lib/utils/agua";
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

  calcularAguaDesdeEstanques: () => number;
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
    return zonas.filter((z) => z.tipo === "estanque" && z.estanque_config);
  }, [zonas]);

  const stock = useMemo(() => calcularStockEstanques(estanques), [estanques]);
  const aguaTotalEstanques = stock.aguaTotal;
  const capacidadTotalEstanques = stock.capacidadTotal;

  const descuentoAplicado = useRef(false);

  useEffect(() => {
    if (!terreno) return;

    let cancelled = false;
    const terrenoId = terreno.id;

    async function cargar() {
      setLoading(true);
      try {
        const data = await aguaDAL.getEntradasByTerrenoId(terrenoId);
        if (!cancelled) {
          setEntradas(data);
        }
      } catch (err) {
        console.error("Error cargando entradas de agua:", err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    cargar();

    return () => {
      cancelled = true;
    };
  }, [terreno]);

  useEffect(() => {
    if (!terreno || estanques.length === 0 || descuentoAplicado.current) return;

    let cancelled = false;
    const terrenoCapture = terreno;

    async function aplicarDescuento() {
      try {
        const now = getCurrentTimestamp();

        if (!terrenoCapture.ultima_simulacion_agua) {
          if (cancelled) return;
          await terrenosDAL.update(terrenoCapture.id, {
            ultima_simulacion_agua: now,
          });
          descuentoAplicado.current = true;
          return;
        }

        const consumoReal = calcularConsumoRealTerreno(
          zonas,
          plantas,
          catalogoCultivos,
        );
        const resultado = calcularDescuentoAutomatico(
          terrenoCapture.ultima_simulacion_agua,
          estanques,
          zonas,
          plantas,
          catalogoCultivos,
          consumoReal,
        );

        if (!resultado) {
          descuentoAplicado.current = true;
          return;
        }

        const descuentos = resultado.descuentos
          .map((d) => {
            const estanque = estanques.find((e) => e.id === d.estanqueId);
            if (!estanque || !estanque.estanque_config) return null;
            return {
              estanqueId: d.estanqueId,
              update: {
                estanque_config: {
                  ...estanque.estanque_config,
                  nivel_actual_m3: d.nivelNuevo,
                },
                updated_at: now,
              } as Partial<Zona>,
            };
          })
          .filter((d): d is NonNullable<typeof d> => d !== null);

        if (cancelled) return;
        await transaccionesDAL.aplicarDescuentosAgua(
          descuentos,
          terrenoCapture.id,
          { ultima_simulacion_agua: now },
        );

        for (const d of descuentos) {
          emitZonaUpdated(d.estanqueId);
        }
        descuentoAplicado.current = true;
        if (!cancelled) onRefetch();
      } catch (err) {
        console.error("Error aplicando descuento automático de agua:", err);
        descuentoAplicado.current = false;
      }
    }

    aplicarDescuento();

    return () => {
      cancelled = true;
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
    if (!terreno) return "ok" as EstadoAgua;
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

  const calcularAguaDesdeEstanques = useCallback(() => {
    return estanques.reduce(
      (sum, e) => sum + (e.estanque_config?.nivel_actual_m3 || 0),
      0,
    );
  }, [estanques]);

  return {
    entradas,
    consumoSemanal,
    aguaTotalEstanques,
    capacidadTotalEstanques,
    estadoAgua,
    loading,
    registrarEntrada,
    calcularAguaDesdeEstanques,
  };
}
