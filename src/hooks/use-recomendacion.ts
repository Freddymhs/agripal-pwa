'use client'

import { useState, useCallback } from 'react'
import { logger } from '@/lib/logger'
import { calcularAguaPorCultivo } from '@/lib/validations/cultivo-restricciones'
import { calcularRecomendacionCultivos } from '@/lib/utils/recomendacion'
import type { Terreno, CatalogoCultivo, Zona, EntradaAgua, Planta } from '@/types'
import type { CultivoRecomendado, Recomendacion } from '@/lib/utils/recomendacion'

export type { CultivoRecomendado, Recomendacion }

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

        const resultado = calcularRecomendacionCultivos(
          terreno,
          estanques,
          entradasAgua,
          zonas,
          plantas,
          catalogoCultivos,
          area_ha
        )

        setRecomendacion(resultado)
        setLoading(false)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Error calculando recomendacion')
        logger.error('Error calculando recomendación', { error })
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
