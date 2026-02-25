'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { zonasDAL } from '@/lib/dal'
import { useTerrainData } from '@/hooks/use-terrain-data'
import { useEstanques } from '@/hooks/use-estanques'
import { useAgua } from '@/hooks/use-agua'
import { logger } from '@/lib/logger'
import { PageLayout } from '@/components/layout'
import {
  PanelEstanques,
  EntradaAguaForm,
  ResumenAgua,
  HistorialAgua,
} from '@/components/agua'
import { ConfigurarAguaModal } from '@/components/agua/configurar-agua-modal'
import { addDays } from 'date-fns'
import { getCurrentTimestamp } from '@/lib/utils'
import { emitZonaUpdated } from '@/lib/events/zona-events'
import type { Terreno, Zona, Planta, CatalogoCultivo } from '@/types'
import { TIPO_ZONA } from '@/lib/constants/entities'

export default function AguaPage() {
  const { terreno, zonas, plantas, catalogoCultivos, loading, refetch } = useTerrainData()
  const [showEntradaForm, setShowEntradaForm] = useState(false)
  const [showConfigRecarga, setShowConfigRecarga] = useState(false)
  const [estanqueSeleccionadoId, setEstanqueSeleccionadoId] = useState<string | null>(null)

  const {
    estanques,
    aguaTotalDisponible,
    aguaTotalActual,
    agregarAgua,
  } = useEstanques(zonas, refetch)

  const {
    entradas,
    consumoSemanal,
    estadoAgua,
    registrarEntrada,
  } = useAgua(terreno, zonas, plantas, catalogoCultivos, refetch)

  useEffect(() => {
    if (estanques.length === 0) {
      setEstanqueSeleccionadoId(null)
      return
    }
    const sigueExistiendo = estanqueSeleccionadoId && estanques.some(e => e.id === estanqueSeleccionadoId)
    if (!sigueExistiendo) {
      setEstanqueSeleccionadoId(estanques[0].id)
    }
  }, [estanques, estanqueSeleccionadoId])

  const estanqueActual = estanques.find(e => e.id === estanqueSeleccionadoId) || estanques[0] || null

  if (loading) {
    return (
      <PageLayout headerColor="cyan">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Cargando...</div>
        </div>
      </PageLayout>
    )
  }

  if (!terreno) {
    return (
      <PageLayout headerColor="cyan">
        <main className="p-4">
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
            <p className="text-yellow-800">No hay terrenos creados. Crea uno primero desde la página principal.</p>
          </div>
        </main>
      </PageLayout>
    )
  }

  return (
    <PageLayout headerColor="cyan">
      <main className="p-4 space-y-4 max-w-4xl mx-auto">
        <div className="bg-cyan-50 border-l-4 border-cyan-500 p-4 rounded-lg">
          <h2 className="text-lg font-bold text-cyan-900 mb-2">💧 Gestión Diaria del Agua</h2>
          <p className="text-sm text-cyan-800">
            Monitorea tu agua <strong>actual</strong>, registra entradas reales, y controla el consumo día a día.
            Este es el seguimiento de tu sistema <strong>en operación</strong>.
          </p>
          <p className="text-xs text-cyan-700 mt-2">
            🧪 <strong>¿Quieres planificar antes de invertir?</strong>{' '}
            <Link href="/agua/planificador" className="underline font-medium">
              Usa el Planificador
            </Link>
            {' '}para simular diferentes escenarios.
          </p>
        </div>

        <ResumenAgua
          aguaActual={aguaTotalActual}
          aguaMaxima={aguaTotalDisponible}
          consumoSemanal={consumoSemanal}
          estadoAgua={estadoAgua}
          zonas={zonas}
          plantas={plantas}
          catalogoCultivos={catalogoCultivos}
          configRecarga={estanqueActual?.estanque_config?.recarga}
        />

{zonas.some(z => z.tipo === TIPO_ZONA.ESTANQUE && !z.estanque_config) && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ Detectamos zonas marcadas como &quot;estanque&quot; pero sin configuración.
              Por favor, edita estas zonas en el mapa y completa su configuración.
            </p>
          </div>
        )}

        {estanques.length > 1 && (
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estanque Seleccionado:
            </label>
            <select
              value={estanqueSeleccionadoId || ''}
              onChange={(e) => {
                const newId = e.target.value
                setEstanqueSeleccionadoId(newId)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              {estanques.map(est => (
                <option key={est.id} value={est.id}>
                  {est.nombre} {est.estanque_config ? `(${est.estanque_config.nivel_actual_m3}/${est.estanque_config.capacidad_m3} m³)` : '(sin configurar)'}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowEntradaForm(true)}
            disabled={estanques.length === 0}
            className="bg-cyan-600 text-white py-3 rounded-lg hover:bg-cyan-700 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Registrar Agua
          </button>
          <button
            onClick={() => setShowConfigRecarga(true)}
            disabled={estanques.length === 0}
            className="bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Configurar Recarga
          </button>
        </div>

        <PanelEstanques
          estanques={estanques}
          aguaTotal={aguaTotalActual}
          capacidadTotal={aguaTotalDisponible}
          onAgregarAgua={agregarAgua}
        />

        <HistorialAgua entradas={entradas} estanques={estanques} />
      </main>

      {showEntradaForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <EntradaAguaForm
              estanques={estanques}
              onRegistrar={async (data) => {
                await registrarEntrada(data)
                setShowEntradaForm(false)
              }}
              onCancelar={() => setShowEntradaForm(false)}
            />
          </div>
        </div>
      )}

      {showConfigRecarga && estanqueActual && (
        <ConfigurarAguaModal
          estanque={estanqueActual}
          onGuardar={async (config) => {
            if (!estanqueActual?.estanque_config) return

            if (typeof config.frecuencia_dias !== 'number' || config.frecuencia_dias <= 0) {
              logger.error('Validación recarga fallida: frecuencia_dias debe ser mayor a 0')
              return
            }
            if (typeof config.cantidad_litros !== 'number' || config.cantidad_litros <= 0) {
              logger.error('Validación recarga fallida: cantidad_litros debe ser mayor a 0')
              return
            }

            const now = getCurrentTimestamp()
            const proximaRecarga = addDays(new Date(), config.frecuencia_dias).toISOString()

            await zonasDAL.update(estanqueActual.id, {
              estanque_config: {
                ...estanqueActual.estanque_config,
                recarga: {
                  frecuencia_dias: config.frecuencia_dias,
                  cantidad_litros: config.cantidad_litros,
                  ultima_recarga: now,
                  proxima_recarga: proximaRecarga,
                  costo_recarga_clp: config.costo_recarga_clp,
                },
              },
              updated_at: now,
            })

            emitZonaUpdated(estanqueActual.id)
            await refetch()
            setShowConfigRecarga(false)
          }}
          onCerrar={() => setShowConfigRecarga(false)}
        />
      )}
    </PageLayout>
  )
}
