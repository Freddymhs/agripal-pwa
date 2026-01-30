'use client'

import { useState } from 'react'

interface CrearProyectoModalProps {
  onCreated: (data: { nombre: string; ubicacion: string }) => Promise<void>
  onCancel: () => void
}

export function CrearProyectoModal({ onCreated, onCancel }: CrearProyectoModalProps) {
  const [nombre, setNombre] = useState('')
  const [ubicacion, setUbicacion] = useState('')
  const [creando, setCreando] = useState(false)

  const valido = nombre.trim().length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (valido && !creando) {
      setCreando(true)
      try {
        await onCreated({ nombre: nombre.trim(), ubicacion: ubicacion.trim() })
      } catch (error) {
        console.error('Error creando proyecto:', error)
        setCreando(false)
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Nuevo Proyecto</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del proyecto *
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Mi Finca"
              className="w-full px-3 py-2 border rounded text-gray-900"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ubicación (referencia)
            </label>
            <input
              type="text"
              value={ubicacion}
              onChange={(e) => setUbicacion(e.target.value)}
              placeholder="Ej: Arica, Chile"
              className="w-full px-3 py-2 border rounded text-gray-900"
            />
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
              {creando ? 'Creando...' : 'Crear Proyecto'}
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
