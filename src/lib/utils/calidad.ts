import type { CatalogoCultivo, FuenteAgua, SueloTerreno } from '@/types'
import { CLIMA_ARICA } from '@/lib/data/clima-arica'

export type CategoriaCalidad = 'excelente' | 'buena' | 'aceptable' | 'riesgosa' | 'no_viable'

export interface ScoreCalidad {
  cultivo_id: string
  cultivo_nombre: string
  score_agua: number
  score_suelo: number
  score_clima: number
  score_riego: number
  score_total: number
  categoria: CategoriaCalidad
  factores_limitantes: string[]
  mejoras_sugeridas: string[]
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

function isValidNum(v: unknown): v is number {
  return typeof v === 'number' && !Number.isNaN(v) && Number.isFinite(v)
}

function calcScoreAgua(fuente: FuenteAgua | null, cultivo: CatalogoCultivo): { score: number; problemas: string[]; mejoras: string[] } {
  if (!fuente) return { score: 50, problemas: ['Sin fuente de agua asignada'], mejoras: ['Asignar fuente de agua al estanque'] }

  let score = 100
  const problemas: string[] = []
  const mejoras: string[] = []

  if (isValidNum(fuente.boro_ppm) && fuente.boro_ppm >= 0 && cultivo.boro_tolerancia_ppm > 0) {
    const ratio = fuente.boro_ppm / cultivo.boro_tolerancia_ppm
    if (ratio > 2) {
      score -= 60
      problemas.push(`Boro ${fuente.boro_ppm} ppm muy alto (tol: ${cultivo.boro_tolerancia_ppm})`)
      mejoras.push('Cambiar a fuente de agua con menor boro')
    } else if (ratio > 1) {
      score -= 30
      problemas.push(`Boro ${fuente.boro_ppm} ppm excede tolerancia`)
      mejoras.push('Considerar filtrado de agua o mezcla con agua de mejor calidad')
    }
  }

  if (isValidNum(fuente.salinidad_dS_m) && fuente.salinidad_dS_m >= 0 && cultivo.salinidad_tolerancia_dS_m > 0) {
    const ratio = fuente.salinidad_dS_m / cultivo.salinidad_tolerancia_dS_m
    if (ratio > 1.5) {
      score -= 40
      problemas.push(`Salinidad ${fuente.salinidad_dS_m} dS/m alta`)
    } else if (ratio > 1) {
      score -= 20
      problemas.push(`Salinidad ${fuente.salinidad_dS_m} dS/m en límite`)
    }
  }

  if (fuente.ph != null) {
    if (fuente.ph < cultivo.ph_min || fuente.ph > cultivo.ph_max) {
      score -= 15
      problemas.push(`pH agua ${fuente.ph} fuera de rango ${cultivo.ph_min}-${cultivo.ph_max}`)
    }
  }

  return { score: clamp(score, 0, 100), problemas, mejoras }
}

function calcScoreSuelo(suelo: SueloTerreno | null, cultivo: CatalogoCultivo): { score: number; problemas: string[]; mejoras: string[] } {
  if (!suelo) return { score: 50, problemas: ['Sin análisis de suelo'], mejoras: ['Realizar análisis de suelo (INIA ~$75,000)'] }

  let score = 100
  const problemas: string[] = []
  const mejoras: string[] = []

  if (isValidNum(suelo.fisico?.ph) && suelo.fisico!.ph >= 0 && suelo.fisico!.ph <= 14) {
    if (suelo.fisico!.ph < cultivo.ph_min) {
      score -= 25
      problemas.push(`pH suelo ${suelo.fisico!.ph} bajo (mín ${cultivo.ph_min})`)
      mejoras.push('Aplicar cal agrícola para subir pH')
    } else if (suelo.fisico!.ph > cultivo.ph_max) {
      score -= 25
      problemas.push(`pH suelo ${suelo.fisico!.ph} alto (máx ${cultivo.ph_max})`)
      mejoras.push('Aplicar azufre agrícola para bajar pH')
    }
  }

  if (isValidNum(suelo.quimico?.salinidad_dS_m) && suelo.quimico!.salinidad_dS_m >= 0 && suelo.quimico!.salinidad_dS_m > cultivo.salinidad_tolerancia_dS_m) {
    score -= 30
    problemas.push(`Salinidad suelo ${suelo.quimico.salinidad_dS_m} dS/m`)
    mejoras.push('Aplicar yeso agrícola y lavado de sales')
  }

  if (isValidNum(suelo.fisico?.materia_organica_pct) && suelo.fisico!.materia_organica_pct >= 0 && suelo.fisico!.materia_organica_pct < 2) {
    score -= 10
    mejoras.push('Aumentar materia orgánica con compost o humus')
  }

  return { score: clamp(score, 0, 100), problemas, mejoras }
}

export function calcularFactorSuelo(
  suelo: SueloTerreno | null,
  cultivo: CatalogoCultivo
): number {
  if (!suelo) return 1.0

  let factor = 1.0

  if (isValidNum(suelo.fisico?.ph) && suelo.fisico!.ph >= 0 && suelo.fisico!.ph <= 14) {
    const ph = suelo.fisico!.ph
    if (ph < cultivo.ph_min || ph > cultivo.ph_max) {
      const desviacion = Math.max(cultivo.ph_min - ph, ph - cultivo.ph_max)
      const penalizacion = Math.min(0.5, desviacion * 0.2)
      factor *= (1 - penalizacion)
    }
  }

  if (isValidNum(suelo.quimico?.salinidad_dS_m) && suelo.quimico!.salinidad_dS_m >= 0 && cultivo.salinidad_tolerancia_dS_m > 0) {
    const ratio = suelo.quimico!.salinidad_dS_m / cultivo.salinidad_tolerancia_dS_m
    if (ratio > 1.0) {
      const penalizacion = Math.min(0.6, (ratio - 1) * 0.3)
      factor *= (1 - penalizacion)
    }
  }

  if (isValidNum(suelo.quimico?.boro_mg_l) && suelo.quimico!.boro_mg_l >= 0 && cultivo.boro_tolerancia_ppm > 0) {
    const ratio = suelo.quimico!.boro_mg_l / cultivo.boro_tolerancia_ppm
    if (ratio > 1.0) {
      const penalizacion = Math.min(0.7, (ratio - 1) * 0.4)
      factor *= (1 - penalizacion)
    }
  }

  if (isValidNum(suelo.fisico?.materia_organica_pct) && suelo.fisico!.materia_organica_pct >= 0 && suelo.fisico!.materia_organica_pct < 2.0) {
    factor *= 0.9
  }

  return Math.max(0.1, factor)
}

function calcScoreClima(cultivo: CatalogoCultivo): { score: number; problemas: string[]; mejoras: string[] } {
  let score = 100
  const problemas: string[] = []
  const mejoras: string[] = []

  if (cultivo.clima) {
    const tempMax = CLIMA_ARICA.temperatura.maxima_verano_c
    const tempMin = CLIMA_ARICA.temperatura.minima_historica_c

    if (cultivo.clima.temp_max_c != null && tempMax > cultivo.clima.temp_max_c) {
      score -= 20
      problemas.push(`Temp máx Arica ${tempMax}°C excede tolerancia ${cultivo.clima.temp_max_c}°C`)
      mejoras.push('Instalar malla sombra en verano')
    }

    if (cultivo.clima.temp_min_c != null && tempMin < cultivo.clima.temp_min_c) {
      score -= 20
      problemas.push(`Temp mín Arica ${tempMin}°C bajo tolerancia ${cultivo.clima.temp_min_c}°C`)
    }

    if (cultivo.clima.horas_frio_requeridas != null && cultivo.clima.horas_frio_requeridas > CLIMA_ARICA.temperatura.horas_frio_aprox) {
      const deficit = cultivo.clima.horas_frio_requeridas - CLIMA_ARICA.temperatura.horas_frio_aprox
      const penalidad = Math.min(30, Math.round(deficit / 10))
      score -= penalidad
      problemas.push(`Requiere ${cultivo.clima.horas_frio_requeridas}h frío, Arica tiene ~${CLIMA_ARICA.temperatura.horas_frio_aprox}h`)
    }
  }

  return { score: clamp(score, 0, 100), problemas, mejoras }
}

function calcScoreRiego(aguaDisponibleM3: number, consumoSemanalM3: number): { score: number; problemas: string[]; mejoras: string[] } {
  if (consumoSemanalM3 <= 0) return { score: 100, problemas: [], mejoras: [] }

  const diasAgua = aguaDisponibleM3 / (consumoSemanalM3 / 7)
  const problemas: string[] = []
  const mejoras: string[] = []

  if (diasAgua < 7) {
    problemas.push(`Solo ${Math.floor(diasAgua)} días de agua`)
    mejoras.push('Aumentar capacidad de estanques o frecuencia de llenado')
    return { score: 10, problemas, mejoras }
  }
  if (diasAgua < 14) {
    problemas.push(`${Math.floor(diasAgua)} días de agua (ajustado)`)
    return { score: 50, problemas, mejoras }
  }
  if (diasAgua < 30) {
    return { score: 75, problemas, mejoras }
  }
  return { score: 100, problemas, mejoras }
}

function getCategoria(score: number): CategoriaCalidad {
  if (score >= 85) return 'excelente'
  if (score >= 70) return 'buena'
  if (score >= 50) return 'aceptable'
  if (score >= 30) return 'riesgosa'
  return 'no_viable'
}

export function calcularScoreCalidad(
  cultivo: CatalogoCultivo,
  fuente: FuenteAgua | null,
  suelo: SueloTerreno | null,
  aguaDisponibleM3: number,
  consumoSemanalM3: number
): ScoreCalidad {
  const agua = calcScoreAgua(fuente, cultivo)
  const sueloScore = calcScoreSuelo(suelo, cultivo)
  const clima = calcScoreClima(cultivo)
  const riego = calcScoreRiego(aguaDisponibleM3, consumoSemanalM3)

  const total = Math.round(
    agua.score * 0.30 +
    sueloScore.score * 0.25 +
    clima.score * 0.20 +
    riego.score * 0.25
  )

  return {
    cultivo_id: cultivo.id,
    cultivo_nombre: cultivo.nombre,
    score_agua: agua.score,
    score_suelo: sueloScore.score,
    score_clima: clima.score,
    score_riego: riego.score,
    score_total: total,
    categoria: getCategoria(total),
    factores_limitantes: [...agua.problemas, ...sueloScore.problemas, ...clima.problemas, ...riego.problemas],
    mejoras_sugeridas: [...agua.mejoras, ...sueloScore.mejoras, ...clima.mejoras, ...riego.mejoras],
  }
}
