'use client'

import { useState, useCallback } from 'react'
import { useProjectContext } from '@/contexts/project-context'
import { useMapContext } from '@/contexts/map-context'
import { EditorZona } from '@/components/mapa/editor-zona'
import { EstanquePanel } from '@/components/mapa/estanque-panel'
import { ScoreCalidadPanel, ROIPanel, Comparador } from '@/components/proyeccion'
import { PlantaInfo } from '@/components/plantas/planta-info'
import { AccionesLote } from '@/components/plantas/acciones-lote'
import { ConfigurarRiegoModal, EntradaAguaForm } from '@/components/agua'
import { useAgua } from '@/hooks/use-agua'
import { calcularScoreCalidad } from '@/lib/utils/calidad'
import { calcularROI, obtenerCostoAguaPromedio } from '@/lib/utils/roi'
import { obtenerFuente } from '@/lib/data/fuentes-agua'
import { calcularConsumoZona, calcularConsumoRiegoZona, calcularDiasRestantes, determinarEstadoAgua } from '@/lib/utils/agua'
import type { UUID } from '@/types'

interface InfoLabelProps {
  label: string
  tooltip: string
}

function InfoLabel({ label, tooltip }: InfoLabelProps) {
  const [show, setShow] = useState(false)

  return (
    <div className="flex items-center gap-1">
      <span>{label}</span>
      <div
        className="relative"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        <button
          type="button"
          className="w-3.5 h-3.5 rounded-full bg-gray-200 text-gray-500 text-[10px] leading-none flex items-center justify-center hover:bg-gray-300"
          aria-label={tooltip}
        >
          i
        </button>
        {show && (
          <div className="absolute right-0 top-4 z-40 max-w-xs bg-white border border-gray-200 rounded-lg shadow-lg p-2 text-[11px] text-gray-700 whitespace-normal break-words">
            {tooltip}
          </div>
        )}
      </div>
    </div>
  )
}

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
    cultivoSeleccionado,
    setCultivoSeleccionado,
    setShowGridModal,
    setZonaPreview,
    plantasZonaSeleccionada,
    handleCambiarEstadoPlanta,
    handleCambiarEtapaPlanta,
    handleEliminarPlanta,
    handleGuardarZona,
    handleEliminarZona,
    validarCambiosZona,
    advertenciaEliminacionZona,
  } = useMapContext()

  const [showConfigRiego, setShowConfigRiego] = useState(false)
  const [showEntradaAguaForm, setShowEntradaAguaForm] = useState(false)
  const [estanqueIdParaAgua, setEstanqueIdParaAgua] = useState<UUID | null>(null)

  const { registrarEntrada } = useAgua(
    terrenoActual,
    zonas,
    plantas,
    catalogoCultivos,
    cargarDatosTerreno
  )

  const handleAbrirFormularioAgua = useCallback((estanqueId: UUID) => {
    setEstanqueIdParaAgua(estanqueId)
    setShowEntradaAguaForm(true)
  }, [])

  if (!terrenoActual) return null

  return (
    <aside className="w-80 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-900">
          {plantasSeleccionadas.length > 0
            ? 'Selección Múltiple'
            : plantaSeleccionada
              ? 'Planta'
              : zonaSeleccionada
                ? 'Editar Zona'
                : 'Panel de Información'}
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
              onCambiarEstado={async (estado) => {
                await plantasLoteHook.cambiarEstadoMultiple(plantasSeleccionadas, estado)
                setPlantasSeleccionadas([])
              }}
              onEliminar={async () => {
                await plantasLoteHook.eliminarMultiple(plantasSeleccionadas)
                setPlantasSeleccionadas([])
              }}
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

            {zonaSeleccionada.tipo === 'cultivo' && (
              <div className="p-4 border-t space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Plantas en esta zona</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    {plantasZonaSeleccionada.length} planta(s) en total
                  </p>

                  {plantasZonaSeleccionada.length > 0 && (() => {
                    const plantasPorTipo = plantasZonaSeleccionada.reduce((acc, planta) => {
                      const id = planta.tipo_cultivo_id
                      acc[id] = (acc[id] || 0) + 1
                      return acc
                    }, {} as Record<string, number>)

                    return (
                      <div className="space-y-2">
                        {Object.entries(plantasPorTipo).map(([cultivoId, cantidad]) => {
                          const cultivo = catalogoCultivos.find(c => c.id === cultivoId)
                          const porcentaje = ((cantidad / plantasZonaSeleccionada.length) * 100).toFixed(0)

                          return (
                            <div key={cultivoId} className="bg-green-50 border border-green-200 rounded-lg p-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">🌱</span>
                                  <div>
                                    <p className="text-sm font-medium text-green-900">
                                      {cultivo?.nombre || 'Cultivo desconocido'}
                                    </p>
                                    <p className="text-xs text-green-700">
                                      {cultivo?.nombre_cientifico}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-green-900">{cantidad}</p>
                                  <p className="text-xs text-green-600">{porcentaje}%</p>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}
                </div>

                {plantasZonaSeleccionada.length > 0 && (() => {
                  const consumoRecomendado = calcularConsumoZona(zonaSeleccionada, plantasZonaSeleccionada, catalogoCultivos)
                  const consumoRiego = calcularConsumoRiegoZona(zonaSeleccionada)
                  const consumoEfectivo = consumoRiego > 0 ? consumoRiego : consumoRecomendado
                  const aguaDisp = estanquesHook.aguaTotalActual
                  const estado = consumoEfectivo > 0 ? determinarEstadoAgua(aguaDisp, consumoEfectivo) : 'ok'
                  const diasRestantes = calcularDiasRestantes(aguaDisp, consumoEfectivo)
                  return (
                    <div className={`p-3 rounded-lg text-sm ${
                      estado === 'ok' ? 'bg-cyan-50 text-cyan-800' :
                      estado === 'ajustado' ? 'bg-yellow-50 text-yellow-800' :
                      'bg-red-50 text-red-800'
                    }`}>
                      <h4 className="text-xs font-bold mb-1">Consumo semanal estimado</h4>
                      <div className="text-xs space-y-0.5">
                        <div className="flex justify-between">
                          <InfoLabel
                            label="Recomendado"
                            tooltip="Consumo que el cultivo debería necesitar según ficha, clima y etapa de crecimiento."
                          />
                          <span className={`font-medium ${consumoRiego > 0 ? 'text-gray-500' : ''}`}>{consumoRecomendado.toFixed(2)} m³/sem</span>
                        </div>
                        {consumoRiego > 0 && (
                          <div className="flex justify-between">
                            <InfoLabel
                              label="Con tu riego"
                              tooltip="Consumo real calculado con el caudal y horas de riego que configuraste en esta zona."
                            />
                            <span className="font-bold">{consumoRiego.toFixed(2)} m³/sem</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <InfoLabel
                            label="Agua actual"
                            tooltip="Nivel estimado del estanque. Se descuenta automáticamente según el consumo calculado de tus plantas."
                          />
                          <span className="font-medium">{aguaDisp.toFixed(1)} m³</span>
                        </div>
                        {diasRestantes !== Infinity && (
                          <div className="flex justify-between font-medium">
                            <InfoLabel
                              label="Días de cobertura"
                              tooltip={consumoRiego > 0
                                ? "Calculado con el consumo real de tu sistema de riego."
                                : "Calculado con el consumo recomendado. Configura tu riego para usar datos reales."
                              }
                            />
                            <span>~{Math.floor(diasRestantes)} días</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })()}

                {plantasZonaSeleccionada.length > 0 && (() => {
                  const consumoRecomendadoZona = calcularConsumoZona(zonaSeleccionada, plantasZonaSeleccionada, catalogoCultivos)
                  const consumoRiegoZona = calcularConsumoRiegoZona(zonaSeleccionada)
                  const consumoEfectivoZona = consumoRiegoZona > 0 ? consumoRiegoZona : consumoRecomendadoZona
                  const aguaDisp = estanquesHook.aguaTotalActual
                  const cultivoZona = catalogoCultivos.find(c =>
                    plantasZonaSeleccionada.some(p => p.tipo_cultivo_id === c.id)
                  )
                  if (!cultivoZona) return null

                  const estanquePrincipal = estanquesHook.obtenerEstanquePrincipal()
                  const fuenteId = estanquePrincipal?.estanque_config?.fuente_id
                  const fuente = fuenteId ? obtenerFuente(fuenteId) ?? null : null
                  const suelo = terrenoActual?.suelo ?? null
                  const score = calcularScoreCalidad(cultivoZona, fuente, suelo, aguaDisp, consumoEfectivoZona)

                  const costoAguaM3 = obtenerCostoAguaPromedio(estanquesHook.estanques, terrenoActual)
                  const plantasVivas = plantasZonaSeleccionada.filter(p => p.estado !== 'muerta')
                  const consumoVivasRec = calcularConsumoZona(zonaSeleccionada, plantasVivas, catalogoCultivos)
                  const consumoParaRoi = consumoRiegoZona > 0 ? consumoRiegoZona : consumoVivasRec
                  const roi = calcularROI(cultivoZona, zonaSeleccionada, plantasVivas.length, costoAguaM3, consumoParaRoi, suelo)

                  return (
                    <div className="space-y-3">
                      <div className="bg-white border rounded-lg p-3">
                        <ScoreCalidadPanel score={score} />
                      </div>
                      <div className="bg-white border rounded-lg p-3">
                        <ROIPanel roi={roi} />
                      </div>
                      <div className="bg-white border rounded-lg p-3">
                        <Comparador
                          zona={zonaSeleccionada}
                          catalogoCultivos={catalogoCultivos}
                          costoAguaM3={costoAguaM3}
                          suelo={suelo}
                        />
                      </div>
                    </div>
                  )
                })()}

                <div className={`p-3 rounded-lg ${zonaSeleccionada.configuracion_riego ? 'bg-blue-50' : 'bg-amber-50/70'}`}>
                  {zonaSeleccionada.configuracion_riego ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1 mb-1">
                        <h4 className="text-sm font-bold text-blue-800">💧 Sistema de Riego</h4>
                        <InfoLabel
                          label=""
                          tooltip="Estos valores usan tu caudal total (L/h) y horas de riego por día. Revisa el panel de Consumo para ver la diferencia vs el consumo recomendado."
                        />
                      </div>
                      <div className="bg-blue-100/60 border border-blue-200 rounded-lg p-2 space-y-0.5">
                        <p className="text-xs font-bold text-blue-800">Riego configurado</p>
                        <p className="text-[11px] text-blue-700">
                          Consumo y días de cobertura se calculan con tu caudal y horas de riego.
                        </p>
                      </div>
                      <div className="text-xs text-blue-700 bg-white p-2 rounded">
                        <div className="flex justify-between">
                          <span>Tipo:</span>
                          <span className="font-medium">
                            {zonaSeleccionada.configuracion_riego.tipo === 'programado' ? '⏰ Programado' : '💧 Continuo 24/7'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Caudal:</span>
                          <span className="font-medium">{zonaSeleccionada.configuracion_riego.caudal_total_lh} L/h</span>
                        </div>
                        {zonaSeleccionada.configuracion_riego.tipo === 'programado' && (
                          <div className="flex justify-between">
                            <span>Horario:</span>
                            <span className="font-medium">
                              {zonaSeleccionada.configuracion_riego.horario_inicio} - {zonaSeleccionada.configuracion_riego.horario_fin}
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setShowConfigRiego(true)}
                        className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 text-sm font-medium"
                      >
                        Reconfigurar Riego
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1 mb-1">
                        <h4 className="text-sm font-bold text-amber-800">💧 Sistema de Riego</h4>
                        <InfoLabel
                          label=""
                          tooltip='Mientras no configures caudal (L/h) y horas/día, la app usa un modelo estándar: lo que el cultivo "debería" consumir. Cuando agregues tu sistema, los cálculos pasarán a usar tu riego real.'
                        />
                      </div>
                      <div className="bg-amber-50 border border-amber-300 rounded-lg p-2.5 space-y-1">
                        <p className="text-xs font-bold text-amber-800">⚠️ Sistema de riego no configurado</p>
                        <p className="text-[11px] text-amber-700">
                          El consumo y los días de cobertura se calculan solo con el consumo recomendado por ficha (cultivo + clima + etapa). No reflejan tu instalación real de goteros/válvulas.
                        </p>
                      </div>
                      <button
                        onClick={() => setShowConfigRiego(true)}
                        className="w-full bg-amber-500 text-white py-2 rounded hover:bg-amber-600 text-sm font-medium"
                      >
                        Configurar Riego
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-lime-50 p-3 rounded-lg space-y-3">
                  <h4 className="text-sm font-bold text-lime-800">Plantar en esta zona</h4>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      ¿Qué quieres plantar?
                    </label>
                    <select
                      value={cultivoSeleccionado.id}
                      onChange={(e) => {
                        const cultivo = catalogoCultivos.find(c => c.id === e.target.value)
                        if (cultivo) setCultivoSeleccionado(cultivo)
                      }}
                      className="w-full px-3 py-2 rounded border border-gray-300 text-gray-900 text-sm"
                    >
                      {catalogoCultivos.map(c => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div className="text-xs text-gray-600 bg-white p-2 rounded">
                    <div>Espaciado: <strong>{cultivoSeleccionado.espaciado_recomendado_m}m</strong></div>
                  </div>

                  <button
                    onClick={() => setShowGridModal(true)}
                    className="w-full bg-lime-600 text-white py-2 rounded hover:bg-lime-700 text-sm font-medium"
                  >
                    Plantar {cultivoSeleccionado.nombre} en Grilla
                  </button>

                  <p className="text-xs text-gray-600 text-center">
                    O usa modo &quot;Plantar&quot; para colocar individualmente
                  </p>
                </div>
              </div>
            )}

            {zonaSeleccionada.tipo === 'estanque' && zonaSeleccionada.estanque_config && (
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
          <div className="p-4 space-y-4">
            <div className="bg-white rounded-lg border shadow-sm">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="font-medium text-gray-900">{terrenoActual.nombre}</h3>
                <button
                  onClick={() => setShowConfigAvanzada(true)}
                  className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Configurar
                </button>
              </div>

              <div className="p-4">
                <p className="text-sm text-gray-600 mb-3">
                  Selecciona una zona o planta para ver detalles y opciones de edición.
                </p>

                {zonas.length === 0 ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>💡 Comienza aquí:</strong> Haz clic en &quot;+ Nueva Zona&quot; arriba y dibuja un rectángulo en el mapa.
                    </p>
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 space-y-1">
                    <div className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono">Click</kbd>
                      <span>en zona/planta para seleccionar</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono">Shift + arrastrar</kbd>
                      <span>para selección múltiple</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono">ESC</kbd>
                      <span>para deseleccionar</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {showConfigRiego && zonaSeleccionada?.tipo === 'cultivo' && (() => {
        const plantasVivas = plantasZonaSeleccionada.filter(p => p.estado !== 'muerta')
        const consumoZonaM3Sem = calcularConsumoZona(zonaSeleccionada, plantasVivas, catalogoCultivos)
        const consumoRecLDia = (consumoZonaM3Sem * 1000) / 7
        const lPorPlantaDia = plantasVivas.length > 0 ? consumoRecLDia / plantasVivas.length : 0

        return (
          <ConfigurarRiegoModal
            config={zonaSeleccionada.configuracion_riego}
            sueloArcilloso={terrenoActual.suelo?.fisico?.textura === 'arcillosa'}
            consumoRecomendadoLDia={consumoRecLDia}
            litrosPorPlantaDia={lPorPlantaDia}
            numPlantasZona={plantasVivas.length}
            onGuardar={async (config) => {
              await zonasHook.actualizarZona(zonaSeleccionada.id, {
                configuracion_riego: config,
              })
              setShowConfigRiego(false)
            }}
            onCerrar={() => setShowConfigRiego(false)}
          />
        )
      })()}

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
                  console.error('Error al registrar entrada de agua:', error)
                }
              }}
              onCancelar={() => {
                setShowEntradaAguaForm(false)
                setEstanqueIdParaAgua(null)
              }}
            />
          </div>
        </div>
      )}
    </aside>
  )
}
