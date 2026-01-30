'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useProjectContext } from '@/contexts/project-context'
import { MapProvider, useMapContext } from '@/contexts/map-context'
import { PageLayout } from '@/components/layout'
import { MapToolbar } from '@/components/mapa/map-toolbar'
import { MapInfoBar } from '@/components/mapa/map-info-bar'
import { MapSidebar } from '@/components/mapa/map-sidebar'
import { PixiMapaTerreno } from '@/components/mapa/pixi/pixi-mapa-terreno'
import { NuevaZonaModal } from '@/components/mapa/nueva-zona-modal'
import { GridAutomaticoModal } from '@/components/plantas/grid-automatico-modal'
import { AlertaBanner } from '@/components/alertas/alerta-banner'
import { AlertasDropdown } from '@/components/alertas/alertas-dropdown'
import { OfflineBanner, ConflictModal } from '@/components/sync'
import { SyncIndicator } from '@/components/sync/sync-indicator'
import {
  SelectorTerreno,
  CrearProyectoModal,
  CrearTerrenoModal,
  ConfiguracionAvanzadaModal,
} from '@/components/terreno'
import type { Alerta, Proyecto, Terreno } from '@/types'

export default function HomePage() {
  return <HomeContent />
}

function HomeContent() {
  const router = useRouter()
  const {
    usuario,
    authLoading,
    isAuthenticated,
    logout,
    proyectoActual,
    terrenoActual,
    proyectos,
    terrenos,
    loading,
    initialLoad,
    showCrearProyecto,
    setShowCrearProyecto,
    showCrearTerreno,
    setShowCrearTerreno,
    showConfigAvanzada,
    setShowConfigAvanzada,
    handleGuardarConfigAvanzada,
    alertasHook,
    syncHook,
    handleCrearProyecto,
    handleCrearTerreno,
    handleSelectProyecto,
    handleSelectTerreno,
  } = useProjectContext()

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [authLoading, isAuthenticated, router])

  if (authLoading || initialLoad) {
    return (
      <PageLayout headerColor="green">
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-gray-600">Cargando...</p>
          </div>
        </div>
      </PageLayout>
    )
  }

  if (!isAuthenticated) return null

  let mainContent: ReactNode

  if (proyectos.length === 0) {
    mainContent = (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
        <div className="text-center max-w-md px-6">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bienvenido a AgriPlan</h1>
          <p className="text-gray-600 mb-8">
            Planifica y gestiona tu producción agrícola de manera inteligente.
            Comienza creando tu primer proyecto.
          </p>
          <button
            onClick={() => setShowCrearProyecto(true)}
            className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors text-lg"
          >
            Crear mi primer proyecto
          </button>
        </div>
      </div>
    )
  } else if (!terrenoActual && proyectoActual) {
    mainContent = (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sin terrenos</h2>
          <p className="text-gray-600 mb-6">
            El proyecto &quot;{proyectoActual.nombre}&quot; aún no tiene terrenos.
            Crea uno para comenzar a planificar.
          </p>
          <button
            onClick={() => setShowCrearTerreno(true)}
            className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Crear terreno
          </button>
        </div>
      </div>
    )
  } else if (loading || !terrenoActual) {
    mainContent = (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  } else {
    mainContent = (
      <MapProvider>
        <MapView />
      </MapProvider>
    )
  }

  return (
    <PageLayout
      headerColor="green"
      headerActions={
        <HeaderActions
          usuarioNombre={usuario?.nombre ?? ''}
          logout={logout}
          alertas={alertasHook.alertas}
          alertasCriticas={alertasHook.alertasCriticas}
          hasConflicts={syncHook.conflicts.length > 0}
          proyectos={proyectos}
          terrenos={terrenos}
          proyectoActualId={proyectoActual?.id ?? null}
          terrenoActualId={terrenoActual?.id ?? null}
          onSelectProyecto={handleSelectProyecto}
          onSelectTerreno={handleSelectTerreno}
          onCrearProyecto={() => setShowCrearProyecto(true)}
          onCrearTerreno={() => setShowCrearTerreno(true)}
        />
      }
    >
      {mainContent}

      {showCrearProyecto && (
        <CrearProyectoModal
          onCreated={handleCrearProyecto}
          onCancel={() => setShowCrearProyecto(false)}
        />
      )}

      {showCrearTerreno && proyectoActual && (
        <CrearTerrenoModal
          proyectoId={proyectoActual.id}
          proyectoNombre={proyectoActual.nombre}
          onCreated={handleCrearTerreno}
          onCancel={() => setShowCrearTerreno(false)}
        />
      )}

      {showConfigAvanzada && terrenoActual && (
        <ConfiguracionAvanzadaModal
          terreno={terrenoActual}
          isOpen={showConfigAvanzada}
          onClose={() => setShowConfigAvanzada(false)}
          onSave={handleGuardarConfigAvanzada}
        />
      )}
    </PageLayout>
  )
}

function MapView() {
  const {
    terrenoActual,
    zonas,
    plantas,
    alertasHook,
    syncHook,
    CULTIVOS_ESPACIADO,
    CULTIVOS_COLORES,
  } = useProjectContext()

  const {
    modo,
    zonaSeleccionada,
    setZonaSeleccionada,
    setPlantaSeleccionada,
    plantasSeleccionadas,
    setPlantasSeleccionadas,
    rectNuevaZona,
    setRectNuevaZona,
    setModo,
    showGridModal,
    setShowGridModal,
    zonaPreview,
    cultivoSeleccionado,
    gridParams,
    posicionesOcupadas,
    plantasZonaSeleccionada,
    handleMapClick,
    handlePlantaClick,
    handleCrearZona,
    handlePlantarGrid,
    handleMoverPlantasSeleccionadas,
  } = useMapContext()

  if (!terrenoActual) return null

  return (
    <div className="flex-1 flex flex-col">
      <AlertaBanner alertasCriticas={alertasHook.alertasCriticas} />
      <OfflineBanner />

      {syncHook.conflicts.length > 0 && (
        <ConflictModal
          conflicts={syncHook.conflicts}
          onResolve={syncHook.resolveConflict}
          onClose={() => {}}
        />
      )}

      <MapToolbar />
      <MapInfoBar />

      <div className="flex-1 flex overflow-hidden relative">
        <main className="flex-1 relative">
          <PixiMapaTerreno
            terreno={terrenoActual}
            zonas={zonas}
            plantas={plantas}
            zonaSeleccionadaId={zonaSeleccionada?.id}
            zonaPreview={zonaPreview}
            modo={modo}
            cultivosEspaciado={CULTIVOS_ESPACIADO}
            cultivosColores={CULTIVOS_COLORES}
            plantasSeleccionadasIds={plantasSeleccionadas}
            gridParams={gridParams}
            posicionesOcupadas={posicionesOcupadas}
            onZonaClick={(zona) => {
              if (modo === 'zonas' || modo === 'plantar') {
                setZonaSeleccionada(zona)
                setPlantaSeleccionada(null)
                setPlantasSeleccionadas([])
              }
            }}
            onZonaCreada={(rect) => {
              if (modo === 'crear_zona') {
                setRectNuevaZona(rect)
              }
            }}
            onMapClick={handleMapClick}
            onPlantaClick={handlePlantaClick}
            onSeleccionMultiple={(ids) => {
              setPlantasSeleccionadas(ids)
              setPlantaSeleccionada(null)
              setZonaSeleccionada(null)
            }}
            onMoverPlantasSeleccionadas={handleMoverPlantasSeleccionadas}
          />
        </main>

        <MapSidebar />
      </div>

      {rectNuevaZona && (
        <NuevaZonaModal
          rect={rectNuevaZona}
          onConfirm={handleCrearZona}
          onCancel={() => {
            setRectNuevaZona(null)
            setModo('terreno')
          }}
        />
      )}

      {showGridModal && zonaSeleccionada && (
        <GridAutomaticoModal
          zona={zonaSeleccionada}
          cultivo={cultivoSeleccionado}
          plantasExistentes={plantasZonaSeleccionada}
          onConfirm={handlePlantarGrid}
          onCancel={() => setShowGridModal(false)}
        />
      )}
    </div>
  )
}

interface HeaderActionsProps {
  usuarioNombre: string
  logout: () => void
  proyectos: Proyecto[]
  terrenos: Terreno[]
  alertas: Alerta[]
  alertasCriticas: number
  proyectoActualId: string | null
  terrenoActualId: string | null
  onSelectProyecto: (p: Proyecto) => void
  onSelectTerreno: (t: Terreno) => void
  onCrearProyecto: () => void
  onCrearTerreno: () => void
  hasConflicts: boolean
}

function HeaderActions({
  usuarioNombre,
  logout,
  proyectos,
  terrenos,
  alertas,
  alertasCriticas,
  proyectoActualId,
  terrenoActualId,
  onSelectProyecto,
  onSelectTerreno,
  onCrearProyecto,
  onCrearTerreno,
}: HeaderActionsProps) {
  const router = useRouter()

  const proyectoActual = proyectoActualId
    ? proyectos.find(p => p.id === proyectoActualId) ?? null
    : null

  const terrenoActual = terrenoActualId
    ? terrenos.find(t => t.id === terrenoActualId) ?? null
    : null

  return (
    <>
      <AlertasDropdown
        alertas={alertas}
        alertasCriticas={alertasCriticas}
      />

      <SyncIndicator />

      <div className="border-l border-green-500 pl-3 ml-1">
        <SelectorTerreno
          proyectos={proyectos}
          terrenos={terrenos}
          proyectoActual={proyectoActual}
          terrenoActual={terrenoActual}
          onSelectProyecto={onSelectProyecto}
          onSelectTerreno={onSelectTerreno}
          onCrearProyecto={onCrearProyecto}
          onCrearTerreno={onCrearTerreno}
          onGestionarTerrenos={() => router.push('/terrenos')}
        />
      </div>

      <div className="flex items-center gap-2 border-l border-green-500 pl-3">
        <span className="text-xs text-white/80">{usuarioNombre}</span>
        <button
          onClick={logout}
          className="text-xs text-green-100 hover:text-white"
          title="Cerrar sesión"
        >
          Salir
        </button>
      </div>
    </>
  )
}
