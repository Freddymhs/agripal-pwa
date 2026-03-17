"use client";

import type { Planta } from "@/types";
import { formatCLP } from "@/lib/utils";

interface EconomiaAnual {
  ingresoAnual: number;
  inversionTotal: number;
  costosAgua: number;
  neto: number;
  roi: number;
}

interface PlanificadorEconomiaTabProps {
  economiaAnual: EconomiaAnual;
  plantas: Planta[];
}

export function PlanificadorEconomiaTab({
  economiaAnual,
  plantas,
}: PlanificadorEconomiaTabProps) {
  const { ingresoAnual, inversionTotal, costosAgua, roi } = economiaAnual;

  const netoOperacional = ingresoAnual - costosAgua;
  const anosParaRecuperar =
    ingresoAnual > 0 ? Math.ceil(inversionTotal / ingresoAnual) : null;

  const roiColor =
    roi > 50
      ? "text-emerald-700"
      : roi > 0
        ? "text-yellow-700"
        : "text-red-600";
  const roiBg =
    roi > 50 ? "bg-emerald-50" : roi > 0 ? "bg-yellow-50" : "bg-red-50";

  if (plantas.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center space-y-2">
        <div className="text-3xl">🌱</div>
        <p className="text-gray-700 font-medium">
          Aún no hay cultivos plantados
        </p>
        <p className="text-sm text-gray-500">
          Agrega plantas desde el mapa para ver la proyección económica.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Hero: ROI con contexto temporal */}
      <div className={`rounded-xl p-5 ${roiBg} border border-gray-100`}>
        <div className="flex items-start justify-between mb-1">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
              Retorno sobre inversión — Año 2
            </div>
            <div className={`text-5xl font-bold ${roiColor}`}>
              {Math.round(roi)}%
            </div>
          </div>
          {anosParaRecuperar !== null && (
            <div className="bg-white/70 rounded-lg px-3 py-2 text-right">
              <div className="text-xs text-gray-500">
                Recuperas inversión en
              </div>
              <div className="text-lg font-bold text-gray-800">
                ~{anosParaRecuperar} años
              </div>
            </div>
          )}
        </div>

        {/* Línea de tiempo: Año 1 → 2 → 3 */}
        <div className="mt-4">
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
            Evolución típica del retorno
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-red-100 border border-red-200 rounded-lg p-2 text-center">
              <div className="text-xs text-red-600 font-medium">Año 1</div>
              <div className="text-xs text-red-500">Inversión inicial</div>
              <div className="text-sm font-bold text-red-700">
                −{formatCLP(inversionTotal)}
              </div>
            </div>
            <div className="text-gray-300 text-lg">→</div>
            <div
              className={`flex-1 rounded-lg border p-2 text-center ring-2 ring-offset-1 ${roiBg} ${roi >= 0 ? "ring-emerald-300 border-emerald-200" : "ring-red-200 border-red-200"}`}
            >
              <div className={`text-xs font-medium ${roiColor}`}>
                Año 2 ← ahora
              </div>
              <div className="text-xs text-gray-500">Ingresos regulares</div>
              <div className={`text-sm font-bold ${roiColor}`}>
                {formatCLP(ingresoAnual)}
              </div>
            </div>
            <div className="text-gray-300 text-lg">→</div>
            <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-center">
              <div className="text-xs text-emerald-600 font-medium">Año 3+</div>
              <div className="text-xs text-emerald-500">
                Sin inversión inicial
              </div>
              <div className="text-sm font-bold text-emerald-700">
                {formatCLP(netoOperacional)}/año
              </div>
            </div>
          </div>
        </div>

        {roi < 0 && (
          <p className="mt-3 text-xs text-gray-500 bg-white/60 rounded-lg px-3 py-2">
            El ROI negativo en año 2 es normal — la inversión inicial aún supera
            los ingresos acumulados.{" "}
            {anosParaRecuperar !== null &&
              `En ~${anosParaRecuperar} años la inversión queda recuperada.`}
          </p>
        )}
      </div>

      {/* Desglose en 3 números */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 text-center">
          <div className="text-xs text-gray-500 mb-1">Ingresos año 2</div>
          <div className="text-xl font-bold text-emerald-700">
            {formatCLP(ingresoAnual)}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 text-center">
          <div className="text-xs text-gray-500 mb-1">Inversión total</div>
          <div className="text-xl font-bold text-blue-700">
            {formatCLP(inversionTotal)}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 text-center">
          <div className="text-xs text-gray-500 mb-1">Agua/año</div>
          <div className="text-xl font-bold text-purple-700">
            {formatCLP(costosAgua)}
          </div>
        </div>
      </div>

      {/* Neto operacional (sin contar inversión inicial) */}
      <div
        className={`rounded-xl p-4 flex items-center justify-between ${
          netoOperacional >= 0
            ? "bg-emerald-50 border border-emerald-200"
            : "bg-orange-50 border border-orange-200"
        }`}
      >
        <div>
          <div className="text-xs text-gray-500">Neto operacional año 3+</div>
          <div className="text-xs text-gray-400">
            Ingresos − agua (sin contar inversión inicial)
          </div>
        </div>
        <div
          className={`text-2xl font-bold ${
            netoOperacional >= 0 ? "text-emerald-700" : "text-orange-700"
          }`}
        >
          {formatCLP(netoOperacional)}/año
        </div>
      </div>
    </div>
  );
}
