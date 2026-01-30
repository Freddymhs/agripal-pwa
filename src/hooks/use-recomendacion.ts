'use client'

import { useState, useCallback } from 'react'
import {
  filtrarCultivosViables,
  rankearCultivosViables,
  calcularAguaPorCultivo,
  simularConsumoEstacional,
} from '@/lib/validations/cultivo-restricciones'
import { calcularAguaAnualAutomatica } from '@/lib/utils/agua-calculo-anual'
import { CULTIVOS_ARICA } from '@/lib/data/cultivos-arica'
import type { Terreno, CatalogoCultivo, Zona, EntradaAgua, Planta } from '@/types'

export interface CultivoRecomendado {
  cultivo: CatalogoCultivo
  score: number
  razon: string
}

export interface Recomendacion {
  cultivos_viables: CultivoRecomendado[]
  cultivos_noViables: { cultivo: CatalogoCultivo; razones: string[] }[]
  agua_total_anual_m3: number
  agua_semanal_m3: number
  agua_diaria_m3: number
  consumo_estacional: Array<{
    mes: number
    mes_nombre: string
    agua_m3: number
    variacion_respecto_promedio: number
  }>
  agua_disponible_anual_m3: number
  riesgos_criticos: string[]
  advertencias: string[]
  resumen: string
}

interface UseRecomendacion {
  recomendacion: Recomendacion | null
  loading: boolean
  error: Error | null
  calcularRecomendacion: (
    terreno: Terreno,
    estanques: Zona[],
    entradasAgua: EntradaAgua[],
    zonas: Zona[],
    plantas: Planta[],
    catalogoCultivos: CatalogoCultivo[],
    area_ha?: number
  ) => Promise<void>
  seleccionados: { cultivo: CatalogoCultivo; area_ha: number }[]
  toggleSeleccionar: (cultivo: CatalogoCultivo, area_ha: number, incluir: boolean) => void
  calcularAguaSeleccionados: () => { agua_anual: number; agua_semanal: number; agua_diaria: number }
}

export function useRecomendacion(): UseRecomendacion {
  const [recomendacion, setRecomendacion] = useState<Recomendacion | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [seleccionados, setSeleccionados] = useState<{ cultivo: CatalogoCultivo; area_ha: number }[]>([])

  const calcularRecomendacion = useCallback(
    async (
      terreno: Terreno,
      estanques: Zona[],
      entradasAgua: EntradaAgua[],
      zonas: Zona[],
      plantas: Planta[],
      catalogoCultivos: CatalogoCultivo[],
      area_ha?: number
    ) => {
      try {
        setLoading(true)
        setError(null)

        const areaHaFinal = area_ha ?? terreno.area_m2 / 10000

        const calculoAgua = calcularAguaAnualAutomatica(
          estanques,
          entradasAgua,
          zonas,
          plantas,
          catalogoCultivos
        )

        const { viables, noViables } = filtrarCultivosViables(
          CULTIVOS_ARICA,
          terreno,
          areaHaFinal,
          calculoAgua.aguaAnualM3
        )

        const ranked = rankearCultivosViables(viables, 'rentabilidad')

        const cultivos_viables: CultivoRecomendado[] = ranked.map(({ cultivo, validacion, score }) => ({
          cultivo,
          score,
          razon: validacion.recomendacion || 'Viable pero con restricciones',
        }))

        const cultivos_noViables = noViables.map(({ cultivo, validacion }) => ({
          cultivo,
          razones: validacion.restricciones,
        }))

        const riesgos_criticos: string[] = []
        const advertencias: string[] = []

        if (!terreno.agua_calidad_salinidad_dS_m) {
          riesgos_criticos.push(
            'CRÍTICO: Salinidad agua desconocida. Río Lluta históricamente > 2 dS/m. Análisis INIA obligatorio antes de invertir $3.12M'
          )
        }

        if (!terreno.agua_calidad_boro_ppm) {
          riesgos_criticos.push(
            'CRÍTICO: Boro en agua desconocido. Río Lluta > 11 ppm documentado. Si > 2 ppm, cultivos no viables sin filtración ($500k/año)'
          )
        }

        if (!terreno.suelo_ph) {
          advertencias.push('pH suelo desconocido. Análisis INIA recomendado para confirmar compatibilidad')
        }

        advertencias.push('Arica: 14 brotes mosca de fruta activos (Dic 2024). Monitoreo SAG obligatorio. Prohibición venta si brote (Feb 2025)')

        const agua_total = calcularAguaPorCultivo(
          cultivos_viables.map(({ cultivo }) => ({ cultivo, area_ha: areaHaFinal }))
        )

        const consumo_estacional = simularConsumoEstacional(
          cultivos_viables.map(({ cultivo }) => ({ cultivo, area_ha: areaHaFinal }))
        )

        const margen_agua = calculoAgua.aguaAnualM3 - agua_total.agua_anual_m3
        const porcentaje_margen = calculoAgua.aguaAnualM3 > 0
          ? (margen_agua / calculoAgua.aguaAnualM3) * 100
          : 0

        let resumen = ''

        if (cultivos_viables.length === 0) {
          resumen = `⚠️ NO HAY CULTIVOS VIABLES. ${cultivos_noViables.length} cultivos descartados por restricciones de agua/suelo.`
        } else if (porcentaje_margen < 10) {
          resumen = `⚠️ AGUA AJUSTADA: ${cultivos_viables.length} cultivos viables pero agua muy justa (margen ${porcentaje_margen.toFixed(0)}%). Considerar RDC, hidrogel o mulch.`
        } else if (porcentaje_margen < 20) {
          resumen = `✅ VIABLE pero ajustado: ${cultivos_viables.length} cultivos con margen moderado (${porcentaje_margen.toFixed(0)}%). Manejo agua crítico.`
        } else {
          resumen = `✅ VIABLE: ${cultivos_viables.length} cultivos recomendados con buen margen de agua (${porcentaje_margen.toFixed(0)}%).`
        }

        setRecomendacion({
          cultivos_viables,
          cultivos_noViables,
          agua_total_anual_m3: agua_total.agua_anual_m3,
          agua_semanal_m3: agua_total.agua_semanal_m3,
          agua_diaria_m3: agua_total.agua_diaria_m3,
          agua_disponible_anual_m3: calculoAgua.aguaAnualM3,
          consumo_estacional,
          riesgos_criticos,
          advertencias,
          resumen,
        })

        setLoading(false)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Error calculando recomendación')
        setError(error)
        setLoading(false)
      }
    },
    []
  )

  const toggleSeleccionar = useCallback(
    (cultivo: CatalogoCultivo, area_ha: number, incluir: boolean) => {
      setSeleccionados(prev => {
        if (incluir) {
          return [...prev, { cultivo, area_ha }]
        } else {
          return prev.filter(s => s.cultivo.id !== cultivo.id)
        }
      })
    },
    []
  )

  const calcularAguaSeleccionados = useCallback(() => {
    if (seleccionados.length === 0) {
      return { agua_anual: 0, agua_semanal: 0, agua_diaria: 0 }
    }

    const agua = calcularAguaPorCultivo(seleccionados)
    return {
      agua_anual: agua.agua_anual_m3,
      agua_semanal: agua.agua_semanal_m3,
      agua_diaria: agua.agua_diaria_m3,
    }
  }, [seleccionados])

  return {
    recomendacion,
    loading,
    error,
    calcularRecomendacion,
    seleccionados,
    toggleSeleccionar,
    calcularAguaSeleccionados,
  }
}
