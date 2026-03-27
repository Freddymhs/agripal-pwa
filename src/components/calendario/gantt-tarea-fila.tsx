"use client";

import type { TareaGantt, TareaGanttColor } from "@/types";
import { formatDate } from "@/lib/utils";

const COL_START = {
  1: "col-start-1",
  2: "col-start-2",
  3: "col-start-3",
  4: "col-start-4",
  5: "col-start-5",
  6: "col-start-6",
  7: "col-start-7",
  8: "col-start-8",
  9: "col-start-9",
  10: "col-start-10",
  11: "col-start-11",
  12: "col-start-12",
} as const;

const COL_SPAN = {
  1: "col-span-1",
  2: "col-span-2",
  3: "col-span-3",
  4: "col-span-4",
  5: "col-span-5",
  6: "col-span-6",
  7: "col-span-7",
  8: "col-span-8",
  9: "col-span-9",
  10: "col-span-10",
  11: "col-span-11",
  12: "col-span-12",
} as const;

const COLOR_CFG: Record<
  TareaGanttColor,
  { bg: string; border: string; text: string }
> = {
  emerald: {
    bg: "bg-emerald-100",
    border: "border-emerald-400",
    text: "text-emerald-700",
  },
  sky: {
    bg: "bg-sky-100",
    border: "border-sky-400",
    text: "text-sky-700",
  },
  amber: {
    bg: "bg-amber-100",
    border: "border-amber-400",
    text: "text-amber-700",
  },
  violet: {
    bg: "bg-violet-100",
    border: "border-violet-400",
    text: "text-violet-700",
  },
  rose: {
    bg: "bg-rose-100",
    border: "border-rose-400",
    text: "text-rose-700",
  },
};

interface GanttTareaFilaProps {
  tarea: TareaGantt;
  año: number;
  onSelect: (tarea: TareaGantt) => void;
}

export function GanttTareaFila({ tarea, año, onSelect }: GanttTareaFilaProps) {
  const inicio = new Date(tarea.fecha_inicio);
  const fin = new Date(tarea.fecha_fin);
  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime())) {
    return null;
  }

  const añoInicio = new Date(año, 0, 1);
  const añoFin = new Date(año, 11, 31, 23, 59, 59);

  if (fin < añoInicio || inicio > añoFin) return null;

  const mesInicio = inicio.getFullYear() < año ? 1 : inicio.getMonth() + 1;
  const mesFin = fin.getFullYear() > año ? 12 : fin.getMonth() + 1;
  const span = Math.max(1, mesFin - mesInicio + 1);

  const spanClass = COL_SPAN[span as keyof typeof COL_SPAN] ?? "col-span-1";
  const startClass =
    COL_START[mesInicio as keyof typeof COL_START] ?? "col-start-1";

  const msPorDia = 1000 * 60 * 60 * 24;
  const duracion = Math.max(
    1,
    Math.ceil((fin.getTime() - inicio.getTime()) / msPorDia) + 1,
  );

  const colorCfg = COLOR_CFG[tarea.color ?? "emerald"];

  return (
    <div className="contents">
      <button
        type="button"
        onClick={() => onSelect(tarea)}
        className="flex flex-col justify-center gap-1 py-2 pr-2 border-b border-gray-100 min-w-0 text-left"
      >
        <span className="text-[11px] font-semibold text-gray-800 truncate">
          {tarea.titulo}
        </span>
        <span className="text-[9px] text-gray-400">
          {formatDate(tarea.fecha_inicio)} -&gt; {formatDate(tarea.fecha_fin)}
        </span>
      </button>

      <div className="flex flex-col border-b border-gray-100">
        <div className="grid grid-cols-12 gap-px py-2 min-h-[44px]">
          <button
            type="button"
            onClick={() => onSelect(tarea)}
            className={`flex items-center px-2 h-6 rounded-md border ${colorCfg.bg} ${colorCfg.border} ${colorCfg.text} ${startClass} ${spanClass}`}
          >
            <span className="text-[9px] font-semibold truncate">
              {tarea.titulo}
            </span>
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onSelect(tarea)}
        className="flex flex-col items-end justify-center py-2 pl-1 border-b border-gray-100 text-right"
      >
        <span className="text-[10px] font-semibold text-gray-700">
          {duracion}d
        </span>
        <span className="text-[8px] text-gray-400">duración</span>
      </button>
    </div>
  );
}
