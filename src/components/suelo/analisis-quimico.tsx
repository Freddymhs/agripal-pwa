"use client";

import type { SueloTerreno } from "@/types";
import { UMBRALES_SUELO } from "@/lib/data/umbrales-suelo";
import {
  getIndicador,
  safeParseFloat,
  coloresIndicador,
} from "./suelo-form-utils";
import { NutrientesOpcionales } from "./nutrientes-opcionales";

interface AnalisisQuimicoProps {
  quimico: NonNullable<SueloTerreno["quimico"]>;
  onChangeQuimico: (q: NonNullable<SueloTerreno["quimico"]>) => void;
}

export function AnalisisQuimico({
  quimico,
  onChangeQuimico,
}: AnalisisQuimicoProps) {
  const {
    salinidad: umbralSalinidad,
    boro: umbralBoro,
    arsenico: umbralArsenico,
  } = UMBRALES_SUELO;

  return (
    <div>
      <h3 className="font-medium text-gray-900 mb-3">
        Analisis Quimico (CRITICO)
      </h3>

      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={quimico.analisis_realizado || false}
            onChange={(e) =>
              onChangeQuimico({
                ...quimico,
                analisis_realizado: e.target.checked,
              })
            }
            className="rounded"
          />
          <span className="text-sm text-yellow-800 font-medium">
            Analisis de laboratorio realizado
          </span>
        </label>
        <p className="text-xs text-yellow-700 mt-1 ml-6">
          INIA La Platina ~$75,000 CLP
        </p>
      </div>

      {quimico.analisis_realizado && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha analisis
            </label>
            <input
              type="date"
              value={quimico.fecha_analisis ?? ""}
              onChange={(e) =>
                onChangeQuimico({
                  ...quimico,
                  fecha_analisis: e.target.value,
                })
              }
              className="w-full px-3 py-2 border rounded text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Laboratorio
            </label>
            <input
              type="text"
              value={quimico.laboratorio ?? ""}
              onChange={(e) =>
                onChangeQuimico({ ...quimico, laboratorio: e.target.value })
              }
              placeholder="INIA La Platina"
              className="w-full px-3 py-2 border rounded text-gray-900"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Salinidad (dS/m)
            <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.1"
            min={0}
            max={50}
            value={quimico.salinidad_dS_m ?? ""}
            onChange={(e) => {
              onChangeQuimico({
                ...quimico,
                salinidad_dS_m: safeParseFloat(e.target.value.trim()),
              });
            }}
            placeholder={`< ${umbralSalinidad.max}`}
            className={`w-full px-3 py-2 border rounded text-gray-900 ${
              coloresIndicador[
                getIndicador(quimico.salinidad_dS_m, umbralSalinidad)
              ]
            }`}
          />
          <p className="text-xs text-gray-500 mt-1">
            Max: {umbralSalinidad.max} dS/m
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Boro (mg/L)
            <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.1"
            min={0}
            max={100}
            value={quimico.boro_mg_l ?? ""}
            onChange={(e) => {
              onChangeQuimico({
                ...quimico,
                boro_mg_l: safeParseFloat(e.target.value.trim()),
              });
            }}
            placeholder={`< ${umbralBoro.max}`}
            className={`w-full px-3 py-2 border rounded text-gray-900 ${
              coloresIndicador[getIndicador(quimico.boro_mg_l, umbralBoro)]
            }`}
          />
          <p className="text-xs text-gray-500 mt-1">
            Max: {umbralBoro.max} mg/L
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Arsenico (mg/L)
            <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            min={0}
            max={10}
            value={quimico.arsenico_mg_l ?? ""}
            onChange={(e) => {
              onChangeQuimico({
                ...quimico,
                arsenico_mg_l: safeParseFloat(e.target.value.trim()),
              });
            }}
            placeholder={`< ${umbralArsenico.max}`}
            className={`w-full px-3 py-2 border rounded text-gray-900 ${
              coloresIndicador[
                getIndicador(quimico.arsenico_mg_l, umbralArsenico)
              ]
            }`}
          />
          <p className="text-xs text-gray-500 mt-1">
            Max: {umbralArsenico.max} mg/L
          </p>
        </div>
      </div>

      <NutrientesOpcionales
        quimico={quimico}
        onChangeQuimico={onChangeQuimico}
      />
    </div>
  );
}
