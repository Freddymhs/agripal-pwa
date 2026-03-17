"use client";

import { useState } from "react";
import type { VariedadCultivo } from "@/lib/data/variedades";
import type { DatosMercado } from "@/lib/data/mercado";
import { useProjectContext } from "@/contexts/project-context";
import type { CatalogoCultivo, UUID } from "@/types";
import { formatCLP } from "@/lib/utils";

interface CatalogoListProps {
  cultivos: CatalogoCultivo[];
  onEditar: (cultivo: CatalogoCultivo) => void;
  onEliminar: (id: UUID) => void;
}

export function CatalogoList({
  cultivos,
  onEditar,
  onEliminar,
}: CatalogoListProps) {
  if (cultivos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay cultivos en el catálogo. Agrega uno para empezar.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cultivos.map((cultivo) => (
        <CultivoCard
          key={cultivo.id}
          cultivo={cultivo}
          onEditar={() => onEditar(cultivo)}
          onEliminar={() => onEliminar(cultivo.id)}
        />
      ))}
    </div>
  );
}

const TENDENCIA_ICONS: Record<string, string> = {
  alza: "↑",
  estable: "→",
  baja: "↓",
};
const TENDENCIA_COLORS: Record<string, string> = {
  alza: "text-green-600",
  estable: "text-gray-600",
  baja: "text-red-600",
};

const TIER_DOT_COLORS: Record<number, string> = {
  1: "bg-green-500",
  2: "bg-yellow-400",
  3: "bg-red-500",
};

const TIER_LABEL_COLORS: Record<number, string> = {
  1: "text-green-700",
  2: "text-yellow-700",
  3: "text-red-700",
};

const RIESGO_BADGE_COLORS: Record<string, string> = {
  bajo: "bg-green-50 text-green-700 border border-green-200",
  medio: "bg-yellow-50 text-yellow-700 border border-yellow-200",
  alto: "bg-red-50 text-red-700 border border-red-200",
};

function CultivoCard({
  cultivo,
  onEditar,
  onEliminar,
}: {
  cultivo: CatalogoCultivo;
  onEditar: () => void;
  onEliminar: () => void;
}) {
  const { datosBaseHook } = useProjectContext();
  const [expanded, setExpanded] = useState(false);

  const variedades: VariedadCultivo[] = (
    datosBaseHook.datosBase.variedades ?? []
  ).filter((v) => v.cultivo_id === cultivo.id);

  const mercado: DatosMercado | undefined =
    datosBaseHook.datosBase.precios?.find((m) => m.cultivo_id === cultivo.id);

  const hasExpandable = variedades.length > 0 || !!mercado;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col gap-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        {/* Tier dot + name block */}
        <div className="flex items-start gap-2 min-w-0">
          <div className="mt-1.5 flex-shrink-0 flex flex-col items-center gap-0.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${TIER_DOT_COLORS[cultivo.tier]}`}
            />
            <span
              className={`text-[9px] font-semibold leading-none ${TIER_LABEL_COLORS[cultivo.tier]}`}
            >
              T{cultivo.tier}
            </span>
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 leading-tight truncate">
              {cultivo.nombre}
            </h3>
            {cultivo.nombre_cientifico && (
              <p className="text-xs text-gray-400 italic leading-tight mt-0.5 truncate">
                {cultivo.nombre_cientifico}
              </p>
            )}
          </div>
        </div>

        {/* Right cluster: riesgo badge + action icons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${RIESGO_BADGE_COLORS[cultivo.riesgo]}`}
          >
            {cultivo.riesgo}
          </span>
          <button
            onClick={onEditar}
            aria-label="Editar cultivo"
            className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {/* pencil icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            onClick={onEliminar}
            aria-label="Eliminar cultivo"
            className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            {/* trash icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Key stats 2-col mini-grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">
            💧 Agua
          </span>
          <span className="text-sm font-semibold text-gray-800">
            {cultivo.agua_m3_ha_año_min}–{cultivo.agua_m3_ha_año_max}
          </span>
          <span className="text-[10px] text-gray-400">m³/ha/año</span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">
            ⏱ Producción
          </span>
          <span className="text-sm font-semibold text-gray-800">
            {cultivo.tiempo_produccion_meses} meses
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">
            📏 Espaciado
          </span>
          <span className="text-sm font-semibold text-gray-800">
            {cultivo.espaciado_recomendado_m} m
          </span>
          <span className="text-[10px] text-gray-400">
            mín {cultivo.espaciado_min_m} m
          </span>
        </div>

        {cultivo.precio_kg_min_clp && cultivo.precio_kg_max_clp && (
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">
              💰 Precio
            </span>
            <span className="text-sm font-semibold text-gray-800">
              {formatCLP(cultivo.precio_kg_min_clp)}–
              {formatCLP(cultivo.precio_kg_max_clp)}
            </span>
            <span className="text-[10px] text-gray-400">por kg</span>
          </div>
        )}
      </div>

      {/* Climate info — one compact line */}
      {cultivo.clima && (
        <p className="text-[11px] text-gray-400 leading-tight border-t border-gray-100 pt-3 -mt-1">
          {cultivo.clima.temp_min_c !== undefined &&
            cultivo.clima.temp_max_c !== undefined && (
              <span>
                🌡️ {cultivo.clima.temp_min_c}° – {cultivo.clima.temp_max_c}°C
              </span>
            )}
          {cultivo.clima.tolerancia_heladas && (
            <span className="ml-2">❄️ {cultivo.clima.tolerancia_heladas}</span>
          )}
        </p>
      )}

      {/* Expandable variedades / mercado */}
      {hasExpandable && (
        <div className="-mt-1">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[11px] text-blue-500 hover:text-blue-700 transition-colors font-medium"
          >
            {expanded ? "▾ Ocultar detalles" : "▸ Variedades y mercado"}
          </button>

          {expanded && (
            <div className="mt-2 space-y-2">
              {mercado && (
                <div className="bg-blue-50 p-2 rounded text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-blue-900">Mercado</span>
                    <span
                      className={`font-bold ${TENDENCIA_COLORS[mercado.tendencia]}`}
                    >
                      {TENDENCIA_ICONS[mercado.tendencia]} {mercado.tendencia}
                    </span>
                  </div>
                  <div className="text-blue-800">
                    {formatCLP(mercado.precio_kg_actual_clp)}/kg actual
                  </div>
                  <div className="text-blue-700">
                    Demanda: {mercado.demanda_local} | Competencia:{" "}
                    {mercado.competencia_local}
                    {mercado.mercado_exportacion && " | Exportable"}
                  </div>
                  {mercado.notas && (
                    <p className="text-blue-600 mt-1 italic">{mercado.notas}</p>
                  )}
                </div>
              )}

              {variedades.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-gray-700">
                    Variedades:
                  </span>
                  {variedades.map((v) => (
                    <div key={v.id} className="bg-gray-50 p-2 rounded text-xs">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-900">
                          {v.nombre}
                        </span>
                        <span className="text-gray-500">
                          {formatCLP(v.precio_planta_clp)}/planta
                        </span>
                      </div>
                      <div className="text-gray-500">
                        {v.origen} | Rend: x{v.rendimiento_relativo}
                      </div>
                      <div className="text-green-600 mt-0.5">
                        + {v.ventajas.join(", ")}
                      </div>
                      <div className="text-red-500">
                        - {v.desventajas.join(", ")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
