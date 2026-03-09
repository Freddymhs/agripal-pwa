import type { SueloTerreno } from "@/types";

/**
 * Default para pampa elevada sobre valle de Azapa (zona de meseta/desierto).
 * Asume intervención mínima: primer leaching realizado, enmienda orgánica básica.
 * Suelo real sin intervención es mucho peor (EC 10-50+, pH 9+, boro 10-100+ mg/kg).
 * El usuario DEBE reemplazar con análisis de laboratorio real (analisis_realizado: true).
 */
export const SUELO_DEFAULT_AZAPA: SueloTerreno = {
  fisico: {
    ph: 8.2,
    textura: "arenosa",
    drenaje: "rapido",
    profundidad_efectiva_cm: 35,
    materia_organica_pct: 0.3,
  },
  quimico: {
    analisis_realizado: false,
    salinidad_dS_m: 5.0,
    boro_mg_l: 4.0,
    arsenico_mg_l: 0.08,
    nitrogeno_ppm: 5,
    fosforo_ppm: 3,
    potasio_ppm: 80,
    calcio_ppm: 2500,
    magnesio_ppm: 60,
  },
};
