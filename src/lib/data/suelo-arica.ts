import type { SueloTerreno } from '@/types'

export const SUELO_DEFAULT_AZAPA: SueloTerreno = {
  fisico: {
    ph: 7.6,
    textura: 'franco-arenosa',
    drenaje: 'bueno',
    profundidad_efectiva_cm: 90,
    materia_organica_pct: 1.5,
  },
  quimico: {
    analisis_realizado: false,
    salinidad_dS_m: 2.5,
    boro_mg_l: 0.7,
    arsenico_mg_l: 0.035,
    nitrogeno_ppm: 12,
    fosforo_ppm: 10,
    potasio_ppm: 175,
    calcio_ppm: 1350,
    magnesio_ppm: 100,
  },
}
