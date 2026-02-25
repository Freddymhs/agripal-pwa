"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useTerrainData } from "@/hooks/use-terrain-data";
import { ESTADO_PLANTA, TIPO_ZONA } from "@/lib/constants/entities";
import { filtrarEstanques } from "@/lib/utils/helpers-cultivo";
import { calcularROI, obtenerCostoAguaPromedio } from "@/lib/utils/roi";
import {
  calcularMetricasEconomicas,
  type MetricasEconomicas,
} from "@/lib/utils/economia-avanzada";
import { calcularConsumoZona } from "@/lib/utils/agua";
import { MetricasGlobales } from "@/components/economia/metricas-globales";
import { TarjetaCultivoAvanzado } from "@/components/economia/tarjeta-cultivo-avanzado";

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

    const estanques = filtrarEstanques(zonas);
    const costoAguaM3 = obtenerCostoAguaPromedio(estanques, terreno);
    const suelo = terreno.suelo ?? null;
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
        const consumoCultivo = calcularConsumoZona(zona, plantasCultivo, catalogoCultivos);
        const roi = calcularROI(cultivo, zona, count, costoAguaM3, consumoCultivo, suelo);
        const metricas = calcularMetricasEconomicas(roi, cultivo, roi.kg_año3);

        items.push({ cultivoNombre: cultivo.nombre, zonaNombre: zona.nombre, metricas });
      }
    }

    return items;
  }, [terreno, zonas, plantas, catalogoCultivos]);

  const global = useMemo(() => {
    if (resumen.length === 0) return null;
    const totalKg = resumen.reduce((s, r) => s + r.metricas.kgProducidosAño, 0);
    const avgCostoKg =
      totalKg > 0
        ? resumen.reduce((s, r) => s + r.metricas.costoProduccionKg * r.metricas.kgProducidosAño, 0) / totalKg
        : 0;
    const avgMargen =
      resumen.reduce((s, r) => s + r.metricas.margenContribucion, 0) / resumen.length;
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
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold">Economia Avanzada</h1>
        </div>
      </header>

      <main className="p-4 space-y-4 max-w-4xl mx-auto">
        {global && <MetricasGlobales {...global} />}

        {resumen.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <p className="text-yellow-800">
              No hay cultivos activos. Planta cultivos desde el mapa para ver metricas avanzadas.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {resumen.map((r, i) => (
              <TarjetaCultivoAvanzado key={i} {...r} />
            ))}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm">
          <h3 className="font-bold text-blue-900 mb-2">Como se calcula</h3>
          <ul className="text-blue-800 space-y-1 text-xs">
            <li><strong>Costo/kg:</strong> Costos operacion anuales / kg producidos ano 3</li>
            <li><strong>Punto equilibrio:</strong> Costos / (Precio venta - Costo variable)</li>
            <li><strong>Margen contribucion:</strong> (Precio - Costo variable) / Precio x 100</li>
            <li><strong>Recuperacion:</strong> Inversion total / Ingreso neto mensual</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
