'use client'

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react'
import { toast } from 'sonner'
import { useProjectContext } from './project-context'
import { zonasSeSuperponen, advertenciaEliminarZona } from '@/lib/validations/zona'
import { calcularGridParams, snapToGrid } from '@/lib/validations/planta'
import type { GridParams } from '@/lib/validations/planta'
import type { ZonaPreviewData } from '@/components/mapa/editor-zona'
import { CULTIVOS_ARICA } from '@/lib/data/cultivos-arica'
import type { Zona, Planta, TipoZona, CatalogoCultivo, EstadoPlanta, EtapaCrecimiento, EstanqueConfig } from '@/types'

export type Modo = 'terreno' | 'zonas' | 'plantas' | 'crear_zona' | 'plantar'

const CATALOGO_DEFAULT = CULTIVOS_ARICA

interface MapContextType {
  modo: Modo
  setModo: (m: Modo) => void
  zonaSeleccionada: Zona | null
  setZonaSeleccionada: (z: Zona | null) => void
  plantaSeleccionada: Planta | null
  setPlantaSeleccionada: (p: Planta | null) => void
  plantasSeleccionadas: string[]
  setPlantasSeleccionadas: (ids: string[]) => void
  rectNuevaZona: { x: number; y: number; ancho: number; alto: number } | null
  setRectNuevaZona: (r: { x: number; y: number; ancho: number; alto: number } | null) => void
  showGridModal: boolean
  setShowGridModal: (v: boolean) => void
  zonaPreview: ZonaPreviewData | null
  setZonaPreview: (v: ZonaPreviewData | null) => void
  cultivoSeleccionado: CatalogoCultivo
  setCultivoSeleccionado: (c: CatalogoCultivo) => void
  panelTab: 'terreno' | 'recomendacion'
  setPanelTab: (t: 'terreno' | 'recomendacion') => void

  gridParams: GridParams | null
  posicionesOcupadas: Set<string>
  plantasZonaSeleccionada: Planta[]

  handleMapClick: (x: number, y: number) => Promise<void>
  handlePlantaClick: (planta: Planta) => void
  handleCambiarEstadoPlanta: (estado: EstadoPlanta) => Promise<void>
  handleCambiarEtapaPlanta: (etapa: EtapaCrecimiento) => Promise<void>
  handleEliminarPlanta: () => Promise<void>
  handlePlantarGrid: (espaciado: number) => Promise<void>
  handleCrearZona: (data: { nombre: string; tipo: TipoZona; estanque_config?: EstanqueConfig }) => Promise<void>
  handleEliminarZona: () => Promise<void>
  handleGuardarZona: (cambios: Partial<Zona>) => Promise<void>
  validarCambiosZona: (nuevaPos: { x: number; y: number }, nuevoTam: { ancho: number; alto: number }) => { valida: boolean; error?: string }
  handleMoverPlantasSeleccionadas: (plantaId: string, deltaX: number, deltaY: number) => Promise<void>
  advertenciaEliminacionZona: string | null
}

const MapContext = createContext<MapContextType | null>(null)

export function useMapContext() {
  const ctx = useContext(MapContext)
  if (!ctx) throw new Error('useMapContext must be used within MapProvider')
  return ctx
}

export function MapProvider({ children }: { children: ReactNode }) {
  const {
    terrenoActual,
    zonas,
    plantas,
    catalogoCultivos,
    zonasHook,
    plantasHook,
    plantasLoteHook,
  } = useProjectContext()

  const [modo, setModo] = useState<Modo>('terreno')
  const [zonaSeleccionada, setZonaSeleccionada] = useState<Zona | null>(null)
  const [plantaSeleccionada, setPlantaSeleccionada] = useState<Planta | null>(null)
  const [plantasSeleccionadas, setPlantasSeleccionadas] = useState<string[]>([])
  const [rectNuevaZona, setRectNuevaZona] = useState<{ x: number; y: number; ancho: number; alto: number } | null>(null)
  const [showGridModal, setShowGridModal] = useState(false)
  const [zonaPreview, setZonaPreview] = useState<ZonaPreviewData | null>(null)
  const [cultivoSeleccionado, setCultivoSeleccionado] = useState<CatalogoCultivo>(CATALOGO_DEFAULT[0])
  const [panelTab, setPanelTab] = useState<'terreno' | 'recomendacion'>('terreno')

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && plantasSeleccionadas.length > 0) {
        setPlantasSeleccionadas([])
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [plantasSeleccionadas.length])

  useEffect(() => {
    if (catalogoCultivos.length > 0) {
      const match = catalogoCultivos.find(c => c.id === cultivoSeleccionado.id)
      if (!match) {
        setCultivoSeleccionado(catalogoCultivos[0])
      }
    }
  }, [catalogoCultivos])

  // Sincronizar zona seleccionada cuando cambia la lista de zonas
  useEffect(() => {
    if (zonaSeleccionada) {
      const zonaActualizada = zonas.find(z => z.id === zonaSeleccionada.id)
      if (!zonaActualizada) {
        setZonaSeleccionada(null)
      } else if (JSON.stringify(zonaActualizada) !== JSON.stringify(zonaSeleccionada)) {
        setZonaSeleccionada(zonaActualizada)
      }
    }
  }, [zonas, zonaSeleccionada])

  // Sincronizar planta seleccionada cuando cambia la lista de plantas
  useEffect(() => {
    if (plantaSeleccionada) {
      const plantaActualizada = plantas.find(p => p.id === plantaSeleccionada.id)
      if (!plantaActualizada) {
        setPlantaSeleccionada(null)
      } else if (JSON.stringify(plantaActualizada) !== JSON.stringify(plantaSeleccionada)) {
        setPlantaSeleccionada(plantaActualizada)
      }
    }
  }, [plantas, plantaSeleccionada])

  const plantasZonaSeleccionada = zonaSeleccionada
    ? plantas.filter(p => p.zona_id === zonaSeleccionada.id)
    : []

  const gridParams: GridParams | null = useMemo(() => {
    if (modo !== 'plantar' || !zonaSeleccionada || zonaSeleccionada.tipo !== 'cultivo') return null
    if (!cultivoSeleccionado.espaciado_recomendado_m) return null
    return calcularGridParams(zonaSeleccionada, cultivoSeleccionado.espaciado_recomendado_m)
  }, [modo, zonaSeleccionada, cultivoSeleccionado])

  const posicionesOcupadas: Set<string> = useMemo(() => {
    const set = new Set<string>()
    if (!gridParams || !zonaSeleccionada) return set
    const { margenX, margenY, espaciado } = gridParams
    for (const planta of plantasZonaSeleccionada) {
      const col = Math.round((planta.x - margenX) / espaciado)
      const row = Math.round((planta.y - margenY) / espaciado)
      set.add(`${col},${row}`)
    }
    return set
  }, [gridParams, zonaSeleccionada, plantasZonaSeleccionada])

  const handleMapClick = useCallback(async (x: number, y: number) => {
    if (modo === 'plantar' && zonaSeleccionada && zonaSeleccionada.tipo === 'cultivo') {
      const xRelativo = x - zonaSeleccionada.x
      const yRelativo = y - zonaSeleccionada.y

      if (xRelativo >= 0 && xRelativo <= zonaSeleccionada.ancho &&
          yRelativo >= 0 && yRelativo <= zonaSeleccionada.alto) {

        let plantX = xRelativo
        let plantY = yRelativo

        if (gridParams) {
          const snapped = snapToGrid(xRelativo, yRelativo, gridParams, posicionesOcupadas)
          if (!snapped) {
            toast.error('Posición ocupada. Mueve el cursor a un espacio vacío de la grilla.')
            return
          }
          plantX = snapped.x
          plantY = snapped.y
        }

        const result = await plantasHook.crearPlanta({
          zona: zonaSeleccionada,
          tipoCultivoId: cultivoSeleccionado.id,
          x: plantX,
          y: plantY,
          plantasExistentes: plantas,
          cultivo: cultivoSeleccionado,
        })

        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success(`${cultivoSeleccionado.nombre} plantada en (${(zonaSeleccionada.x + plantX).toFixed(1)}, ${(zonaSeleccionada.y + plantY).toFixed(1)})m`)
          if (result.advertencia) {
            toast.warning(result.advertencia)
          }
        }
      }
    }
  }, [modo, zonaSeleccionada, cultivoSeleccionado, gridParams, posicionesOcupadas, plantas, plantasHook])

  const handlePlantaClick = (planta: Planta) => {
    if (modo === 'plantas') {
      setPlantaSeleccionada(planta)
      setZonaSeleccionada(null)
    }
  }

  const handleCambiarEstadoPlanta = async (estado: EstadoPlanta) => {
    if (!plantaSeleccionada) return
    await plantasHook.cambiarEstado(plantaSeleccionada.id, estado)
    setPlantaSeleccionada({ ...plantaSeleccionada, estado })
  }

  const handleCambiarEtapaPlanta = async (etapa: EtapaCrecimiento) => {
    if (!plantaSeleccionada) return
    await plantasHook.cambiarEtapa(plantaSeleccionada.id, etapa)
    setPlantaSeleccionada({ ...plantaSeleccionada, etapa_actual: etapa })
  }

  const handleEliminarPlanta = async () => {
    if (!plantaSeleccionada) return
    await plantasHook.eliminarPlanta(plantaSeleccionada.id)
    setPlantaSeleccionada(null)
  }

  const handlePlantarGrid = async (espaciado: number) => {
    if (!zonaSeleccionada) return

    const result = await plantasHook.crearPlantasGrid({
      zona: zonaSeleccionada,
      tipoCultivoId: cultivoSeleccionado.id,
      espaciado,
      plantasExistentes: plantas,
      cultivo: cultivoSeleccionado,
    })

    setShowGridModal(false)
    toast.success(`Se crearon ${result.plantas.length} plantas de ${cultivoSeleccionado.nombre}`)
  }

  const validarCambiosZona = useCallback((
    nuevaPos: { x: number; y: number },
    nuevoTam: { ancho: number; alto: number }
  ): { valida: boolean; error?: string } => {
    if (!zonaSeleccionada || !terrenoActual) {
      return { valida: false, error: 'No hay zona seleccionada' }
    }

    if (nuevaPos.x < 0 || nuevaPos.y < 0) {
      return { valida: false, error: 'La posición no puede tener coordenadas negativas' }
    }

    if (nuevoTam.ancho < 1 || nuevoTam.alto < 1) {
      return { valida: false, error: 'Las dimensiones deben ser al menos 1m × 1m' }
    }

    if (nuevaPos.x + nuevoTam.ancho > terrenoActual.ancho_m) {
      return { valida: false, error: 'La zona excedería el ancho del terreno' }
    }

    if (nuevaPos.y + nuevoTam.alto > terrenoActual.alto_m) {
      return { valida: false, error: 'La zona excedería el alto del terreno' }
    }

    const zonaVirtual = {
      ...zonaSeleccionada,
      x: nuevaPos.x,
      y: nuevaPos.y,
      ancho: nuevoTam.ancho,
      alto: nuevoTam.alto,
    }

    const otrasZonas = zonas.filter(z => z.id !== zonaSeleccionada.id)
    for (const otraZona of otrasZonas) {
      if (zonasSeSuperponen(zonaVirtual, otraZona)) {
        return { valida: false, error: `La zona se superpondría con "${otraZona.nombre}"` }
      }
    }

    return { valida: true }
  }, [zonaSeleccionada, terrenoActual, zonas])

  const handleCrearZona = async (data: { nombre: string; tipo: TipoZona; estanque_config?: EstanqueConfig }) => {
    if (!rectNuevaZona) return

    const result = await zonasHook.crearZona({
      nombre: data.nombre,
      tipo: data.tipo,
      x: rectNuevaZona.x,
      y: rectNuevaZona.y,
      ancho: rectNuevaZona.ancho,
      alto: rectNuevaZona.alto,
      estanque_config: data.estanque_config,
    })

    if (result.error) {
      toast.error(result.error)
    } else {
      setRectNuevaZona(null)
      setModo('terreno')
    }
  }

  const handleEliminarZona = async () => {
    if (!zonaSeleccionada) return
    await zonasHook.eliminarZona(zonaSeleccionada.id)
    setZonaSeleccionada(null)
  }

  const handleGuardarZona = async (cambios: Partial<Zona>) => {
    if (!zonaSeleccionada) return
    await zonasHook.actualizarZona(zonaSeleccionada.id, cambios)
    const zonaActualizada = { ...zonaSeleccionada, ...cambios }
    setZonaSeleccionada(zonaActualizada as Zona)
  }

  const handleMoverPlantasSeleccionadas = useCallback(async (plantaId: string, deltaX: number, deltaY: number) => {
    const planta = plantas.find(p => p.id === plantaId)
    if (!planta) return

    const nuevaX = Math.max(0, Math.min(terrenoActual?.ancho_m || 100, planta.x + deltaX))
    const nuevaY = Math.max(0, Math.min(terrenoActual?.alto_m || 100, planta.y + deltaY))

    await plantasHook.moverPlanta(plantaId, { x: nuevaX, y: nuevaY })
  }, [plantas, terrenoActual, plantasHook])

  const advertenciaEliminacionZona = zonaSeleccionada
    ? advertenciaEliminarZona(zonaSeleccionada, plantas)
    : null

  const value: MapContextType = {
    modo,
    setModo,
    zonaSeleccionada,
    setZonaSeleccionada,
    plantaSeleccionada,
    setPlantaSeleccionada,
    plantasSeleccionadas,
    setPlantasSeleccionadas,
    rectNuevaZona,
    setRectNuevaZona,
    showGridModal,
    setShowGridModal,
    zonaPreview,
    setZonaPreview,
    cultivoSeleccionado,
    setCultivoSeleccionado,
    panelTab,
    setPanelTab,
    gridParams,
    posicionesOcupadas,
    plantasZonaSeleccionada,
    handleMapClick,
    handlePlantaClick,
    handleCambiarEstadoPlanta,
    handleCambiarEtapaPlanta,
    handleEliminarPlanta,
    handlePlantarGrid,
    handleCrearZona,
    handleEliminarZona,
    handleGuardarZona,
    validarCambiosZona,
    handleMoverPlantasSeleccionadas,
    advertenciaEliminacionZona,
  }

  return (
    <MapContext.Provider value={value}>
      {children}
    </MapContext.Provider>
  )
}
