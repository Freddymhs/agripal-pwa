"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useProjectContext } from "@/contexts/project-context";
import { PageLayout } from "@/components/layout/page-layout";
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
  {
    id: "viabilidad" as const,
    label: "¿Qué plantar?",
    sub: "Cultivos viables",
  },
  {
    id: "proyeccion" as const,
    label: "¿Alcanza 12 meses?",
    sub: "Proyección agua",
  },
  { id: "economia" as const, label: "¿Es rentable?", sub: "Economía anual" },
];

import { ROUTES } from "@/lib/constants/routes";

interface Prerequisito {
  cumplido: boolean;
  label: string;
  accion?: { label: string; href: string };
}

function PrerequisitosBloque({ items }: { items: Prerequisito[] }) {
  const incumplidos = items.filter((p) => !p.cumplido);
  if (incumplidos.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
      <div className="text-sm font-semibold text-amber-900">
        Para usar esta sección necesitas:
      </div>
      {incumplidos.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-amber-800">
            <span className="text-amber-500">○</span>
            {p.label}
          </div>
          {p.accion && (
            <Link
              href={p.accion.href}
              className="shrink-0 text-xs bg-amber-600 text-white px-2.5 py-1 rounded hover:bg-amber-700"
            >
              {p.accion.label}
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}

export default function PlanificadorAguaPage() {
  const {
    terrenoActual: terreno,
    proyectoActual,
    zonas,
    plantas,
    catalogoCultivos,
    loading,
    cargarDatosTerreno: refetch,
    estanquesHook: { estanques },
    opcionesConsumoAgua,
  } = useProjectContext();
  const [tabActiva, setTabActiva] = useState<TabActiva>("viabilidad");

  const { entradas } = useAgua(
    terreno,
    zonas,
    plantas,
    catalogoCultivos,
    refetch,
    opcionesConsumoAgua,
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
              undefined,
              opcionesConsumoAgua,
            );
            const roi = calcularROI(
              cultivo,
              zona,
              count,
              costoAguaM3,
              consumoCultivo,
              proyectoActual?.suelo ?? null,
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
  }, [
    terreno,
    zonas,
    plantas,
    catalogoCultivos,
    estanques,
    proyeccion,
    proyectoActual?.suelo,
    opcionesConsumoAgua,
  ]);

  const tieneEstanques = estanques.length > 0;
  const tieneRecarga = estanques.some((e) => e.estanque_config?.recarga);
  const tienePlantas = plantas.some((p) => p.estado !== ESTADO_PLANTA.MUERTA);
  const tieneZonasCultivo = zonas.some((z) => z.tipo === TIPO_ZONA.CULTIVO);
  const tieneSuelo = !!proyectoActual?.suelo;
  const proveedores = terreno?.agua_avanzada?.proveedores ?? [];
  const tieneCostoAgua =
    proveedores.some((p) => !!p.precio_m3_clp) ||
    estanques.some((e) => !!e.estanque_config?.recarga?.costo_transporte_clp);

  const prerequisitosViabilidad: Prerequisito[] = [
    {
      cumplido: tieneEstanques,
      label: "Al menos un estanque configurado",
      accion: { label: "Ir al mapa", href: ROUTES.HOME },
    },
    {
      cumplido: tieneZonasCultivo,
      label: "Al menos una zona de cultivo en el mapa",
      accion: { label: "Ir al mapa", href: ROUTES.HOME },
    },
    {
      cumplido: tieneSuelo,
      label: "Análisis de suelo registrado (mejora precisión)",
      accion: { label: "Registrar suelo", href: ROUTES.TERRENOS_SUELO },
    },
  ];

  const prerequisitosProyeccion: Prerequisito[] = [
    {
      cumplido: tieneEstanques,
      label: "Al menos un estanque configurado",
      accion: { label: "Ir al mapa", href: ROUTES.HOME },
    },
    {
      cumplido: tieneRecarga,
      label: "Frecuencia e importe de recarga configurados",
      accion: { label: "Configurar recarga", href: ROUTES.AGUA },
    },
    {
      cumplido: tienePlantas,
      label: "Plantas registradas en el mapa (define el consumo)",
      accion: { label: "Ir al mapa", href: ROUTES.HOME },
    },
  ];

  const prerequisitosEconomia: Prerequisito[] = [
    {
      cumplido: tienePlantas,
      label: "Plantas registradas en zonas de cultivo",
      accion: { label: "Ir al mapa", href: ROUTES.HOME },
    },
    {
      cumplido: tieneCostoAgua,
      label: "Costo del agua configurado (CLP/m³)",
      accion: { label: "Configurar costo", href: ROUTES.AGUA },
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  if (!terreno) {
    return (
      <PageLayout headerColor="blue" title="Planificador de Agua">
        <main className="p-4">
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
            <p className="text-yellow-800">No hay terrenos creados.</p>
          </div>
        </main>
      </PageLayout>
    );
  }

  const areaHa = terreno.area_m2 / M2_POR_HECTAREA;

  const headerActions = (
    <>
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
    </>
  );

  return (
    <PageLayout
      headerColor="blue"
      title="Planificador (12 meses)"
      headerActions={headerActions}
    >
      <main className="p-4 space-y-4 max-w-4xl mx-auto">
        {/* Snapshot de métricas clave */}
        {economiaAnual && proyeccion && (
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 text-center">
              <div className="text-[10px] text-gray-400 uppercase tracking-wide">
                Ingresos año 2
              </div>
              <div className="text-base font-bold text-emerald-700">
                {economiaAnual.ingresoAnual > 0
                  ? new Intl.NumberFormat("es-CL", {
                      style: "currency",
                      currency: "CLP",
                      maximumFractionDigits: 0,
                    }).format(economiaAnual.ingresoAnual)
                  : "—"}
              </div>
            </div>
            <div
              className={`rounded-xl border shadow-sm p-3 text-center ${proyeccion.resumen.mesesDeficit > 0 ? "bg-red-50 border-red-200" : "bg-cyan-50 border-cyan-100"}`}
            >
              <div className="text-[10px] text-gray-400 uppercase tracking-wide">
                Meses déficit
              </div>
              <div
                className={`text-base font-bold ${proyeccion.resumen.mesesDeficit > 0 ? "text-red-700" : "text-cyan-700"}`}
              >
                {proyeccion.resumen.mesesDeficit === 0
                  ? "Ninguno"
                  : proyeccion.resumen.mesesDeficit}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 text-center">
              <div className="text-[10px] text-gray-400 uppercase tracking-wide">
                ROI año 2
              </div>
              <div
                className={`text-base font-bold ${economiaAnual.roi > 0 ? "text-emerald-700" : "text-red-600"}`}
              >
                {Math.round(economiaAnual.roi)}%
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTabActiva(tab.id)}
              className={`px-4 py-2.5 rounded-lg text-left whitespace-nowrap transition-colors ${
                tabActiva === tab.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <div className="text-sm font-semibold">{tab.label}</div>
              <div
                className={`text-[10px] ${tabActiva === tab.id ? "text-blue-200" : "text-gray-400"}`}
              >
                {tab.sub}
              </div>
            </button>
          ))}
        </div>

        {/* min-h evita layout shift al cambiar tabs con distinta altura de contenido */}
        <div className="min-h-[320px]">
          {tabActiva === "viabilidad" && (
            <>
              <PrerequisitosBloque items={prerequisitosViabilidad} />
              {tieneEstanques && tieneZonasCultivo && (
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
            </>
          )}

          {tabActiva === "proyeccion" && (
            <>
              <PrerequisitosBloque items={prerequisitosProyeccion} />
              {proyeccion &&
                prerequisitosProyeccion.every((p) => p.cumplido) && (
                  <PlanificadorProyeccionTab
                    proyeccion={proyeccion}
                    estanques={estanques}
                  />
                )}
            </>
          )}

          {tabActiva === "economia" && (
            <>
              <PrerequisitosBloque items={prerequisitosEconomia} />
              {economiaAnual &&
                prerequisitosEconomia.every((p) => p.cumplido) && (
                  <PlanificadorEconomiaTab
                    economiaAnual={economiaAnual}
                    plantas={plantas}
                  />
                )}
            </>
          )}
        </div>
      </main>
    </PageLayout>
  );
}
