"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTerrainData } from "@/hooks/use-terrain-data";
import { useEstanques } from "@/hooks/use-estanques";
import { useAgua } from "@/hooks/use-agua";
import { RecomendacionPanel } from "@/components/recomendacion/recomendacion-panel";
import { PlanificadorProyeccionTab } from "@/components/agua/planificador-proyeccion-tab";
import { PlanificadorEconomiaTab } from "@/components/agua/planificador-economia-tab";
import {
  generarProyeccionAnual,
  type ProyeccionAnual,
} from "@/lib/utils/agua-proyeccion-anual";
import { calcularROI, obtenerCostoAguaPromedio } from "@/lib/utils/roi";
import { ESTADO_PLANTA, TIPO_ZONA } from "@/lib/constants/entities";
import { M2_POR_HECTAREA } from "@/lib/constants/conversiones";
import { calcularConsumoZona } from "@/lib/utils/agua";

type TabActiva = "viabilidad" | "proyeccion" | "economia";

const TABS = [
  { id: "viabilidad" as const, label: "Viabilidad Cultivos" },
  { id: "proyeccion" as const, label: "Proyeccion Agua" },
  { id: "economia" as const, label: "Economia Anual" },
];

import { ROUTES } from "@/lib/constants/routes";

export default function PlanificadorAguaPage() {
  const { terreno, zonas, plantas, catalogoCultivos, loading, refetch } =
    useTerrainData();
  const [tabActiva, setTabActiva] = useState<TabActiva>("viabilidad");

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
    const totals = zonas
      .filter((z) => z.tipo === TIPO_ZONA.CULTIVO)
      .reduce(
        (acc, zona) => {
          const plantasZona = plantas.filter(
            (p) => p.zona_id === zona.id && p.estado !== ESTADO_PLANTA.MUERTA,
          );
          if (plantasZona.length === 0) return acc;

          const cultivosPorTipo = plantasZona.reduce(
            (grouped, p) => {
              grouped[p.tipo_cultivo_id] =
                (grouped[p.tipo_cultivo_id] || 0) + 1;
              return grouped;
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
            acc.ingresoTotal += roi.ingreso_año2;
            acc.inversionTotal += roi.inversion_total;
          }
          return acc;
        },
        { ingresoTotal: 0, inversionTotal: 0 },
      );

    return {
      ingresoAnual: totals.ingresoTotal,
      inversionTotal: totals.inversionTotal,
      costosAgua: proyeccion?.resumen.costosAgua || 0,
      neto: totals.ingresoTotal - (proyeccion?.resumen.costosAgua || 0),
      roi:
        totals.inversionTotal > 0
          ? ((totals.ingresoTotal - totals.inversionTotal) /
              totals.inversionTotal) *
            100
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
          <Link href={ROUTES.AGUA} className="p-1 hover:bg-blue-700 rounded">
            <BackIcon />
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

  const areaHa = terreno.area_m2 / M2_POR_HECTAREA;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={ROUTES.AGUA} className="p-1 hover:bg-blue-700 rounded">
            <BackIcon />
          </Link>
          <h1 className="text-xl font-bold">Planificador (12 meses)</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={ROUTES.ECONOMIA}
            className="text-sm bg-emerald-600 px-3 py-1 rounded hover:bg-emerald-700"
          >
            Economia
          </Link>
          <Link
            href={ROUTES.AGUA}
            className="text-sm bg-cyan-600 px-3 py-1 rounded hover:bg-cyan-700"
          >
            Gestion
          </Link>
        </div>
      </header>

      <main className="p-4 space-y-4 max-w-4xl mx-auto">
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
          <h2 className="text-lg font-bold text-blue-900 mb-2">
            Vista CEO: Proyeccion Anual
          </h2>
          <p className="text-sm text-blue-800">
            Simula y proyecta tu negocio agricola a <strong>12 meses</strong>.
            Anticipa problemas de agua, planifica recargas y calcula la
            economia.
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTabActiva(tab.id)}
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
          <PlanificadorProyeccionTab
            proyeccion={proyeccion}
            estanques={estanques}
          />
        )}

        {tabActiva === "economia" && economiaAnual && (
          <PlanificadorEconomiaTab
            economiaAnual={economiaAnual}
            plantas={plantas}
          />
        )}

        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          <h3 className="text-sm font-bold text-green-900 mb-2">
            Siguiente Paso
          </h3>
          <p className="text-xs text-green-800 mb-3">
            Una vez que hayas identificado cultivos viables, usa el{" "}
            <strong>mapa interactivo</strong> para plantar.
          </p>
          <Link
            href={ROUTES.HOME}
            className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm font-medium"
          >
            Ir al Mapa
          </Link>
        </div>
      </main>
    </div>
  );
}

function BackIcon() {
  return (
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
  );
}
