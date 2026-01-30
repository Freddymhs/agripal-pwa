'use client'

import { useState } from 'react'
import type { Zona, UUID } from '@/types'

interface EntradaAguaFormProps {
  estanques: Zona[]
  estanqueIdPrecargado?: UUID
  onRegistrar: (data: {
    estanque_id: UUID
    cantidad_m3: number
    costo_clp?: number
    proveedor?: string
    notas?: string
  }) => Promise<void>
  onCancelar: () => void
}

export function EntradaAguaForm({
  estanques,
  estanqueIdPrecargado,
  onRegistrar,
  onCancelar,
}: EntradaAguaFormProps) {
  const [estanqueId, setEstanqueId] = useState<UUID>(estanqueIdPrecargado || estanques[0]?.id || '')
  const [cantidad, setCantidad] = useState(20)
  const [costo, setCosto] = useState<number | ''>('')
  const [proveedor, setProveedor] = useState('')
  const [notas, setNotas] = useState('')
  const [loading, setLoading] = useState(false)

  const estanqueSeleccionado = estanques.find(e => e.id === estanqueId)
  const config = estanqueSeleccionado?.estanque_config

  const aguaActual = config?.nivel_actual_m3 || 0
  const aguaMaxima = config?.capacidad_m3 || 0
  const espacioDisponible = aguaMaxima - aguaActual
  const cantidadFinal = Math.min(cantidad, espacioDisponible)
  const excede = cantidad > espacioDisponible

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!estanqueId || cantidadFinal <= 0) return

    setLoading(true)
    try {
      await onRegistrar({
        estanque_id: estanqueId,
        cantidad_m3: cantidadFinal,
        costo_clp: costo || undefined,
        proveedor: proveedor || undefined,
        notas,
      })
    } finally {
      setLoading(false)
    }
  }

  if (estanques.length === 0) {
    return (
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Registrar Entrada de Agua</h3>
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
          <p className="text-yellow-800">No hay estanques disponibles. Crea una zona tipo &quot;Estanque&quot; primero.</p>
        </div>
        <button
          onClick={onCancelar}
          className="mt-4 w-full bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300"
        >
          Cerrar
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <h3 className="text-lg font-bold text-gray-900">Registrar Entrada de Agua</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Estanque destino *</label>
        <select
          value={estanqueId}
          onChange={(e) => setEstanqueId(e.target.value)}
          className="w-full px-3 py-2 border rounded text-gray-900"
          disabled={!!estanqueIdPrecargado}
          required
        >
          {estanques.map((est) => (
            <option key={est.id} value={est.id}>
              {est.nombre} ({est.estanque_config?.nivel_actual_m3.toFixed(1)}/{est.estanque_config?.capacidad_m3}m³)
            </option>
          ))}
        </select>
        {estanqueIdPrecargado && (
          <p className="text-xs text-cyan-600 mt-1">
            💡 Estanque preseleccionado desde el mapa
          </p>
        )}
      </div>

      {config && (
        <div className="bg-cyan-50 p-3 rounded text-sm text-cyan-800">
          <div><strong>Agua actual:</strong> {aguaActual.toFixed(1)} m³</div>
          <div><strong>Capacidad:</strong> {aguaMaxima.toFixed(1)} m³</div>
          <div><strong>Espacio disponible:</strong> {espacioDisponible.toFixed(1)} m³</div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad (m³) *</label>
        <input
          type="number"
          value={cantidad}
          onChange={(e) => setCantidad(Number(e.target.value))}
          min={0.1}
          step={0.1}
          className={`w-full px-3 py-2 border rounded text-gray-900 ${excede ? 'border-yellow-500' : ''}`}
          required
        />
        {excede && (
          <p className="text-yellow-600 text-sm mt-1">
            Solo se agregarán {cantidadFinal.toFixed(1)} m³ (capacidad máxima)
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Costo (CLP)</label>
        <input
          type="number"
          value={costo}
          onChange={(e) => setCosto(e.target.value ? Number(e.target.value) : '')}
          min={0}
          className="w-full px-3 py-2 border rounded text-gray-900"
          placeholder="Opcional"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
        <input
          type="text"
          value={proveedor}
          onChange={(e) => setProveedor(e.target.value)}
          className="w-full px-3 py-2 border rounded text-gray-900"
          placeholder="Ej: Camión municipal"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          className="w-full px-3 py-2 border rounded text-gray-900"
          rows={2}
        />
      </div>

      {config && cantidadFinal > 0 && (
        <div className="bg-green-50 p-3 rounded text-center">
          <div className="text-sm text-green-700">Agua después de entrada:</div>
          <div className="text-2xl font-bold text-green-800">
            {(aguaActual + cantidadFinal).toFixed(1)} m³
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading || cantidadFinal <= 0}
          className="flex-1 bg-cyan-600 text-white py-2 rounded hover:bg-cyan-700 disabled:opacity-50"
        >
          {loading ? 'Registrando...' : 'Registrar Entrada'}
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="flex-1 bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
