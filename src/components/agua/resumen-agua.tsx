"use client";

import { useState } from "react";
import type {
  EstadoAgua,
  Zona,
  Planta,
  CatalogoCultivo,
  ConfiguracionRecarga,
} from "@/types";
import { TIPO_ZONA, ESTADO_AGUA } from "@/lib/constants/entities";
import { clamp } from "@/lib/utils/math";
import {
  DIAS_AGUA_UMBRAL_ALTO,
  DIAS_AGUA_UMBRAL_CRITICO,
} from "@/lib/constants/umbrales";
import { calcularConsumoZona } from "@/lib/utils/agua";
import { getTemporadaActual } from "@/lib/utils";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { ConsumoZonasDesglose } from "./consumo-zonas-desglose";
import { DIAS_POR_SEMANA } from "@/lib/constants/conversiones";

interface ResumenAguaProps {
  aguaActual: number;
  aguaMaxima: number;
  consumoSemanal: number;
  estadoAgua: EstadoAgua;
  zonas?: Zona[];
  plantas?: Planta[];
  catalogoCultivos?: CatalogoCultivo[];
  configRecarga?: ConfiguracionRecarga;
}

export function ResumenAgua({
  aguaActual,
  aguaMaxima,
  consumoSemanal,
  estadoAgua,
  zonas = [],
  plantas = [],
  catalogoCultivos = [],
  configRecarga,
}: ResumenAguaProps) {
  const [mostrarDesglose, setMostrarDesglose] = useState(false);

  const porcentaje = aguaMaxima > 0 ? (aguaActual / aguaMaxima) * 100 : 0;
  const semanasRestantes =
    consumoSemanal > 0 ? aguaActual / consumoSemanal : Infinity;
  const diasRestantes = semanasRestantes * DIAS_POR_SEMANA;
  const consumoDiario = consumoSemanal / DIAS_POR_SEMANA;

  const temporada = getTemporadaActual();
  const zonasConsumo = zonas
    .filter((z) => z.tipo === TIPO_ZONA.CULTIVO)
    .map((zona) => {
      const plantasZona = plantas.filter((p) => p.zona_id === zona.id);
      const consumo = calcularConsumoZona(
        zona,
        plantasZona,
        catalogoCultivos,
        temporada,
      );
      return {
        zona,
        consumo,
        porcentaje: consumoSemanal > 0 ? (consumo / consumoSemanal) * 100 : 0,
      };
    })
    .filter((z) => z.consumo > 0)
    .sort((a, b) => b.consumo - a.consumo);

  const diasHastaRecarga = configRecarga?.proxima_recarga
    ? differenceInDays(new Date(configRecarga.proxima_recarga), new Date())
    : null;

  const alcanzaHastaRecarga =
    diasHastaRecarga !== null && diasRestantes !== Infinity
      ? diasRestantes >= diasHastaRecarga
      : true;

  const diasFaltantes =
    diasHastaRecarga !== null && diasRestantes !== Infinity
      ? Math.ceil(diasHastaRecarga - diasRestantes)
      : 0;

  const getColorDias = (dias: number) => {
    if (dias > DIAS_AGUA_UMBRAL_ALTO)
      return {
        bg: "bg-green-500",
        text: "text-green-800",
        bgLight: "bg-green-50",
      };
    if (dias >= DIAS_AGUA_UMBRAL_CRITICO)
      return {
        bg: "bg-yellow-500",
        text: "text-yellow-800",
        bgLight: "bg-yellow-50",
      };
    return { bg: "bg-red-500", text: "text-red-800", bgLight: "bg-red-50" };
  };

  const colorDias =
    diasRestantes !== Infinity ? getColorDias(diasRestantes) : null;

  const estadoConfig = {
    ok: {
      label: "OK",
      bg: "bg-green-500",
      text: "text-green-800",
      bgLight: "bg-green-50",
    },
    ajustado: {
      label: "Ajustado",
      bg: "bg-yellow-500",
      text: "text-yellow-800",
      bgLight: "bg-yellow-50",
    },
    deficit: {
      label: "Déficit",
      bg: "bg-red-500",
      text: "text-red-800",
      bgLight: "bg-red-50",
    },
  };

  const config = estadoConfig[estadoAgua];

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Estado del Agua</h2>
        <span
          className={`px-3 py-1 rounded-full text-white text-sm font-medium ${config.bg}`}
        >
          {config.label}
        </span>
      </div>

      <div>
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>{aguaActual.toFixed(1)} m³</span>
          <span>{aguaMaxima.toFixed(1)} m³</span>
        </div>
        <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${config.bg} transition-all`}
            style={{ width: `${clamp(porcentaje, 0, 100)}%` }}
          />
        </div>
        <div className="text-center text-sm text-gray-500 mt-1">
          {porcentaje.toFixed(0)}% de capacidad
        </div>
      </div>

      <div className="space-y-3 pt-2">
        {diasRestantes !== Infinity && colorDias && (
          <div
            className={`${colorDias.bgLight} border border-${colorDias.bg.replace("bg-", "")} p-3 rounded`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Duración estimada</div>
                <div className={`text-2xl font-bold ${colorDias.text}`}>
                  ~{Math.floor(diasRestantes)} días
                </div>
              </div>
              <svg
                className={`w-8 h-8 ${colorDias.text}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-cyan-50 p-3 rounded text-center">
            <div className="text-2xl font-bold text-cyan-600">
              {consumoSemanal.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500">m³/semana</div>
          </div>
          <div className="bg-purple-50 p-3 rounded text-center">
            <div className="text-2xl font-bold text-purple-600">
              {semanasRestantes === Infinity
                ? "-"
                : semanasRestantes.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500">
              {semanasRestantes === Infinity ? "Sin consumo" : "semanas"}
            </div>
          </div>
        </div>

        <ConsumoZonasDesglose
          zonasConsumo={zonasConsumo}
          mostrarDesglose={mostrarDesglose}
          onToggle={() => setMostrarDesglose(!mostrarDesglose)}
        />
      </div>

      {configRecarga && diasHastaRecarga !== null && (
        <div
          className={`p-4 rounded-lg ${alcanzaHastaRecarga ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-1">
                Próxima Recarga
              </h3>
              <div className="text-lg font-bold text-gray-900">
                {format(
                  new Date(configRecarga.proxima_recarga),
                  "EEEE d 'de' MMMM",
                  { locale: es },
                )}
              </div>
              <div className="text-sm text-gray-600">
                En {diasHastaRecarga} días (
                {configRecarga.cantidad_litros.toLocaleString()} L)
              </div>
            </div>
            <div
              className={`text-2xl ${alcanzaHastaRecarga ? "text-green-500" : "text-red-500"}`}
            >
              {alcanzaHastaRecarga ? "✓" : "✗"}
            </div>
          </div>
          <div
            className={`mt-3 text-sm font-medium ${alcanzaHastaRecarga ? "text-green-700" : "text-red-700"}`}
          >
            {alcanzaHastaRecarga ? (
              <>
                ✅ Agua alcanza hasta la recarga ({Math.abs(diasFaltantes)} días
                de margen)
              </>
            ) : (
              <>
                ❌ NO alcanza - Falta{diasFaltantes > 1 ? "n" : ""}{" "}
                {Math.abs(diasFaltantes)} día
                {Math.abs(diasFaltantes) !== 1 ? "s" : ""} de agua
              </>
            )}
          </div>
          {!alcanzaHastaRecarga && (
            <div className="mt-3 p-3 bg-red-100 rounded text-xs text-red-800">
              <strong>Recomendaciones:</strong>
              <ul className="mt-1 ml-4 list-disc space-y-1">
                <li>
                  Adelanta la recarga {Math.abs(diasFaltantes)} día
                  {Math.abs(diasFaltantes) !== 1 ? "s" : ""}
                </li>
                <li>
                  O reduce el consumo en{" "}
                  {Math.ceil(
                    (consumoDiario * Math.abs(diasFaltantes)) /
                      diasHastaRecarga,
                  ).toFixed(1)}{" "}
                  L/día
                </li>
              </ul>
            </div>
          )}
        </div>
      )}

      {!configRecarga && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
          <strong>Tip:</strong> Configura tu frecuencia de recarga para saber si
          el agua alcanzará hasta tu próximo aljibe.
        </div>
      )}

      {estadoAgua === ESTADO_AGUA.DEFICIT && !configRecarga && (
        <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-800">
          Agua insuficiente para el consumo semanal. Considera reducir cultivos
          o aumentar entradas.
        </div>
      )}

      {estadoAgua === ESTADO_AGUA.AJUSTADO && !configRecarga && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
          Nivel de agua ajustado. Planifica próxima recarga pronto.
        </div>
      )}
    </div>
  );
}
