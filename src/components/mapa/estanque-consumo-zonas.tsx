"use client";

import type { Zona } from "@/types";
import { getEstadoDiasAgua } from "@/lib/utils/agua";

interface ConsumoZona {
  zona: Zona;
  plantasCount: number;
  consumoRecomendado: number;
  consumoRiego: number;
  consumoEfectivo: number;
  cultivoNombre: string;
}

interface EstanqueConsumoZonasProps {
  consumoPorZona: ConsumoZona[];
  consumoTotal: number;
  diasRestantes: number;
  ocultarResumen?: boolean;
}

export function EstanqueConsumoZonas({
  consumoPorZona,
  consumoTotal,
  diasRestantes,
  ocultarResumen = false,
}: EstanqueConsumoZonasProps) {
  const estadoDias = getEstadoDiasAgua(diasRestantes);

  if (consumoTotal === 0) {
    return (
      <div className="bg-gray-50 p-3 rounded text-xs text-gray-600">
        No hay zonas de cultivo con plantas. El consumo se calculará
        automáticamente al plantar.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!ocultarResumen ? (
        <div
          className={`p-3 rounded-lg text-sm ${estadoDias.colorFondo} ${estadoDias.colorTexto}`}
        >
          <div className="font-medium">
            {diasRestantes === Infinity
              ? "Sin consumo activo"
              : `Agua para ~${Math.floor(diasRestantes)} días`}
          </div>
          <div className="text-xs opacity-75">
            Consumo total: {consumoTotal.toFixed(2)} m³/semana
          </div>
        </div>
      ) : (
        <div className="text-xs text-gray-500">
          Consumo total del terreno: {consumoTotal.toFixed(2)} m³/semana
        </div>
      )}

      <div>
        <h5 className="text-xs font-medium text-gray-700 mb-2">
          {ocultarResumen
            ? "Consumo por zona (todo el terreno)"
            : "Consumo por zona"}
        </h5>
        <div className="space-y-1.5">
          {consumoPorZona.map(
            ({
              zona,
              plantasCount,
              consumoRecomendado,
              consumoRiego,
              consumoEfectivo,
              cultivoNombre,
            }) => {
              const pct =
                consumoTotal > 0 ? (consumoEfectivo / consumoTotal) * 100 : 0;
              return (
                <div key={zona.id} className="bg-gray-50 p-2 rounded text-xs">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-900">
                      {zona.nombre}
                    </span>
                    <span className="text-gray-600">
                      {consumoEfectivo.toFixed(2)} m³/sem
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>
                      {cultivoNombre} ({plantasCount})
                    </span>
                    <span>{pct.toFixed(0)}% del total</span>
                  </div>
                  {consumoRiego > 0 && (
                    <div className="flex justify-between text-blue-600 mt-0.5">
                      <span>Rec: {consumoRecomendado.toFixed(2)}</span>
                      <span>Real: {consumoRiego.toFixed(2)} m³/sem</span>
                    </div>
                  )}
                </div>
              );
            },
          )}
        </div>
      </div>
    </div>
  );
}
