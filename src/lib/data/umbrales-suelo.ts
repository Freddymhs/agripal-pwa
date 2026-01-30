import sueloData from '../../../data/static/umbrales/suelo.json'

export interface UmbralConfig {
  max?: number
  min?: number
  unidad: string
  alerta: string
}

const SUELO_STATIC = sueloData as typeof sueloData

export const UMBRALES_SUELO = SUELO_STATIC.UMBRALES_SUELO

export type TexturaSuelo = 'arenosa' | 'franco-arenosa' | 'franco' | 'franco-arcillosa' | 'arcillosa'
export type DrenajeSuelo = 'rapido' | 'bueno' | 'moderado' | 'lento'

export interface AnalisisFisico {
  ph?: number
  textura?: TexturaSuelo
  drenaje?: DrenajeSuelo
  profundidad_efectiva_cm?: number
  materia_organica_pct?: number
}

export interface AnalisisQuimico {
  analisis_realizado?: boolean
  fecha_analisis?: string
  laboratorio?: string
  salinidad_dS_m?: number
  boro_mg_l?: number
  arsenico_mg_l?: number
  nitrogeno_ppm?: number
  fosforo_ppm?: number
  potasio_ppm?: number
  calcio_ppm?: number
  magnesio_ppm?: number
}

export interface SueloAnalisis {
  fisico?: AnalisisFisico
  quimico?: AnalisisQuimico
}

export type NivelAlerta = 'ok' | 'advertencia' | 'critico'

export interface EvaluacionSuelo {
  viable: boolean
  nivel: NivelAlerta
  problemas: string[]
  advertencias: string[]
}

export function evaluarSuelo(suelo?: SueloAnalisis): EvaluacionSuelo {
  const problemas: string[] = []
  const advertencias: string[] = []

  if (!suelo?.quimico?.analisis_realizado) {
    advertencias.push('Sin análisis de laboratorio - datos no verificados')
  }

  if (suelo?.quimico?.salinidad_dS_m !== undefined) {
    if (suelo.quimico.salinidad_dS_m > UMBRALES_SUELO.salinidad.max) {
      problemas.push(`Salinidad ${suelo.quimico.salinidad_dS_m} dS/m > ${UMBRALES_SUELO.salinidad.max} (MUY ALTO)`)
    } else if (suelo.quimico.salinidad_dS_m > UMBRALES_SUELO.salinidad.max * 0.75) {
      advertencias.push(`Salinidad ${suelo.quimico.salinidad_dS_m} dS/m - cerca del límite`)
    }
  }

  if (suelo?.quimico?.boro_mg_l !== undefined) {
    if (suelo.quimico.boro_mg_l > UMBRALES_SUELO.boro.max) {
      problemas.push(`Boro ${suelo.quimico.boro_mg_l} mg/L > ${UMBRALES_SUELO.boro.max} (TÓXICO para frutales)`)
    } else if (suelo.quimico.boro_mg_l > UMBRALES_SUELO.boro.max * 0.75) {
      advertencias.push(`Boro ${suelo.quimico.boro_mg_l} mg/L - cerca del límite`)
    }
  }

  if (suelo?.quimico?.arsenico_mg_l !== undefined) {
    if (suelo.quimico.arsenico_mg_l > UMBRALES_SUELO.arsenico.max) {
      problemas.push(`Arsénico ${suelo.quimico.arsenico_mg_l} mg/L > ${UMBRALES_SUELO.arsenico.max} (RIESGO SALUD)`)
    }
  }

  if (suelo?.fisico?.ph !== undefined) {
    if (suelo.fisico.ph < UMBRALES_SUELO.ph.min || suelo.fisico.ph > UMBRALES_SUELO.ph.max) {
      advertencias.push(`pH ${suelo.fisico.ph} fuera del rango óptimo (${UMBRALES_SUELO.ph.min}-${UMBRALES_SUELO.ph.max})`)
    }
  }

  if (suelo?.fisico?.profundidad_efectiva_cm !== undefined) {
    if (suelo.fisico.profundidad_efectiva_cm < UMBRALES_SUELO.profundidad_frutales.min) {
      advertencias.push(`Profundidad ${suelo.fisico.profundidad_efectiva_cm}cm < ${UMBRALES_SUELO.profundidad_frutales.min}cm (limitado para frutales)`)
    }
  }

  let nivel: NivelAlerta = 'ok'
  if (problemas.length > 0) nivel = 'critico'
  else if (advertencias.length > 0) nivel = 'advertencia'

  return {
    viable: problemas.length === 0,
    nivel,
    problemas,
    advertencias,
  }
}
