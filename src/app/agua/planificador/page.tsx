"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTerrainData } from "@/hooks/use-terrain-data";
import { useEstanques } from "@/hooks/use-estanques";
import { useAgua } from "@/hooks/use-agua";
import { RecomendacionPanel } from "@/components/recomendacion/recomendacion-panel";
import {
  generarProyeccionAnual,
  type ProyeccionAnual,
  type EventoFuturo,
} from "@/lib/utils/agua-proyeccion-anual";
import { calcularROI, obtenerCostoAguaPromedio } from "@/lib/utils/roi";
import { calcularConsumoZona } from "@/lib/utils/agua";
import { format } from "date-fns";
import { es } from "date-fns/locale";

function formatCLP(n: number): string {
  return "$" + Math.round(n).toLocaleString("es-CL");
}

const EVENTO_ICONS: Record<EventoFuturo["tipo"], string> = {
  recarga: "💧",
  replanta: "🌱",
  lavado: "🧼",
  cosecha: "🍅",
};

const EVENTO_COLORS: Record<EventoFuturo["tipo"], string> = {
  recarga: "bg-cyan-100 text-cyan-800",
  replanta: "bg-green-100 text-green-800",
  lavado: "bg-yellow-100 text-yellow-800",
  cosecha: "bg-orange-100 text-orange-800",
};

export default function PlanificadorAguaPage() {
  const { terreno, zonas, plantas, catalogoCultivos, loading, refetch } =
    useTerrainData();
  const [tabActiva, setTabActiva] = useState<
    "viabilidad" | "proyeccion" | "economia"
  >("viabilidad");

  const { estanques } = useEstanques(zonas, refetch);
  const { entradas } = useAgua(
    terreno,
    zonas,
    plantas,
    catalogoCultivos,
    refetch,
  );

  const proyeccion = useMemo<ProyeccionAnual | null>(() => {
    if (!terreno) return null;
    return generarProyeccionAnual(terreno, zonas, plantas, catalogoCultivos);
  }, [terreno, zonas, plantas, catalogoCultivos]);

  const economiaAnual = useMemo(() => {
    if (!terreno) return null;

    const costoAguaM3 = obtenerCostoAguaPromedio(estanques, terreno);

    let ingresoTotal = 0;
    let inversionTotal = 0;

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
          terreno?.suelo ?? null,
        );
        ingresoTotal += roi.ingreso_año2;
        inversionTotal += roi.inversion_total;
      }
    }

    return {
      ingresoAnual: ingresoTotal,
      inversionTotal,
      costosAgua: proyeccion?.resumen.costosAgua || 0,
      neto: ingresoTotal - (proyeccion?.resumen.costosAgua || 0),
      roi:
        inversionTotal > 0
          ? ((ingresoTotal - inversionTotal) / inversionTotal) * 100
          : 0,
    };
  }, [terreno, zonas, plantas, catalogoCultivos, estanques, proyeccion]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  if (!terreno) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-blue-600 text-white px-4 py-3 flex items-center gap-4">
          <Link href="/agua" className="p-1 hover:bg-blue-700 rounded">
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
          <h1 className="text-xl font-bold">Planificador de Agua</h1>
        </header>
        <main className="p-4">
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
            <p className="text-yellow-800">No hay terrenos creados.</p>
          </div>
        </main>
      </div>
    );
  }

  const areaHa = terreno.area_m2 / 10000;
  const maxNivel = proyeccion
    ? Math.max(
        ...proyeccion.meses.map((m) =>
          Math.max(m.nivelInicio, m.nivelFin, m.recargas),
        ),
      )
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/agua" className="p-1 hover:bg-blue-700 rounded">
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
          <h1 className="text-xl font-bold">🧪 Planificador (12 meses)</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/economia"
            className="text-sm bg-emerald-600 px-3 py-1 rounded hover:bg-emerald-700"
          >
            💰 Economía
          </Link>
          <Link
            href="/agua"
            className="text-sm bg-cyan-600 px-3 py-1 rounded hover:bg-cyan-700"
          >
            💧 Gestión
          </Link>
        </div>
      </header>

      <main className="p-4 space-y-4 max-w-4xl mx-auto">
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
          <h2 className="text-lg font-bold text-blue-900 mb-2">
            🔮 Vista CEO: Proyección Anual
          </h2>
          <p className="text-sm text-blue-800">
            Simula y proyecta tu negocio agrícola a <strong>12 meses</strong>.
            Anticipa problemas de agua, planifica recargas y calcula la
            economía.
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { id: "viabilidad", label: "🌱 Viabilidad Cultivos" },
            { id: "proyeccion", label: "📊 Proyección Agua" },
            { id: "economia", label: "💰 Economía Anual" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTabActiva(tab.id as typeof tabActiva)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                tabActiva === tab.id
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {tabActiva === "viabilidad" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <RecomendacionPanel
              terreno={terreno}
              estanques={estanques}
              entradasAgua={entradas}
              zonas={zonas}
              plantas={plantas}
              catalogoCultivos={catalogoCultivos}
              areaHa={areaHa}
            />
          </div>
        )}

        {tabActiva === "proyeccion" && proyeccion && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Nivel de Agua (12 meses)
              </h3>

              <div className="h-48 flex items-end gap-1">
                {proyeccion.meses.map((mes, i) => {
                  const alturaFin =
                    maxNivel > 0 ? (mes.nivelFin / maxNivel) * 100 : 0;
                  const deficit = mes.diasDeficit > 0;

                  return (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <div className="w-full h-40 flex flex-col justify-end relative">
                        <div
                          className={`w-full rounded-t transition-all ${
                            deficit ? "bg-red-400" : "bg-cyan-400"
                          }`}
                          style={{ height: `${Math.max(alturaFin, 2)}%` }}
                          title={`${mes.mesNombre}: ${mes.nivelFin.toFixed(1)} m³`}
                        />
                        {deficit && (
                          <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-xs text-red-600">
                            ⚠️
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 truncate w-full text-center">
                        {mes.mesNombre.slice(0, 3)}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="bg-cyan-50 p-3 rounded">
                  <div className="text-xs text-cyan-600">Consumo anual</div>
                  <div className="font-bold text-cyan-800">
                    {proyeccion.resumen.consumoTotalAnual.toFixed(1)} m³
                  </div>
                </div>
                <div className="bg-blue-50 p-3 rounded">
                  <div className="text-xs text-blue-600">Recargas totales</div>
                  <div className="font-bold text-blue-800">
                    {proyeccion.resumen.recargasTotales.toFixed(1)} m³
                  </div>
                </div>
                <div
                  className={`p-3 rounded ${proyeccion.resumen.mesesDeficit > 0 ? "bg-red-50" : "bg-green-50"}`}
                >
                  <div
                    className={`text-xs ${proyeccion.resumen.mesesDeficit > 0 ? "text-red-600" : "text-green-600"}`}
                  >
                    Meses déficit
                  </div>
                  <div
                    className={`font-bold ${proyeccion.resumen.mesesDeficit > 0 ? "text-red-800" : "text-green-800"}`}
                  >
                    {proyeccion.resumen.mesesDeficit}
                  </div>
                </div>
                <div className="bg-purple-50 p-3 rounded">
                  <div className="text-xs text-purple-600">Costo agua</div>
                  <div className="font-bold text-purple-800">
                    {formatCLP(proyeccion.resumen.costosAgua)}
                  </div>
                </div>
              </div>

              {!estanques.some((e) => e.estanque_config?.recarga) && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 p-3 rounded text-sm text-yellow-800">
                  ⚠️ No tienes configurada la recarga.{" "}
                  <Link href="/agua" className="underline font-medium">
                    Configúrala aquí
                  </Link>{" "}
                  para proyectar mejor.
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                📅 Calendario de Eventos
              </h3>

              {proyeccion.eventos.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No hay eventos programados
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {proyeccion.eventos.slice(0, 20).map((evento, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 p-2 rounded ${EVENTO_COLORS[evento.tipo]}`}
                    >
                      <span className="text-lg">
                        {EVENTO_ICONS[evento.tipo]}
                      </span>
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {evento.titulo}
                        </div>
                        <div className="text-xs opacity-75">
                          {evento.descripcion}
                        </div>
                      </div>
                      <div className="text-xs font-medium">
                        {format(evento.fecha, "d MMM", { locale: es })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tabActiva === "economia" && economiaAnual && (
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Economía Anual Proyectada
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-green-700">
                  {formatCLP(economiaAnual.ingresoAnual)}
                </div>
                <div className="text-sm text-green-600">Ingresos año 2</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-blue-700">
                  {formatCLP(economiaAnual.inversionTotal)}
                </div>
                <div className="text-sm text-blue-600">Inversión total</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-purple-700">
                  {formatCLP(economiaAnual.costosAgua)}
                </div>
                <div className="text-sm text-purple-600">Costos agua/año</div>
              </div>
              <div
                className={`p-4 rounded-lg text-center ${economiaAnual.neto > 0 ? "bg-emerald-50" : "bg-red-50"}`}
              >
                <div
                  className={`text-3xl font-bold ${economiaAnual.neto > 0 ? "text-emerald-700" : "text-red-700"}`}
                >
                  {formatCLP(economiaAnual.neto)}
                </div>
                <div
                  className={`text-sm ${economiaAnual.neto > 0 ? "text-emerald-600" : "text-red-600"}`}
                >
                  Neto anual
                </div>
              </div>
            </div>

            <div
              className={`p-4 rounded-lg text-center ${economiaAnual.roi > 50 ? "bg-green-100" : economiaAnual.roi > 0 ? "bg-yellow-100" : "bg-red-100"}`}
            >
              <div
                className={`text-4xl font-bold ${economiaAnual.roi > 50 ? "text-green-800" : economiaAnual.roi > 0 ? "text-yellow-800" : "text-red-800"}`}
              >
                {Math.round(economiaAnual.roi)}%
              </div>
              <div
                className={`text-sm ${economiaAnual.roi > 50 ? "text-green-700" : economiaAnual.roi > 0 ? "text-yellow-700" : "text-red-700"}`}
              >
                ROI Proyectado
              </div>
            </div>

            {plantas.length === 0 && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 p-3 rounded text-sm text-yellow-800">
                No hay plantas. Agrega cultivos desde el mapa para ver
                proyecciones económicas.
              </div>
            )}
          </div>
        )}

        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          <h3 className="text-sm font-bold text-green-900 mb-2">
            📋 Siguiente Paso
          </h3>
          <p className="text-xs text-green-800 mb-3">
            Una vez que hayas identificado cultivos viables, usa el{" "}
            <strong>mapa interactivo</strong> para plantar.
          </p>
          <Link
            href="/"
            className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm font-medium"
          >
            Ir al Mapa →
          </Link>
        </div>
      </main>
    </div>
  );
}
