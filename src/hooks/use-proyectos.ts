'use client'

import { useState, useEffect, useCallback } from 'react'
import { proyectosDAL, terrenosDAL, zonasDAL, plantasDAL, catalogoDAL } from '@/lib/dal'
import { generateUUID, getCurrentTimestamp } from '@/lib/utils'
import { CULTIVOS_ARICA } from '@/lib/data/cultivos-arica'
import type { Proyecto, UUID, CatalogoCultivo } from '@/types'

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
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await proyectosDAL.getByUsuarioId(USUARIO_ID)
      setProyectos(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error cargando proyectos'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const crearProyecto = useCallback(async (data: { nombre: string; ubicacion: string }): Promise<Proyecto> => {
    const timestamp = getCurrentTimestamp()
    const nuevoProyecto: Proyecto = {
      id: generateUUID(),
      usuario_id: USUARIO_ID,
      nombre: data.nombre,
      ubicacion_referencia: data.ubicacion,
      created_at: timestamp,
      updated_at: timestamp,
    }

    await proyectosDAL.add(nuevoProyecto)

    for (const cultivo of CULTIVOS_ARICA) {
      const { id, proyecto_id, created_at, updated_at, ...cultivoData } = cultivo as CatalogoCultivo & { proyecto_id?: string }
      const nuevoCultivo: CatalogoCultivo = {
        ...cultivoData,
        id: generateUUID(),
        proyecto_id: nuevoProyecto.id,
        created_at: timestamp,
        updated_at: timestamp,
      }
      await catalogoDAL.add(nuevoCultivo)
    }

    await fetchData()
    return nuevoProyecto
  }, [fetchData])

  const editarProyecto = useCallback(async (
    id: UUID,
    data: { nombre?: string; ubicacion_referencia?: string }
  ): Promise<void> => {
    await proyectosDAL.update(id, {
      ...data,
      updated_at: getCurrentTimestamp(),
    })
    await fetchData()
  }, [fetchData])

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

  const eliminarProyecto = useCallback(async (id: UUID): Promise<{ eliminados: EliminacionCascada }> => {
    const conteo = await contarContenido(id)

    const terrenos = await terrenosDAL.getByProyectoId(id)
    const terrenoIds = terrenos.map(t => t.id)

    if (terrenoIds.length > 0) {
      const zonas = await zonasDAL.getByTerrenoIds(terrenoIds)
      const zonaIds = zonas.map(z => z.id)

      if (zonaIds.length > 0) {
        await plantasDAL.deleteByZonaIds(zonaIds)
      }

      await zonasDAL.deleteByTerrenoIds(terrenoIds)
    }

    await terrenosDAL.deleteByProyectoId(id)
    await catalogoDAL.deleteByProyectoId(id)
    await proyectosDAL.delete(id)

    await fetchData()
    return { eliminados: conteo }
  }, [fetchData, contarContenido])

  return {
    proyectos,
    loading,
    error,
    refetch: fetchData,
    crearProyecto,
    editarProyecto,
    eliminarProyecto,
    contarContenido,
  }
}
