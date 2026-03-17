"use client";

import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";
import type {
  ProyeccionAnual,
  EventoFuturo,
} from "@/lib/utils/agua-proyeccion-anual";
import type { Zona } from "@/types";
import { formatCLP } from "@/lib/utils";
import { getEstadoDiasAgua } from "@/lib/utils/agua";
import { ROUTES } from "@/lib/constants/routes";

const EVENTO_ICONS: Record<EventoFuturo["tipo"], string> = {
  recarga: "💧",
  replanta: "🌱",
  lavado: "🧼",
  cosecha: "🍅",
};

const EVENTO_COLORS: Record<EventoFuturo["tipo"], string> = {
  recarga: "bg-cyan-50 text-cyan-800 border-cyan-200",
  replanta: "bg-green-50 text-green-800 border-green-200",
  lavado: "bg-yellow-50 text-yellow-800 border-yellow-200",
  cosecha: "bg-orange-50 text-orange-800 border-orange-200",
};

interface ProyeccionTabProps {
  proyeccion: ProyeccionAnual;
  estanques: Zona[];
}

export function PlanificadorProyeccionTab({
  proyeccion,
  estanques,
}: ProyeccionTabProps) {
  const [mostrarEventos, setMostrarEventos] = useState(false);

  const maxNivel = Math.max(
    ...proyeccion.meses.map((m) =>
      Math.max(m.nivelInicio, m.nivelFin, m.recargas),
    ),
    1,
  );

  // Mes con menor nivel de agua (el cuello de botella)
  const mesMinimo = proyeccion.meses.reduce(
    (min, m) => (m.nivelFin < min.nivelFin ? m : min),
    proyeccion.meses[0],
  );
  const diasMinimos =
    proyeccion.resumen.consumoTotalAnual > 0 && mesMinimo
      ? Math.floor(
          mesMinimo.nivelFin / (proyeccion.resumen.consumoTotalAnual / 365),
        )
      : null;

  const estadoMinimo =
    diasMinimos !== null ? getEstadoDiasAgua(diasMinimos) : null;
  const mesesConDeficit = proyeccion.resumen.mesesDeficit;

  return (
    <div className="space-y-4">
      {/* Hero: cuello de botella */}
      <div
        className={`rounded-xl p-5 border ${
          mesesConDeficit > 0
            ? "bg-red-50 border-red-200"
            : estadoMinimo
              ? `${estadoMinimo.colorFondo} border-gray-100`
              : "bg-cyan-50 border-cyan-200"
        }`}
      >
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
          Peor mes proyectado
        </div>
        {mesesConDeficit > 0 ? (
          <div>
            <div className="text-3xl font-bold text-red-700">
              {mesesConDeficit} mes{mesesConDeficit > 1 ? "es" : ""} en déficit
            </div>
            <div className="text-sm text-red-600 mt-1">
              El agua se acabará antes de la próxima recarga en{" "}
              {mesesConDeficit} mes{mesesConDeficit > 1 ? "es" : ""} del año.
              Ajusta la frecuencia de recarga.
            </div>
          </div>
        ) : diasMinimos !== null && estadoMinimo ? (
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-bold ${estadoMinimo.colorTexto}`}>
              ~{diasMinimos}
            </span>
            <span className={`text-base ${estadoMinimo.colorTexto}`}>
              días en el mes más seco ({mesMinimo?.mesNombre})
            </span>
          </div>
        ) : (
          <div className="text-2xl font-bold text-cyan-700">
            Sin datos de consumo
          </div>
        )}
      </div>

      {/* Gráfico de barras mensual */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-3">
          Nivel de agua — 12 meses
        </div>

        <div className="h-40 flex items-end gap-1">
          {proyeccion.meses.map((mes, i) => {
            const alturaFin =
              maxNivel > 0 ? (mes.nivelFin / maxNivel) * 100 : 0;
            const deficit = mes.diasDeficit > 0;

            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full h-36 flex flex-col justify-end relative">
                  <div
                    className={`w-full rounded-t transition-all ${
                      deficit ? "bg-red-400" : "bg-cyan-400"
                    }`}
                    style={{ height: `${Math.max(alturaFin, 2)}%` }}
                    title={`${mes.mesNombre}: ${mes.nivelFin.toFixed(1)} m³`}
                  />
                  {deficit && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] text-red-600">
                      ⚠
                    </div>
                  )}
                </div>
                <div className="text-[10px] text-gray-500 truncate w-full text-center">
                  {mes.mesNombre.slice(0, 3)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Métricas resumen */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
          <div className="text-xs text-gray-500 mb-1">Consumo anual</div>
          <div className="text-xl font-bold text-cyan-700">
            {proyeccion.resumen.consumoTotalAnual.toFixed(1)} m³
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
          <div className="text-xs text-gray-500 mb-1">Recargas totales</div>
          <div className="text-xl font-bold text-blue-700">
            {proyeccion.resumen.recargasTotales.toFixed(1)} m³
          </div>
        </div>
        <div
          className={`rounded-xl border shadow-sm p-3 ${
            mesesConDeficit > 0
              ? "bg-red-50 border-red-200"
              : "bg-green-50 border-green-200"
          }`}
        >
          <div
            className={`text-xs mb-1 ${
              mesesConDeficit > 0 ? "text-red-600" : "text-green-600"
            }`}
          >
            Meses en déficit
          </div>
          <div
            className={`text-xl font-bold ${
              mesesConDeficit > 0 ? "text-red-700" : "text-green-700"
            }`}
          >
            {mesesConDeficit === 0 ? "Ninguno ✓" : mesesConDeficit}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
          <div className="text-xs text-gray-500 mb-1">Costo agua / año</div>
          <div className="text-xl font-bold text-purple-700">
            {formatCLP(proyeccion.resumen.costosAgua)}
          </div>
        </div>
      </div>

      {!estanques.some((e) => e.estanque_config?.recarga) && (
        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-sm text-yellow-800">
          Sin recarga configurada — la proyección asume nivel actual estático.{" "}
          <Link
            href={ROUTES.AGUA_CONFIGURACION}
            className="underline font-medium"
          >
            Configurar recarga
          </Link>
        </div>
      )}

      {/* Calendario colapsado */}
      {proyeccion.eventos.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <button
            onClick={() => setMostrarEventos((v) => !v)}
            className="w-full flex items-center justify-between p-4 text-left"
          >
            <div>
              <div className="text-sm font-semibold text-gray-800">
                Eventos del año
              </div>
              <div className="text-xs text-gray-500">
                {proyeccion.eventos.length} eventos programados
              </div>
            </div>
            <span className="text-gray-400 text-lg">
              {mostrarEventos ? "↑" : "↓"}
            </span>
          </button>

          {mostrarEventos && (
            <div className="border-t border-gray-100 divide-y divide-gray-50 max-h-64 overflow-y-auto">
              {proyeccion.eventos.slice(0, 20).map((evento, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-4 py-2.5 border-l-4 ${EVENTO_COLORS[evento.tipo]}`}
                >
                  <span>{EVENTO_ICONS[evento.tipo]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {evento.titulo}
                    </div>
                    <div className="text-xs opacity-75 truncate">
                      {evento.descripcion}
                    </div>
                  </div>
                  <div className="text-xs font-medium shrink-0">
                    {format(evento.fecha, "d MMM", { locale: es })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
