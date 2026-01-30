import type { CatalogoCultivo, SueloTerreno, CompatibilidadNivel } from '@/types'

export interface CompatibilidadSueloCultivo {
  cultivo_id: string
  cultivo_nombre: string
  nivel: CompatibilidadNivel
  problemas: string[]
}

export function evaluarCompatibilidadSuelo(
  suelo: SueloTerreno,
  cultivo: CatalogoCultivo
): CompatibilidadSueloCultivo {
  const problemas: string[] = []

  if (suelo.fisico?.ph != null) {
    if (suelo.fisico.ph < cultivo.ph_min) {
      problemas.push(`pH ${suelo.fisico.ph} menor al mínimo ${cultivo.ph_min}`)
    } else if (suelo.fisico.ph > cultivo.ph_max) {
      problemas.push(`pH ${suelo.fisico.ph} mayor al máximo ${cultivo.ph_max}`)
    }
  }

  if (suelo.quimico?.salinidad_dS_m != null) {
    if (suelo.quimico.salinidad_dS_m > cultivo.salinidad_tolerancia_dS_m) {
      const exceso = (suelo.quimico.salinidad_dS_m / cultivo.salinidad_tolerancia_dS_m).toFixed(1)
      problemas.push(
        `Salinidad suelo ${suelo.quimico.salinidad_dS_m} dS/m excede tolerancia ${cultivo.salinidad_tolerancia_dS_m} dS/m (${exceso}x)`
      )
    }
  }

  if (suelo.quimico?.boro_mg_l != null) {
    if (suelo.quimico.boro_mg_l > cultivo.boro_tolerancia_ppm) {
      problemas.push(
        `Boro suelo ${suelo.quimico.boro_mg_l} mg/L excede tolerancia ${cultivo.boro_tolerancia_ppm} ppm`
      )
    }
  }

  let nivel: CompatibilidadNivel = 'compatible'
  if (problemas.length >= 2) {
    nivel = 'no_compatible'
  } else if (problemas.length === 1) {
    const hayPhFuera = suelo.fisico?.ph != null &&
      (suelo.fisico.ph < cultivo.ph_min - 1 || suelo.fisico.ph > cultivo.ph_max + 1)
    const haySalinidadGrave = suelo.quimico?.salinidad_dS_m != null &&
      suelo.quimico.salinidad_dS_m > cultivo.salinidad_tolerancia_dS_m * 1.5

    if (hayPhFuera || haySalinidadGrave) {
      nivel = 'no_compatible'
    } else {
      nivel = 'limitado'
    }
  }

  return {
    cultivo_id: cultivo.id,
    cultivo_nombre: cultivo.nombre,
    nivel,
    problemas,
  }
}

export function evaluarCompatibilidadSueloMultiple(
  suelo: SueloTerreno,
  cultivos: CatalogoCultivo[]
): CompatibilidadSueloCultivo[] {
  return cultivos.map(c => evaluarCompatibilidadSuelo(suelo, c))
}
