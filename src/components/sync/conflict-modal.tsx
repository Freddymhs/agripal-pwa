'use client'

import type { SyncItem } from '@/types'

interface ConflictModalProps {
  conflicts: SyncItem[]
  onResolve: (id: string, decision: 'local' | 'servidor') => void
  onClose: () => void
}

const ENTIDAD_LABELS: Record<string, string> = {
  proyecto: 'Proyecto',
  terreno: 'Terreno',
  zona: 'Zona',
  planta: 'Planta',
  entrada_agua: 'Entrada de Agua',
  cosecha: 'Cosecha',
  alerta: 'Alerta',
}

export function ConflictModal({ conflicts, onResolve, onClose }: ConflictModalProps) {
  if (conflicts.length === 0) return null

  const current = conflicts[0]
  const entidadLabel = ENTIDAD_LABELS[current.entidad] || current.entidad

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-red-600">
            Conflicto de Sincronización ({conflicts.length})
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
          >
            ×
          </button>
        </div>

        <p className="text-gray-600 mb-4">
          <strong>{entidadLabel}</strong> fue modificado tanto localmente como en el servidor.
        </p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
            <h4 className="font-medium mb-2 text-blue-700">Tu versión (local)</h4>
            <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-40 text-gray-800">
              {JSON.stringify(current.datos, null, 2)}
            </pre>
          </div>

          <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
            <h4 className="font-medium mb-2 text-green-700">Versión servidor</h4>
            <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-40 text-gray-800">
              {current.datos_servidor ? JSON.stringify(current.datos_servidor, null, 2) : 'Sin datos del servidor'}
            </pre>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => onResolve(current.id, 'local')}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium"
          >
            Mantener mi versión
          </button>
          <button
            onClick={() => onResolve(current.id, 'servidor')}
            className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-medium"
          >
            Usar versión servidor
          </button>
        </div>
      </div>
    </div>
  )
}
