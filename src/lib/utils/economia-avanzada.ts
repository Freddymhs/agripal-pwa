import type { CatalogoCultivo } from "@/types";
import type { ProyeccionROI } from "./roi";
import {
  COSTO_VARIABLE_FACTOR,
  COSTO_VARIABLE_FALLBACK_FACTOR,
  AÑOS_AMORTIZACION_PLANTAS,
} from "@/lib/constants/conversiones";

export interface MetricasEconomicas {
  costoProduccionKg: number;
  puntoEquilibrioKg: number | null;
  margenContribucion: number;
  tiempoRecuperacionMeses: number | null;
  precioVentaKg: number;
  costoVariableKg: number;
  kgProducidosAño: number;
  costoAguaAnual: number;
  costoPlantasAmortizado: number;
  costoTotalAnual: number;
}

export function calcularMetricasEconomicas(
  roi: ProyeccionROI,
  cultivo: CatalogoCultivo,
  kgProducidosAño: number,
): MetricasEconomicas {
  const costoPlantasAmortizado = roi.costo_plantas / AÑOS_AMORTIZACION_PLANTAS;
  const costoTotalAnual = roi.costo_agua_anual + costoPlantasAmortizado;
  const precioVenta = roi.precio_kg_estimado;
  const costoVariable =
    cultivo.costo_variable_kg ??
    (costoTotalAnual > 0 && kgProducidosAño > 0
      ? (costoTotalAnual / kgProducidosAño) * COSTO_VARIABLE_FACTOR
      : precioVenta * COSTO_VARIABLE_FALLBACK_FACTOR);

  const costoProduccionKg =
    kgProducidosAño > 0 ? costoTotalAnual / kgProducidosAño : 0;

  const margenUnitario = precioVenta - costoVariable;
  const puntoEquilibrioKg =
    margenUnitario > 0 ? costoTotalAnual / margenUnitario : Infinity;

  const margenContribucion =
    precioVenta > 0 ? (margenUnitario / precioVenta) * 100 : 0;

  return {
    costoProduccionKg,
    puntoEquilibrioKg:
      puntoEquilibrioKg === Infinity ? null : puntoEquilibrioKg,
    margenContribucion,
    tiempoRecuperacionMeses: roi.punto_equilibrio_meses,
    precioVentaKg: precioVenta,
    costoVariableKg: costoVariable,
    kgProducidosAño,
    costoAguaAnual: roi.costo_agua_anual,
    costoPlantasAmortizado,
    costoTotalAnual,
  };
}
