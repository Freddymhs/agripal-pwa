import type { SueloTerreno } from "@/types";

/**
 * Valores de ejemplo para inicializar el formulario de suelo al crear un proyecto.
 * NO representan ninguna zona geográfica específica.
 *
 * El usuario DEBE reemplazar estos valores con su análisis de laboratorio real.
 * Mientras analisis_realizado = false, el sistema mostrará advertencias.
 *
 * Valores basados en suelo desértico árido típico del norte de Chile antes de intervención.
 */
export const SUELO_EJEMPLO: SueloTerreno = {
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
