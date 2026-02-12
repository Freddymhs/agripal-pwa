"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTerrainData } from "@/hooks/use-terrain-data";
import { calcularROI, obtenerCostoAguaPromedio } from "@/lib/utils/roi";
import {
  calcularMetricasEconomicas,
  type MetricasEconomicas,
} from "@/lib/utils/economia-avanzada";
import { calcularConsumoZona } from "@/lib/utils/agua";
import type { CatalogoCultivo } from "@/types";

function formatCLP(n: number): string {
  return "$" + Math.round(n).toLocaleString("es-CL");
}

interface ResumenAvanzado {
  cultivoNombre: string;
  zonaNombre: string;
  metricas: MetricasEconomicas;
}

export default function EconomiaAvanzadaPage() {
  const { terreno, zonas, plantas, catalogoCultivos, loading } =
    useTerrainData();

  const resumen = useMemo<ResumenAvanzado[]>(() => {
    if (!terreno || zonas.length === 0) return [];

    const estanques = zonas.filter(
      (z) => z.tipo === "estanque" && z.estanque_config,
    );
    const costoAguaM3 = obtenerCostoAguaPromedio(estanques, terreno);
    const suelo = terreno.suelo ?? null;

    const items: ResumenAvanzado[] = [];

    for (const zona of zonas.filter((z) => z.tipo === "cultivo")) {
      const plantasZona = plantas.filter(
        (p) => p.zona_id === zona.id && p.estado !== "muerta",
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
        );
        const roi = calcularROI(
          cultivo,
          zona,
          count,
          costoAguaM3,
          consumoCultivo,
          suelo,
        );
        const kgAño = roi.kg_año3;
        const metricas = calcularMetricasEconomicas(roi, cultivo, kgAño);

        items.push({
          cultivoNombre: cultivo.nombre,
          zonaNombre: zona.nombre,
          metricas,
        });
      }
    }

    return items;
  }, [terreno, zonas, plantas, catalogoCultivos]);

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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-emerald-600 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/economia" className="p-1 hover:bg-emerald-700 rounded">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <h1 className="text-xl font-bold">Economia Avanzada</h1>
        </div>
      </header>

      <main className="p-4 space-y-4 max-w-4xl mx-auto">
        {global && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-3xl font-bold text-blue-700">
                {formatCLP(global.avgCostoKg)}
              </div>
              <div className="text-xs text-blue-600 mt-1">
                Costo Promedio / kg
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-3xl font-bold text-purple-700">
                {Math.round(global.totalKg).toLocaleString("es-CL")} kg
              </div>
              <div className="text-xs text-purple-600 mt-1">
                Producción Anual (Año 3)
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div
                className={`text-3xl font-bold ${
                  global.avgMargen > 40
                    ? "text-green-700"
                    : global.avgMargen > 20
                      ? "text-yellow-700"
                      : "text-red-700"
                }`}
              >
                {Math.round(global.avgMargen)}%
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Margen Contribucion
              </div>
              <div
                className={`text-xs mt-1 px-2 py-0.5 rounded-full inline-block ${
                  global.avgMargen > 40
                    ? "bg-green-100 text-green-800"
                    : global.avgMargen > 20
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                }`}
              >
                {global.avgMargen > 40
                  ? "Saludable"
                  : global.avgMargen > 20
                    ? "Ajustado"
                    : "Riesgo"}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-3xl font-bold text-amber-700">
                {global.mejorRecuperacion != null
                  ? `${global.mejorRecuperacion}m`
                  : "-"}
              </div>
              <div className="text-xs text-amber-600 mt-1">
                Recuperacion Inversion
              </div>
            </div>
          </div>
        )}

        {resumen.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <p className="text-yellow-800">
              No hay cultivos activos. Planta cultivos desde el mapa para ver
              métricas avanzadas.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {resumen.map((r, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-900">{r.cultivoNombre}</h3>
                  <span className="text-sm text-gray-500">{r.zonaNombre}</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="bg-blue-50 p-3 rounded">
                    <div className="text-xs text-blue-600">Costo/kg</div>
                    <div className="font-bold text-blue-800">
                      {formatCLP(r.metricas.costoProduccionKg)}
                    </div>
                    <div className="text-xs text-blue-500">
                      vs venta {formatCLP(r.metricas.precioVentaKg)}
                    </div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded">
                    <div className="text-xs text-purple-600">
                      Punto Equilibrio
                    </div>
                    <div className="font-bold text-purple-800">
                      {r.metricas.puntoEquilibrioKg != null
                        ? `${Math.round(r.metricas.puntoEquilibrioKg).toLocaleString("es-CL")} kg`
                        : "No alcanzable"}
                    </div>
                    <div className="text-xs text-purple-500">
                      de{" "}
                      {Math.round(r.metricas.kgProducidosAño).toLocaleString(
                        "es-CL",
                      )}{" "}
                      kg/año
                    </div>
                  </div>
                  <div
                    className={`p-3 rounded ${
                      r.metricas.margenContribucion > 40
                        ? "bg-green-50"
                        : r.metricas.margenContribucion > 20
                          ? "bg-yellow-50"
                          : "bg-red-50"
                    }`}
                  >
                    <div className="text-xs text-gray-600">Margen</div>
                    <div
                      className={`font-bold ${
                        r.metricas.margenContribucion > 40
                          ? "text-green-800"
                          : r.metricas.margenContribucion > 20
                            ? "text-yellow-800"
                            : "text-red-800"
                      }`}
                    >
                      {Math.round(r.metricas.margenContribucion)}%
                    </div>
                  </div>
                  <div className="bg-amber-50 p-3 rounded">
                    <div className="text-xs text-amber-600">Recuperacion</div>
                    <div className="font-bold text-amber-800">
                      {r.metricas.tiempoRecuperacionMeses != null
                        ? `${r.metricas.tiempoRecuperacionMeses} meses`
                        : "N/A"}
                    </div>
                  </div>
                </div>

                {r.metricas.kgProducidosAño > 0 &&
                  r.metricas.puntoEquilibrioKg != null && (
                    <div className="mt-3">
                      <div className="text-xs text-gray-500 mb-1">
                        Break-even:{" "}
                        {Math.round(
                          (r.metricas.puntoEquilibrioKg /
                            r.metricas.kgProducidosAño) *
                            100,
                        )}
                        % de producción
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            r.metricas.puntoEquilibrioKg /
                              r.metricas.kgProducidosAño <
                            0.6
                              ? "bg-green-500"
                              : "bg-yellow-500"
                          }`}
                          style={{
                            width: `${Math.min(100, (r.metricas.puntoEquilibrioKg / r.metricas.kgProducidosAño) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm">
          <h3 className="font-bold text-blue-900 mb-2">Como se calcula</h3>
          <ul className="text-blue-800 space-y-1 text-xs">
            <li>
              <strong>Costo/kg:</strong> Costos operación anuales / kg
              producidos año 3
            </li>
            <li>
              <strong>Punto equilibrio:</strong> Costos / (Precio venta - Costo
              variable)
            </li>
            <li>
              <strong>Margen contribución:</strong> (Precio - Costo variable) /
              Precio x 100
            </li>
            <li>
              <strong>Recuperación:</strong> Inversión total / Ingreso neto
              mensual
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
