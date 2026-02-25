'use client'

import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { proyectosDAL, terrenosDAL, zonasDAL, plantasDAL, catalogoDAL, transaccionesDAL } from '@/lib/dal'
import { generateUUID, getCurrentTimestamp } from '@/lib/utils'
import { crearCatalogoInicial } from '@/lib/data/cultivos-arica'
import type { Proyecto, UUID } from '@/types'
import { QUERY_KEYS } from '@/lib/constants/query-keys'

interface EliminacionCascada {
  terrenos: number
  zonas: number
  plantas: number
  cultivos: number
}

interface UseProyectos {
  proyectos: Proyecto[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>

  crearProyecto: (data: { nombre: string; ubicacion: string }) => Promise<Proyecto>
  editarProyecto: (id: UUID, data: { nombre?: string; ubicacion_referencia?: string }) => Promise<void>
  eliminarProyecto: (id: UUID) => Promise<{ eliminados: EliminacionCascada }>
  contarContenido: (id: UUID) => Promise<EliminacionCascada>
}

const USUARIO_ID = 'usuario-demo'

export function useProyectos(): UseProyectos {
  const queryClient = useQueryClient()

  // Query para obtener proyectos
  const {
    data: proyectos = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.proyectos(USUARIO_ID),
    queryFn: () => proyectosDAL.getByUsuarioId(USUARIO_ID),
  })

  // Mutation para crear proyecto
  const crearProyectoMutation = useMutation({
    mutationFn: async (data: { nombre: string; ubicacion: string }) => {
      const timestamp = getCurrentTimestamp()
      const nuevoProyecto: Proyecto = {
        id: generateUUID(),
        usuario_id: USUARIO_ID,
        nombre: data.nombre,
        ubicacion_referencia: data.ubicacion,
        created_at: timestamp,
        updated_at: timestamp,
      }

      await transaccionesDAL.crearProyectoConCatalogo(nuevoProyecto, crearCatalogoInicial(nuevoProyecto.id))
      return nuevoProyecto
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.proyectos(USUARIO_ID) })
    },
  })

  // Mutation para editar proyecto
  const editarProyectoMutation = useMutation({
    mutationFn: async (params: { id: UUID; data: { nombre?: string; ubicacion_referencia?: string } }) => {
      await proyectosDAL.update(params.id, {
        ...params.data,
        updated_at: getCurrentTimestamp(),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.proyectos(USUARIO_ID) })
    },
  })

  // Mutation para eliminar proyecto
  const eliminarProyectoMutation = useMutation({
    mutationFn: async (id: UUID) => {
      const conteo = await contarContenido(id)
      await transaccionesDAL.eliminarProyectoCascade(id)
      return { eliminados: conteo }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.proyectos(USUARIO_ID) })
    },
  })

  // Función auxiliar para contar contenido
  const contarContenido = useCallback(async (id: UUID): Promise<EliminacionCascada> => {
    const terrenos = await terrenosDAL.getByProyectoId(id)
    const terrenoIds = terrenos.map(t => t.id)

    let zonasCount = 0
    let plantasCount = 0

    if (terrenoIds.length > 0) {
      const zonas = await zonasDAL.getByTerrenoIds(terrenoIds)
      zonasCount = zonas.length
      const zonaIds = zonas.map(z => z.id)

      if (zonaIds.length > 0) {
        plantasCount = await plantasDAL.countByZonaIds(zonaIds)
      }
    }

    const cultivosCount = await catalogoDAL.countByProyectoId(id)

    return {
      terrenos: terrenos.length,
      zonas: zonasCount,
      plantas: plantasCount,
      cultivos: cultivosCount,
    }
  }, [])

  return {
    proyectos,
    loading: isLoading,
    error: error instanceof Error ? error : null,
    refetch: () => refetch().then(() => Promise.resolve()),

    crearProyecto: (data) => crearProyectoMutation.mutateAsync(data),
    editarProyecto: (id, data) => editarProyectoMutation.mutateAsync({ id, data }),
    eliminarProyecto: (id) => eliminarProyectoMutation.mutateAsync(id),
    contarContenido,
  }
}
