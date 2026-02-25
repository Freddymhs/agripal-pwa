'use client'

import { formatDate, formatCLP } from '@/lib/utils'
import type { EntradaAgua, Zona } from '@/types'

interface HistorialAguaProps {
  entradas: EntradaAgua[]
  estanques: Zona[]
}

export function HistorialAgua({ entradas, estanques }: HistorialAguaProps) {
  const getEstanqueNombre = (estanqueId?: string) => {
    if (!estanqueId) return 'Sin asignar'
    const estanque = estanques.find(e => e.id === estanqueId)
    return estanque?.nombre || 'Desconocido'
  }

  if (entradas.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-bold text-gray-900 mb-2">Historial de Entradas</h3>
        <p className="text-gray-500 text-sm">No hay entradas de agua registradas.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-bold text-gray-900 mb-3">Historial de Entradas</h3>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {entradas.map((entrada) => (
          <div
            key={entrada.id}
            className="border border-gray-100 rounded p-3 hover:bg-gray-50"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium text-cyan-700">
                  +{entrada.cantidad_m3.toFixed(1)} m³
                </div>
                <div className="text-xs text-gray-500">
                  {formatDate(entrada.fecha)}
                </div>
              </div>
              <div className="text-right">
                {entrada.costo_clp && (
                  <div className="text-sm text-gray-700">
                    {formatCLP(entrada.costo_clp)}
                  </div>
                )}
                <div className="text-xs text-gray-500">
                  {getEstanqueNombre(entrada.estanque_id)}
                </div>
              </div>
            </div>
            {entrada.proveedor && (
              <div className="text-xs text-gray-600 mt-1">
                Proveedor: {entrada.proveedor}
              </div>
            )}
            {entrada.notas && (
              <div className="text-xs text-gray-500 mt-1 italic">
                {entrada.notas}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
