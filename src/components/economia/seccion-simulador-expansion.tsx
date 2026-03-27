"use client";

import { useState, useMemo } from "react";
import { useProjectContext } from "@/contexts/project-context";
import { ESTADO_PLANTA, TIPO_ZONA } from "@/lib/constants/entities";
import {
  DIAS_POR_AÑO,
  LITROS_POR_M3,
  RECARGAS_AÑO_FALLBACK,
  SEMANAS_POR_AÑO,
} from "@/lib/constants/conversiones";
import {
  filtrarEstanques,
  esCultivoCompleto,
} from "@/lib/utils/helpers-cultivo";
import {
  calcularROI,
  obtenerCostoAguaPromedio,
  type ProyeccionROI,
} from "@/lib/utils/roi";
import {
  calcularConsumoZona,
  calcularAguaAnualPorPlantaAdulta,
} from "@/lib/utils/agua";
import { getTemporadaActual } from "@/lib/data/calculos-clima";
import { formatCLP } from "@/lib/utils";
import type { CatalogoCultivo } from "@/types";
import type { PrecioMayorista } from "@/lib/data/tipos-mercado";

interface LineaExpansion {
  cultivoId: string;
  nombre: string;
  plantasActuales: number;
  plantasSimuladas: number;
  aguaPorPlantaAño: number;
}

interface ResultadoExpansion {
  cultivoId: string;
  nombre: string;
  plantasActuales: number;
  plantasSimuladas: number;
  delta: number;
  roiActual: ProyeccionROI | null;
  roiSimulado: ProyeccionROI;
  aguaAnualSimulada: number;
}

export function SeccionSimuladorExpansion() {
  const {
    terrenoActual: terreno,
    proyectoActual,
    zonas,
    plantas,
    catalogoCultivos,
    opcionesConsumoAgua,
    datosBaseHook,
  } = useProjectContext();

  const [ajustes, setAjustes] = useState<Record<string, number>>({});
  const [nuevoCultivoId, setNuevoCultivoId] = useState<string>("");
  const [nuevoCultivoCantidad, setNuevoCultivoCantidad] = useState<number>(10);

  const preciosMap = useMemo(() => {
    const map = new Map<string, PrecioMayorista>();
    for (const p of datosBaseHook.datosBase.precios) {
      map.set(p.cultivo_id, p);
    }
    return map;
  }, [datosBaseHook.datosBase.precios]);

  const precios = useMemo(
    () => datosBaseHook.datosBase.precios ?? [],
    [datosBaseHook.datosBase.precios],
  );
  const mercadoDetalle = useMemo(
    () => datosBaseHook.datosBase.mercadoDetalle ?? [],
    [datosBaseHook.datosBase.mercadoDetalle],
  );

  const estanques = useMemo(() => filtrarEstanques(zonas), [zonas]);

  const costoAguaM3 = useMemo(() => {
    if (!terreno || estanques.length === 0) return 0;
    return obtenerCostoAguaPromedio(estanques, terreno);
  }, [terreno, estanques]);

  const aguaDisponibleAnual = useMemo(() => {
    if (estanques.length === 0) return 0;
    const totalM3 = estanques.reduce((acc, est) => {
      const cfg = est.estanque_config;
      if (!cfg) return acc;
      const recarga = cfg.recarga;
      if (
        recarga &&
        recarga.frecuencia_dias > 0 &&
        recarga.cantidad_litros > 0
      ) {
        return (
          acc +
          (recarga.cantidad_litros / LITROS_POR_M3) *
            (DIAS_POR_AÑO / recarga.frecuencia_dias)
        );
      }
      if (cfg.capacidad_m3 > 0)
        return acc + cfg.capacidad_m3 * RECARGAS_AÑO_FALLBACK;
      return acc;
    }, 0);
    return Math.round(totalM3);
  }, [estanques]);

  // Plantas actuales agrupadas por cultivo
  const plantasActuales = useMemo(() => {
    const map = new Map<string, { cultivo: CatalogoCultivo; count: number }>();
    for (const p of plantas) {
      if (p.estado === ESTADO_PLANTA.MUERTA) continue;
      const cultivo = catalogoCultivos.find((c) => c.id === p.tipo_cultivo_id);
      if (!cultivo) continue;
      const existing = map.get(cultivo.id);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(cultivo.id, { cultivo, count: 1 });
      }
    }
    return map;
  }, [plantas, catalogoCultivos]);

  // Cultivos disponibles para agregar (que no tiene ya)
  const cultivosCompletos = useMemo(
    () =>
      catalogoCultivos.filter((c) =>
        esCultivoCompleto(c, precios, mercadoDetalle),
      ),
    [catalogoCultivos, precios, mercadoDetalle],
  );

  const cultivosNuevosDisponibles = useMemo(
    () =>
      cultivosCompletos.filter(
        (c) =>
          !plantasActuales.has(c.id) && !Object.keys(ajustes).includes(c.id),
      ),
    [cultivosCompletos, plantasActuales, ajustes],
  );

  // Primera zona de cultivo como referencia para calcularROI
  const zonaRef = useMemo(
    () => zonas.find((z) => z.tipo === TIPO_ZONA.CULTIVO) ?? null,
    [zonas],
  );

  const agregarNuevoCultivo = () => {
    if (!nuevoCultivoId) return;
    setAjustes((prev) => ({
      ...prev,
      [nuevoCultivoId]: nuevoCultivoCantidad,
    }));
    setNuevoCultivoId("");
    setNuevoCultivoCantidad(10);
  };

  // Lineas de simulacion: actuales + ajustes + nuevos
  const lineas = useMemo<LineaExpansion[]>(() => {
    const result: LineaExpansion[] = [];

    // Cultivos existentes: tasa por planta derivada del consumo real de zona (igual que detalle)
    const temporada = getTemporadaActual();
    for (const [cultivoId, { cultivo, count }] of plantasActuales) {
      // Sumar consumo semanal de todas las zonas que contienen este cultivo
      const consumoSemanalTotal = zonas.reduce((acc, zona) => {
        const plantasZona = plantas.filter((p) => p.zona_id === zona.id);
        if (!plantasZona.some((p) => p.tipo_cultivo_id === cultivoId))
          return acc;
        return (
          acc +
          calcularConsumoZona(
            zona,
            plantasZona,
            catalogoCultivos,
            temporada,
            opcionesConsumoAgua,
          )
        );
      }, 0);
      const consumoAnualTotal = consumoSemanalTotal * SEMANAS_POR_AÑO;
      const aguaPorPlanta = count > 0 ? consumoAnualTotal / count : 0;

      result.push({
        cultivoId,
        nombre: cultivo.nombre,
        plantasActuales: count,
        plantasSimuladas: count + (ajustes[cultivoId] ?? 0),
        aguaPorPlantaAño: aguaPorPlanta,
      });
    }

    // Cultivos nuevos (solo en ajustes, no existentes)
    for (const [cultivoId, cantidad] of Object.entries(ajustes)) {
      if (plantasActuales.has(cultivoId)) continue;
      const cultivo = catalogoCultivos.find((c) => c.id === cultivoId);
      if (!cultivo) continue;
      const aguaPorPlanta = calcularAguaAnualPorPlantaAdulta(
        cultivo,
        opcionesConsumoAgua,
      );

      result.push({
        cultivoId,
        nombre: cultivo.nombre,
        plantasActuales: 0,
        plantasSimuladas: cantidad,
        aguaPorPlantaAño: aguaPorPlanta,
      });
    }

    return result;
  }, [
    plantasActuales,
    ajustes,
    catalogoCultivos,
    opcionesConsumoAgua,
    zonas,
    plantas,
  ]);

  // Calcular resultados
  const resultados = useMemo<ResultadoExpansion[]>(() => {
    if (!zonaRef) return [];
    const suelo = proyectoActual?.suelo ?? null;

    return lineas
      .filter((l) => l.plantasSimuladas > 0)
      .map((l) => {
        const cultivo =
          plantasActuales.get(l.cultivoId)?.cultivo ??
          catalogoCultivos.find((c) => c.id === l.cultivoId);
        if (!cultivo) return null;

        const pm = preciosMap.get(cultivo.cultivo_base_id ?? "");
        const precioMayorista = pm?.precio_actual_clp ?? undefined;

        // Consumo basado en plantas (no en área de zona fija)
        const consumoSimulado =
          l.aguaPorPlantaAño > 0
            ? (l.aguaPorPlantaAño * l.plantasSimuladas) / SEMANAS_POR_AÑO
            : undefined;

        const roiSimulado = calcularROI(
          cultivo,
          zonaRef,
          l.plantasSimuladas,
          costoAguaM3,
          consumoSimulado,
          suelo,
          precioMayorista,
        );

        const consumoActual =
          l.plantasActuales > 0 && l.aguaPorPlantaAño > 0
            ? (l.aguaPorPlantaAño * l.plantasActuales) / SEMANAS_POR_AÑO
            : undefined;

        const roiActual =
          l.plantasActuales > 0
            ? calcularROI(
                cultivo,
                zonaRef,
                l.plantasActuales,
                costoAguaM3,
                consumoActual,
                suelo,
                precioMayorista,
              )
            : null;

        return {
          cultivoId: l.cultivoId,
          nombre: l.nombre,
          plantasActuales: l.plantasActuales,
          plantasSimuladas: l.plantasSimuladas,
          delta: l.plantasSimuladas - l.plantasActuales,
          roiActual,
          roiSimulado,
          aguaAnualSimulada: roiSimulado.agua_anual_m3,
        } satisfies ResultadoExpansion;
      })
      .filter((r): r is ResultadoExpansion => r !== null);
  }, [
    lineas,
    zonaRef,
    costoAguaM3,
    proyectoActual?.suelo,
    plantasActuales,
    catalogoCultivos,
    preciosMap,
  ]);

  // Totales
  const totalAguaSimulada = resultados.reduce(
    (s, r) => s + r.aguaAnualSimulada,
    0,
  );
  const totalAguaActual = resultados.reduce(
    (s, r) => s + (r.roiActual?.agua_anual_m3 ?? 0),
    0,
  );
  const totalInversionSimulada = resultados.reduce(
    (s, r) => s + r.roiSimulado.inversion_total,
    0,
  );
  const totalInversionActual = resultados.reduce(
    (s, r) => s + (r.roiActual?.inversion_total ?? 0),
    0,
  );
  const totalIngresoSimulado = resultados.reduce(
    (s, r) => s + r.roiSimulado.ingreso_acumulado_5años,
    0,
  );
  const totalIngresoActual = resultados.reduce(
    (s, r) => s + (r.roiActual?.ingreso_acumulado_5años ?? 0),
    0,
  );
  const roiSimuladoGlobal =
    totalInversionSimulada > 0
      ? Math.round((totalIngresoSimulado / totalInversionSimulada) * 100)
      : 0;
  const roiActualGlobal =
    totalInversionActual > 0
      ? Math.round((totalIngresoActual / totalInversionActual) * 100)
      : 0;

  // Infraestructura: viajes, frecuencia, costo anual de agua
  const recargaInfo = useMemo(() => {
    const est = estanques[0];
    const recarga = est?.estanque_config?.recarga;
    if (!recarga || recarga.cantidad_litros <= 0) return null;
    const m3PorViaje = recarga.cantidad_litros / LITROS_POR_M3;

    const viajesActuales = Math.ceil(DIAS_POR_AÑO / recarga.frecuencia_dias);
    const viajesSimulados =
      totalAguaSimulada > 0
        ? Math.ceil(totalAguaSimulada / m3PorViaje)
        : viajesActuales;
    const frecuenciaSimulada =
      viajesSimulados > 0
        ? Math.round(DIAS_POR_AÑO / viajesSimulados)
        : recarga.frecuencia_dias;

    const costoAguaAnualActual = Math.round(totalAguaActual * costoAguaM3);
    const costoAguaAnualSimulado = Math.round(totalAguaSimulada * costoAguaM3);
    const capacidadM3 = est.estanque_config?.capacidad_m3 ?? 0;
    const consumoDiarioSimulado = totalAguaSimulada / DIAS_POR_AÑO;
    const diasAutonomia =
      consumoDiarioSimulado > 0
        ? Math.floor(capacidadM3 / consumoDiarioSimulado)
        : Infinity;

    return {
      m3PorViaje,
      viajesActuales,
      viajesSimulados,
      frecuenciaActual: recarga.frecuencia_dias,
      frecuenciaSimulada,
      costoAguaAnualActual,
      costoAguaAnualSimulado,
      capacidadM3,
      diasAutonomia,
    };
  }, [estanques, totalAguaSimulada, totalAguaActual, costoAguaM3]);

  const aguaExcedida = totalAguaSimulada > aguaDisponibleAnual;
  const pctAgua =
    aguaDisponibleAnual > 0
      ? Math.min((totalAguaSimulada / aguaDisponibleAnual) * 100, 100)
      : 0;

  if (!terreno || !zonaRef) {
    return (
      <div className="text-sm text-gray-500 p-2">
        Configura un terreno con zonas de cultivo para simular expansion.
      </div>
    );
  }

  const hayAjustes =
    Object.keys(ajustes).length > 0 &&
    Object.values(ajustes).some((v) => v !== 0);

  return (
    <div className="space-y-4">
      {/* Ajustes por cultivo existente */}
      <div>
        <h3 className="text-xs font-semibold text-gray-600 mb-2">
          Ajustar plantas existentes
        </h3>
        {lineas.filter((l) => l.plantasActuales > 0).length === 0 ? (
          <p className="text-xs text-gray-400">No tienes plantas aun.</p>
        ) : (
          <div className="space-y-1.5">
            {lineas
              .filter((l) => l.plantasActuales > 0)
              .map((l) => (
                <div key={l.cultivoId} className="flex items-center gap-2">
                  <span className="text-xs text-gray-700 w-28 truncate shrink-0">
                    {l.nombre}
                  </span>
                  <span className="text-[10px] text-gray-400 w-12 text-right shrink-0">
                    Actual: {l.plantasActuales}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        setAjustes((p) => ({
                          ...p,
                          [l.cultivoId]: (p[l.cultivoId] ?? 0) - 10,
                        }))
                      }
                      className="w-6 h-6 rounded bg-red-100 text-red-600 text-xs font-bold hover:bg-red-200"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={ajustes[l.cultivoId] ?? 0}
                      onChange={(e) => {
                        const v = parseInt(e.target.value);
                        setAjustes((p) => ({
                          ...p,
                          [l.cultivoId]: isNaN(v) ? 0 : v,
                        }));
                      }}
                      className="w-16 border border-gray-300 rounded px-1 py-0.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-300"
                    />
                    <button
                      onClick={() =>
                        setAjustes((p) => ({
                          ...p,
                          [l.cultivoId]: (p[l.cultivoId] ?? 0) + 10,
                        }))
                      }
                      className="w-6 h-6 rounded bg-green-100 text-green-600 text-xs font-bold hover:bg-green-200"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-[10px] text-gray-500">
                    = {l.plantasSimuladas}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Agregar nuevo cultivo */}
      {cultivosNuevosDisponibles.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-600 mb-2">
            Agregar nuevo cultivo
          </h3>
          <div className="flex items-center gap-2">
            <select
              value={nuevoCultivoId}
              onChange={(e) => setNuevoCultivoId(e.target.value)}
              className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-300"
            >
              <option value="">Seleccionar cultivo...</option>
              {cultivosNuevosDisponibles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              value={nuevoCultivoCantidad}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                setNuevoCultivoCantidad(isNaN(v) || v < 1 ? 1 : v);
              }}
              className="w-16 border border-gray-300 rounded px-1 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-300"
            />
            <button
              onClick={agregarNuevoCultivo}
              disabled={!nuevoCultivoId}
              className="px-3 py-1 rounded bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Agregar
            </button>
          </div>
        </div>
      )}

      {/* Cultivos nuevos agregados */}
      {lineas.filter((l) => l.plantasActuales === 0).length > 0 && (
        <div className="space-y-1.5">
          {lineas
            .filter((l) => l.plantasActuales === 0)
            .map((l) => (
              <div
                key={l.cultivoId}
                className="flex items-center gap-2 bg-blue-50 rounded px-2 py-1"
              >
                <span className="text-xs text-blue-700 font-medium w-28 truncate shrink-0">
                  {l.nombre}
                </span>
                <span className="text-[10px] text-blue-500 w-12 text-right shrink-0">
                  Nuevo
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      setAjustes((p) => ({
                        ...p,
                        [l.cultivoId]: Math.max(0, (p[l.cultivoId] ?? 0) - 10),
                      }))
                    }
                    className="w-6 h-6 rounded bg-red-100 text-red-600 text-xs font-bold hover:bg-red-200"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={0}
                    value={ajustes[l.cultivoId] ?? 0}
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      setAjustes((p) => ({
                        ...p,
                        [l.cultivoId]: isNaN(v) || v < 0 ? 0 : v,
                      }));
                    }}
                    className="w-16 border border-gray-300 rounded px-1 py-0.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-300"
                  />
                  <button
                    onClick={() =>
                      setAjustes((p) => ({
                        ...p,
                        [l.cultivoId]: (p[l.cultivoId] ?? 0) + 10,
                      }))
                    }
                    className="w-6 h-6 rounded bg-green-100 text-green-600 text-xs font-bold hover:bg-green-200"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() =>
                    setAjustes((p) => {
                      const next = { ...p };
                      delete next[l.cultivoId];
                      return next;
                    })
                  }
                  className="text-xs text-red-400 hover:text-red-600 ml-auto"
                >
                  x
                </button>
              </div>
            ))}
        </div>
      )}

      {/* Barra de agua */}
      {aguaDisponibleAnual > 0 && (
        <div>
          <div className="flex justify-between text-[10px] text-gray-500 mb-1">
            <span>
              Agua simulada: {Math.round(totalAguaSimulada)} /{" "}
              {aguaDisponibleAnual} m3/año
            </span>
            <span className={aguaExcedida ? "text-red-600 font-bold" : ""}>
              {Math.round((totalAguaSimulada / aguaDisponibleAnual) * 100)}%
            </span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                aguaExcedida
                  ? "bg-red-500"
                  : pctAgua > 80
                    ? "bg-yellow-500"
                    : "bg-green-500"
              }`}
              style={{ width: `${pctAgua}%` }}
            />
          </div>
          {aguaExcedida && (
            <p className="text-[10px] text-red-600 mt-1 font-medium">
              Necesitas {Math.round(totalAguaSimulada - aguaDisponibleAnual)}{" "}
              m3/año mas de agua. Aumenta la frecuencia de recarga o consigue un
              estanque mas grande.
            </p>
          )}
        </div>
      )}

      {/* Impacto infraestructura */}
      {recargaInfo && hayAjustes && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
          <div className="text-[10px] text-amber-800 font-semibold uppercase tracking-wide">
            Impacto en infraestructura
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <div className="text-gray-600">Viajes/año:</div>
            <div className="text-gray-900 font-medium">
              {recargaInfo.viajesSimulados}
              <span className="text-gray-400 font-normal ml-1">
                (hoy: {recargaInfo.viajesActuales})
              </span>
            </div>
            <div className="text-gray-600">Frecuencia:</div>
            <div className="text-gray-900 font-medium">
              cada {recargaInfo.frecuenciaSimulada} dias
              <span className="text-gray-400 font-normal ml-1">
                (hoy: cada {recargaInfo.frecuenciaActual})
              </span>
            </div>
            <div className="text-gray-600">Costo agua/año:</div>
            <div className="text-gray-900 font-medium">
              {formatCLP(recargaInfo.costoAguaAnualSimulado)}
              <span className="text-gray-400 font-normal ml-1">
                (hoy: {formatCLP(recargaInfo.costoAguaAnualActual)})
              </span>
            </div>
            <div className="text-gray-600">Autonomia estanque:</div>
            <div
              className={`font-medium ${
                recargaInfo.diasAutonomia < recargaInfo.frecuenciaSimulada
                  ? "text-red-700"
                  : "text-gray-900"
              }`}
            >
              {recargaInfo.diasAutonomia === Infinity
                ? "—"
                : `${recargaInfo.diasAutonomia} dias`}
              <span className="text-gray-400 font-normal ml-1">
                ({recargaInfo.capacidadM3} m3)
              </span>
            </div>
          </div>
          {recargaInfo.diasAutonomia < recargaInfo.frecuenciaSimulada && (
            <p className="text-[10px] text-red-700 font-medium bg-red-50 rounded px-2 py-1">
              Tu estanque de {recargaInfo.capacidadM3} m3 no aguanta{" "}
              {recargaInfo.frecuenciaSimulada} dias entre recargas. Necesitas un
              estanque mas grande o recargas mas seguidas (cada{" "}
              {recargaInfo.diasAutonomia} dias maximo).
            </p>
          )}
        </div>
      )}

      {/* Resultados comparativos */}
      {resultados.length > 0 && (
        <div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-gray-50 rounded p-2 text-center">
              <div className="text-[10px] text-gray-500">Inversion</div>
              <div className="text-xs font-bold text-gray-700">
                {formatCLP(totalInversionSimulada)}
              </div>
              {hayAjustes && totalInversionActual > 0 && (
                <div className="text-[10px] text-gray-400">
                  antes: {formatCLP(totalInversionActual)}
                </div>
              )}
            </div>
            <div className="bg-gray-50 rounded p-2 text-center">
              <div className="text-[10px] text-gray-500">Margen 5a</div>
              <div
                className={`text-xs font-bold ${totalIngresoSimulado >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {formatCLP(Math.round(totalIngresoSimulado))}
              </div>
              {hayAjustes && totalIngresoActual !== 0 && (
                <div className="text-[10px] text-gray-400">
                  antes: {formatCLP(Math.round(totalIngresoActual))}
                </div>
              )}
            </div>
            <div className="bg-gray-50 rounded p-2 text-center">
              <div className="text-[10px] text-gray-500">ROI Bruto</div>
              <div
                className={`text-xs font-bold ${roiSimuladoGlobal > 0 ? "text-green-600" : "text-red-600"}`}
              >
                {roiSimuladoGlobal}%
              </div>
              {hayAjustes && roiActualGlobal !== 0 && (
                <div className="text-[10px] text-gray-400">
                  antes: {roiActualGlobal}%
                </div>
              )}
            </div>
          </div>

          {/* Tabla por cultivo */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="p-1.5 text-[10px] font-medium text-gray-500">
                    Cultivo
                  </th>
                  <th className="p-1.5 text-right text-[10px] font-medium text-gray-500">
                    Plantas
                  </th>
                  <th className="p-1.5 text-right text-[10px] font-medium text-gray-500">
                    Agua/año
                  </th>
                  <th className="p-1.5 text-right text-[10px] font-medium text-gray-500">
                    ROI 5a
                  </th>
                  <th className="p-1.5 text-right text-[10px] font-medium text-gray-500">
                    Recupera
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {resultados.map((r) => (
                  <tr key={r.cultivoId} className="hover:bg-gray-50">
                    <td className="p-1.5 text-xs text-gray-800">
                      {r.nombre}
                      {r.delta !== 0 && (
                        <span
                          className={`ml-1 text-[10px] font-medium ${r.delta > 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          {r.delta > 0 ? "+" : ""}
                          {r.delta}
                        </span>
                      )}
                    </td>
                    <td className="p-1.5 text-right text-xs text-gray-700">
                      {r.plantasSimuladas}
                    </td>
                    <td className="p-1.5 text-right text-xs text-gray-600">
                      {Math.round(r.aguaAnualSimulada)} m3
                    </td>
                    <td className="p-1.5 text-right">
                      <span
                        className={`text-xs font-bold ${r.roiSimulado.roi_5_años_pct > 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {r.roiSimulado.roi_5_años_pct}%
                      </span>
                    </td>
                    <td className="p-1.5 text-right text-xs text-gray-600">
                      {r.roiSimulado.punto_equilibrio_meses != null
                        ? `${r.roiSimulado.punto_equilibrio_meses}m`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {hayAjustes && (
        <button
          onClick={() => setAjustes({})}
          className="text-xs text-gray-500 underline hover:text-gray-700"
        >
          Restaurar valores actuales
        </button>
      )}

      <p className="text-[10px] text-gray-400">
        Simulacion numerica. No modifica tu terreno real. ROI bruto (precio
        mayorista, sin mano de obra ni insumos).
      </p>
    </div>
  );
}
