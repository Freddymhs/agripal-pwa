"use client";

import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type {
  ProyeccionAnual,
  EventoFuturo,
} from "@/lib/utils/agua-proyeccion-anual";
import type { Zona } from "@/types";
import { formatCLP } from "@/lib/utils";
import { ROUTES } from "@/lib/constants/routes";

const EVENTO_ICONS: Record<EventoFuturo["tipo"], string> = {
  recarga: "💧",
  replanta: "🌱",
  lavado: "🧼",
  cosecha: "🍅",
};

const EVENTO_COLORS: Record<EventoFuturo["tipo"], string> = {
  recarga: "bg-cyan-100 text-cyan-800",
  replanta: "bg-green-100 text-green-800",
  lavado: "bg-yellow-100 text-yellow-800",
  cosecha: "bg-orange-100 text-orange-800",
};

interface ProyeccionTabProps {
  proyeccion: ProyeccionAnual;
  estanques: Zona[];
}

export function PlanificadorProyeccionTab({
  proyeccion,
  estanques,
}: ProyeccionTabProps) {
  const maxNivel = Math.max(
    ...proyeccion.meses.map((m) =>
      Math.max(m.nivelInicio, m.nivelFin, m.recargas),
    ),
  );

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Nivel de Agua (12 meses)
        </h3>

        <div className="h-48 flex items-end gap-1">
          {proyeccion.meses.map((mes, i) => {
            const alturaFin =
              maxNivel > 0 ? (mes.nivelFin / maxNivel) * 100 : 0;
            const deficit = mes.diasDeficit > 0;

            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full h-40 flex flex-col justify-end relative">
                  <div
                    className={`w-full rounded-t transition-all ${
                      deficit ? "bg-red-400" : "bg-cyan-400"
                    }`}
                    style={{ height: `${Math.max(alturaFin, 2)}%` }}
                    title={`${mes.mesNombre}: ${mes.nivelFin.toFixed(1)} m3`}
                  />
                  {deficit && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-xs text-red-600">
                      ⚠️
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500 truncate w-full text-center">
                  {mes.mesNombre.slice(0, 3)}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="bg-cyan-50 p-3 rounded">
            <div className="text-xs text-cyan-600">Consumo anual</div>
            <div className="font-bold text-cyan-800">
              {proyeccion.resumen.consumoTotalAnual.toFixed(1)} m3
            </div>
          </div>
          <div className="bg-blue-50 p-3 rounded">
            <div className="text-xs text-blue-600">Recargas totales</div>
            <div className="font-bold text-blue-800">
              {proyeccion.resumen.recargasTotales.toFixed(1)} m3
            </div>
          </div>
          <div
            className={`p-3 rounded ${proyeccion.resumen.mesesDeficit > 0 ? "bg-red-50" : "bg-green-50"}`}
          >
            <div
              className={`text-xs ${proyeccion.resumen.mesesDeficit > 0 ? "text-red-600" : "text-green-600"}`}
            >
              Meses deficit
            </div>
            <div
              className={`font-bold ${proyeccion.resumen.mesesDeficit > 0 ? "text-red-800" : "text-green-800"}`}
            >
              {proyeccion.resumen.mesesDeficit}
            </div>
          </div>
          <div className="bg-purple-50 p-3 rounded">
            <div className="text-xs text-purple-600">Costo agua</div>
            <div className="font-bold text-purple-800">
              {formatCLP(proyeccion.resumen.costosAgua)}
            </div>
          </div>
        </div>

        {!estanques.some((e) => e.estanque_config?.recarga) && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 p-3 rounded text-sm text-yellow-800">
            No tienes configurada la recarga.{" "}
            <Link
              href={ROUTES.AGUA_CONFIGURACION}
              className="underline font-medium"
            >
              Configurala aqui
            </Link>{" "}
            para proyectar mejor.
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Calendario de Eventos
        </h3>

        {proyeccion.eventos.length === 0 ? (
          <p className="text-gray-500 text-sm">No hay eventos programados</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {proyeccion.eventos.slice(0, 20).map((evento, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 p-2 rounded ${EVENTO_COLORS[evento.tipo]}`}
              >
                <span className="text-lg">{EVENTO_ICONS[evento.tipo]}</span>
                <div className="flex-1">
                  <div className="font-medium text-sm">{evento.titulo}</div>
                  <div className="text-xs opacity-75">{evento.descripcion}</div>
                </div>
                <div className="text-xs font-medium">
                  {format(evento.fecha, "d MMM", { locale: es })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
