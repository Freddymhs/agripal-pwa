"use client";

import { Fragment, useMemo, useState } from "react";
import { PageLayout } from "@/components/layout";
import { useProjectContext } from "@/contexts/project-context";
import { ESTADO_PLANTA, TIPO_ZONA } from "@/lib/constants/entities";
import {
  filtrarEstanques,
  calcularPrecioKgPromedio,
} from "@/lib/utils/helpers-cultivo";
import {
  calcularROI,
  obtenerCostoAguaPromedio,
  extenderROI10Años,
  type ProyeccionROI,
  type ProyeccionROI10,
} from "@/lib/utils/roi";
import { calcularConsumoZona } from "@/lib/utils/agua";
import { formatCLP } from "@/lib/utils";
import { ConfianzaPrecioBadge } from "@/components/economia/confianza-precio-badge";
import type {
  CatalogoCultivo,
  ResumenPrecioHistorico,
  PerfilCalidad,
} from "@/types";
import type { PrecioMayorista } from "@/lib/data/tipos-mercado";
import {
  PERFILES_CALIDAD,
  CALIDAD_PRECIO_DEFAULT,
} from "@/lib/constants/conversiones";

function RoiBadge({ pct, label }: { pct: number; label?: string }) {
  const tag = label ?? "5a";
  if (pct < 0)
    return (
      <span className="font-bold text-red-600 text-xs">
        No rentable ({tag})
      </span>
    );
  if (pct === 0)
    return <span className="font-bold text-gray-500">Sin ganancia</span>;
  if (pct < 30)
    return <span className="font-bold text-yellow-600">{pct}%</span>;
  return <span className="font-bold text-green-700">{pct}%</span>;
}

function RecuperaCell({
  meses5,
  meses10,
}: {
  meses5: number | null;
  meses10?: number | null;
}) {
  const meses = meses5 ?? meses10 ?? null;
  if (meses === null)
    return <span className="text-red-400 text-xs">&gt;10a</span>;
  const esExtendido = meses5 === null && meses10 !== null;
  if (meses <= 36)
    return <span className="text-green-700 font-medium">{meses}m</span>;
  if (meses <= 60)
    return <span className="text-yellow-600 font-medium">{meses}m</span>;
  return (
    <span className="text-orange-500 font-medium">
      {meses}m
      {esExtendido && (
        <span className="text-[10px] text-gray-400 ml-0.5">(10a)</span>
      )}
    </span>
  );
}

function BreakEvenAgua({ precio }: { precio: number | null }) {
  if (precio === null) return <span className="text-red-400 text-xs">N/A</span>;
  return (
    <span
      className={`font-medium text-xs ${precio > 5000 ? "text-green-700" : precio > 2000 ? "text-yellow-600" : "text-red-600"}`}
    >
      {formatCLP(precio)}
    </span>
  );
}

function ViabilidadBadge({
  breakEvenAgua,
  costoAgua,
}: {
  breakEvenAgua: number | null;
  costoAgua: number;
}) {
  if (costoAgua <= 2000) return null;
  if (!breakEvenAgua)
    return (
      <span className="ml-1 text-[10px] bg-red-100 text-red-700 px-1 py-0.5 rounded font-medium">
        Inviable
      </span>
    );
  const margen = breakEvenAgua / costoAgua;
  if (margen >= 1.5)
    return (
      <span className="ml-1 text-[10px] bg-green-100 text-green-700 px-1 py-0.5 rounded font-medium">
        Viable
      </span>
    );
  if (margen >= 1.0)
    return (
      <span className="ml-1 text-[10px] bg-yellow-100 text-yellow-700 px-1 py-0.5 rounded font-medium">
        Riesgo
      </span>
    );
  return (
    <span className="ml-1 text-[10px] bg-red-100 text-red-700 px-1 py-0.5 rounded font-medium">
      Inviable
    </span>
  );
}

const LABEL_RIEGO: Record<string, string> = {
  programado: "Goteo programado",
  manual_sesiones: "Válvula manual",
  continuo_24_7: "Continuo 24/7",
  manual_balde: "Balde",
};

interface ResumenCultivo {
  cultivoId: string;
  cultivoNombre: string;
  zonaId: string;
  zonaNombre: string;
  tipoRiego: string | null;
  numPlantas: number;
  cultivo: CatalogoCultivo;
  /** ROI calculado con precio feria (escenario principal) */
  roi: ProyeccionROI;
  roi10: ProyeccionROI10 | null;
  /** ROI calculado con precio mayorista ODEPA (escenario conservador) */
  roiMayorista: ProyeccionROI;
  roi10Mayorista: ProyeccionROI10 | null;
}

export default function EconomiaPage() {
  const [comoSeCalculaOpen, setComoSeCalculaOpen] = useState(false);
  const [simuladorOpen, setSimuladorOpen] = useState(false);
  const [simuladorVentaOpen, setSimuladorVentaOpen] = useState(false);
  const [precioAguaSimulado, setPrecioAguaSimulado] = useState<number | null>(
    null,
  );
  const [preciosVentaSimulados, setPreciosVentaSimulados] = useState<
    Record<string, number>
  >({});
  const [perfilCalidad, setPerfilCalidad] = useState<PerfilCalidad | null>(
    null,
  );

  const {
    terrenoActual: terreno,
    proyectoActual,
    zonas,
    plantas,
    catalogoCultivos,
    loading,
    opcionesConsumoAgua,
    datosBaseHook,
  } = useProjectContext();

  const costoAguaM3Real = useMemo(() => {
    if (!terreno || zonas.length === 0) return 0;
    const estanques = filtrarEstanques(zonas);
    return obtenerCostoAguaPromedio(estanques, terreno);
  }, [terreno, zonas]);

  const costoAguaM3Efectivo = precioAguaSimulado ?? costoAguaM3Real;
  const usandoSimuladorAgua = precioAguaSimulado !== null;
  const usandoSimuladorVenta = Object.keys(preciosVentaSimulados).length > 0;

  // Lookup: cultivo_base_id → PrecioMayorista (movido antes de resumen para calcular ROI feria/mayorista)
  const preciosMap = useMemo(() => {
    const map = new Map<string, PrecioMayorista>();
    for (const p of datosBaseHook.datosBase.precios) {
      map.set(p.cultivo_id, p);
    }
    return map;
  }, [datosBaseHook.datosBase.precios]);

  const resumen = useMemo<ResumenCultivo[]>(() => {
    if (!terreno || zonas.length === 0) return [];

    const zonasConCultivo = zonas.filter((z) => z.tipo === TIPO_ZONA.CULTIVO);
    const resumenCalculado: ResumenCultivo[] = [];

    for (const zona of zonasConCultivo) {
      const plantasZona = plantas.filter(
        (p) => p.zona_id === zona.id && p.estado !== ESTADO_PLANTA.MUERTA,
      );
      if (plantasZona.length === 0) continue;

      const cultivosPorTipo = plantasZona.reduce(
        (acc, p) => {
          acc[p.tipo_cultivo_id] = (acc[p.tipo_cultivo_id] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      for (const [cultivoId, count] of Object.entries(cultivosPorTipo)) {
        const cultivo = catalogoCultivos.find((c) => c.id === cultivoId);
        if (!cultivo) continue;

        const plantasCultivo = plantasZona.filter(
          (p) => p.tipo_cultivo_id === cultivoId,
        );
        const consumoCultivo = calcularConsumoZona(
          zona,
          plantasCultivo,
          catalogoCultivos,
          undefined,
          opcionesConsumoAgua,
        );
        const precioOverride = preciosVentaSimulados[cultivoId];

        // Derivar precio feria y mayorista desde precios_mayoristas
        const pm = preciosMap.get(cultivo.cultivo_base_id ?? "");
        const precioFeria =
          precioOverride ??
          (pm?.precio_actual_clp && pm.factor_precio_feria
            ? Math.round(pm.precio_actual_clp * pm.factor_precio_feria)
            : undefined);
        const precioMayorista =
          precioOverride ??
          (pm?.precio_actual_clp ? pm.precio_actual_clp : undefined);

        const suelo = proyectoActual?.suelo ?? null;
        const roi = calcularROI(
          cultivo,
          zona,
          count,
          costoAguaM3Efectivo,
          consumoCultivo,
          suelo,
          precioFeria,
          perfilCalidad,
        );
        const roiMayorista = calcularROI(
          cultivo,
          zona,
          count,
          costoAguaM3Efectivo,
          consumoCultivo,
          suelo,
          precioMayorista,
          perfilCalidad,
        );
        const esPerenne = (cultivo.vida_util_años ?? 0) > 5;
        const roi10 = esPerenne ? extenderROI10Años(roi) : null;
        const roi10Mayorista = esPerenne
          ? extenderROI10Años(roiMayorista)
          : null;

        resumenCalculado.push({
          cultivoId,
          cultivoNombre: cultivo.nombre,
          zonaId: zona.id,
          zonaNombre: zona.nombre,
          tipoRiego: zona.configuracion_riego?.tipo ?? null,
          numPlantas: count,
          cultivo,
          roi,
          roi10,
          roiMayorista,
          roi10Mayorista,
        });
      }
    }

    return resumenCalculado;
  }, [
    terreno,
    zonas,
    plantas,
    catalogoCultivos,
    costoAguaM3Efectivo,
    proyectoActual?.suelo,
    opcionesConsumoAgua,
    preciosVentaSimulados,
    preciosMap,
    perfilCalidad,
  ]);

  const totalInversion = resumen.reduce((s, r) => s + r.roi.inversion_total, 0);
  const totalIngresoAcumulado = resumen.reduce(
    (s, r) => s + r.roi.ingreso_acumulado_5años,
    0,
  );
  const totalCostoAgua = resumen.reduce(
    (s, r) => s + r.roi.costo_agua_anual,
    0,
  );
  const totalCostoPlantas = resumen.reduce(
    (s, r) => s + r.roi.costo_plantas,
    0,
  );
  const roiGlobal =
    totalInversion > 0 ? (totalIngresoAcumulado / totalInversion) * 100 : 0;

  const zonasAgrupadas = useMemo(() => {
    const map = new Map<
      string,
      { zonaId: string; zonaNombre: string; items: ResumenCultivo[] }
    >();
    for (const r of resumen) {
      const existing = map.get(r.zonaId);
      if (existing) {
        existing.items.push(r);
      } else {
        map.set(r.zonaId, {
          zonaId: r.zonaId,
          zonaNombre: r.zonaNombre,
          items: [r],
        });
      }
    }
    return Array.from(map.values());
  }, [resumen]);

  const resumenHistMap = useMemo(() => {
    const map = new Map<string, ResumenPrecioHistorico>();
    for (const r of datosBaseHook.datosBase.resumenHistoricos) {
      map.set(r.nombre_odepa, r);
    }
    return map;
  }, [datosBaseHook.datosBase.resumenHistoricos]);

  // Cultivos únicos para simulador de precios
  const cultivosUnicos = useMemo(() => {
    const map = new Map<string, CatalogoCultivo>();
    for (const r of resumen) {
      if (!map.has(r.cultivoId)) map.set(r.cultivoId, r.cultivo);
    }
    return Array.from(map.values());
  }, [resumen]);

  if (loading) {
    return (
      <PageLayout headerColor="emerald">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Cargando...</div>
        </div>
      </PageLayout>
    );
  }

  if (!terreno) {
    return (
      <PageLayout headerColor="emerald">
        <main className="p-4">
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
            <p className="text-yellow-800">No hay terrenos creados.</p>
          </div>
        </main>
      </PageLayout>
    );
  }

  return (
    <PageLayout headerColor="emerald">
      <main className="p-4 space-y-4 max-w-full mx-auto">
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Proyeccion Economica (5 anos)
          </h2>

          {totalCostoAgua === 0 &&
            !usandoSimuladorAgua &&
            resumen.length > 0 && (
              <div className="mb-4 p-3 rounded-lg text-sm bg-orange-50 text-orange-800 border border-orange-200">
                <strong>Costo del agua no configurado.</strong> El ROI no
                incluye gastos de agua. Configura el costo en{" "}
                <a href="/agua" className="underline font-medium">
                  Agua &rarr; Configurar Recarga
                </a>{" "}
                o usa el simulador abajo.
              </div>
            )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-blue-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-700">
                {formatCLP(totalInversion)}
              </div>
              <div className="text-xs text-blue-600">Inversion Inicial</div>
              <div className="text-xs text-blue-400 mt-1">
                Plantas: {formatCLP(totalCostoPlantas)} | Agua a1:{" "}
                {formatCLP(totalCostoAgua)}
              </div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <div
                className={`text-2xl font-bold ${totalIngresoAcumulado >= 0 ? "text-green-700" : "text-red-600"}`}
              >
                {formatCLP(totalIngresoAcumulado)}
              </div>
              <div className="text-xs text-green-600">Margen Bruto (5a)</div>
              <div className="text-xs text-green-400 mt-1">
                Ventas - agua - plantas amortizadas
              </div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg text-center">
              <div
                className={`text-2xl font-bold ${costoAguaM3Efectivo > 0 ? "text-purple-700" : "text-orange-500"}`}
              >
                {costoAguaM3Efectivo > 0 ? (
                  <>
                    {formatCLP(costoAguaM3Efectivo)}
                    <span className="text-sm font-normal">/m3</span>
                  </>
                ) : (
                  "Sin configurar"
                )}
              </div>
              <div className="text-xs text-purple-600">
                Costo real agua
                {usandoSimuladorAgua && (
                  <span className="text-orange-500"> *simulado</span>
                )}
              </div>
              {costoAguaM3Efectivo > 0 && (
                <div className="text-xs text-purple-400 mt-1">
                  Agua/ano: {formatCLP(totalCostoAgua)}
                </div>
              )}
            </div>
            <div
              className={`p-3 rounded-lg text-center ${roiGlobal > 0 ? "bg-emerald-50" : "bg-red-50"}`}
            >
              <div
                className={`text-2xl font-bold ${roiGlobal > 0 ? "text-emerald-700" : "text-red-700"}`}
              >
                {Math.round(roiGlobal)}%
              </div>
              <div
                className={`text-xs ${roiGlobal > 0 ? "text-emerald-600" : "text-red-600"}`}
              >
                ROI Global
              </div>
            </div>
          </div>

          {/* Simulador precio agua */}
          <div className="mb-2 border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setSimuladorOpen(!simuladorOpen)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <span>Simular precio del agua</span>
                {usandoSimuladorAgua && (
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                    {formatCLP(precioAguaSimulado ?? 0)}/m3 activo
                  </span>
                )}
                {!usandoSimuladorAgua && costoAguaM3Real > 0 && (
                  <span className="text-xs text-gray-400">
                    Real: {formatCLP(costoAguaM3Real)}/m3
                  </span>
                )}
              </span>
              <ChevronIcon open={simuladorOpen} />
            </button>
            {simuladorOpen && (
              <div className="px-3 pb-3 pt-1 bg-gray-50 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-2">
                  Ajusta el precio (incluye transporte) para comparar
                  escenarios. No modifica tu configuracion real.
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 shrink-0">
                    CLP/m3:
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={precioAguaSimulado ?? costoAguaM3Real}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setPrecioAguaSimulado(isNaN(v) || v < 0 ? 0 : v);
                    }}
                    className="w-28 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                  {usandoSimuladorAgua && (
                    <button
                      onClick={() => setPrecioAguaSimulado(null)}
                      className="text-xs text-gray-500 underline hover:text-gray-700"
                    >
                      Restaurar real
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Simulador precio venta */}
          {cultivosUnicos.length > 0 && (
            <div className="mb-3 border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setSimuladorVentaOpen(!simuladorVentaOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span>Simular precios de venta</span>
                  {usandoSimuladorVenta && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                      {Object.keys(preciosVentaSimulados).length} cultivo(s)
                      ajustado(s)
                    </span>
                  )}
                </span>
                <ChevronIcon open={simuladorVentaOpen} />
              </button>
              {simuladorVentaOpen && (
                <div className="px-3 pb-3 pt-1 bg-gray-50 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">
                    Ajusta el precio de venta por cultivo para explorar
                    escenarios. No modifica datos reales.
                  </p>
                  <div className="space-y-2">
                    {cultivosUnicos.map((c) => {
                      const precioReal = calcularPrecioKgPromedio(c);
                      const precioSim = preciosVentaSimulados[c.id];
                      return (
                        <div key={c.id} className="flex items-center gap-2">
                          <span className="text-sm text-gray-700 w-28 shrink-0 truncate">
                            {c.nombre}
                          </span>
                          <span className="text-xs text-gray-400 w-20 shrink-0">
                            {formatCLP(precioReal)}/kg
                          </span>
                          <input
                            type="number"
                            min={0}
                            step={100}
                            placeholder={String(precioReal)}
                            value={precioSim ?? ""}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value);
                              setPreciosVentaSimulados((prev) => {
                                if (isNaN(v) || e.target.value === "") {
                                  const next = { ...prev };
                                  delete next[c.id];
                                  return next;
                                }
                                return { ...prev, [c.id]: Math.max(0, v) };
                              });
                            }}
                            className="w-24 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                          />
                          <span className="text-xs text-gray-400">/kg</span>
                          {precioSim !== undefined && (
                            <button
                              onClick={() =>
                                setPreciosVentaSimulados((prev) => {
                                  const next = { ...prev };
                                  delete next[c.id];
                                  return next;
                                })
                              }
                              className="text-xs text-gray-400 hover:text-gray-600"
                            >
                              x
                            </button>
                          )}
                        </div>
                      );
                    })}
                    {usandoSimuladorVenta && (
                      <button
                        onClick={() => setPreciosVentaSimulados({})}
                        className="text-xs text-gray-500 underline hover:text-gray-700"
                      >
                        Restaurar todos los precios
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Perfil de calidad de cosecha */}
          <div className="mb-3 border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-700 font-medium">
                Calidad de cosecha
              </span>
              {perfilCalidad && (
                <button
                  onClick={() => setPerfilCalidad(null)}
                  className="text-xs text-gray-400 underline hover:text-gray-600"
                >
                  Desactivar
                </button>
              )}
            </div>
            <div className="flex gap-2">
              {(
                [
                  [
                    "basico",
                    "Basico",
                    "bg-orange-100 text-orange-700 border-orange-300",
                  ],
                  [
                    "estandar",
                    "Estandar",
                    "bg-blue-100 text-blue-700 border-blue-300",
                  ],
                  [
                    "premium",
                    "Premium",
                    "bg-emerald-100 text-emerald-700 border-emerald-300",
                  ],
                ] as const
              ).map(([key, label, activeClass]) => (
                <button
                  key={key}
                  onClick={() =>
                    setPerfilCalidad(perfilCalidad === key ? null : key)
                  }
                  className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                    perfilCalidad === key
                      ? activeClass
                      : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5">
              {perfilCalidad
                ? `${Math.round(PERFILES_CALIDAD[perfilCalidad].primera * 100)}% 1a (${CALIDAD_PRECIO_DEFAULT.primera}x) · ${Math.round(PERFILES_CALIDAD[perfilCalidad].segunda * 100)}% 2a (${CALIDAD_PRECIO_DEFAULT.segunda}x) · ${Math.round(PERFILES_CALIDAD[perfilCalidad].tercera * 100)}% 3a (${CALIDAD_PRECIO_DEFAULT.tercera}x)`
                : "Sin perfil = precio promedio plano. Activa para simular calidad de cosecha."}
            </p>
          </div>

          {resumen.length === 0 ? (
            <div className="p-3 rounded-lg text-sm bg-amber-50 text-amber-800 border border-amber-200">
              Agrega cultivos desde el mapa para ver tu proyeccion economica.
            </div>
          ) : (
            <div
              className={`p-3 rounded-lg text-sm ${roiGlobal > 50 ? "bg-green-100 text-green-800" : roiGlobal > 0 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}
            >
              {roiGlobal > 50
                ? "Excelente rentabilidad proyectada"
                : roiGlobal > 0
                  ? "Rentabilidad ajustada - considera optimizar cultivos"
                  : totalInversion > 0
                    ? "No rentable en 5 anos con los cultivos actuales"
                    : "Agrega cultivos desde el mapa para ver tu proyeccion economica."}
            </div>
          )}
        </div>

        {resumen.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <p className="text-yellow-800">
              No hay plantas cultivadas. Agrega plantas a tus zonas desde el
              mapa para ver proyecciones economicas.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <h2 className="text-lg font-bold text-gray-900 p-4 border-b">
              Detalle por Cultivo
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-2 font-medium text-gray-700 text-xs">
                      Cultivo
                    </th>
                    <th className="text-right p-2 font-medium text-gray-700 text-xs">
                      Pl
                    </th>
                    <th className="text-right p-2 font-medium text-gray-700 whitespace-nowrap">
                      <span className="block text-xs">$/kg</span>
                      <span className="block text-[10px] font-normal text-gray-400">
                        feria / super
                      </span>
                    </th>
                    <th className="text-right p-2 font-medium text-gray-700 whitespace-nowrap">
                      <span className="block text-xs">Inversion</span>
                      <span className="block text-[10px] font-normal text-gray-400">
                        plantas+agua a1
                      </span>
                    </th>
                    <th className="text-right p-2 font-medium text-green-700 whitespace-nowrap">
                      <span className="block text-xs">ROI Feria</span>
                      <span className="block text-[10px] font-normal text-green-400">
                        vta directa
                      </span>
                    </th>
                    <th className="text-right p-2 font-medium text-gray-700 whitespace-nowrap">
                      <span className="block text-xs">ROI Mayor.</span>
                      <span className="block text-[10px] font-normal text-gray-400">
                        intermedio
                      </span>
                    </th>
                    <th className="text-right p-2 font-medium text-gray-700 whitespace-nowrap">
                      <span className="block text-xs">Recupera</span>
                    </th>
                    <th className="text-right p-2 font-medium text-gray-700 whitespace-nowrap">
                      <span className="block text-xs">Agua max</span>
                      <span className="block text-[10px] font-normal text-gray-400">
                        $/m3
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {zonasAgrupadas.map((grupo) => (
                    <Fragment key={grupo.zonaId}>
                      <tr className="bg-gray-100">
                        <td colSpan={4} className="p-2 pl-3 text-xs">
                          <span className="font-semibold text-gray-700 uppercase tracking-wide">
                            {grupo.zonaNombre}
                          </span>
                          {grupo.items[0]?.tipoRiego && (
                            <span className="ml-2 text-gray-400 font-normal normal-case tracking-normal">
                              &middot;{" "}
                              {LABEL_RIEGO[grupo.items[0].tipoRiego] ??
                                grupo.items[0].tipoRiego}{" "}
                              <span className="text-gray-300">
                                (ef.{" "}
                                {Math.round(
                                  grupo.items[0].roi.factor_riego * 100,
                                )}
                                %)
                              </span>
                            </span>
                          )}
                        </td>
                        <td className="p-2 text-right text-xs font-medium text-green-600">
                          {(() => {
                            const inv = grupo.items.reduce(
                              (s, r) => s + r.roi.inversion_total,
                              0,
                            );
                            const ing = grupo.items.reduce(
                              (s, r) => s + r.roi.ingreso_acumulado_5años,
                              0,
                            );
                            return inv > 0
                              ? `${Math.round((ing / inv) * 100)}%`
                              : "-";
                          })()}
                        </td>
                        <td className="p-2 text-right text-xs font-medium text-gray-400">
                          {(() => {
                            const inv = grupo.items.reduce(
                              (s, r) => s + r.roiMayorista.inversion_total,
                              0,
                            );
                            const ing = grupo.items.reduce(
                              (s, r) =>
                                s + r.roiMayorista.ingreso_acumulado_5años,
                              0,
                            );
                            return inv > 0
                              ? `${Math.round((ing / inv) * 100)}%`
                              : "-";
                          })()}
                        </td>
                        <td className="p-2" />
                        <td className="p-2" />
                      </tr>
                      {grupo.items.map((r, i) => {
                        const tiempoProduccion =
                          r.cultivo.tiempo_produccion_meses ?? 12;
                        const precioSimulado =
                          preciosVentaSimulados[r.cultivoId];
                        return (
                          <tr
                            key={`${r.zonaId}-${r.cultivoId}-${i}`}
                            className="hover:bg-gray-50"
                          >
                            <td className="p-2 pl-4">
                              <div className="font-medium text-gray-900 text-xs">
                                {r.cultivoNombre}
                                <ViabilidadBadge
                                  breakEvenAgua={r.roi.precio_agua_break_even}
                                  costoAgua={costoAguaM3Efectivo}
                                />
                                {precioSimulado !== undefined && (
                                  <span className="ml-1 text-[10px] bg-blue-100 text-blue-600 px-1 py-0.5 rounded">
                                    ${precioSimulado}/kg
                                  </span>
                                )}
                                {(() => {
                                  const pm = preciosMap.get(
                                    r.cultivo.cultivo_base_id ?? "",
                                  );
                                  const hist = pm?.nombre_odepa
                                    ? resumenHistMap.get(pm.nombre_odepa)
                                    : undefined;
                                  return (
                                    <span className="ml-1">
                                      <ConfianzaPrecioBadge
                                        nombreOdepa={pm?.nombre_odepa}
                                        resumen={hist}
                                      />
                                    </span>
                                  );
                                })()}
                              </div>
                              <div className="text-[10px] text-gray-400 mt-0.5">
                                {tiempoProduccion}m
                                {r.roi.agua_anual_m3 > 0 && (
                                  <>
                                    {" "}
                                    &middot;{" "}
                                    {Math.round(r.roi.agua_anual_m3 * 10) /
                                      10}{" "}
                                    m3/a
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="p-2 text-right text-gray-900 text-xs">
                              {r.numPlantas}
                            </td>
                            <td className="p-2 text-right">
                              {(() => {
                                const pm = preciosMap.get(
                                  r.cultivo.cultivo_base_id ?? "",
                                );
                                if (
                                  !pm?.precio_actual_clp ||
                                  !pm.factor_precio_feria
                                )
                                  return (
                                    <span className="text-gray-400 text-xs">
                                      —
                                    </span>
                                  );
                                const pFeria = Math.round(
                                  pm.precio_actual_clp * pm.factor_precio_feria,
                                );
                                const pRetail = pm.factor_precio_retail
                                  ? Math.round(
                                      pm.precio_actual_clp *
                                        pm.factor_precio_retail,
                                    )
                                  : null;
                                return (
                                  <div className="text-xs">
                                    <span className="font-medium text-green-700">
                                      {formatCLP(pFeria)}
                                    </span>
                                    {pRetail && (
                                      <span className="block text-[10px] text-gray-400">
                                        {formatCLP(pRetail)} sup
                                      </span>
                                    )}
                                  </div>
                                );
                              })()}
                            </td>
                            <td className="p-2 text-right text-gray-900 text-xs">
                              {formatCLP(r.roi.inversion_total)}
                            </td>
                            <td className="p-2 text-right">
                              <div>
                                <RoiBadge pct={r.roi.roi_5_años_pct} />
                              </div>
                              {r.roi10 && (
                                <div className="mt-0.5">
                                  <RoiBadge
                                    pct={r.roi10.roi_10_años_pct}
                                    label="10a"
                                  />
                                </div>
                              )}
                            </td>
                            <td className="p-2 text-right">
                              <div>
                                <RoiBadge pct={r.roiMayorista.roi_5_años_pct} />
                              </div>
                              {r.roi10Mayorista && (
                                <div className="mt-0.5">
                                  <RoiBadge
                                    pct={r.roi10Mayorista.roi_10_años_pct}
                                    label="10a"
                                  />
                                </div>
                              )}
                            </td>
                            <td className="p-2 text-right">
                              <RecuperaCell
                                meses5={r.roi.punto_equilibrio_meses}
                                meses10={r.roi10?.punto_equilibrio_meses_10}
                              />
                            </td>
                            <td className="p-2 text-right">
                              <BreakEvenAgua
                                precio={r.roi.precio_agua_break_even}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </Fragment>
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-2 text-[10px] text-gray-400 border-t border-gray-100">
                * No incluye mano de obra, insumos (fertilizantes, plaguicidas)
                ni transporte. Es el margen bruto agricola estimado.
              </div>
            </div>
          </div>
        )}

        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => setComoSeCalculaOpen(!comoSeCalculaOpen)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <span>Como se calcula?</span>
            <ChevronIcon open={comoSeCalculaOpen} />
          </button>
          {comoSeCalculaOpen && (
            <div className="px-4 pb-4 pt-1">
              <ul className="text-xs text-gray-500 space-y-2">
                <li>
                  <span className="font-medium text-gray-600">
                    Inversion Inicial:
                  </span>{" "}
                  Desembolso del primer ano: costo de las plantas + agua del ano
                  1.
                </li>
                <li>
                  <span className="font-medium text-gray-600">
                    ROI Feria (venta directa):
                  </span>{" "}
                  Retorno si vendes en feria local o directo al consumidor.
                  Precio = mayorista ODEPA x factor feria. Es el escenario
                  realista para agricultores que venden sin intermediario.
                </li>
                <li>
                  <span className="font-medium text-gray-600">
                    ROI Mayor. (intermediario):
                  </span>{" "}
                  Retorno si vendes a un acopiador o intermediario al precio
                  mayorista ODEPA. Es el escenario conservador (precio mas
                  bajo).
                </li>
                <li>
                  <span className="font-medium text-gray-600">
                    ROI 100% / 10a:
                  </span>{" "}
                  ROI 100% = duplicaste tu inversion. 10a se muestra para
                  frutales perennes (vida util &gt;5 anos), donde anos 6-10 ya
                  no amortizan plantas.
                </li>
                <li>
                  <span className="font-medium text-gray-600">Recupera:</span>{" "}
                  Mes en que recuperas la inversion. Verde &le;36m, amarillo
                  &le;60m, naranjo &le;120m.
                </li>
                <li>
                  <span className="font-medium text-gray-600">Agua max:</span>{" "}
                  Precio maximo del agua (CLP/m3) donde el cultivo sigue siendo
                  rentable en 5 anos. Si tu costo real es mayor, el cultivo
                  pierde plata.
                </li>
                <li>
                  <span className="font-medium text-gray-600">
                    Costo real agua:
                  </span>{" "}
                  Incluye precio del proveedor + transporte por m3. Un aljibe de
                  10m3 baja el costo vs bidones de 1.5m3.
                </li>
                <li>
                  <span className="font-medium text-gray-600">Cosecha:</span>{" "}
                  Meses desde que plantas hasta la primera cosecha. Cultivos con
                  cosecha &gt;24m tienen 0 ingresos los primeros anos.
                </li>
                <li>
                  <span className="font-medium text-gray-600">
                    Kr (coef. cobertura):
                  </span>{" "}
                  Plantas jovenes consumen menos agua. Ano 1: 15%, ano 2: 40%,
                  anos 3-4: 70%, ano 5+: 100% del consumo adulto (FAO/INIA).
                  Reduce el costo de agua en los primeros anos.
                </li>
                <li>
                  <span className="font-medium text-gray-600">
                    FL (fraccion de lavado):
                  </span>{" "}
                  Agua extra para lavar sales del suelo. Cultivos tolerantes
                  +2%, medios +4%, sensibles +7.5%. Basado en la tolerancia a
                  salinidad del cultivo.
                </li>
                <li>
                  <span className="font-medium text-gray-600">Viabilidad:</span>{" "}
                  Con agua cara (&gt;$2.000/m3): Viable = break-even agua 50%
                  sobre tu costo, Riesgo = break-even cerca del limite, Inviable
                  = no cubre el costo del agua.
                </li>
              </ul>
            </div>
          )}
        </div>
      </main>
    </PageLayout>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
}
