'use client'

import { useCallback } from 'react'
import { zonasDAL } from '@/lib/dal'
import { STORAGE_KEYS } from '@/lib/constants/storage'
import { useProyectos } from './use-proyectos'
import { useTerrenos } from './use-terrenos'
import type { Proyecto, Terreno, Zona } from '@/types'

interface UseProjectHandlersParams {
  proyectosHook: ReturnType<typeof useProyectos>
  terrenosHook: ReturnType<typeof useTerrenos>
  zonas: Zona[]
  terrenoActual: Terreno | null
  setProyectoActual: (p: Proyecto | null) => void
  setTerrenoActual: (t: Terreno | null) => void
  setShowCrearProyecto: (v: boolean) => void
  setShowCrearTerreno: (v: boolean) => void
  cargarDatosTerreno: () => Promise<void>
}

export function useProjectHandlers({
  proyectosHook,
  terrenosHook,
  zonas,
  terrenoActual,
  setProyectoActual,
  setTerrenoActual,
  setShowCrearProyecto,
  setShowCrearTerreno,
  cargarDatosTerreno,
}: UseProjectHandlersParams) {
  const handleSelectProyecto = (proyecto: Proyecto) => {
    setProyectoActual(proyecto)
    setTerrenoActual(null)
  }

  const handleSelectTerreno = (terreno: Terreno) => {
    setTerrenoActual(terreno)
  }

  const handleCrearProyecto = async (data: { nombre: string; ubicacion: string }) => {
    const proyecto = await proyectosHook.crearProyecto(data)
    setProyectoActual(proyecto)
    localStorage.setItem(STORAGE_KEYS.PROYECTO, proyecto.id)
    setShowCrearProyecto(false)
  }

  const handleCrearTerreno = async (data: { nombre: string; ancho_m: number; alto_m: number }, proyectoId: string) => {
    const terreno = await terrenosHook.crearTerreno({ proyecto_id: proyectoId, ...data })
    setTerrenoActual(terreno)
    localStorage.setItem(STORAGE_KEYS.TERRENO, terreno.id)
    localStorage.setItem(STORAGE_KEYS.PROYECTO, terreno.proyecto_id)
    setShowCrearTerreno(false)
  }

  const handleGuardarConfigAvanzada = async (updates: Partial<Terreno>) => {
    if (!terrenoActual) return
    await terrenosHook.actualizarTerreno(terrenoActual.id, updates)
    setTerrenoActual({ ...terrenoActual, ...updates })
  }

  const handleCambiarFuente = useCallback(async (estanqueId: string, fuenteId: string) => {
    const zona = zonas.find(z => z.id === estanqueId)
    if (!zona || !zona.estanque_config) return
    await zonasDAL.update(estanqueId, {
      estanque_config: { ...zona.estanque_config, fuente_id: fuenteId || undefined },
      updated_at: new Date().toISOString(),
    })
    cargarDatosTerreno()
  }, [zonas, cargarDatosTerreno])

  return {
    handleSelectProyecto,
    handleSelectTerreno,
    handleCrearProyecto,
    handleCrearTerreno,
    handleGuardarConfigAvanzada,
    handleCambiarFuente,
  }
}
