'use client'

import { useState, useEffect, useCallback } from 'react'
import { terrenosDAL, zonasDAL, catalogoDAL, plantasDAL } from '@/lib/dal'
import type { Terreno, Zona, Planta, CatalogoCultivo } from '@/types'

interface UseTerrainDataResult {
  terreno: Terreno | null
  zonas: Zona[]
  plantas: Planta[]
  catalogoCultivos: CatalogoCultivo[]
  loading: boolean
  refetch: () => Promise<void>
}

/**
 * Hook unificado para cargar datos del terreno con el patrón:
 * 1. Obtener terreno del usuario
 * 2. Cargar zonas y cultivos del proyecto (en paralelo)
 * 3. Cargar plantas de todas las zonas
 *
 * Deduplicación de lógica de carga que se repetía en 5+ páginas.
 *
 * @example
 * ```tsx
 * const { terreno, zonas, plantas, catalogoCultivos, loading, refetch } = useTerrainData()
 *
 * if (loading) return <LoadingState />
 * if (!terreno) return <NoTerrainState />
 *
 * return <YourContent />
 * ```
 */
export function useTerrainData(): UseTerrainDataResult {
  const [terreno, setTerreno] = useState<Terreno | null>(null)
  const [zonas, setZonas] = useState<Zona[]>([])
  const [plantas, setPlantas] = useState<Planta[]>([])
  const [catalogoCultivos, setCatalogoCultivos] = useState<CatalogoCultivo[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const terrenos = await terrenosDAL.getAll()
      if (terrenos.length > 0) {
        const t = terrenos[0]
        setTerreno(t)

        // Cargar zonas y cultivos en paralelo
        const [z, c] = await Promise.all([
          zonasDAL.getByTerrenoId(t.id),
          catalogoDAL.getByProyectoId(t.proyecto_id),
        ])
        setZonas(z)
        setCatalogoCultivos(c)

        // Cargar plantas de todas las zonas
        const zonaIds = z.map(zona => zona.id)
        if (zonaIds.length > 0) {
          const p = await plantasDAL.getByZonaIds(zonaIds)
          setPlantas(p)
        } else {
          setPlantas([])
        }
      } else {
        setTerreno(null)
        setZonas([])
        setPlantas([])
        setCatalogoCultivos([])
      }
    } catch (err) {
      console.error('Error cargando datos del terreno:', err)
      setTerreno(null)
      setZonas([])
      setPlantas([])
      setCatalogoCultivos([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return {
    terreno,
    zonas,
    plantas,
    catalogoCultivos,
    loading,
    refetch,
  }
}
