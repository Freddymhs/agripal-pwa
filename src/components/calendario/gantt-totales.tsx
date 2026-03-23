"use client";

import { formatCLP } from "@/lib/utils";
import { MESES_CORTO } from "@/lib/utils/calendario-gantt";

interface GanttTotalesProps {
  totalesPorMes: number[];
  totalAnual: number;
}

export function GanttTotales({ totalesPorMes, totalAnual }: GanttTotalesProps) {
  const maxMes = Math.max(...totalesPorMes, 1);

  return (
    <div className="contents">
      {/* Col 1: label */}
      <div className="flex items-center py-2 pr-2 bg-gray-50 border-t-2 border-gray-200">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
          Ingresos
        </span>
      </div>

      {/* Col 2: barras por mes */}
      <div className="grid grid-cols-12 gap-px py-2 bg-gray-50 border-t-2 border-gray-200">
        {totalesPorMes.map((total, idx) => (
          <div
            key={MESES_CORTO[idx]}
            className="flex flex-col items-center justify-end"
            style={{ minHeight: 40 }}
          >
            {total > 0 ? (
              <>
                <div
                  className="w-full bg-green-300 rounded-t"
                  style={{
                    height: `${Math.max(4, Math.round((total / maxMes) * 28))}px`,
                  }}
                />
                <span className="text-[7px] text-green-700 font-medium mt-0.5 leading-tight text-center">
                  {formatCLP(total)}
                </span>
              </>
            ) : (
              <span className="text-[9px] text-gray-200 mb-1">—</span>
            )}
          </div>
        ))}
      </div>

      {/* Col 3: total anual */}
      <div className="flex flex-col items-end justify-center py-2 pl-2 bg-gray-50 border-t-2 border-gray-200">
        <span className="text-[9px] text-gray-400">año</span>
        <span className="text-xs font-bold text-green-700 leading-tight">
          {formatCLP(totalAnual)}
        </span>
      </div>
    </div>
  );
}
