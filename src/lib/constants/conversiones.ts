export const M2_POR_HECTAREA = 10_000;
export const SEMANAS_POR_AÑO = 52;
export const DIAS_POR_SEMANA = 7;
export const SEMANAS_POR_MES = 4.33;
export const MS_POR_DIA = 86_400_000;

export const DIAS_LAVADO_SALINO = 30;
export const ESPACIADO_MINIMO_M = 0.5;
export const MIN_DIAS_DESCUENTO = 0.04;

export const PORCENTAJE_CICLO_REPLANTA = 0.9;
export const PRECIO_PLANTA_FACTOR = 0.5;
export const COSTO_VARIABLE_FACTOR = 0.6;
export const COSTO_VARIABLE_FALLBACK_FACTOR = 0.4;

// Umbral a partir del cual el chequeo O(n²) de solapamiento se omite.
// Plantas colocadas por grid automático nunca se solapan; el check es inútil
// para zonas grandes y bloquea el hilo principal.
export const MAX_PLANTAS_OVERLAP_CHECK = 80;

export const DIAS_POR_MES_PROMEDIO = 30;
export const DIAS_POR_AÑO = 365;
export const HORAS_POR_DIA = 24;
export const MESES_POR_AÑO = 12;

/** Terreno piloto de referencia: pampa elevada sobre Valle de Azapa, Arica */
export const UBICACION_PILOTO = {
  coordenadas: "-18.3660, -70.0450",
  altitud_m: 1086,
  region: "Arica y Parinacota",
  zona: "Pampa elevada sobre Valle de Azapa",
} as const;
