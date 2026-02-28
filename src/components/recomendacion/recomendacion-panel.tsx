"use client";

import { useState, useMemo } from "react";
import { useRecomendacion } from "@/hooks/use-recomendacion";
import {
  RecomendacionViables,
  RecomendacionNoViables,
  RecomendacionPlan,
} from "@/components/recomendacion/recomendacion-tabs";
import { M2_POR_HECTAREA } from "@/lib/constants/conversiones";
import type {
  Terreno,
  CatalogoCultivo,
  Zona,
  EntradaAgua,
  Planta,
} from "@/types";

export interface RecomendacionPanelProps {
  terreno: Terreno;
  estanques: Zona[];
  entradasAgua: EntradaAgua[];
  zonas: Zona[];
  plantas: Planta[];
  catalogoCultivos: CatalogoCultivo[];
  areaHa?: number;
}

export function RecomendacionPanel({
  terreno,
  estanques,
  entradasAgua,
  zonas,
  plantas,
  catalogoCultivos,
  areaHa,
}: RecomendacionPanelProps) {
  const areaHaFinal = areaHa ?? terreno.area_m2 / M2_POR_HECTAREA;
  const {
    recomendacion,
    loading,
    error,
    calcularRecomendacion,
    seleccionados,
    toggleSeleccionar,
    calcularAguaSeleccionados,
  } = useRecomendacion();
  const [tabActivo, setTabActivo] = useState<"viables" | "noViables" | "plan">(
    "viables",
  );

  const aguaSeleccionados = calcularAguaSeleccionados();
  const aguaDisponible = recomendacion?.agua_disponible_anual_m3 ?? 0;
  const margenAgua = aguaDisponible - aguaSeleccionados.agua_anual;
  const porcentajeMargen =
    aguaDisponible > 0 ? (margenAgua / aguaDisponible) * 100 : 0;

  const estadoAgua = useMemo(() => {
    if (porcentajeMargen < 0)
      return {
        tipo: "critico",
        texto: "CRÍTICO - Agua insuficiente",
        color: "red",
      };
    if (porcentajeMargen < 10)
      return { tipo: "ajustado", texto: "Muy ajustado", color: "orange" };
    if (porcentajeMargen < 20)
      return { tipo: "moderado", texto: "Moderado", color: "amber" };
    return { tipo: "comodo", texto: "Cómodo", color: "green" };
  }, [porcentajeMargen]);

  if (loading && !recomendacion) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="w-6 h-6 border-3 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Analizando cultivos...</p>
        </div>
      </div>
    );
  }

  if (error)
    return (
      <div className="p-4 bg-red-50 rounded-lg">
        <p className="text-sm text-red-700">Error: {error.message}</p>
      </div>
    );

  if (!recomendacion) {
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            Haz clic en &ldquo;Analizar Cultivos&rdquo; para obtener
            recomendaciones personalizadas basadas en los datos de tu terreno.
          </p>
        </div>
        <button
          onClick={() =>
            calcularRecomendacion(
              terreno,
              estanques,
              entradasAgua,
              zonas,
              plantas,
              catalogoCultivos,
              areaHaFinal,
            )
          }
          className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-medium transition-colors"
        >
          Analizar Cultivos
        </button>
      </div>
    );
  }

  const TABS = [
    {
      id: "viables" as const,
      label: `Viables (${recomendacion.cultivos_viables.length})`,
      activeColor: "border-green-500 text-green-600",
    },
    {
      id: "noViables" as const,
      label: `No Viables (${recomendacion.cultivos_noViables.length})`,
      activeColor: "border-red-500 text-red-600",
    },
    {
      id: "plan" as const,
      label: `Mi Plan (${seleccionados.length})`,
      activeColor: "border-blue-500 text-blue-600",
    },
  ];

  return (
    <div className="space-y-4">
      {recomendacion.riesgos_criticos.length > 0 && (
        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <h4 className="font-bold text-red-900 mb-2">⚠️ Riesgos Críticos</h4>
          <ul className="space-y-1">
            {recomendacion.riesgos_criticos.map((r, i) => (
              <li key={i} className="text-xs text-red-800">
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}
      {recomendacion.advertencias.length > 0 && (
        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <h4 className="font-bold text-yellow-900 mb-2">⚠️ Advertencias</h4>
          <ul className="space-y-1">
            {recomendacion.advertencias.map((a, i) => (
              <li key={i} className="text-xs text-yellow-800">
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div
        className={`p-4 rounded-lg border-l-4 ${recomendacion.resumen.includes("✅") ? "bg-green-50 border-green-500" : "bg-amber-50 border-amber-500"}`}
      >
        <p className="text-sm font-medium text-gray-900">
          {recomendacion.resumen}
        </p>
      </div>

      <div className="flex gap-2 border-b">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTabActivo(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tabActivo === tab.id ? tab.activeColor : "border-transparent text-gray-600 hover:text-gray-900"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {tabActivo === "viables" && (
          <RecomendacionViables
            cultivos={recomendacion.cultivos_viables}
            seleccionados={seleccionados}
            areaHaFinal={areaHaFinal}
            onToggle={toggleSeleccionar}
          />
        )}
        {tabActivo === "noViables" && (
          <RecomendacionNoViables cultivos={recomendacion.cultivos_noViables} />
        )}
        {tabActivo === "plan" && (
          <RecomendacionPlan
            seleccionados={seleccionados}
            aguaDisponible={aguaDisponible}
            aguaSeleccionados={aguaSeleccionados}
            estadoAgua={estadoAgua}
            onRemover={(cultivo, area) =>
              toggleSeleccionar(cultivo, area, false)
            }
          />
        )}
      </div>

      {recomendacion.consumo_estacional.length > 0 &&
        tabActivo === "viables" && (
          <div className="mt-6 pt-4 border-t">
            <h4 className="text-sm font-bold text-gray-900 mb-3">
              📅 Consumo Estacional Promedio
            </h4>
            <div className="space-y-2 text-xs">
              {recomendacion.consumo_estacional.map((mes) => (
                <div key={mes.mes} className="flex items-center gap-2">
                  <span className="w-16 text-gray-700">{mes.mes_nombre}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full"
                      style={{
                        width: `${Math.min((mes.agua_m3 / recomendacion.agua_total_anual_m3) * 12 * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <span className="w-12 text-right text-gray-600">
                    {mes.agua_m3.toFixed(0)} m³
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}
