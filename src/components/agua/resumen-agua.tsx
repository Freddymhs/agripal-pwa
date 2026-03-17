"use client";

import { clamp } from "@/lib/utils/math";
import { getEstadoDiasAgua } from "@/lib/utils/agua";
import { DIAS_POR_SEMANA } from "@/lib/constants/conversiones";

interface ResumenAguaProps {
  aguaActual: number;
  aguaMaxima: number;
  consumoSemanal: number;
  onRegistrarAgua: () => void;
  deshabilitarRegistro?: boolean;
  diasHastaRecarga?: number | null;
  /** Override de días restantes (para multi-estanque: cuello de botella real) */
  diasRestantesOverride?: number;
}

export function ResumenAgua({
  aguaActual,
  aguaMaxima,
  consumoSemanal,
  onRegistrarAgua,
  deshabilitarRegistro = false,
  diasHastaRecarga,
  diasRestantesOverride,
}: ResumenAguaProps) {
  const porcentaje = aguaMaxima > 0 ? (aguaActual / aguaMaxima) * 100 : 0;
  const diasRestantes =
    diasRestantesOverride !== undefined
      ? diasRestantesOverride
      : consumoSemanal > 0
        ? (aguaActual / consumoSemanal) * DIAS_POR_SEMANA
        : Infinity;

  const estado = getEstadoDiasAgua(diasRestantes);

  const alcanzaHastaRecarga =
    diasHastaRecarga != null && diasRestantes !== Infinity
      ? diasRestantes >= diasHastaRecarga
      : null;

  const diasRestantesFloor =
    diasRestantes !== Infinity ? Math.floor(diasRestantes) : null;

  return (
    <div
      className={`rounded-lg border-2 p-5 space-y-4 ${estado.colorFondo} ${estado.colorBorde}`}
    >
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className={`text-sm font-semibold ${estado.colorTexto}`}>
            💧 {estado.texto}
          </span>
          <span className="text-sm text-gray-600">
            {aguaActual.toFixed(1)} / {aguaMaxima.toFixed(1)} m³
          </span>
        </div>
        <div className="h-5 bg-white/60 rounded-full overflow-hidden">
          <div
            className={`h-full ${estado.colorBarra} transition-all`}
            style={{ width: `${clamp(porcentaje, 0, 100)}%` }}
          />
        </div>
        <div className="text-center text-xs text-gray-500 mt-1">
          {porcentaje.toFixed(0)}% de capacidad
        </div>
      </div>

      {diasRestantesFloor !== null && (
        <div className="text-center">
          <span className={`text-4xl font-bold ${estado.colorTexto}`}>
            ~{diasRestantesFloor}
          </span>
          <span className={`text-lg ml-1 ${estado.colorTexto}`}>días</span>
          <div className="text-xs text-gray-500 mt-0.5">de agua disponible</div>
        </div>
      )}

      <button
        onClick={onRegistrarAgua}
        disabled={deshabilitarRegistro}
        className="w-full bg-cyan-600 text-white py-3 rounded-lg hover:bg-cyan-700 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        Registrar entrada de agua
      </button>

      {/* Indicador de recarga: una línea, accionable */}
      {diasHastaRecarga != null &&
        alcanzaHastaRecarga !== null &&
        diasRestantesFloor !== null && (
          <div
            className={`px-3 py-2 rounded-lg text-sm font-medium ${
              alcanzaHastaRecarga
                ? "bg-green-100 text-green-800"
                : "bg-orange-100 text-orange-800"
            }`}
          >
            {alcanzaHastaRecarga ? (
              <>
                ✅ Alcanza hasta el camión — llega en {diasHastaRecarga} días,
                sobran ~{Math.floor(diasRestantes - diasHastaRecarga)} días
              </>
            ) : (
              <>
                ⚠️ Pide el camión antes de ~{diasRestantesFloor} días · está
                programado en {diasHastaRecarga} días
              </>
            )}
          </div>
        )}
    </div>
  );
}
