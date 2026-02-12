'use client'

import { useState, useEffect, useCallback } from 'react'
import { terrenosDAL, zonasDAL, plantasDAL, transaccionesDAL } from '@/lib/dal'
import { generateUUID, getCurrentTimestamp } from '@/lib/utils'
import type { Terreno, UUID } from '@/types'
import { SUELO_DEFAULT_AZAPA } from '@/lib/data'

interface EliminacionCascada {
  zonas: number
  plantas: number
}

interface UseTerrenos {
  terrenos: Terreno[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>

  crearTerreno: (data: {
    proyecto_id: UUID
    nombre: string
    ancho_m: number
    alto_m: number
  }) => Promise<Terreno>

  editarTerreno: (id: UUID, data: {
    nombre?: string
    ancho_m?: number
    alto_m?: number
  }) => Promise<{ error?: string }>

  actualizarTerreno: (id: UUID, data: Partial<Terreno>) => Promise<void>

  eliminarTerreno: (id: UUID) => Promise<{ eliminados: EliminacionCascada }>

  contarContenido: (id: UUID) => Promise<EliminacionCascada>
}

export function useTerrenos(proyectoId: UUID | null): UseTerrenos {
  const [terrenos, setTerrenos] = useState<Terreno[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
    if (!proyectoId) {
      setTerrenos([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await terrenosDAL.getByProyectoId(proyectoId)
      setTerrenos(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error cargando terrenos'))
    } finally {
      setLoading(false)
    }
  }, [proyectoId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const crearTerreno = useCallback(async (data: {
    proyecto_id: UUID
    nombre: string
    ancho_m: number
    alto_m: number
  }): Promise<Terreno> => {
    const timestamp = getCurrentTimestamp()
    const nuevoTerreno: Terreno = {
      id: generateUUID(),
      proyecto_id: data.proyecto_id,
      nombre: data.nombre,
      ancho_m: data.ancho_m,
      alto_m: data.alto_m,
      area_m2: data.ancho_m * data.alto_m,
      agua_disponible_m3: 0,
      agua_actual_m3: 0,
      sistema_riego: {
        litros_hora: 0,
        descuento_auto: false,
        ultima_actualizacion: timestamp,
      },
      suelo: SUELO_DEFAULT_AZAPA,
      ultima_simulacion_agua: timestamp,
      created_at: timestamp,
      updated_at: timestamp,
    }

    await terrenosDAL.add(nuevoTerreno)
    await fetchData()
    return nuevoTerreno
  }, [fetchData])

  const editarTerreno = useCallback(async (
    id: UUID,
    data: { nombre?: string; ancho_m?: number; alto_m?: number }
  ): Promise<{ error?: string }> => {
    const terreno = await terrenosDAL.getById(id)
    if (!terreno) {
      return { error: 'Terreno no encontrado' }
    }

    const nuevoAncho = data.ancho_m ?? terreno.ancho_m
    const nuevoAlto = data.alto_m ?? terreno.alto_m

    if (data.ancho_m !== undefined || data.alto_m !== undefined) {
      const zonas = await zonasDAL.getByTerrenoId(id)
      for (const zona of zonas) {
        if (zona.x + zona.ancho > nuevoAncho) {
          return { error: `La zona "${zona.nombre}" excedería el nuevo ancho del terreno` }
        }
        if (zona.y + zona.alto > nuevoAlto) {
          return { error: `La zona "${zona.nombre}" excedería el nuevo alto del terreno` }
        }
      }
    }

    const updates: Partial<Terreno> = {
      ...data,
      updated_at: getCurrentTimestamp(),
    }

    if (data.ancho_m !== undefined || data.alto_m !== undefined) {
      updates.area_m2 = nuevoAncho * nuevoAlto
    }

    await terrenosDAL.update(id, updates)
    await fetchData()
    return {}
  }, [fetchData])

  const actualizarTerreno = useCallback(async (
    id: UUID,
    data: Partial<Terreno>
  ): Promise<void> => {
    const updates = {
      ...data,
      updated_at: getCurrentTimestamp(),
    }
    delete updates.id
    delete updates.proyecto_id
    delete updates.created_at

    await terrenosDAL.update(id, updates)
    await fetchData()
  }, [fetchData])

  const contarContenido = useCallback(async (id: UUID): Promise<EliminacionCascada> => {
    const zonas = await zonasDAL.getByTerrenoId(id)
    const zonaIds = zonas.map(z => z.id)

    let plantasCount = 0
    if (zonaIds.length > 0) {
      plantasCount = await plantasDAL.countByZonaIds(zonaIds)
    }

    return {
      zonas: zonas.length,
      plantas: plantasCount,
    }
  }, [])

  const eliminarTerreno = useCallback(async (id: UUID): Promise<{ eliminados: EliminacionCascada }> => {
    const conteo = await contarContenido(id)
    await transaccionesDAL.eliminarTerrenoCascade(id)
    await fetchData()
    return { eliminados: conteo }
  }, [fetchData, contarContenido])

  return {
    terrenos,
    loading,
    error,
    refetch: fetchData,
    crearTerreno,
    editarTerreno,
    actualizarTerreno,
    eliminarTerreno,
    contarContenido,
  }
}
