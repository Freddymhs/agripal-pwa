'use client'

import { useState } from 'react'
import { logger } from '@/lib/logger'
import type { UUID } from '@/types'
import { formatArea } from '@/lib/utils'

interface CrearTerrenoModalProps {
  proyectoId: UUID
  proyectoNombre: string
  onCreated: (data: { nombre: string; ancho_m: number; alto_m: number }) => Promise<void>
  onCancel: () => void
}

export function CrearTerrenoModal({
  proyectoNombre,
  onCreated,
  onCancel,
}: CrearTerrenoModalProps) {
  const [nombre, setNombre] = useState('')
  const [ancho, setAncho] = useState(50)
  const [alto, setAlto] = useState(30)
  const [creando, setCreando] = useState(false)

  const valido = nombre.trim().length > 0 && ancho >= 1 && alto >= 1
  const area = ancho * alto

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (valido && !creando) {
      setCreando(true)
      try {
        await onCreated({ nombre: nombre.trim(), ancho_m: ancho, alto_m: alto })
      } catch (error) {
        logger.error('Error creando terreno', { error: error instanceof Error ? { message: error.message } : { error } })
        setCreando(false)
      }
    }
  }

  const maxDimension = Math.max(ancho, alto)
  const previewScale = 150 / maxDimension
  const previewWidth = ancho * previewScale
  const previewHeight = alto * previewScale

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-bold text-gray-900 mb-1">Nuevo Terreno</h3>
        <p className="text-sm text-gray-500 mb-4">En proyecto: {proyectoNombre}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del terreno *
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Lote Norte"
              className="w-full px-3 py-2 border rounded text-gray-900"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ancho (metros) *
              </label>
              <input
                type="number"
                value={ancho}
                onChange={(e) => setAncho(Number(e.target.value))}
                min={1}
                step={1}
                className="w-full px-3 py-2 border rounded text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alto (metros) *
              </label>
              <input
                type="number"
                value={alto}
                onChange={(e) => setAlto(Number(e.target.value))}
                min={1}
                step={1}
                className="w-full px-3 py-2 border rounded text-gray-900"
              />
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-gray-600">Vista previa</span>
              <span className="text-sm font-bold text-gray-900">{formatArea(area)}</span>
            </div>
            <div className="flex justify-center">
              <div
                className="bg-green-100 border-2 border-green-400 rounded flex items-center justify-center"
                style={{ width: previewWidth, height: previewHeight }}
              >
                <span className="text-xs text-green-700 font-medium">
                  {ancho}×{alto}m
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={!valido || creando}
              className={`flex-1 py-2 rounded font-medium ${
                valido && !creando
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              {creando ? 'Creando...' : 'Crear Terreno'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={creando}
              className="flex-1 bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
