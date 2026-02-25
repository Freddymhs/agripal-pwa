'use client'

import { useCallback } from 'react'
import { toast } from 'sonner'
import { snapToGrid } from '@/lib/validations/planta'
import { zonasSeSuperponen } from '@/lib/validations/zona'
import type { GridParams } from '@/lib/validations/planta'
import { TIPO_ZONA } from '@/lib/constants/entities'
import { clamp } from '@/lib/utils/math'
import { usePlantas } from './use-plantas'
import { useZonas } from './use-zonas'
import type { Zona, Planta, CatalogoCultivo, EstadoPlanta, EtapaCrecimiento, TipoZona, EstanqueConfig, Terreno } from '@/types'

interface UseMapHandlersParams {
  modo: string
  zonaSeleccionada: Zona | null
  plantaSeleccionada: Planta | null
  plantas: Planta[]
  zonas: Zona[]
  catalogoCultivos: CatalogoCultivo[]
  terrenoActual: Terreno | null
  cultivoSeleccionadoId: string
  cultivoSeleccionadoNombre: string
  gridParams: GridParams | null
  posicionesOcupadas: Set<string>
  rectNuevaZona: { x: number; y: number; ancho: number; alto: number } | null
  plantasHook: ReturnType<typeof usePlantas>
  zonasHook: ReturnType<typeof useZonas>
  setPlantaSeleccionada: (p: Planta | null) => void
  setZonaSeleccionada: (z: Zona | null) => void
  setRectNuevaZona: (r: { x: number; y: number; ancho: number; alto: number } | null) => void
  setModo: (m: string) => void
  setShowGridModal: (v: boolean) => void
  getCultivoSeleccionado: () => CatalogoCultivo
}

export function useMapHandlers({
  modo,
  zonaSeleccionada,
  plantaSeleccionada,
  plantas,
  zonas,
  catalogoCultivos,
  terrenoActual,
  gridParams,
  posicionesOcupadas,
  rectNuevaZona,
  plantasHook,
  zonasHook,
  setPlantaSeleccionada,
  setZonaSeleccionada,
  setRectNuevaZona,
  setModo,
  setShowGridModal,
  getCultivoSeleccionado,
}: UseMapHandlersParams) {
  const handleMapClick = useCallback(async (x: number, y: number) => {
    const cultivoSel = getCultivoSeleccionado()
    if (modo === 'plantar' && zonaSeleccionada && zonaSeleccionada.tipo === TIPO_ZONA.CULTIVO) {
      const xRelativo = x - zonaSeleccionada.x
      const yRelativo = y - zonaSeleccionada.y

      if (xRelativo >= 0 && xRelativo <= zonaSeleccionada.ancho &&
          yRelativo >= 0 && yRelativo <= zonaSeleccionada.alto) {
        let plantX = xRelativo
        let plantY = yRelativo
        if (gridParams) {
          const snapped = snapToGrid(xRelativo, yRelativo, gridParams, posicionesOcupadas)
          if (!snapped) { toast.error('Posición ocupada. Mueve el cursor a un espacio vacío de la grilla.'); return }
          plantX = snapped.x
          plantY = snapped.y
        }
        const result = await plantasHook.crearPlanta({
          zona: zonaSeleccionada, tipoCultivoId: cultivoSel.id,
          x: plantX, y: plantY, plantasExistentes: plantas, cultivo: cultivoSel,
        })
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success(`${cultivoSel.nombre} plantada en (${(zonaSeleccionada.x + plantX).toFixed(1)}, ${(zonaSeleccionada.y + plantY).toFixed(1)})m`)
          if (result.advertencia) toast.warning(result.advertencia)
        }
      }
    }
  }, [modo, zonaSeleccionada, gridParams, posicionesOcupadas, plantas, plantasHook, getCultivoSeleccionado])

  const handlePlantaClick = (planta: Planta) => {
    if (modo === 'plantas') { setPlantaSeleccionada(planta); setZonaSeleccionada(null) }
  }

  const handleCambiarEstadoPlanta = async (estado: EstadoPlanta) => {
    if (!plantaSeleccionada) return
    const result = await plantasHook.cambiarEstado(plantaSeleccionada.id, estado)
    if (result?.error) { toast.error(result.error); return }
    setPlantaSeleccionada({ ...plantaSeleccionada, estado })
    toast.success('Estado actualizado')
  }

  const handleCambiarEtapaPlanta = async (etapa: EtapaCrecimiento) => {
    if (!plantaSeleccionada) return
    const result = await plantasHook.cambiarEtapa(plantaSeleccionada.id, etapa)
    if (result?.error) { toast.error(result.error); return }
    setPlantaSeleccionada({ ...plantaSeleccionada, etapa_actual: etapa })
    toast.success('Etapa actualizada')
  }

  const handleEliminarPlanta = async () => {
    if (!plantaSeleccionada) return
    await plantasHook.eliminarPlanta(plantaSeleccionada.id)
    setPlantaSeleccionada(null)
  }

  const handlePlantarGrid = async (espaciado: number) => {
    if (!zonaSeleccionada) return
    const cultivoSel = getCultivoSeleccionado()
    const result = await plantasHook.crearPlantasGrid({
      zona: zonaSeleccionada, tipoCultivoId: cultivoSel.id,
      espaciado, plantasExistentes: plantas, cultivo: cultivoSel,
    })
    setShowGridModal(false)
    toast.success(`Se crearon ${result.plantas.length} plantas de ${cultivoSel.nombre}`)
  }

  const validarCambiosZona = useCallback((
    nuevaPos: { x: number; y: number },
    nuevoTam: { ancho: number; alto: number }
  ): { valida: boolean; error?: string } => {
    if (!zonaSeleccionada || !terrenoActual) return { valida: false, error: 'No hay zona seleccionada' }
    if (nuevaPos.x < 0 || nuevaPos.y < 0) return { valida: false, error: 'La posición no puede tener coordenadas negativas' }
    if (nuevoTam.ancho < 1 || nuevoTam.alto < 1) return { valida: false, error: 'Las dimensiones deben ser al menos 1m × 1m' }
    if (nuevaPos.x + nuevoTam.ancho > terrenoActual.ancho_m) return { valida: false, error: 'La zona excedería el ancho del terreno' }
    if (nuevaPos.y + nuevoTam.alto > terrenoActual.alto_m) return { valida: false, error: 'La zona excedería el alto del terreno' }
    const zonaVirtual = { ...zonaSeleccionada, x: nuevaPos.x, y: nuevaPos.y, ancho: nuevoTam.ancho, alto: nuevoTam.alto }
    for (const otraZona of zonas.filter(z => z.id !== zonaSeleccionada.id)) {
      if (zonasSeSuperponen(zonaVirtual, otraZona)) return { valida: false, error: `La zona se superpondría con "${otraZona.nombre}"` }
    }
    return { valida: true }
  }, [zonaSeleccionada, terrenoActual, zonas])

  const handleCrearZona = async (data: { nombre: string; tipo: TipoZona; estanque_config?: EstanqueConfig }) => {
    if (!rectNuevaZona) return
    const result = await zonasHook.crearZona({
      nombre: data.nombre, tipo: data.tipo,
      x: rectNuevaZona.x, y: rectNuevaZona.y,
      ancho: rectNuevaZona.ancho, alto: rectNuevaZona.alto,
      estanque_config: data.estanque_config,
    })
    if (result.error) { toast.error(result.error) } else { setRectNuevaZona(null); setModo('terreno') }
  }

  const handleEliminarZona = async () => {
    if (!zonaSeleccionada) return
    await zonasHook.eliminarZona(zonaSeleccionada.id)
    setZonaSeleccionada(null)
  }

  const handleGuardarZona = async (cambios: Partial<Zona>) => {
    if (!zonaSeleccionada) return
    await zonasHook.actualizarZona(zonaSeleccionada.id, cambios)
    setZonaSeleccionada({ ...zonaSeleccionada, ...cambios } as Zona)
  }

  const handleMoverPlantasSeleccionadas = useCallback(async (plantaId: string, deltaX: number, deltaY: number) => {
    const planta = plantas.find(p => p.id === plantaId)
    if (!planta) return
    const zona = zonas.find(z => z.id === planta.zona_id)
    if (!zona) return
    const nuevaX = clamp(planta.x + deltaX, 0, zona.ancho)
    const nuevaY = clamp(planta.y + deltaY, 0, zona.alto)
    const cultivo = catalogoCultivos.find(c => c.id === planta.tipo_cultivo_id)
    const result = await plantasHook.moverPlanta(plantaId, { x: nuevaX, y: nuevaY }, zona, plantas, cultivo)
    if (result?.error) toast.error(result.error)
  }, [plantas, zonas, catalogoCultivos, plantasHook])

  return {
    handleMapClick,
    handlePlantaClick,
    handleCambiarEstadoPlanta,
    handleCambiarEtapaPlanta,
    handleEliminarPlanta,
    handlePlantarGrid,
    validarCambiosZona,
    handleCrearZona,
    handleEliminarZona,
    handleGuardarZona,
    handleMoverPlantasSeleccionadas,
  }
}
