import type { CatalogoCultivo, Zona, SueloTerreno } from '@/types'
import { calcularROI, type ProyeccionROI } from './roi'
import { calcularMetricasEconomicas, type MetricasEconomicas } from './economia-avanzada'
import { calcularFactorSuelo } from './calidad'

export interface EscenarioCultivo {
  cultivo: CatalogoCultivo
  roi: ProyeccionROI
  metricas: MetricasEconomicas
  consumoAguaAnualM3: number
  factorSuelo: number
}

export function compararCultivos(
  cultivos: CatalogoCultivo[],
  zona: Zona,
  suelo: SueloTerreno | null,
  costoAguaM3: number
): EscenarioCultivo[] {
  return cultivos.map(cultivo => {
    const espaciadoM2 = cultivo.espaciado_recomendado_m ** 2
    const numPlantas = espaciadoM2 > 0 ? Math.floor(zona.area_m2 / espaciadoM2) : 0
    const areaHa = zona.area_m2 / 10000

    const roi = calcularROI(cultivo, zona, numPlantas, costoAguaM3, undefined, suelo)
    const kgAño = roi.kg_año3
    const metricas = calcularMetricasEconomicas(roi, cultivo, kgAño)

    const aguaPromedioHaAño = (cultivo.agua_m3_ha_año_min + cultivo.agua_m3_ha_año_max) / 2
    const consumoAguaAnualM3 = aguaPromedioHaAño * areaHa

    const factorSueloVal = suelo ? calcularFactorSuelo(suelo, cultivo) : 1.0

    return {
      cultivo,
      roi,
      metricas,
      consumoAguaAnualM3,
      factorSuelo: factorSueloVal,
    }
  })
}
