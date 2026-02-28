"use client";

import { formatDate } from "@/lib/utils";
import type {
  Planta,
  CatalogoCultivo,
  EstadoPlanta,
  EtapaCrecimiento,
} from "@/types";
import {
  COLORES_ESTADO_PLANTA,
  ETAPA_INFO,
  ESTADOS_PLANTA_LIST,
  ETAPA,
  ETAPAS_LIST,
} from "@/lib/constants/entities";
import { getKc } from "@/lib/data/kc-cultivos";
import { getDiasRestantesEtapa } from "@/lib/data/duracion-etapas";

interface PlantaInfoProps {
  planta: Planta;
  cultivo?: CatalogoCultivo;
  onCambiarEstado: (estado: EstadoPlanta) => void;
  onCambiarEtapa?: (etapa: EtapaCrecimiento) => void;
  onEliminar: () => void;
  onClose: () => void;
}

export function PlantaInfo({
  planta,
  cultivo,
  onCambiarEstado,
  onCambiarEtapa,
  onEliminar,
  onClose,
}: PlantaInfoProps) {
  const estados: EstadoPlanta[] = ESTADOS_PLANTA_LIST;
  const etapaActual = planta.etapa_actual || ETAPA.ADULTA;
  const kc = cultivo ? getKc(cultivo.nombre, etapaActual) : 1.0;
  const diasRestantes =
    cultivo && planta.fecha_plantacion
      ? getDiasRestantesEtapa(
          cultivo.nombre,
          etapaActual,
          new Date(planta.fecha_plantacion),
        )
      : null;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">
          {cultivo?.nombre || "Planta"}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-xl font-bold"
        >
          ✕
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: COLORES_ESTADO_PLANTA[planta.estado] }}
        />
        <span className="capitalize font-medium text-gray-900">
          {planta.estado}
        </span>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{ETAPA_INFO[etapaActual].emoji}</span>
            <div>
              <div className="font-medium text-green-900">
                {ETAPA_INFO[etapaActual].label}
              </div>
              <div className="text-xs text-green-700">Kc: {kc.toFixed(2)}</div>
            </div>
          </div>
          {diasRestantes !== null && diasRestantes > 0 && (
            <div className="text-right">
              <div className="text-sm font-medium text-green-800">
                {diasRestantes}d
              </div>
              <div className="text-xs text-green-600">restantes</div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="text-gray-900">
          <span className="text-gray-700 font-medium">Plantada:</span>{" "}
          {formatDate(planta.fecha_plantacion)}
        </div>
        <div className="text-gray-900">
          <span className="text-gray-700 font-medium">Posición:</span> (
          {planta.x.toFixed(1)}m, {planta.y.toFixed(1)}m)
        </div>
        {cultivo && (
          <>
            <div className="text-gray-900">
              <span className="text-gray-700 font-medium">
                Tiempo producción:
              </span>{" "}
              {cultivo.tiempo_produccion_meses} meses
            </div>
            <div className="text-gray-900">
              <span className="text-gray-700 font-medium">Vida útil:</span>{" "}
              {cultivo.vida_util_años} años
            </div>
          </>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Cambiar estado
        </label>
        <div className="grid grid-cols-2 gap-2">
          {estados.map((estado) => (
            <button
              key={estado}
              onClick={() => onCambiarEstado(estado)}
              disabled={planta.estado === estado}
              className={`
                px-3 py-2 rounded text-sm capitalize flex items-center gap-2 font-medium
                ${
                  planta.estado === estado
                    ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                    : "bg-gray-50 hover:bg-gray-100 text-gray-900"
                }
              `}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORES_ESTADO_PLANTA[estado] }}
              />
              {estado}
            </button>
          ))}
        </div>
      </div>

      {onCambiarEtapa && (
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Etapa de crecimiento
          </label>
          <select
            value={etapaActual}
            onChange={(e) => onCambiarEtapa(e.target.value as EtapaCrecimiento)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            {ETAPAS_LIST.map((etapa) => {
              const info = ETAPA_INFO[etapa];
              const etapaKc = cultivo ? getKc(cultivo.nombre, etapa) : 1.0;
              return (
                <option key={etapa} value={etapa}>
                  {info.emoji} {info.label} (Kc {etapaKc.toFixed(2)})
                </option>
              );
            })}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Auto-actualiza según fecha plantación
          </p>
        </div>
      )}

      <button
        onClick={onEliminar}
        className="w-full text-red-600 hover:text-red-800 text-sm py-2 font-medium"
      >
        Eliminar planta
      </button>
    </div>
  );
}
