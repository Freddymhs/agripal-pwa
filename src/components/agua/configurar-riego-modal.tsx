'use client'

import { useState } from 'react'
import type { ConfiguracionRiego, TipoSistemaRiego } from '@/types'
import { GOTEROS_DEFAULT } from '@/types'

interface ConfigurarRiegoModalProps {
  config?: ConfiguracionRiego
  sueloArcilloso?: boolean
  consumoRecomendadoLDia?: number
  litrosPorPlantaDia?: number
  numPlantasZona?: number
  onGuardar: (config: ConfiguracionRiego) => Promise<void>
  onCerrar: () => void
}

export function ConfigurarRiegoModal({
  config,
  sueloArcilloso = false,
  consumoRecomendadoLDia,
  litrosPorPlantaDia,
  numPlantasZona,
  onGuardar,
  onCerrar,
}: ConfigurarRiegoModalProps) {
  const [tipo, setTipo] = useState<TipoSistemaRiego>(config?.tipo || 'programado')
  const [caudalTotal, setCaudalTotal] = useState(config?.caudal_total_lh || 100)
  const [horasDia, setHorasDia] = useState(config?.horas_dia || 6)
  const [horarioInicio, setHorarioInicio] = useState(config?.horario_inicio || '06:00')
  const [horarioFin, setHorarioFin] = useState(config?.horario_fin || '12:00')
  const [guardando, setGuardando] = useState(false)

  const [goterosPorPlanta, setGoterosPorPlanta] = useState<number>(GOTEROS_DEFAULT.cantidad)
  const [caudalPorGotero, setCaudalPorGotero] = useState<number>(() => {
    if (config?.caudal_total_lh && numPlantasZona && numPlantasZona > 0) {
      const derivado = config.caudal_total_lh / (GOTEROS_DEFAULT.cantidad * numPlantasZona)
      return Math.round(derivado * 10) / 10
    }
    return GOTEROS_DEFAULT.caudal_lh_por_gotero
  })
  const [mostrarCalculadoraCaudal, setMostrarCalculadoraCaudal] = useState(false)

  const calcularHoraFin = (inicio: string, horas: number) => {
    const [h, m] = inicio.split(':').map(Number)
    const totalMin = (h * 60 + m + horas * 60) % (24 * 60)
    return `${String(Math.floor(totalMin / 60)).padStart(2, '0')}:${String(totalMin % 60).padStart(2, '0')}`
  }

  const horasEfectivas = tipo === 'continuo_24_7' ? 24 : horasDia
  const gastoDiarioL = caudalTotal * horasEfectivas
  const gastoDiarioM3 = gastoDiarioL / 1000

  const handleGuardar = async () => {
    setGuardando(true)
    try {
      await onGuardar({
        tipo,
        caudal_total_lh: caudalTotal,
        horas_dia: tipo === 'programado' ? horasDia : undefined,
        horario_inicio: tipo === 'programado' ? horarioInicio : undefined,
        horario_fin: tipo === 'programado' ? horarioFin : undefined,
      })
      onCerrar()
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Configurar Sistema de Riego</h2>

        <div className="space-y-4">
          {consumoRecomendadoLDia != null && consumoRecomendadoLDia > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs font-medium text-green-800 mb-1">Necesidad diaria estimada (recomendada)</p>
              <p className="text-sm text-green-700">
                Esta zona necesita aprox. <strong>{Math.round(consumoRecomendadoLDia)} L/día</strong> en total
                {litrosPorPlantaDia != null && litrosPorPlantaDia > 0 && (
                  <> ({litrosPorPlantaDia.toFixed(1)} L/día por planta)</>
                )} según ficha de cultivo, clima y etapa. Si no configuras riego, se usará este valor recomendado para estimar el consumo.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Tipo de Sistema</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTipo('programado')}
                className={`p-3 rounded-lg border-2 text-left ${
                  tipo === 'programado'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">⏰ Programado</div>
                <div className="text-xs text-gray-500">Horario específico</div>
              </button>
              <button
                type="button"
                onClick={() => setTipo('continuo_24_7')}
                className={`p-3 rounded-lg border-2 text-left ${
                  tipo === 'continuo_24_7'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">💧 Continuo 24/7</div>
                <div className="text-xs text-gray-500">Válvula abierta</div>
              </button>
            </div>
          </div>

          {tipo === 'continuo_24_7' && sueloArcilloso && (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="text-yellow-600">⚠️</span>
                <div className="text-sm text-yellow-800">
                  <strong>Atención:</strong> Tu suelo es arcilloso. El riego continuo 24/7 puede causar encharcamiento y pudrición de raíces.
                </div>
              </div>
            </div>
          )}
          {tipo === 'continuo_24_7' && consumoRecomendadoLDia != null && consumoRecomendadoLDia > 0 && caudalTotal > 0 && (() => {
            const gastoContL = caudalTotal * 24
            const ratio = gastoContL / consumoRecomendadoLDia
            const porcentaje = Math.round(ratio * 100)

            let descripcion = ''
            let containerClasses = 'bg-blue-50 border-blue-200'
            let textClasses = 'text-blue-800'

            if (porcentaje < 70) {
              const menos = 100 - porcentaje
              descripcion = `${porcentaje}% de lo recomendado (≈${menos}% menos).`
              containerClasses = 'bg-yellow-50 border-yellow-200'
              textClasses = 'text-yellow-800'
            } else if (porcentaje <= 130) {
              descripcion = `${porcentaje}% de lo recomendado (casi igual).`
            } else {
              const veces = ratio.toFixed(1)
              descripcion = `${porcentaje}% de lo recomendado (≈${veces}× más).`
              containerClasses = 'bg-amber-50 border-amber-300'
              textClasses = 'text-amber-800'
            }

            return (
              <div className={`p-3 rounded-lg border ${containerClasses}`}>
                <p className={`text-xs ${textClasses}`}>
                  Continuo 24/7 = <strong>{gastoContL.toLocaleString()} L/día</strong>, {descripcion}
                </p>
                {porcentaje > 130 && (
                  <p className="text-[11px] text-amber-700 mt-1">
                    ⚠️ Este modo gasta mucha más agua que la recomendada. Úsalo solo en casos especiales (lavado de sales, emergencias, etc.).
                  </p>
                )}
              </div>
            )
          })()}

          <div>
            <label className="block text-sm font-medium mb-2">
              Caudal total del sistema (L/h)
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                value={caudalTotal}
                onChange={(e) => setCaudalTotal(Math.max(1, Number(e.target.value)))}
                min={1}
                className="flex-1 px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setMostrarCalculadoraCaudal(v => !v)}
                className="px-2 py-2 text-xs rounded border border-gray-300 bg-gray-50 hover:bg-gray-100"
              >
                {mostrarCalculadoraCaudal ? 'Cerrar' : 'Calculadora'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Ingresa el caudal real de tu sistema (suma de todos los goteros conectados).
            </p>
            {mostrarCalculadoraCaudal && (
              <div className="mt-2 border rounded-md p-2 bg-gray-50 space-y-2">
                <div className="grid grid-cols-3 gap-2 items-end">
                  <div>
                    <label className="block text-[11px] text-gray-600 mb-1">Goteros por planta</label>
                    <input
                      type="number"
                      min={1}
                      value={goterosPorPlanta}
                      onChange={e => setGoterosPorPlanta(Math.max(1, Number(e.target.value)))}
                      className="w-full px-2 py-1 border rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-600 mb-1">L/h por gotero</label>
                    <input
                      type="number"
                      min={0.1}
                      step={0.1}
                      value={caudalPorGotero}
                      onChange={e => setCaudalPorGotero(Math.max(0.1, Number(e.target.value)))}
                      className="w-full px-2 py-1 border rounded text-xs"
                    />
                    <div className="flex gap-1 mt-1">
                      {[2, 4, 8].map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setCaudalPorGotero(v)}
                          className={`px-1.5 py-0.5 text-[10px] rounded ${caudalPorGotero === v ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
                        >
                          {v} L/h
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-600 mb-1">Nº plantas</label>
                    <div className="px-2 py-1 border rounded text-xs bg-white">
                      {numPlantasZona ?? 0}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-[11px] text-gray-500">
                    Caudal estimado = goteros × L/h × plantas (nº plantas viene de esta zona).
                  </p>
                  <button
                    type="button"
                    disabled={!numPlantasZona || numPlantasZona <= 0}
                    onClick={() => {
                      const caudal = goterosPorPlanta * caudalPorGotero * (numPlantasZona || 0)
                      setCaudalTotal(caudal)
                    }}
                    className="px-2 py-1 text-[11px] rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Usar este caudal
                  </button>
                </div>
                {(!numPlantasZona || numPlantasZona <= 0) && (
                  <p className="text-[11px] text-amber-600">Agrega plantas a esta zona primero para poder calcular el caudal.</p>
                )}
              </div>
            )}
            <p className="text-[11px] text-gray-500 mt-1">
              Si no conoces tu caudal exacto, puedes dejar este valor; la app seguirá usando el consumo recomendado como referencia.
            </p>
          </div>

          {tipo === 'programado' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Horas de riego por día
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    value={horasDia}
                    onChange={(e) => {
                      const h = Math.max(1, Math.min(24, Number(e.target.value)))
                      setHorasDia(h)
                      setHorarioFin(calcularHoraFin(horarioInicio, h))
                    }}
                    min={1}
                    max={24}
                    className="flex-1 px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-600">h/día</span>
                </div>
                {consumoRecomendadoLDia != null && consumoRecomendadoLDia > 0 && caudalTotal > 0 && (() => {
                  const horasRec = consumoRecomendadoLDia / caudalTotal
                  if (horasRec > 24) return null
                  const gastoActualL = caudalTotal * horasDia
                  const ratio = gastoActualL / consumoRecomendadoLDia
                  const porcentaje = Math.round(ratio * 100)

                  let resumenActual = ''
                  if (porcentaje < 70) {
                    resumenActual = `${porcentaje}% de lo recomendado (riego bajo).`
                  } else if (porcentaje <= 130) {
                    resumenActual = `${porcentaje}% de lo recomendado (casi igual).`
                  } else {
                    resumenActual = `${porcentaje}% de lo recomendado (riego alto).`
                  }

                  return (
                    <div className="bg-blue-50 border border-blue-200 rounded p-2 mt-2">
                      <p className="text-xs text-blue-800">
                        Para este caudal (<strong>{caudalTotal} L/h</strong>), lo recomendado es regar <strong>~{horasRec.toFixed(1)} h/día</strong> para llegar al consumo estimado.
                      </p>
                      <p className="text-[11px] text-blue-600 mt-0.5">
                        Con tus <strong>{horasDia} h/día</strong> actuales riegas aproximadamente <strong>{Math.round(gastoActualL)} L/día</strong> ({resumenActual}).
                      </p>
                    </div>
                  )
                })()}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-2">Inicio</label>
                  <input
                    type="time"
                    value={horarioInicio}
                    onChange={(e) => {
                      setHorarioInicio(e.target.value)
                      setHorarioFin(calcularHoraFin(e.target.value, horasDia))
                    }}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Fin</label>
                  <input
                    type="time"
                    value={horarioFin}
                    onChange={(e) => setHorarioFin(e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </>
          )}

          <div className="bg-cyan-50 border border-cyan-200 p-4 rounded-lg">
            <div className="text-sm text-cyan-800 mb-1">Gasto diario estimado</div>
            <div className="text-2xl font-bold text-cyan-700">
              {gastoDiarioL.toLocaleString()} L/día
            </div>
            <div className="text-sm text-cyan-600">
              {gastoDiarioM3.toFixed(2)} m³/día • {(gastoDiarioM3 * 7).toFixed(2)} m³/semana
            </div>
            {tipo === 'programado' && (
              <div className="text-xs text-cyan-600 mt-2 pt-2 border-t border-cyan-200">
                💡 vs Continuo 24/7: Ahorro de {Math.round((1 - horasDia / 24) * 100)}% de agua
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleGuardar}
              disabled={guardando}
              className="flex-1 bg-blue-500 text-white py-2.5 rounded-lg hover:bg-blue-600 disabled:opacity-50 font-medium"
            >
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              onClick={onCerrar}
              disabled={guardando}
              className="flex-1 bg-gray-100 py-2.5 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
