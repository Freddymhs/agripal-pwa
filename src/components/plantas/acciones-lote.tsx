'use client'

import { useState } from 'react'
import type { EstadoPlanta } from '@/types'

interface AccionesLoteProps {
  cantidad: number
  onCambiarEstado: (estado: EstadoPlanta) => void
  onEliminar: () => void
  onCancelar: () => void
}

export function AccionesLote({
  cantidad,
  onCambiarEstado,
  onEliminar,
  onCancelar,
}: AccionesLoteProps) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)

  const estados: { value: EstadoPlanta; label: string }[] = [
    { value: 'plantada', label: 'Plantada' },
    { value: 'creciendo', label: 'Creciendo' },
    { value: 'produciendo', label: 'Produciendo' },
    { value: 'muerta', label: 'Muerta' },
  ]

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-blue-800 font-medium">
          🌱 {cantidad} planta{cantidad !== 1 ? 's' : ''} seleccionada{cantidad !== 1 ? 's' : ''}
        </span>
        <button
          onClick={onCancelar}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          ✕ Cancelar
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs text-gray-600 mb-1">Cambiar estado a:</label>
          <select
            onChange={(e) => {
              if (e.target.value) {
                onCambiarEstado(e.target.value as EstadoPlanta)
              }
            }}
            defaultValue=""
            className="w-full px-2 py-1.5 border rounded text-sm text-gray-900"
          >
            <option value="" disabled>Seleccionar...</option>
            {estados.map(e => (
              <option key={e.value} value={e.value}>{e.label}</option>
            ))}
          </select>
        </div>

        {!showConfirmDelete ? (
          <button
            onClick={() => setShowConfirmDelete(true)}
            className="px-3 py-1.5 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 self-end"
          >
            Eliminar
          </button>
        ) : (
          <div className="flex gap-1 self-end">
            <button
              onClick={() => {
                onEliminar()
                setShowConfirmDelete(false)
              }}
              className="px-3 py-1.5 bg-red-500 text-white rounded text-sm hover:bg-red-600"
            >
              Confirmar
            </button>
            <button
              onClick={() => setShowConfirmDelete(false)}
              className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
            >
              No
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-blue-600">
        Tip: Presiona Escape para deseleccionar
      </p>
    </div>
  )
}
