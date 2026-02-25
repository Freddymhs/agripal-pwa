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
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-bold text-gray-900 mb-4">
        Economia Anual Proyectada
      </h3>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-3xl font-bold text-green-700">
            {formatCLP(economiaAnual.ingresoAnual)}
          </div>
          <div className="text-sm text-green-600">Ingresos ano 2</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <div className="text-3xl font-bold text-blue-700">
            {formatCLP(economiaAnual.inversionTotal)}
          </div>
          <div className="text-sm text-blue-600">Inversion total</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg text-center">
          <div className="text-3xl font-bold text-purple-700">
            {formatCLP(economiaAnual.costosAgua)}
          </div>
          <div className="text-sm text-purple-600">Costos agua/ano</div>
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
          proyecciones economicas.
        </div>
      )}
    </div>
  );
}
