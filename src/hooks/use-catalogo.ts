'use client'

import { useEffect, useState, useCallback } from 'react'
import { catalogoDAL } from '@/lib/dal'
import { generateUUID, getCurrentTimestamp } from '@/lib/utils'
import { CULTIVOS_ARICA } from '@/lib/data/cultivos-arica'
import type { CatalogoCultivo, UUID } from '@/types'

interface UseCatalogo {
  cultivos: CatalogoCultivo[]
  loading: boolean
  error: Error | null

  agregarCultivo: (data: Omit<CatalogoCultivo, 'id' | 'proyecto_id' | 'created_at' | 'updated_at'>) => Promise<CatalogoCultivo>
  actualizarCultivo: (id: UUID, cambios: Partial<CatalogoCultivo>) => Promise<void>
  eliminarCultivo: (id: UUID) => Promise<void>
  obtenerCultivo: (id: UUID) => CatalogoCultivo | undefined
}

export function useCatalogo(proyectoId: UUID | null): UseCatalogo {
  const [cultivos, setCultivos] = useState<CatalogoCultivo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function cargar() {
      if (!proyectoId) {
        setCultivos([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const data = await catalogoDAL.getByProyectoId(proyectoId)

        if (data.length === 0) {
          const timestamp = getCurrentTimestamp()
          const cultivosIniciales: CatalogoCultivo[] = []

          for (const cultivo of CULTIVOS_ARICA) {
            const { id, proyecto_id, created_at, updated_at, ...cultivoData } = cultivo as CatalogoCultivo & { proyecto_id?: string }
            const nuevoCultivo: CatalogoCultivo = {
              ...cultivoData,
              id: generateUUID(),
              proyecto_id: proyectoId,
              created_at: timestamp,
              updated_at: timestamp,
            }
            await catalogoDAL.add(nuevoCultivo)
            cultivosIniciales.push(nuevoCultivo)
          }

          setCultivos(cultivosIniciales)
        } else {
          setCultivos(data)
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Error al cargar catálogo'))
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [proyectoId])

  const agregarCultivo = useCallback(async (
    data: Omit<CatalogoCultivo, 'id' | 'proyecto_id' | 'created_at' | 'updated_at'>
  ) => {
    if (!proyectoId) {
      throw new Error('No hay proyecto seleccionado')
    }

    const nuevo: CatalogoCultivo = {
      ...data,
      id: generateUUID(),
      proyecto_id: proyectoId,
      created_at: getCurrentTimestamp(),
      updated_at: getCurrentTimestamp(),
    }

    await catalogoDAL.add(nuevo)
    setCultivos(prev => [...prev, nuevo])
    return nuevo
  }, [proyectoId])

  const actualizarCultivo = useCallback(async (id: UUID, cambios: Partial<CatalogoCultivo>) => {
    await catalogoDAL.update(id, {
      ...cambios,
      updated_at: getCurrentTimestamp(),
    })
    setCultivos(prev => prev.map(c =>
      c.id === id ? { ...c, ...cambios, updated_at: getCurrentTimestamp() } : c
    ))
  }, [])

  const eliminarCultivo = useCallback(async (id: UUID) => {
    await catalogoDAL.delete(id)
    setCultivos(prev => prev.filter(c => c.id !== id))
  }, [])

  const obtenerCultivo = useCallback((id: UUID) => {
    return cultivos.find(c => c.id === id)
  }, [cultivos])

  return {
    cultivos,
    loading,
    error,
    agregarCultivo,
    actualizarCultivo,
    eliminarCultivo,
    obtenerCultivo,
  }
}
