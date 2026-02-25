"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useTerrainData } from "@/hooks/use-terrain-data";
import { obtenerCostoAguaPromedio } from "@/lib/utils/roi";
import {
  compararCultivos,
  type EscenarioCultivo,
} from "@/lib/utils/comparador-cultivos";
import {
  TablaComparativa,
  GraficoRoiComparativo,
  RecomendacionEscenario,
} from "@/components/escenarios/tabla-comparativa";
import { filtrarEstanques } from "@/lib/utils/helpers-cultivo";
import { TIPO_ZONA } from "@/lib/constants/entities";
import type { CatalogoCultivo } from "@/types";

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
      const zonaCultivo = zonas.find((zona) => zona.tipo === TIPO_ZONA.CULTIVO);
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

    const estanques = filtrarEstanques(zonas);
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

  const zonasCultivo = zonas.filter((z) => z.tipo === TIPO_ZONA.CULTIVO);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-indigo-600 text-white px-4 py-3 flex items-center gap-4">
        <Link href="/" className="p-1 hover:bg-indigo-700 rounded">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold">Escenarios Comparativos</h1>
      </header>

      <main className="p-4 space-y-4 max-w-4xl mx-auto">
        <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-lg">
          <p className="text-sm text-indigo-800">
            Compara hasta <strong>3 cultivos</strong> lado a lado para una zona.
            Evalua ROI, costos, agua y compatibilidad con tu suelo.
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
                  {z.nombre} ({z.area_m2} m2)
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
            <TablaComparativa escenarios={escenarios} />
            <GraficoRoiComparativo escenarios={escenarios} />
            <RecomendacionEscenario escenarios={escenarios} />
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
