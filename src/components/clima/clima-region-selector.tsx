"use client";

import type { ClimaBase } from "@/lib/dal/base-data";

interface ClimaRegionSelectorProps {
  climas: ClimaBase[];
  climaActivoId: string | undefined;
  cambiandoClima: boolean;
  onCambiarClima: (climaId: string) => void;
}

function getClimaLabel(clima: ClimaBase): string {
  const zona = clima.zona?.replace(/_/g, " ") ?? "";
  const elev =
    typeof clima.elevacion_m === "number" ? ` (${clima.elevacion_m}m)` : "";
  return `${clima.region} — ${zona}${elev}`;
}

export function ClimaRegionSelector({
  climas,
  climaActivoId,
  cambiandoClima,
  onCambiarClima,
}: ClimaRegionSelectorProps) {
  return (
    <div className="bg-white rounded-lg border shadow-sm p-4 space-y-3">
      <h3 className="font-bold text-gray-900">Clima de tu región</h3>
      <p className="text-sm text-gray-600">
        Selecciona la región climática más cercana a tu terreno. Esto afecta los
        cálculos de evapotranspiración y consumo de agua.
      </p>
      <div className="grid gap-2">
        {climas.map((clima) => {
          const esActivo = clima.id === climaActivoId;
          const et0 = clima.evapotranspiracion?.et0_mm_dia;
          return (
            <button
              key={clima.id}
              onClick={() => onCambiarClima(clima.id)}
              disabled={cambiandoClima}
              className={`text-left p-3 rounded-lg border-2 transition-colors ${
                esActivo
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200 hover:border-green-300 hover:bg-green-50/50"
              } ${cambiandoClima ? "opacity-50" : ""}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 text-sm">
                    {getClimaLabel(clima)}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    ET0: {et0 ?? "?"} mm/día · Temp:{" "}
                    {clima.temperatura?.promedio_anual_c}°C promedio
                  </div>
                </div>
                {esActivo && (
                  <span className="text-green-600 font-bold text-lg">✓</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
