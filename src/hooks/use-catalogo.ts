'use client'

import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { catalogoDAL, transaccionesDAL } from '@/lib/dal'
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
  const queryClient = useQueryClient()

  const {
    data: cultivos = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['catalogo', proyectoId],
    queryFn: async () => {
      if (!proyectoId) return []

      const data = await catalogoDAL.getByProyectoId(proyectoId)

      if (data.length === 0) {
        const timestamp = getCurrentTimestamp()
        const cultivosIniciales: CatalogoCultivo[] = CULTIVOS_ARICA.map(cultivo => {
          const { id, proyecto_id, created_at, updated_at, ...cultivoData } = cultivo as CatalogoCultivo & { proyecto_id?: string }
          return {
            ...cultivoData,
            id: generateUUID(),
            proyecto_id: proyectoId,
            created_at: timestamp,
            updated_at: timestamp,
          } as CatalogoCultivo
        })
        await transaccionesDAL.seedCatalogo(cultivosIniciales)
        return cultivosIniciales
      }

      return data
    },
    enabled: !!proyectoId,
  })

  const agregarCultivoMutation = useMutation({
    mutationFn: async (data: Omit<CatalogoCultivo, 'id' | 'proyecto_id' | 'created_at' | 'updated_at'>) => {
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
      return nuevo
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalogo', proyectoId] })
    },
  })

  const actualizarCultivoMutation = useMutation({
    mutationFn: async (params: { id: UUID; cambios: Partial<CatalogoCultivo> }) => {
      await catalogoDAL.update(params.id, {
        ...params.cambios,
        updated_at: getCurrentTimestamp(),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalogo', proyectoId] })
    },
  })

  const eliminarCultivoMutation = useMutation({
    mutationFn: async (id: UUID) => {
      await catalogoDAL.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalogo', proyectoId] })
    },
  })

  const obtenerCultivo = useCallback((id: UUID) => {
    return cultivos.find(c => c.id === id)
  }, [cultivos])

  return {
    cultivos,
    loading: isLoading,
    error: error instanceof Error ? error : null,
    agregarCultivo: (data) => agregarCultivoMutation.mutateAsync(data),
    actualizarCultivo: (id, cambios) => actualizarCultivoMutation.mutateAsync({ id, cambios }),
    eliminarCultivo: (id) => eliminarCultivoMutation.mutateAsync(id),
    obtenerCultivo,
  }
}
