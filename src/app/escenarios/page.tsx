"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useTerrainData } from "@/hooks/use-terrain-data";
import { obtenerCostoAguaPromedio } from "@/lib/utils/roi";
import {
  compararCultivos,
  type EscenarioCultivo,
} from "@/lib/utils/comparador-cultivos";
import type { Zona, CatalogoCultivo } from "@/types";

function formatCLP(n: number): string {
  return "$" + Math.round(n).toLocaleString("es-CL");
}

const COLORES_LINEA = ["text-blue-600", "text-green-600", "text-purple-600"];
const COLORES_BG = ["bg-blue-50", "bg-green-50", "bg-purple-50"];

export default function EscenariosPage() {
  const { terreno, zonas, catalogoCultivos, loading } = useTerrainData({
    skipPlants: true,
  });
  const [zonaId, setZonaId] = useState<string>("");
  const [seleccion, setSeleccion] = useState<string[]>([]);

  useEffect(() => {
    if (zonas.length > 0) {
      const zonaCultivo = zonas.find((zona) => zona.tipo === "cultivo");
      if (zonaCultivo) setZonaId(zonaCultivo.id);
      if (catalogoCultivos.length >= 2)
        setSeleccion([catalogoCultivos[0].id, catalogoCultivos[1].id]);
      else if (catalogoCultivos.length === 1)
        setSeleccion([catalogoCultivos[0].id]);
    }
  }, [zonas, catalogoCultivos]);

  const zonaSeleccionada = zonas.find((z) => z.id === zonaId) ?? null;

  const escenarios = useMemo<EscenarioCultivo[]>(() => {
    if (!zonaSeleccionada || !terreno || seleccion.length === 0) return [];
    const cultivosSelec = seleccion
      .map((id) => catalogoCultivos.find((c) => c.id === id))
      .filter((c): c is CatalogoCultivo => c != null);

    const estanques = zonas.filter(
      (z) => z.tipo === "estanque" && z.estanque_config,
    );
    const costoAguaM3 = obtenerCostoAguaPromedio(estanques, terreno);

    return compararCultivos(
      cultivosSelec,
      zonaSeleccionada,
      terreno.suelo ?? null,
      costoAguaM3,
    );
  }, [zonaSeleccionada, terreno, seleccion, catalogoCultivos, zonas]);

  const toggleCultivo = (id: string) => {
    setSeleccion((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  const zonasCultivo = zonas.filter((z) => z.tipo === "cultivo");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-indigo-600 text-white px-4 py-3 flex items-center gap-4">
        <Link href="/" className="p-1 hover:bg-indigo-700 rounded">
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
        <h1 className="text-xl font-bold">Escenarios Comparativos</h1>
      </header>

      <main className="p-4 space-y-4 max-w-4xl mx-auto">
        <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-lg">
          <p className="text-sm text-indigo-800">
            Compara hasta <strong>3 cultivos</strong> lado a lado para una zona.
            Evalúa ROI, costos, agua y compatibilidad con tu suelo.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Zona a evaluar
            </label>
            <select
              value={zonaId}
              onChange={(e) => setZonaId(e.target.value)}
              className="w-full px-3 py-2 border rounded text-gray-900"
            >
              <option value="">Seleccionar zona...</option>
              {zonasCultivo.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.nombre} ({z.area_m2} m²)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cultivos a comparar ({seleccion.length}/3)
            </label>
            <div className="flex flex-wrap gap-2">
              {catalogoCultivos.map((c) => {
                const idx = seleccion.indexOf(c.id);
                const selected = idx >= 0;
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleCultivo(c.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selected
                        ? `${COLORES_BG[idx]} ${COLORES_LINEA[idx]} ring-2 ring-current`
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {c.nombre}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {escenarios.length >= 2 && (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 font-medium text-gray-700">
                        Métrica
                      </th>
                      {escenarios.map((e, i) => (
                        <th
                          key={e.cultivo.id}
                          className={`text-right p-3 font-medium ${COLORES_LINEA[i]}`}
                        >
                          {e.cultivo.nombre}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="p-3 text-gray-600">ROI 4 años</td>
                      {escenarios.map((e, i) => (
                        <td
                          key={i}
                          className={`p-3 text-right font-bold ${e.roi.viable ? "text-green-700" : "text-red-700"}`}
                        >
                          {e.roi.roi_4_años_pct}%
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 text-gray-600">Inversión</td>
                      {escenarios.map((e, i) => (
                        <td key={i} className="p-3 text-right text-gray-900">
                          {formatCLP(e.roi.inversion_total)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 text-gray-600">Ingreso Año 3</td>
                      {escenarios.map((e, i) => (
                        <td
                          key={i}
                          className="p-3 text-right text-green-700 font-medium"
                        >
                          {formatCLP(e.roi.ingreso_año3)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 text-gray-600">Costo/kg</td>
                      {escenarios.map((e, i) => (
                        <td key={i} className="p-3 text-right text-gray-900">
                          {formatCLP(e.metricas.costoProduccionKg)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 text-gray-600">Margen</td>
                      {escenarios.map((e, i) => (
                        <td
                          key={i}
                          className={`p-3 text-right font-medium ${
                            e.metricas.margenContribucion > 40
                              ? "text-green-700"
                              : e.metricas.margenContribucion > 20
                                ? "text-yellow-700"
                                : "text-red-700"
                          }`}
                        >
                          {Math.round(e.metricas.margenContribucion)}%
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 text-gray-600">Agua anual</td>
                      {escenarios.map((e, i) => (
                        <td key={i} className="p-3 text-right text-cyan-700">
                          {e.consumoAguaAnualM3.toFixed(1)} m³
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 text-gray-600">Factor suelo</td>
                      {escenarios.map((e, i) => (
                        <td
                          key={i}
                          className={`p-3 text-right font-medium ${
                            e.factorSuelo > 0.8
                              ? "text-green-700"
                              : e.factorSuelo > 0.5
                                ? "text-yellow-700"
                                : "text-red-700"
                          }`}
                        >
                          {Math.round(e.factorSuelo * 100)}%
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 text-gray-600">Equilibrio</td>
                      {escenarios.map((e, i) => (
                        <td key={i} className="p-3 text-right text-gray-900">
                          {e.roi.punto_equilibrio_meses != null
                            ? `${e.roi.punto_equilibrio_meses} meses`
                            : "N/A"}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 text-gray-600">Plantas</td>
                      {escenarios.map((e, i) => (
                        <td key={i} className="p-3 text-right text-gray-900">
                          {e.roi.num_plantas}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold text-gray-900 mb-3">
                ROI Comparativo (Año 2 → 4)
              </h3>
              <div className="space-y-3">
                {escenarios.map((e, i) => {
                  const maxIngreso = Math.max(
                    ...escenarios.map((x) => x.roi.ingreso_año4),
                  );
                  return (
                    <div key={e.cultivo.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className={`font-medium ${COLORES_LINEA[i]}`}>
                          {e.cultivo.nombre}
                        </span>
                        <span className="text-gray-600">
                          {formatCLP(e.roi.ingreso_acumulado_4años)}
                        </span>
                      </div>
                      <div className="flex gap-1 h-6">
                        {[
                          e.roi.ingreso_año2,
                          e.roi.ingreso_año3,
                          e.roi.ingreso_año4,
                        ].map((ingreso, j) => (
                          <div
                            key={j}
                            className={`rounded ${COLORES_BG[i]} flex items-center justify-center text-xs ${COLORES_LINEA[i]}`}
                            style={{
                              width: `${maxIngreso > 0 ? (ingreso / maxIngreso) * 100 : 0}%`,
                              minWidth: "20px",
                            }}
                          >
                            A{j + 2}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {(() => {
              const mejor = [...escenarios].sort(
                (a, b) => b.roi.roi_4_años_pct - a.roi.roi_4_años_pct,
              )[0];
              return (
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <h3 className="font-bold text-green-900 mb-1">
                    Recomendación
                  </h3>
                  <p className="text-sm text-green-800">
                    <strong>{mejor.cultivo.nombre}</strong> tiene el mejor ROI (
                    {mejor.roi.roi_4_años_pct}%) con margen de contribución del{" "}
                    {Math.round(mejor.metricas.margenContribucion)}% y factor de
                    compatibilidad con suelo del{" "}
                    {Math.round(mejor.factorSuelo * 100)}%.
                  </p>
                </div>
              );
            })()}
          </>
        )}

        {escenarios.length < 2 && seleccion.length < 2 && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <p className="text-yellow-800 text-sm">
              Selecciona al menos 2 cultivos y una zona para comparar.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
