export const M2_POR_HECTAREA = 10_000;
export const SEMANAS_POR_AÑO = 52;
export const DIAS_POR_SEMANA = 7;
export const SEMANAS_POR_MES = 4.33;
export const MS_POR_DIA = 86_400_000;

export const DIAS_LAVADO_SALINO = 30;
export const ESPACIADO_MINIMO_M = 0.5;
export const MARGEN_BORDE_MINIMO_M = 2;
export const MIN_DIAS_DESCUENTO = 0.04;

export const PORCENTAJE_CICLO_REPLANTA = 0.9;
export const PRECIO_PLANTA_FACTOR = 0.5;
export const COSTO_VARIABLE_FACTOR = 0.6;
export const COSTO_VARIABLE_FALLBACK_FACTOR = 0.4;
export const AÑOS_AMORTIZACION_PLANTAS = 5;

/**
 * Factor de eficiencia de riego aplicado a la producción proyectada.
 * Refleja que el goteo programado optimiza el uso del agua → mayor rendimiento.
 * El continuo desperdicia agua (siempre abierto) → menor aprovechamiento.
 * Sin configuración → sin penalización (estimado teórico ya es conservador).
 */
export const FACTOR_EFICIENCIA_RIEGO: Record<string, number> = {
  programado: 1.0,
  manual_sesiones: 0.9,
  continuo_24_7: 0.85,
  manual_balde: 0.8,
} as const;
export const FACTOR_EFICIENCIA_RIEGO_DEFAULT = 1.0;

/**
 * Kr — Coeficiente de Reducción por Cobertura (FAO/INIA).
 * Plantas jóvenes consumen mucho menos agua que adultas.
 * Basado en método de fracción de sombra validado por INIA para Azapa.
 * Índice: [año1, año2, año3, año4, año5+]
 */
export const KR_POR_AÑO = [0.15, 0.4, 0.7, 0.7, 1.0] as const;

/**
 * Fracción de Lavado estática (FL) por tolerancia a salinidad del cultivo.
 * Fallback cuando no se conoce la CE del agua de riego.
 * Asume agua aljibe/potable (CE ~0.5 dS/m).
 */
export const FRACCION_LAVADO: Record<string, number> = {
  alta: 0.02,
  media: 0.04,
  baja: 0.075,
} as const;

/**
 * Fracción de Lavado FAO-56 dinámica:
 *   LF = ECw / (2 × ECe_max − ECw)
 *
 * Donde:
 *   ECw = conductividad del agua de riego (dS/m)
 *   ECe_max = umbral de salinidad del cultivo (dS/m, desde catalogo_cultivo.salinidad_tolerancia_dS_m)
 *
 * Retorna la FL calculada si ambos datos están disponibles y el denominador es positivo.
 * Si ECw >= 2×ECe_max (agua demasiado salina), retorna null → el cultivo no es viable con esa agua.
 * Límite inferior: nunca menos que el fallback estático (FRACCION_LAVADO) para no subestimar.
 */
export function calcularFraccionLavadoFAO(
  ecwDsM: number | undefined | null,
  eceMaxDsM: number | undefined | null,
  toleranciaSalinidad?: string,
): number {
  const fallback = toleranciaSalinidad
    ? (FRACCION_LAVADO[toleranciaSalinidad] ?? 0)
    : 0;

  if (ecwDsM == null || eceMaxDsM == null || ecwDsM <= 0 || eceMaxDsM <= 0) {
    return fallback;
  }

  const denominador = 2 * eceMaxDsM - ecwDsM;
  if (denominador <= 0) return fallback;

  const flFAO = ecwDsM / denominador;
  return Math.max(flFAO, fallback);
}

/**
 * Perfiles de calidad de cosecha — distribución % por categoría (1ª/2ª/3ª).
 * Básico: agricultor sin selección, cosecha mixta.
 * Estándar: selección manual post-cosecha, calibre mínimo.
 * Premium: manejo integrado, poda/raleo, calibre exportación.
 */
export const PERFILES_CALIDAD = {
  basico: { primera: 0.2, segunda: 0.5, tercera: 0.3 },
  estandar: { primera: 0.4, segunda: 0.45, tercera: 0.15 },
  premium: { primera: 0.7, segunda: 0.25, tercera: 0.05 },
} as const;

/**
 * Multiplicadores de precio por categoría de calidad (sobre precio base).
 * 1ª = exportación/premium → 1.4x
 * 2ª = mercado estándar → 1.0x (precio base)
 * 3ª = proceso/descarte → 0.6x
 * Dato INIA: caja 1ª vale ~240% de caja 3ª → 1.4/0.6 = 2.33x (consistente).
 */
export const CALIDAD_PRECIO_DEFAULT = {
  primera: 1.4,
  segunda: 1.0,
  tercera: 0.6,
} as const;

// Umbral a partir del cual el chequeo O(n²) de solapamiento se omite.
// Plantas colocadas por grid automático nunca se solapan; el check es inútil
// para zonas grandes y bloquea el hilo principal.
export const MAX_PLANTAS_OVERLAP_CHECK = 80;

export const DIAS_POR_MES_PROMEDIO = 30;
export const DIAS_POR_AÑO = 365;
/** Estimación de llenadas/año para estanques sin recarga configurada (~1 cada 2 semanas) */
export const RECARGAS_AÑO_FALLBACK = 26;
export const HORAS_POR_DIA = 24;
export const LITROS_POR_M3 = 1000;
export const LITROS_POR_BALDE = 20;
export const MESES_POR_AÑO = 12;

/** Terreno piloto de referencia: pampa elevada sobre Valle de Azapa, Arica */
export const UBICACION_PILOTO = {
  coordenadas: "-18.3660, -70.0450",
  altitud_m: 1086,
  region: "Arica y Parinacota",
  zona: "Pampa elevada sobre Valle de Azapa",
} as const;
