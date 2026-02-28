"use client";

import type { SueloTerreno } from "@/types";
import { UMBRALES_SUELO } from "@/lib/data/umbrales-suelo";

interface ChecklistSueloProps {
  suelo?: SueloTerreno;
}

interface CheckItem {
  id: string;
  label: string;
  checked: boolean;
  critical?: boolean;
  value?: string;
}

export function ChecklistSuelo({ suelo }: ChecklistSueloProps) {
  const items: CheckItem[] = [
    {
      id: "analisis",
      label: "Análisis de suelo realizado (INIA ~$75,000 CLP)",
      checked: suelo?.quimico?.analisis_realizado || false,
      critical: true,
    },
    {
      id: "salinidad",
      label: `Salinidad < ${UMBRALES_SUELO.salinidad.max} dS/m`,
      checked:
        suelo?.quimico?.salinidad_dS_m !== undefined &&
        suelo.quimico.salinidad_dS_m <= UMBRALES_SUELO.salinidad.max,
      value:
        suelo?.quimico?.salinidad_dS_m !== undefined
          ? `${suelo.quimico.salinidad_dS_m} dS/m`
          : undefined,
    },
    {
      id: "boro",
      label: `Boro < ${UMBRALES_SUELO.boro.max} mg/L`,
      checked:
        suelo?.quimico?.boro_mg_l !== undefined &&
        suelo.quimico.boro_mg_l <= UMBRALES_SUELO.boro.max,
      value:
        suelo?.quimico?.boro_mg_l !== undefined
          ? `${suelo.quimico.boro_mg_l} mg/L`
          : undefined,
    },
    {
      id: "arsenico",
      label: `Arsénico < ${UMBRALES_SUELO.arsenico.max} mg/L`,
      checked:
        suelo?.quimico?.arsenico_mg_l !== undefined &&
        suelo.quimico.arsenico_mg_l <= UMBRALES_SUELO.arsenico.max,
      value:
        suelo?.quimico?.arsenico_mg_l !== undefined
          ? `${suelo.quimico.arsenico_mg_l} mg/L`
          : undefined,
    },
    {
      id: "profundidad",
      label: `Profundidad > ${UMBRALES_SUELO.profundidad_frutales.min}cm para frutales`,
      checked:
        suelo?.fisico?.profundidad_efectiva_cm !== undefined &&
        suelo.fisico.profundidad_efectiva_cm >=
          UMBRALES_SUELO.profundidad_frutales.min,
      value:
        suelo?.fisico?.profundidad_efectiva_cm !== undefined
          ? `${suelo.fisico.profundidad_efectiva_cm} cm`
          : undefined,
    },
    {
      id: "ph",
      label: `pH entre ${UMBRALES_SUELO.ph.min} - ${UMBRALES_SUELO.ph.max}`,
      checked:
        suelo?.fisico?.ph !== undefined &&
        suelo.fisico.ph >= UMBRALES_SUELO.ph.min &&
        suelo.fisico.ph <= UMBRALES_SUELO.ph.max,
      value: suelo?.fisico?.ph !== undefined ? `${suelo.fisico.ph}` : undefined,
    },
  ];

  const completados = items.filter((i) => i.checked).length;
  const total = items.length;

  return (
    <div className="bg-white rounded-lg border p-4">
      <h3 className="font-bold text-gray-900 mb-3">
        Checklist Antes de Invertir
      </h3>

      <div className="space-y-2 mb-4">
        {items.map((item) => (
          <div
            key={item.id}
            className={`flex items-start gap-2 p-2 rounded ${
              item.checked
                ? "bg-green-50"
                : item.critical
                  ? "bg-red-50"
                  : "bg-gray-50"
            }`}
          >
            <span
              className={`w-5 h-5 flex items-center justify-center rounded text-xs flex-shrink-0 ${
                item.checked
                  ? "bg-green-500 text-white"
                  : "bg-gray-300 text-white"
              }`}
            >
              {item.checked ? "✓" : "×"}
            </span>
            <div className="flex-1">
              <span
                className={`text-sm ${item.checked ? "text-green-700" : "text-gray-600"}`}
              >
                {item.label}
              </span>
              {item.value && (
                <span
                  className={`text-xs ml-2 ${item.checked ? "text-green-600" : "text-red-600"}`}
                >
                  ({item.value})
                </span>
              )}
              {item.critical && !item.checked && (
                <span className="block text-xs text-red-600 mt-0.5">
                  REQUERIDO
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="pt-3 border-t">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Progreso</span>
          <span
            className={`text-sm font-medium ${
              completados === total ? "text-green-600" : "text-gray-600"
            }`}
          >
            {completados}/{total}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              completados === total
                ? "bg-green-500"
                : completados >= total / 2
                  ? "bg-yellow-500"
                  : "bg-red-500"
            }`}
            style={{ width: `${(completados / total) * 100}%` }}
          />
        </div>
      </div>

      {completados < total && (
        <div className="mt-3 p-2 bg-yellow-50 rounded text-xs text-yellow-800">
          Si algún parámetro falla, consultar agrónomo antes de plantar
        </div>
      )}
    </div>
  );
}
