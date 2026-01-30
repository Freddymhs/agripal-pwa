'use client'

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from 'react'
import { useAuthContext } from '@/components/providers/auth-provider'
import { useProyectos } from '@/hooks/use-proyectos'
import { useTerrenos } from '@/hooks/use-terrenos'
import { useCatalogo } from '@/hooks/use-catalogo'
import { useAlertas } from '@/hooks/use-alertas'
import { useSync } from '@/hooks/use-sync'
import { useEstanques } from '@/hooks/use-estanques'
import { useZonas } from '@/hooks/use-zonas'
import { usePlantas } from '@/hooks/use-plantas'
import { usePlantasLote } from '@/hooks/use-plantas-lote'
import { useActualizarEtapas } from '@/hooks/use-actualizar-etapas'
import { zonasDAL, plantasDAL } from '@/lib/dal'
import { getTemporadaActual } from '@/lib/utils'
import { asignarColorCultivo } from '@/components/mapa/pixi/pixi-constants'
import { calcularConsumoTerreno, determinarEstadoAgua } from '@/lib/utils/agua'
import { CULTIVOS_ARICA } from '@/lib/data/cultivos-arica'
import { FACTORES_TEMPORADA } from '@/types'
import { onZonaUpdated } from '@/lib/events/zona-events'
import type { Terreno, Zona, Planta, CatalogoCultivo, Proyecto, DashboardTerreno, Usuario } from '@/types'

const STORAGE_KEY_PROYECTO = 'agriplan_proyecto_actual'
const STORAGE_KEY_TERRENO = 'agriplan_terreno_actual'
const CATALOGO_DEFAULT = CULTIVOS_ARICA

interface ProjectContextType {
  usuario: Usuario | null
  authLoading: boolean
  isAuthenticated: boolean
  logout: () => void

  proyectoActual: Proyecto | null
  terrenoActual: Terreno | null
  setTerrenoActual: (t: Terreno | null) => void
  proyectos: Proyecto[]
  terrenos: Terreno[]

  zonas: Zona[]
  plantas: Planta[]
  catalogoCultivos: CatalogoCultivo[]
  loading: boolean
  initialLoad: boolean

  alertasHook: ReturnType<typeof useAlertas>
  syncHook: ReturnType<typeof useSync>
  estanquesHook: ReturnType<typeof useEstanques>
  zonasHook: ReturnType<typeof useZonas>
  plantasHook: ReturnType<typeof usePlantas>
  plantasLoteHook: ReturnType<typeof usePlantasLote>

  dashboard: DashboardTerreno | null
  CULTIVOS_ESPACIADO: Record<string, number>
  CULTIVOS_COLORES: Record<string, number>

  cargarDatosTerreno: () => Promise<void>
  handleSelectProyecto: (p: Proyecto) => void
  handleSelectTerreno: (t: Terreno) => void
  handleCrearProyecto: (data: { nombre: string; ubicacion: string }) => Promise<void>
  handleCrearTerreno: (data: { nombre: string; ancho_m: number; alto_m: number }) => Promise<void>
  handleGuardarConfigAvanzada: (updates: Partial<Terreno>) => Promise<void>
  handleCambiarFuente: (estanqueId: string, fuenteId: string) => Promise<void>

  showCrearProyecto: boolean
  setShowCrearProyecto: (v: boolean) => void
  showCrearTerreno: boolean
  setShowCrearTerreno: (v: boolean) => void
  showConfigAvanzada: boolean
  setShowConfigAvanzada: (v: boolean) => void
}

const ProjectContext = createContext<ProjectContextType | null>(null)

export function useProjectContext() {
  const ctx = useContext(ProjectContext)
  if (!ctx) throw new Error('useProjectContext must be used within ProjectProvider')
  return ctx
}

export function useOptionalProjectContext() {
  return useContext(ProjectContext)
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { usuario, loading: authLoading, isAuthenticated, logout } = useAuthContext()

  const [proyectoActual, setProyectoActual] = useState<Proyecto | null>(null)
  const [terrenoActual, setTerrenoActual] = useState<Terreno | null>(null)
  const [zonas, setZonas] = useState<Zona[]>([])
  const [plantas, setPlantas] = useState<Planta[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoad, setInitialLoad] = useState(true)

  const [showCrearProyecto, setShowCrearProyecto] = useState(false)
  const [showCrearTerreno, setShowCrearTerreno] = useState(false)
  const [showConfigAvanzada, setShowConfigAvanzada] = useState(false)

  const proyectosHook = useProyectos()
  const terrenosHook = useTerrenos(proyectoActual?.id || null)
  const catalogoHook = useCatalogo(proyectoActual?.id || null)
  const catalogoCultivos = catalogoHook.cultivos.length > 0 ? catalogoHook.cultivos : CATALOGO_DEFAULT

  const alertasHook = useAlertas(terrenoActual, zonas, plantas, catalogoCultivos)
  const syncHook = useSync()

  const CULTIVOS_ESPACIADO: Record<string, number> = useMemo(() =>
    catalogoCultivos.reduce(
      (acc, c) => ({ ...acc, [c.id]: c.espaciado_recomendado_m }),
      {}
    ), [catalogoCultivos]
  )

  const CULTIVOS_COLORES: Record<string, number> = useMemo(() =>
    catalogoCultivos.reduce(
      (acc, c, i) => ({ ...acc, [c.id]: asignarColorCultivo(i) }),
      {} as Record<string, number>
    ), [catalogoCultivos]
  )

  useEffect(() => {
    if (initialLoad && !proyectosHook.loading) {
      const savedProyectoId = localStorage.getItem(STORAGE_KEY_PROYECTO)

      if (savedProyectoId) {
        const proyecto = proyectosHook.proyectos.find(p => p.id === savedProyectoId)
        if (proyecto) {
          setProyectoActual(proyecto)
        }
      }

      if (!savedProyectoId && proyectosHook.proyectos.length > 0) {
        setProyectoActual(proyectosHook.proyectos[0])
      }

      setInitialLoad(false)
    }
  }, [proyectosHook.loading, proyectosHook.proyectos, initialLoad])

  useEffect(() => {
    if (proyectoActual && !terrenosHook.loading) {
      const savedTerrenoId = localStorage.getItem(STORAGE_KEY_TERRENO)

      if (savedTerrenoId) {
        const terreno = terrenosHook.terrenos.find(t => t.id === savedTerrenoId)
        if (terreno) {
          setTerrenoActual(terreno)
          return
        }
      }

      if (terrenosHook.terrenos.length > 0) {
        setTerrenoActual(terrenosHook.terrenos[0])
      } else {
        setTerrenoActual(null)
      }
    }
  }, [proyectoActual, terrenosHook.loading, terrenosHook.terrenos])

  useEffect(() => {
    if (proyectoActual) {
      localStorage.setItem(STORAGE_KEY_PROYECTO, proyectoActual.id)
    }
  }, [proyectoActual])

  useEffect(() => {
    if (terrenoActual) {
      localStorage.setItem(STORAGE_KEY_TERRENO, terrenoActual.id)
    }
  }, [terrenoActual])

  const initialLoadDone = useRef(false)

  const cargarDatosTerreno = useCallback(async () => {
    if (!terrenoActual) {
      setZonas([])
      setPlantas([])
      setLoading(false)
      return
    }

    try {
      if (!initialLoadDone.current) {
        setLoading(true)
      }

      const zonasData = await zonasDAL.getByTerrenoId(terrenoActual.id)
      setZonas(zonasData)

      const zonaIds = zonasData.map(z => z.id)
      if (zonaIds.length > 0) {
        const plantasData = await plantasDAL.getByZonaIds(zonaIds)
        setPlantas(plantasData)
      } else {
        setPlantas([])
      }
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
      initialLoadDone.current = true
    }
  }, [terrenoActual])

  useEffect(() => {
    initialLoadDone.current = false
    cargarDatosTerreno()
  }, [cargarDatosTerreno])

  useEffect(() => {
    const unsubscribe = onZonaUpdated(() => {
      cargarDatosTerreno()
    })
    return unsubscribe
  }, [cargarDatosTerreno])

  const estanquesHook = useEstanques(zonas, cargarDatosTerreno)

  const handleCambiarFuente = useCallback(async (estanqueId: string, fuenteId: string) => {
    const zona = zonas.find(z => z.id === estanqueId)
    if (!zona || !zona.estanque_config) return
    await zonasDAL.update(estanqueId, {
      estanque_config: {
        ...zona.estanque_config,
        fuente_id: fuenteId || undefined,
      },
      updated_at: new Date().toISOString(),
    })
    cargarDatosTerreno()
  }, [zonas, cargarDatosTerreno])

  const zonasHook = useZonas(
    terrenoActual?.id || '',
    terrenoActual!,
    zonas,
    plantas,
    cargarDatosTerreno
  )

  const plantasHook = usePlantas(cargarDatosTerreno)
  const plantasLoteHook = usePlantasLote(cargarDatosTerreno)

  useActualizarEtapas(plantas, catalogoCultivos, cargarDatosTerreno)

  const dashboard: DashboardTerreno | null = useMemo(() => {
    if (!terrenoActual) return null

    const areaUsada = zonas.reduce((sum, z) => sum + z.area_m2, 0)
    const areaTotal = terrenoActual.ancho_m * terrenoActual.alto_m
    const estanques = zonas.filter(z => z.tipo === 'estanque' && z.estanque_config)
    const aguaEstanques = estanques.reduce((sum, e) => sum + (e.estanque_config?.nivel_actual_m3 || 0), 0)
    const aguaDisponible = estanques.length > 0 ? aguaEstanques : terrenoActual.agua_actual_m3
    const aguaNecesaria = calcularConsumoTerreno(zonas, plantas, catalogoCultivos)
    const estadoAgua = determinarEstadoAgua(aguaDisponible, aguaNecesaria)
    const diasRestantes = aguaNecesaria > 0 ? aguaDisponible / (aguaNecesaria / 7) : Infinity
    const temporada = getTemporadaActual()
    const plantasPorCultivo: Record<string, number> = {}

    for (const planta of plantas) {
      if (planta.estado === 'muerta') continue
      const cultivo = catalogoCultivos.find(c => c.id === planta.tipo_cultivo_id)
      if (!cultivo) continue
      plantasPorCultivo[cultivo.nombre] = (plantasPorCultivo[cultivo.nombre] || 0) + 1
    }

    return {
      terreno_id: terrenoActual.id,
      area_total_m2: areaTotal,
      area_usada_m2: areaUsada,
      area_libre_m2: areaTotal - areaUsada,
      porcentaje_uso: (areaUsada / areaTotal) * 100,
      agua_disponible_m3: aguaDisponible,
      agua_necesaria_m3: aguaNecesaria,
      agua_margen_m3: aguaDisponible - aguaNecesaria,
      estado_agua: estadoAgua,
      dias_agua_restantes: diasRestantes,
      total_plantas: plantas.filter(p => p.estado !== 'muerta').length,
      plantas_por_cultivo: plantasPorCultivo,
      plantas_produciendo: plantas.filter(p => p.estado === 'produciendo').length,
      plantas_muertas: plantas.filter(p => p.estado === 'muerta').length,
      alertas_activas: alertasHook.alertas.length,
      alertas_criticas: alertasHook.alertasCriticas,
      temporada_actual: temporada,
      factor_temporada: FACTORES_TEMPORADA[temporada],
    }
  }, [terrenoActual, zonas, plantas, catalogoCultivos, alertasHook.alertas.length, alertasHook.alertasCriticas])

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
    localStorage.setItem(STORAGE_KEY_PROYECTO, proyecto.id)
    setShowCrearProyecto(false)
  }

  const handleCrearTerreno = async (data: { nombre: string; ancho_m: number; alto_m: number }) => {
    if (!proyectoActual) return
    const terreno = await terrenosHook.crearTerreno({
      proyecto_id: proyectoActual.id,
      ...data,
    })
    setTerrenoActual(terreno)
    localStorage.setItem(STORAGE_KEY_TERRENO, terreno.id)
    localStorage.setItem(STORAGE_KEY_PROYECTO, terreno.proyecto_id)
    setShowCrearTerreno(false)
  }

  const handleGuardarConfigAvanzada = async (updates: Partial<Terreno>) => {
    if (!terrenoActual) return
    await terrenosHook.actualizarTerreno(terrenoActual.id, updates)
    setTerrenoActual({ ...terrenoActual, ...updates })
  }

  const value: ProjectContextType = {
    usuario,
    authLoading,
    isAuthenticated,
    logout,

    proyectoActual,
    terrenoActual,
    setTerrenoActual,
    proyectos: proyectosHook.proyectos,
    terrenos: terrenosHook.terrenos,

    zonas,
    plantas,
    catalogoCultivos,
    loading,
    initialLoad: initialLoad || proyectosHook.loading,

    alertasHook,
    syncHook,
    estanquesHook,
    zonasHook,
    plantasHook,
    plantasLoteHook,

    dashboard,
    CULTIVOS_ESPACIADO,
    CULTIVOS_COLORES,

    cargarDatosTerreno,
    handleSelectProyecto,
    handleSelectTerreno,
    handleCrearProyecto,
    handleCrearTerreno,
    handleGuardarConfigAvanzada,
    handleCambiarFuente,

    showCrearProyecto,
    setShowCrearProyecto,
    showCrearTerreno,
    setShowCrearTerreno,
    showConfigAvanzada,
    setShowConfigAvanzada,
  }

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  )
}
