"use client";

import { useMemo, useState } from "react";
import { useProjectContext } from "@/contexts/project-context";
import { PageLayout } from "@/components/layout/page-layout";
import { ESTADO_PLANTA, TIPO_ZONA } from "@/lib/constants/entities";
import { filtrarEstanques } from "@/lib/utils/helpers-cultivo";
import { calcularROI, obtenerCostoAguaPromedio } from "@/lib/utils/roi";
import {
  calcularMetricasEconomicas,
  type MetricasEconomicas,
} from "@/lib/utils/economia-avanzada";
import { calcularConsumoZona } from "@/lib/utils/agua";
import { formatCLP } from "@/lib/utils";
import { MetricasGlobales } from "@/components/economia/metricas-globales";
import { TarjetaCultivoAvanzado } from "@/components/economia/tarjeta-cultivo-avanzado";
import { ConfianzaPrecioBadge } from "@/components/economia/confianza-precio-badge";
import type { ResumenPrecioHistorico } from "@/types";
import type { PrecioMayorista } from "@/lib/data/tipos-mercado";

interface ResumenAvanzado {
  cultivoId: string;
  cultivoBaseId: string | undefined;
  cultivoNombre: string;
  zonaNombre: string;
  metricas: MetricasEconomicas;
}

export default function EconomiaAvanzadaPage() {
  const [simuladorOpen, setSimuladorOpen] = useState(false);
  const [precioAguaSimulado, setPrecioAguaSimulado] = useState<number | null>(
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
  const usandoSimulador = precioAguaSimulado !== null;

  const preciosMap = useMemo(() => {
    const map = new Map<string, PrecioMayorista>();
    for (const p of datosBaseHook.datosBase.precios) {
      map.set(p.cultivo_id, p);
    }
    return map;
  }, [datosBaseHook.datosBase.precios]);

  const resumenHistMap = useMemo(() => {
    const map = new Map<string, ResumenPrecioHistorico>();
    for (const r of datosBaseHook.datosBase.resumenHistoricos) {
      map.set(r.nombre_odepa, r);
    }
    return map;
  }, [datosBaseHook.datosBase.resumenHistoricos]);

  const resumen = useMemo<ResumenAvanzado[]>(() => {
    if (!terreno || zonas.length === 0) return [];

    const suelo = proyectoActual?.suelo ?? null;
    const items: ResumenAvanzado[] = [];

    for (const zona of zonas.filter((z) => z.tipo === TIPO_ZONA.CULTIVO)) {
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
        const roi = calcularROI(
          cultivo,
          zona,
          count,
          costoAguaM3Efectivo,
          consumoCultivo,
          suelo,
        );
        const metricas = calcularMetricasEconomicas(roi, cultivo, roi.kg_año3);

        items.push({
          cultivoId,
          cultivoBaseId: cultivo.cultivo_base_id,
          cultivoNombre: cultivo.nombre,
          zonaNombre: zona.nombre,
          metricas,
        });
      }
    }

    return items;
  }, [
    terreno,
    zonas,
    plantas,
    catalogoCultivos,
    proyectoActual?.suelo,
    opcionesConsumoAgua,
    costoAguaM3Efectivo,
  ]);

  const global = useMemo(() => {
    if (resumen.length === 0) return null;
    const totalKg = resumen.reduce((s, r) => s + r.metricas.kgProducidosAño, 0);
    const avgCostoKg =
      totalKg > 0
        ? resumen.reduce(
            (s, r) =>
              s + r.metricas.costoProduccionKg * r.metricas.kgProducidosAño,
            0,
          ) / totalKg
        : 0;
    const avgMargen =
      resumen.reduce((s, r) => s + r.metricas.margenContribucion, 0) /
      resumen.length;
    const mejorRecuperacion =
      resumen
        .map((r) => r.metricas.tiempoRecuperacionMeses)
        .filter((v): v is number => v !== null)
        .sort((a, b) => a - b)[0] ?? null;

    return { avgCostoKg, avgMargen, mejorRecuperacion, totalKg };
  }, [resumen]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  return (
    <PageLayout headerColor="emerald" title="Economia Avanzada">
      <main className="p-4 space-y-4 max-w-4xl mx-auto">
        {costoAguaM3Efectivo === 0 && resumen.length > 0 && (
          <div className="p-3 rounded-lg text-sm bg-orange-50 text-orange-800 border border-orange-200">
            <strong>Costo del agua no configurado.</strong> Las metricas de
            costo/kg solo reflejan plantas amortizadas.{" "}
            <a href="/agua" className="underline font-medium">
              Configurar agua
            </a>{" "}
            o usa el simulador abajo.
          </div>
        )}

        {/* Simulador precio agua */}
        {resumen.length > 0 && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setSimuladorOpen(!simuladorOpen)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <span>Simular precio del agua</span>
                {usandoSimulador && (
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                    {formatCLP(precioAguaSimulado ?? 0)}/m3 activo
                  </span>
                )}
                {!usandoSimulador && costoAguaM3Real > 0 && (
                  <span className="text-xs text-gray-400">
                    Real: {formatCLP(costoAguaM3Real)}/m3
                  </span>
                )}
              </span>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${simuladorOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
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
                  {usandoSimulador && (
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
        )}

        {global && <MetricasGlobales {...global} />}

        {resumen.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <p className="text-yellow-800">
              No hay cultivos activos. Planta cultivos desde el mapa para ver
              metricas avanzadas.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {resumen.map((r, i) => {
              const pm = preciosMap.get(r.cultivoBaseId ?? "");
              const hist = pm?.nombre_odepa
                ? resumenHistMap.get(pm.nombre_odepa)
                : undefined;
              return (
                <TarjetaCultivoAvanzado
                  key={i}
                  cultivoNombre={r.cultivoNombre}
                  zonaNombre={r.zonaNombre}
                  metricas={r.metricas}
                  confianzaBadge={
                    <ConfianzaPrecioBadge
                      nombreOdepa={pm?.nombre_odepa}
                      resumen={hist}
                    />
                  }
                />
              );
            })}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm">
          <h3 className="font-bold text-blue-900 mb-2">Como se calcula</h3>
          <ul className="text-blue-800 space-y-1 text-xs">
            <li>
              <strong>Costo/kg:</strong> (Agua anual + Plantas amortizadas a 5
              años) / kg producidos año 3
            </li>
            <li>
              <strong>Punto equilibrio:</strong> Costos / (Precio venta - Costo
              variable)
            </li>
            <li>
              <strong>Margen contribucion:</strong> (Precio - Costo variable) /
              Precio x 100
            </li>
            <li>
              <strong>Recuperacion:</strong> Inversion total / Ingreso neto
              mensual
            </li>
          </ul>
        </div>
      </main>
    </PageLayout>
  );
}
