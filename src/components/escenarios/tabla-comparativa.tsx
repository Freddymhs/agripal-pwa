"use client";

import type { EscenarioCultivo } from "@/lib/utils/comparador-cultivos";
import { formatCLP } from "@/lib/utils";

const COLORES_LINEA = ["text-blue-600", "text-green-600", "text-purple-600"];
const COLORES_BG = ["bg-blue-50", "bg-green-50", "bg-purple-50"];

interface TablaComparativaProps {
  escenarios: EscenarioCultivo[];
}

export function TablaComparativa({ escenarios }: TablaComparativaProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 font-medium text-gray-700">
                Metrica
              </th>
              {escenarios.map((e, i) => (
                <th
                  key={e.cultivo.id}
                  className={`text-right p-3 font-medium ${COLORES_LINEA[i]}`}
                >
                  {e.cultivo.nombre}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <FilaMetrica label="ROI 4 anos" escenarios={escenarios} render={(e) => `${e.roi.roi_4_años_pct}%`}
              colorFn={(e) => e.roi.viable ? "text-green-700" : "text-red-700"} bold />
            <FilaMetrica label="Inversion" escenarios={escenarios} render={(e) => formatCLP(e.roi.inversion_total)} />
            <FilaMetrica label="Ingreso Ano 3" escenarios={escenarios} render={(e) => formatCLP(e.roi.ingreso_año3)}
              colorFn={() => "text-green-700 font-medium"} />
            <FilaMetrica label="Costo/kg" escenarios={escenarios} render={(e) => formatCLP(e.metricas.costoProduccionKg)} />
            <FilaMetrica label="Margen" escenarios={escenarios} render={(e) => `${Math.round(e.metricas.margenContribucion)}%`}
              colorFn={(e) => e.metricas.margenContribucion > 40 ? "text-green-700" : e.metricas.margenContribucion > 20 ? "text-yellow-700" : "text-red-700"} bold />
            <FilaMetrica label="Agua anual" escenarios={escenarios} render={(e) => `${e.consumoAguaAnualM3.toFixed(1)} m3`}
              colorFn={() => "text-cyan-700"} />
            <FilaMetrica label="Factor suelo" escenarios={escenarios} render={(e) => `${Math.round(e.factorSuelo * 100)}%`}
              colorFn={(e) => e.factorSuelo > 0.8 ? "text-green-700" : e.factorSuelo > 0.5 ? "text-yellow-700" : "text-red-700"} bold />
            <FilaMetrica label="Equilibrio" escenarios={escenarios}
              render={(e) => e.roi.punto_equilibrio_meses != null ? `${e.roi.punto_equilibrio_meses} meses` : "N/A"} />
            <FilaMetrica label="Plantas" escenarios={escenarios} render={(e) => `${e.roi.num_plantas}`} />
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilaMetrica({
  label, escenarios, render, colorFn, bold,
}: {
  label: string
  escenarios: EscenarioCultivo[]
  render: (e: EscenarioCultivo) => string
  colorFn?: (e: EscenarioCultivo) => string
  bold?: boolean
}) {
  return (
    <tr>
      <td className="p-3 text-gray-600">{label}</td>
      {escenarios.map((e, i) => (
        <td
          key={i}
          className={`p-3 text-right ${bold ? "font-bold" : ""} ${colorFn ? colorFn(e) : "text-gray-900"}`}
        >
          {render(e)}
        </td>
      ))}
    </tr>
  );
}

export function GraficoRoiComparativo({ escenarios }: TablaComparativaProps) {
  const maxIngreso = Math.max(...escenarios.map((x) => x.roi.ingreso_año4));

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-bold text-gray-900 mb-3">
        ROI Comparativo (Ano 2 a 4)
      </h3>
      <div className="space-y-3">
        {escenarios.map((e, i) => (
          <div key={e.cultivo.id}>
            <div className="flex justify-between text-sm mb-1">
              <span className={`font-medium ${COLORES_LINEA[i]}`}>
                {e.cultivo.nombre}
              </span>
              <span className="text-gray-600">
                {formatCLP(e.roi.ingreso_acumulado_4años)}
              </span>
            </div>
            <div className="flex gap-1 h-6">
              {[
                e.roi.ingreso_año2,
                e.roi.ingreso_año3,
                e.roi.ingreso_año4,
              ].map((ingreso, j) => (
                <div
                  key={j}
                  className={`rounded ${COLORES_BG[i]} flex items-center justify-center text-xs ${COLORES_LINEA[i]}`}
                  style={{
                    width: `${maxIngreso > 0 ? (ingreso / maxIngreso) * 100 : 0}%`,
                    minWidth: "20px",
                  }}
                >
                  A{j + 2}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RecomendacionEscenario({ escenarios }: TablaComparativaProps) {
  const mejor = [...escenarios].sort(
    (a, b) => b.roi.roi_4_años_pct - a.roi.roi_4_años_pct,
  )[0];

  return (
    <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
      <h3 className="font-bold text-green-900 mb-1">
        Recomendacion
      </h3>
      <p className="text-sm text-green-800">
        <strong>{mejor.cultivo.nombre}</strong> tiene el mejor ROI (
        {mejor.roi.roi_4_años_pct}%) con margen de contribucion del{" "}
        {Math.round(mejor.metricas.margenContribucion)}% y factor de
        compatibilidad con suelo del{" "}
        {Math.round(mejor.factorSuelo * 100)}%.
      </p>
    </div>
  );
}
