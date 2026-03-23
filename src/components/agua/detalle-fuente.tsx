"use client";

import type { FuenteAgua } from "@/types";
import { UMBRALES_AGUA } from "@/lib/data/umbrales-agua";
import type { NivelIndicador } from "@/components/suelo/suelo-form-utils";
import { coloresIndicador } from "@/components/suelo/suelo-form-utils";

const FACTOR_ADVERTENCIA = 0.75;

function getIndicador(valor: number | undefined, max: number): NivelIndicador {
  if (valor === undefined) return "neutral";
  if (valor > max) return "critico";
  if (valor > max * FACTOR_ADVERTENCIA) return "advertencia";
  return "ok";
}

interface DetalleFuenteProps {
  fuente: FuenteAgua;
}

interface CampoCalidad {
  label: string;
  valor: number | undefined;
  unidad: string;
  max?: number;
}

export function DetalleFuente({ fuente }: DetalleFuenteProps) {
  const campos: CampoCalidad[] = [
    {
      label: "Salinidad",
      valor: fuente.salinidad_dS_m,
      unidad: "dS/m",
      max: UMBRALES_AGUA.salinidad.max,
    },
    {
      label: "Boro",
      valor: fuente.boro_ppm,
      unidad: "ppm",
      max: UMBRALES_AGUA.boro.max,
    },
    {
      label: "Arsénico",
      valor: fuente.arsenico_mg_l,
      unidad: "mg/L",
      max: UMBRALES_AGUA.arsenico.max,
    },
    {
      label: "pH",
      valor: fuente.ph,
      unidad: "",
    },
  ];

  return (
    <div className="bg-gray-50 border rounded p-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-gray-600">
          Datos de la fuente seleccionada
        </p>
        <span className="text-xs text-gray-400">Solo lectura</span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {campos.map((campo) => {
          const indicador = campo.max
            ? getIndicador(campo.valor, campo.max)
            : "neutral";
          return (
            <div key={campo.label}>
              <p className="text-xs text-gray-500 mb-0.5">{campo.label}</p>
              <p
                className={`text-sm font-semibold px-2 py-1 rounded ${coloresIndicador[indicador]}`}
              >
                {campo.valor !== undefined
                  ? `${campo.valor} ${campo.unidad}`
                  : "—"}
              </p>
              {campo.max !== undefined && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Máx: {campo.max} {campo.unidad}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {fuente.notas && (
        <div className="pt-1 border-t border-gray-200">
          <p className="text-xs text-gray-500">Notas</p>
          <p className="text-sm text-gray-700">{fuente.notas}</p>
        </div>
      )}
    </div>
  );
}
