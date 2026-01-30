import type { CatalogoCultivo } from '@/types'
import type { ProyeccionROI } from './roi'

export interface MetricasEconomicas {
  costoProduccionKg: number
  puntoEquilibrioKg: number | null
  margenContribucion: number
  tiempoRecuperacionMeses: number | null
  precioVentaKg: number
  costoVariableKg: number
  kgProducidosAño: number
}

export function calcularMetricasEconomicas(
  roi: ProyeccionROI,
  cultivo: CatalogoCultivo,
  kgProducidosAño: number
): MetricasEconomicas {
  const costoTotalAnual = roi.costo_agua_anual
  const precioVenta = (cultivo.precio_kg_min_clp + cultivo.precio_kg_max_clp) / 2
  const costoVariable = cultivo.costo_variable_kg ?? (costoTotalAnual > 0 && kgProducidosAño > 0
    ? (costoTotalAnual / kgProducidosAño) * 0.6
    : precioVenta * 0.4)

  const costoProduccionKg = kgProducidosAño > 0
    ? costoTotalAnual / kgProducidosAño
    : 0

  const margenUnitario = precioVenta - costoVariable
  const puntoEquilibrioKg = margenUnitario > 0
    ? costoTotalAnual / margenUnitario
    : Infinity

  const margenContribucion = precioVenta > 0
    ? (margenUnitario / precioVenta) * 100
    : 0

  const ingresoNetoMensual = roi.ingreso_año2 > 0
    ? (roi.ingreso_año2 - roi.costo_agua_anual) / 12
    : 0
  const tiempoRecuperacionMeses = ingresoNetoMensual > 0 && roi.inversion_total > 0
    ? Math.ceil(roi.inversion_total / ingresoNetoMensual)
    : null

  return {
    costoProduccionKg,
    puntoEquilibrioKg: puntoEquilibrioKg === Infinity ? null : puntoEquilibrioKg,
    margenContribucion,
    tiempoRecuperacionMeses,
    precioVentaKg: precioVenta,
    costoVariableKg: costoVariable,
    kgProducidosAño,
  }
}
