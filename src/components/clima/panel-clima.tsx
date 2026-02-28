"use client";

import { useState } from "react";
import {
  CLIMA_ARICA,
  getTemporadaActual,
  type DatosClimaticos,
} from "@/lib/data/clima-arica";
import type { Temporada } from "@/types";

interface SeccionProps {
  titulo: string;
  icono: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Seccion({
  titulo,
  icono,
  children,
  defaultOpen = false,
}: SeccionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <span className="flex items-center gap-2 font-medium text-gray-900">
          <span>{icono}</span>
          {titulo}
        </span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
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
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

interface PanelClimaProps {
  clima?: DatosClimaticos;
}

export function PanelClima({ clima = CLIMA_ARICA }: PanelClimaProps) {
  const temporadaActual = getTemporadaActual();
  const infoTemporada = clima.estacionalidad[temporadaActual];

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-cyan-50">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Clima</h2>
            <p className="text-sm text-gray-600">
              {clima.region} - {clima.zona}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-blue-600 capitalize">
              {temporadaActual}
            </div>
            <div className="text-xs text-gray-500">
              Factor agua: {infoTemporada.factor_agua}×
            </div>
          </div>
        </div>
      </div>

      <Seccion titulo="Lluvia" icono="🌧️">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Anual:</span>
            <span className="font-medium text-gray-900">
              {clima.lluvia.anual_mm} mm
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Máx. 24h:</span>
            <span className="font-medium text-gray-900">
              {clima.lluvia.max_24h_mm} mm
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Meses lluviosos:</span>
            <span className="font-medium text-gray-900">
              {clima.lluvia.meses_lluviosos.join(", ") || "Ninguno"}
            </span>
          </div>
          <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-yellow-800">
            Arica es una de las zonas más áridas del mundo. Dependencia total de
            riego.
          </div>
        </div>
      </Seccion>

      <Seccion titulo="Temperatura" icono="🌡️" defaultOpen>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Mín. histórica:</span>
            <span className="font-medium text-gray-900">
              {clima.temperatura.minima_historica_c}°C
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Máx. verano:</span>
            <span className="font-medium text-gray-900">
              {clima.temperatura.maxima_verano_c}°C
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Promedio anual:</span>
            <span className="font-medium text-gray-900">
              {clima.temperatura.promedio_anual_c}°C
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Horas frío:</span>
            <span className="font-medium text-gray-900">
              ~{clima.temperatura.horas_frio_aprox}
            </span>
          </div>
          <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-800">
            Pocas horas frío = difícil para frutales que requieren vernalización
            (manzano, pera, etc.)
          </div>
        </div>
      </Seccion>

      <Seccion titulo="Heladas" icono="❄️">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Heladas anuales:</span>
            <span className="font-medium text-green-600">
              {clima.heladas.anuales}
            </span>
          </div>
          {clima.heladas.meses_riesgo.length > 0 ? (
            <div className="flex justify-between">
              <span className="text-gray-500">Meses riesgo:</span>
              <span className="font-medium text-gray-900">
                {clima.heladas.meses_riesgo.join(", ")}
              </span>
            </div>
          ) : (
            <div className="p-2 bg-green-50 rounded text-xs text-green-800">
              Sin riesgo de heladas en zona costera. Ideal para cultivos
              tropicales.
            </div>
          )}
          {clima.heladas.plantas_sensibles.length > 0 && (
            <div className="text-xs text-gray-500">
              Plantas sensibles al frío:{" "}
              {clima.heladas.plantas_sensibles.join(", ")}
            </div>
          )}
        </div>
      </Seccion>

      <Seccion titulo="Viento" icono="💨">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Velocidad máx:</span>
            <span className="font-medium text-gray-900">
              {clima.viento.max_kmh} km/h
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Dirección:</span>
            <span className="font-medium text-gray-900">
              {clima.viento.direccion_predominante}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Meses fuertes:</span>
            <span className="font-medium text-gray-900">
              {clima.viento.meses_fuerte.join(", ")}
            </span>
          </div>
        </div>
      </Seccion>

      <Seccion titulo="Humedad y Radiación" icono="💧">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Humedad relativa:</span>
            <span className="font-medium text-gray-900">
              {clima.humedad_radiacion.humedad_relativa_pct}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Radiación solar:</span>
            <span className="font-medium text-gray-900">
              {clima.humedad_radiacion.radiacion_mj_m2_dia} MJ/m²/día
            </span>
          </div>
        </div>
      </Seccion>

      <Seccion titulo="Evapotranspiración (ET₀)" icono="☀️">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">ET₀ diario:</span>
            <span className="font-medium text-gray-900">
              {clima.evapotranspiracion.et0_mm_dia} mm/día
            </span>
          </div>
          <div className="p-2 bg-gray-50 rounded text-xs text-gray-600">
            {clima.evapotranspiracion.nota}
          </div>
        </div>
      </Seccion>

      <Seccion titulo="Estacionalidad" icono="📅">
        <div className="space-y-3">
          {(
            Object.entries(clima.estacionalidad) as [
              Temporada,
              typeof infoTemporada,
            ][]
          ).map(([temporada, info]) => (
            <div
              key={temporada}
              className={`p-2 rounded text-sm ${
                temporada === temporadaActual
                  ? "bg-green-50 border border-green-200"
                  : "bg-gray-50"
              }`}
            >
              <div className="flex justify-between items-center">
                <span
                  className={`font-medium capitalize ${temporada === temporadaActual ? "text-green-700" : "text-gray-700"}`}
                >
                  {temporada}
                  {temporada === temporadaActual && " (actual)"}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    temporada === temporadaActual
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  ×{info.factor_agua}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {info.meses.join(", ")} - {info.caracteristica}
              </div>
            </div>
          ))}
        </div>
      </Seccion>

      <div className="p-3 bg-gray-50 text-xs text-gray-500">
        <div className="font-medium mb-1">Fuentes:</div>
        {clima.fuentes.join(" • ")}
      </div>
    </div>
  );
}
