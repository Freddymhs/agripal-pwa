"use client";

import { useState } from "react";
import { GOTEROS_DEFAULT } from "@/lib/constants/entities";

interface CaudalCalculadoraProps {
  numPlantasZona?: number;
  caudalPorGoteroInicial?: number;
  onUsarCaudal: (caudal: number) => void;
}

export function CaudalCalculadora({
  numPlantasZona,
  caudalPorGoteroInicial,
  onUsarCaudal,
}: CaudalCalculadoraProps) {
  const [goterosPorPlanta, setGoterosPorPlanta] = useState<number>(
    GOTEROS_DEFAULT.cantidad,
  );
  const [caudalPorGotero, setCaudalPorGotero] = useState<number>(
    caudalPorGoteroInicial ?? GOTEROS_DEFAULT.caudal_lh_por_gotero,
  );

  const caudalEstimado =
    goterosPorPlanta * caudalPorGotero * (numPlantasZona || 0);

  return (
    <div className="mt-3 border border-gray-200 rounded-lg bg-gray-50 overflow-hidden">
      <div className="px-3 py-2 bg-gray-100 border-b border-gray-200">
        <p className="text-xs font-semibold text-gray-700">
          Calculadora de caudal
        </p>
      </div>
      <div className="p-3 space-y-3">
        {/* Fila 1: Goteros por planta */}
        <div className="flex items-center justify-between gap-3">
          <label className="text-xs text-gray-600 shrink-0">
            Goteros por planta
          </label>
          <input
            type="number"
            min={1}
            value={goterosPorPlanta}
            onChange={(e) =>
              setGoterosPorPlanta(Math.max(1, Number(e.target.value)))
            }
            className="w-20 px-2 py-1.5 border rounded text-sm text-center"
          />
        </div>

        {/* Fila 2: L/h por gotero + quick select */}
        <div className="flex items-center justify-between gap-3">
          <label className="text-xs text-gray-600 shrink-0">
            L/h por gotero
          </label>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[2, 4, 8].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setCaudalPorGotero(v)}
                  className={`w-9 py-1 text-xs rounded-md font-medium transition-colors ${caudalPorGotero === v ? "bg-blue-500 text-white shadow-sm" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"}`}
                >
                  {v}
                </button>
              ))}
            </div>
            <input
              type="number"
              min={0.1}
              step={0.1}
              value={caudalPorGotero}
              onChange={(e) =>
                setCaudalPorGotero(Math.max(0.1, Number(e.target.value)))
              }
              className="w-20 px-2 py-1.5 border rounded text-sm text-center"
            />
          </div>
        </div>

        {/* Fila 3: Nº plantas (solo lectura) */}
        <div className="flex items-center justify-between gap-3">
          <label className="text-xs text-gray-600 shrink-0">
            Plantas en zona
          </label>
          <div className="w-20 px-2 py-1.5 border rounded text-sm text-center bg-white text-gray-500">
            {numPlantasZona ?? 0}
          </div>
        </div>

        {/* Resultado + botón */}
        <div className="border-t border-gray-200 pt-3">
          {!numPlantasZona || numPlantasZona <= 0 ? (
            <p className="text-xs text-amber-600">
              Agrega plantas a esta zona para calcular el caudal.
            </p>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-gray-800">
                  {caudalEstimado.toLocaleString()} L/h
                </div>
                <p className="text-[11px] text-gray-400">
                  {goterosPorPlanta} × {caudalPorGotero} × {numPlantasZona}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onUsarCaudal(caudalEstimado)}
                className="px-4 py-2 text-xs rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors"
              >
                Usar este caudal
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
