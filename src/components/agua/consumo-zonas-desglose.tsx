"use client";

import type { Zona } from "@/types";

interface ZonaConsumo {
  zona: Zona;
  consumo: number;
  porcentaje: number;
}

interface ConsumoZonasDesgloseProps {
  zonasConsumo: ZonaConsumo[];
  mostrarDesglose: boolean;
  onToggle: () => void;
}

export function ConsumoZonasDesglose({
  zonasConsumo,
  mostrarDesglose,
  onToggle,
}: ConsumoZonasDesgloseProps) {
  if (zonasConsumo.length === 0) return null;

  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-sm font-medium text-gray-700 hover:text-gray-900 py-2"
      >
        <span>Consumo por zona</span>
        <svg
          className={`w-5 h-5 transition-transform ${mostrarDesglose ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {mostrarDesglose && (
        <div className="space-y-2 mt-2">
          {zonasConsumo.map(({ zona, consumo, porcentaje: pct }) => (
            <div
              key={zona.id}
              className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: zona.color }}
                />
                <span className="font-medium text-gray-700">{zona.nombre}</span>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">
                  {consumo.toFixed(2)} m³/sem
                </div>
                <div className="text-xs text-gray-500">{pct.toFixed(0)}%</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
