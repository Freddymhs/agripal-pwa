'use client'

import { useState, useCallback } from 'react'
import { logger } from '@/lib/logger'
import { useProjectContext } from '@/contexts/project-context'
import { useMapContext } from '@/contexts/map-context'
import { EditorZona } from '@/components/mapa/editor-zona'
import { EstanquePanel } from '@/components/mapa/estanque-panel'
import { ZonaCultivoPanel } from '@/components/mapa/zona-cultivo-panel'
import { MapSidebarEmpty } from '@/components/mapa/map-sidebar-empty'
import { PlantaInfo } from '@/components/plantas/planta-info'
import { AccionesLote } from '@/components/plantas/acciones-lote'
import { EntradaAguaForm } from '@/components/agua'
import { useAgua } from '@/hooks/use-agua'
import type { UUID } from '@/types'
import { TIPO_ZONA } from '@/lib/constants/entities'

export function MapSidebar() {
  const {
    terrenoActual,
    zonas,
    plantas,
    catalogoCultivos,
    estanquesHook,
    zonasHook,
    plantasLoteHook,
    handleCambiarFuente,
    setShowConfigAvanzada,
    cargarDatosTerreno,
  } = useProjectContext()

  const {
    modo,
    zonaSeleccionada,
    plantaSeleccionada,
    setPlantaSeleccionada,
    plantasSeleccionadas,
    setPlantasSeleccionadas,
    setZonaSeleccionada,
    plantasZonaSeleccionada,
    handleCambiarEstadoPlanta,
    handleCambiarEtapaPlanta,
    handleEliminarPlanta,
    handleGuardarZona,
    handleEliminarZona,
    validarCambiosZona,
    advertenciaEliminacionZona,
    setZonaPreview,
  } = useMapContext()

  const [showEntradaAguaForm, setShowEntradaAguaForm] = useState(false)
  const [estanqueIdParaAgua, setEstanqueIdParaAgua] = useState<UUID | null>(null)

  const { registrarEntrada } = useAgua(terrenoActual, zonas, plantas, catalogoCultivos, cargarDatosTerreno)

  const handleAbrirFormularioAgua = useCallback((estanqueId: UUID) => {
    setEstanqueIdParaAgua(estanqueId)
    setShowEntradaAguaForm(true)
  }, [])

  if (!terrenoActual) return null

  return (
    <aside className="w-80 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-900">
          {plantasSeleccionadas.length > 0 ? 'Selección Múltiple' : plantaSeleccionada ? 'Planta' : zonaSeleccionada ? 'Editar Zona' : 'Panel de Información'}
        </h2>
        {!zonaSeleccionada && !plantaSeleccionada && plantasSeleccionadas.length === 0 && (modo === 'zonas' || modo === 'plantas') && (
          <p className="text-sm text-gray-500">
            {modo === 'zonas' ? 'Selecciona una zona' : 'Selecciona una planta. Shift+arrastrar para selección múltiple.'}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {plantasSeleccionadas.length > 0 ? (
          <div className="p-4">
            <AccionesLote
              cantidad={plantasSeleccionadas.length}
              onCambiarEstado={async (estado) => { await plantasLoteHook.cambiarEstadoMultiple(plantasSeleccionadas, estado); setPlantasSeleccionadas([]) }}
              onEliminar={async () => { await plantasLoteHook.eliminarMultiple(plantasSeleccionadas); setPlantasSeleccionadas([]) }}
              onCancelar={() => setPlantasSeleccionadas([])}
            />
          </div>
        ) : plantaSeleccionada ? (
          <PlantaInfo
            planta={plantaSeleccionada}
            cultivo={catalogoCultivos.find(c => c.id === plantaSeleccionada.tipo_cultivo_id)}
            onCambiarEstado={handleCambiarEstadoPlanta}
            onCambiarEtapa={handleCambiarEtapaPlanta}
            onEliminar={handleEliminarPlanta}
            onClose={() => setPlantaSeleccionada(null)}
          />
        ) : zonaSeleccionada ? (
          <div>
            <EditorZona
              zona={zonaSeleccionada}
              cantidadPlantas={plantasZonaSeleccionada.length}
              onSave={handleGuardarZona}
              onRedimensionar={(size) => zonasHook.redimensionarZona(zonaSeleccionada.id, size)}
              onMover={(pos) => zonasHook.moverZona(zonaSeleccionada.id, pos)}
              onDelete={handleEliminarZona}
              onClose={() => setZonaSeleccionada(null)}
              onPreviewChange={setZonaPreview}
              validarCambios={validarCambiosZona}
              advertenciaEliminacion={advertenciaEliminacionZona}
            />

            {zonaSeleccionada.tipo === TIPO_ZONA.CULTIVO && <ZonaCultivoPanel />}

            {zonaSeleccionada.tipo === TIPO_ZONA.ESTANQUE && zonaSeleccionada.estanque_config && (
              <div className="border-t">
                <EstanquePanel
                  estanque={zonaSeleccionada}
                  zonas={zonas}
                  plantas={plantas}
                  catalogoCultivos={catalogoCultivos}
                  onAbrirFormularioAgua={handleAbrirFormularioAgua}
                  onCambiarFuente={handleCambiarFuente}
                />
              </div>
            )}
          </div>
        ) : (
          <MapSidebarEmpty
            terrenoActual={terrenoActual}
            zonas={zonas}
            onConfigAvanzada={() => setShowConfigAvanzada(true)}
          />
        )}
      </div>

      {showEntradaAguaForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <EntradaAguaForm
              estanques={estanquesHook.estanques}
              estanqueIdPrecargado={estanqueIdParaAgua || undefined}
              onRegistrar={async (data) => {
                try {
                  await registrarEntrada(data)
                  setShowEntradaAguaForm(false)
                  setEstanqueIdParaAgua(null)
                } catch (error) {
                  logger.error('Error al registrar entrada de agua', { error: error instanceof Error ? { message: error.message } : { error } })
                }
              }}
              onCancelar={() => { setShowEntradaAguaForm(false); setEstanqueIdParaAgua(null) }}
            />
          </div>
        </div>
      )}
    </aside>
  )
}
