"use client";

import {
  getEtoMesActual,
  hayCamanchaca,
  getFactorClimatico,
  type DatosETo,
} from "@/lib/data/clima";

/** Valor máximo del eje ETo en el gráfico de barras (mm/día) */
const ETO_MAX_ESCALA_MM_DIA = 6.5;

interface ClimaImpactoRiegoProps {
  etoData: DatosETo;
  consumoBase: number;
  factorTemporada: number;
}

export function ClimaImpactoRiego({
  etoData,
  consumoBase,
  factorTemporada,
}: ClimaImpactoRiegoProps) {
  const etoActual = getEtoMesActual(etoData);
  const camanchacaActiva = hayCamanchaca(etoData);
  const factorClimatico = getFactorClimatico(etoData);
  const consumoAjustado = consumoBase * factorClimatico;
  const mesActual = new Date().getMonth() + 1;
  const etoMensual = Object.entries(etoData.mensual).map(([mes, data]) => ({
    mes: Number(mes),
    ...data,
    actual: Number(mes) === mesActual,
  }));

  return (
    <>
      {consumoBase > 0 && (
        <div className="bg-white rounded-lg border shadow-sm p-4 space-y-3">
          <h3 className="font-bold text-gray-900">
            Impacto del clima en riego
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 p-3 rounded">
              <div className="text-xs text-blue-600">ETo actual</div>
              <div className="text-lg font-bold text-blue-900">
                {etoActual} mm/día
              </div>
              <div className="text-xs text-blue-500">
                Ref: {etoData.eto_referencia_mm_dia} mm/día
              </div>
            </div>
            <div
              className={`p-3 rounded ${factorClimatico > 1 ? "bg-red-50" : "bg-green-50"}`}
            >
              <div
                className={`text-xs ${factorClimatico > 1 ? "text-red-600" : "text-green-600"}`}
              >
                Factor climático
              </div>
              <div
                className={`text-lg font-bold ${factorClimatico > 1 ? "text-red-900" : "text-green-900"}`}
              >
                x{factorClimatico}
              </div>
              <div
                className={`text-xs ${factorClimatico > 1 ? "text-red-500" : "text-green-500"}`}
              >
                {factorClimatico > 1
                  ? "Más agua necesaria"
                  : "Menos agua necesaria"}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                Consumo base (temporal x{factorTemporada})
              </span>
              <span className="font-medium text-gray-900">
                {consumoBase.toFixed(2)} m³/sem
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                Consumo ajustado por ETo (x{factorClimatico})
              </span>
              <span className="font-bold text-gray-900">
                {consumoAjustado.toFixed(2)} m³/sem
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Diferencia: {consumoAjustado > consumoBase ? "+" : ""}
              {(consumoAjustado - consumoBase).toFixed(2)} m³/sem
            </div>
          </div>

          {camanchacaActiva && (
            <div className="bg-cyan-50 border border-cyan-200 p-3 rounded">
              <div className="font-medium text-cyan-800 text-sm">
                Camanchaca activa
              </div>
              <div className="text-xs text-cyan-700 mt-1">
                La neblina costera reduce evaporación ~
                {etoData.camanchaca.reduccion_eto_pct}%.{" "}
                {etoData.camanchaca.info}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg border shadow-sm p-4 space-y-3">
        <h3 className="font-bold text-gray-900">ETo mensual</h3>
        <div className="space-y-1">
          {etoMensual.map(({ mes, label, eto_mm_dia, actual }) => {
            const pct = (eto_mm_dia / ETO_MAX_ESCALA_MM_DIA) * 100;
            const esCamanchaca =
              etoData.camanchaca.meses_presencia.includes(mes);
            return (
              <div
                key={mes}
                className={`flex items-center gap-2 text-xs ${actual ? "font-bold" : ""}`}
              >
                <span className="w-12 text-gray-600 text-right">
                  {label.slice(0, 3)}
                </span>
                <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden">
                  <div
                    className={`h-full rounded ${actual ? "bg-blue-500" : "bg-blue-300"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-16 text-gray-700">{eto_mm_dia} mm/d</span>
                {esCamanchaca && (
                  <span className="text-cyan-600 text-xs">C</span>
                )}
              </div>
            );
          })}
        </div>
        <div className="text-xs text-gray-500">
          C = Mes con camanchaca (neblina). ETo más alto = más evaporación = más
          riego necesario.
        </div>
      </div>
    </>
  );
}
