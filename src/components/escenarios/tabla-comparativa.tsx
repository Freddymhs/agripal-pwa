"use client";

import type { EscenarioCultivo } from "@/lib/utils/comparador-cultivos";
import { formatCLP } from "@/lib/utils";

const COLORES_LINEA = ["text-blue-600", "text-green-600", "text-purple-600"];
const COLORES_BAR = ["bg-blue-400", "bg-green-400", "bg-purple-400"];

interface TablaComparativaProps {
  escenarios: EscenarioCultivo[];
}

// ─── Tabla principal ──────────────────────────────────────────────────────────

export function TablaComparativa({ escenarios }: TablaComparativaProps) {
  const sinCostoAgua = escenarios.every((e) => e.roi.costo_agua_anual === 0);
  const sinSuelo = escenarios.every((e) => e.factorSuelo === 1.0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Supuestos del cálculo */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 text-xs text-gray-500 space-y-0.5">
        <div className="font-medium text-gray-600 mb-1">
          Cómo se calculan estos números
        </div>
        <div>
          • <strong>Plantas:</strong> densidad calculada según espaciado
          recomendado del catálogo y el área de la zona
        </div>
        <div>
          • <strong>Inversión:</strong> costo de plantas (año 1) + agua año 1
        </div>
        <div>
          • <strong>Ingresos:</strong> kg producidos × precio promedio de
          mercado del norte de Chile
        </div>
        <div>
          • <strong>Agua:</strong> Kc del cultivo × ET0 de la región × área de
          la zona
        </div>
        {sinSuelo && (
          <div className="text-amber-600 mt-1">
            ⚠ Sin análisis de suelo configurado — factor suelo asume condiciones
            ideales (100%)
          </div>
        )}
        {sinCostoAgua && (
          <div className="text-amber-600">
            ⚠ Sin costo de agua configurado — Costo/kg y Margen usan estimación
            por defecto
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left px-4 py-3 font-medium text-gray-500 w-44">
                Métrica
              </th>
              {escenarios.map((e, i) => (
                <th
                  key={e.cultivo.id}
                  className={`text-right px-4 py-3 font-semibold ${COLORES_LINEA[i]}`}
                >
                  {e.cultivo.nombre}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            <FilaMetrica
              label="ROI a 5 años"
              hint="(Ingresos − Inversión) ÷ Inversión. Cuánto ganas por cada peso invertido en 4 años."
              escenarios={escenarios}
              render={(e) => `${e.roi.roi_5_años_pct}%`}
              colorFn={(e) =>
                e.roi.viable ? "text-green-700" : "text-red-700"
              }
              bold
            />
            <FilaMetrica
              label="Inversión inicial"
              hint="Costo de las plantas + agua del año 1. Lo que necesitas poner para empezar."
              escenarios={escenarios}
              render={(e) => formatCLP(e.roi.inversion_total)}
            />
            <FilaMetrica
              label="Ingreso año 3"
              hint="Año 3 es cuando el cultivo está maduro. Producción kg × precio mercado."
              escenarios={escenarios}
              render={(e) => formatCLP(e.roi.ingreso_año3)}
              colorFn={() => "text-green-700 font-medium"}
            />
            <FilaMetrica
              label="Costo por kg"
              hint={
                sinCostoAgua
                  ? "Solo incluye costo de agua. Configura costo en /agua para un valor real."
                  : "Costo total del agua ÷ kg producidos."
              }
              escenarios={escenarios}
              render={(e) =>
                e.metricas.costoProduccionKg === 0
                  ? "— (sin costo agua)"
                  : formatCLP(e.metricas.costoProduccionKg)
              }
              colorFn={(e) =>
                e.metricas.costoProduccionKg === 0
                  ? "text-gray-400"
                  : "text-gray-900"
              }
            />
            <FilaMetrica
              label="Margen"
              hint="(Precio − Costo variable) ÷ Precio. Qué % del precio de venta es ganancia."
              escenarios={escenarios}
              render={(e) => `${Math.round(e.metricas.margenContribucion)}%`}
              colorFn={(e) =>
                e.metricas.margenContribucion > 40
                  ? "text-green-700"
                  : e.metricas.margenContribucion > 20
                    ? "text-yellow-700"
                    : "text-red-700"
              }
              bold
            />
            <FilaMetrica
              label="Agua anual"
              hint="Litros que necesita esta zona para este cultivo durante un año completo."
              escenarios={escenarios}
              render={(e) => `${e.consumoAguaAnualM3.toFixed(1)} m³`}
              colorFn={() => "text-cyan-700"}
            />
            <FilaMetrica
              label="Compatibilidad suelo"
              hint={
                sinSuelo
                  ? "Sin análisis de suelo — asume condiciones ideales. Registra tu suelo para un cálculo real."
                  : "Qué tanto tolera este cultivo tu suelo (pH, salinidad, boro). 100% = ideal, <50% = riesgo alto."
              }
              escenarios={escenarios}
              render={(e) => `${Math.round(e.factorSuelo * 100)}%`}
              colorFn={(e) =>
                e.factorSuelo > 0.8
                  ? "text-green-700"
                  : e.factorSuelo > 0.5
                    ? "text-yellow-700"
                    : "text-red-700"
              }
              bold
            />
            <FilaMetrica
              label="Punto de equilibrio"
              hint="Cuántos meses hasta que los ingresos recuperan la inversión inicial."
              escenarios={escenarios}
              render={(e) =>
                e.roi.punto_equilibrio_meses != null
                  ? `${e.roi.punto_equilibrio_meses} meses`
                  : "—"
              }
            />
            <FilaMetrica
              label="Plantas en la zona"
              hint="Cantidad de plantas que caben según el espaciado recomendado y el área de la zona."
              escenarios={escenarios}
              render={(e) => `${e.roi.num_plantas} plantas`}
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Fila con hint ────────────────────────────────────────────────────────────

function FilaMetrica({
  label,
  hint,
  escenarios,
  render,
  colorFn,
  bold,
}: {
  label: string;
  hint: string;
  escenarios: EscenarioCultivo[];
  render: (e: EscenarioCultivo) => string;
  colorFn?: (e: EscenarioCultivo) => string;
  bold?: boolean;
}) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 align-top">
        <div className="text-gray-800 font-medium text-sm">{label}</div>
        <div className="text-[11px] text-gray-400 leading-snug mt-0.5 max-w-[170px]">
          {hint}
        </div>
      </td>
      {escenarios.map((e, i) => (
        <td
          key={i}
          className={`px-4 py-3 text-right align-top ${bold ? "font-bold" : ""} ${colorFn ? colorFn(e) : "text-gray-900"}`}
        >
          {render(e)}
        </td>
      ))}
    </tr>
  );
}

// ─── Gráfico de ingresos por año ─────────────────────────────────────────────

export function GraficoRoiComparativo({ escenarios }: TablaComparativaProps) {
  const años = [
    { key: "ingreso_año2" as const, label: "Año 2" },
    { key: "ingreso_año3" as const, label: "Año 3" },
    { key: "ingreso_año4" as const, label: "Año 4" },
  ];

  const maxIngreso = Math.max(
    ...escenarios.flatMap((e) => años.map(({ key }) => e.roi[key])),
    1,
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="mb-3">
        <h3 className="font-semibold text-gray-900 text-sm">
          Ingresos por año (Año 2 al 4)
        </h3>
        <p className="text-xs text-gray-400 mt-0.5">
          Año 1 no genera ingreso (plantas en establecimiento). Las barras
          muestran cuánto vende cada cultivo por año a medida que madura.
        </p>
      </div>

      <div className="space-y-5">
        {escenarios.map((e, i) => (
          <div key={e.cultivo.id}>
            <div className="flex justify-between items-baseline mb-2">
              <span className={`text-sm font-semibold ${COLORES_LINEA[i]}`}>
                {e.cultivo.nombre}
              </span>
              <span className="text-xs text-gray-500">
                Total 4 años:{" "}
                <strong className="text-gray-700">
                  {formatCLP(e.roi.ingreso_acumulado_5años)}
                </strong>
              </span>
            </div>
            <div className="space-y-1.5">
              {años.map(({ key, label }) => {
                const ingreso = e.roi[key];
                const pct = maxIngreso > 0 ? (ingreso / maxIngreso) * 100 : 0;
                return (
                  <div key={key} className="flex items-center gap-2">
                    <div className="text-[11px] text-gray-400 w-10 shrink-0">
                      {label}
                    </div>
                    <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                      <div
                        className={`h-full ${COLORES_BAR[i]} rounded transition-all flex items-center justify-end pr-1.5`}
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      >
                        {pct > 15 && (
                          <span className="text-[10px] text-white font-medium">
                            {formatCLP(ingreso)}
                          </span>
                        )}
                      </div>
                    </div>
                    {pct <= 15 && (
                      <div className="text-[11px] text-gray-500 shrink-0">
                        {formatCLP(ingreso)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Leyenda de colores */}
      <div className="flex gap-4 mt-4 pt-3 border-t border-gray-100">
        {escenarios.map((e, i) => (
          <div key={e.cultivo.id} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-sm ${COLORES_BAR[i]}`} />
            <span className="text-xs text-gray-500">{e.cultivo.nombre}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Recomendación ────────────────────────────────────────────────────────────

export function RecomendacionEscenario({ escenarios }: TablaComparativaProps) {
  const mejor = [...escenarios].sort(
    (a, b) => b.roi.roi_5_años_pct - a.roi.roi_5_años_pct,
  )[0];

  const todosNegativos = escenarios.every((e) => e.roi.roi_5_años_pct < 0);
  const sinSuelo = mejor.factorSuelo === 1.0;

  if (todosNegativos) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <div className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">
          Advertencia
        </div>
        <p className="text-sm text-red-900 font-semibold mb-1">
          Ninguno de los cultivos seleccionados es rentable en esta zona
        </p>
        <ul className="text-sm text-red-800 space-y-0.5 mt-2">
          <li>
            • El menos negativo es <strong>{mejor.cultivo.nombre}</strong> con
            ROI <strong>{mejor.roi.roi_5_años_pct}%</strong>
          </li>
          <li>
            • Considera reducir el costo de agua, cambiar cultivos, o vender en
            feria para mejorar el margen
          </li>
        </ul>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
      <div className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">
        Recomendación
      </div>
      <p className="text-sm text-green-900 font-semibold mb-1">
        {mejor.cultivo.nombre} tiene el mejor retorno para esta zona
      </p>
      <ul className="text-sm text-green-800 space-y-0.5 mt-2">
        <li>
          • ROI a 5 años: <strong>{mejor.roi.roi_5_años_pct}%</strong> — por
          cada $100 invertidos recuperas ${mejor.roi.roi_5_años_pct + 100}
        </li>
        <li>
          • Margen estimado:{" "}
          <strong>{Math.round(mejor.metricas.margenContribucion)}%</strong> del
          precio de venta es ganancia
        </li>
        <li>
          • Compatibilidad con tu suelo:{" "}
          <strong>{Math.round(mejor.factorSuelo * 100)}%</strong>
          {sinSuelo ? " (sin análisis — asume suelo ideal)" : ""}
        </li>
        <li>
          • Punto de equilibrio:{" "}
          <strong>
            {mejor.roi.punto_equilibrio_meses != null
              ? `${mejor.roi.punto_equilibrio_meses} meses`
              : "—"}
          </strong>
        </li>
      </ul>
    </div>
  );
}
