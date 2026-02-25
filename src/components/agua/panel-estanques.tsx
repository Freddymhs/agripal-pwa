'use client'

import type { Zona, UUID } from '@/types'
import { clamp } from '@/lib/utils/math'

interface PanelEstanquesProps {
  estanques: Zona[]
  aguaTotal: number
  capacidadTotal: number
  onAgregarAgua: (estanqueId: UUID, cantidad: number) => Promise<{ error?: string }>
}

export function PanelEstanques({
  estanques,
  aguaTotal,
  capacidadTotal,
}: PanelEstanquesProps) {
  const porcentajeTotal = capacidadTotal > 0 ? (aguaTotal / capacidadTotal) * 100 : 0

  if (estanques.length === 0) {
    return (
      <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
        <h3 className="font-bold text-cyan-800 mb-2">Estanques de Agua</h3>
        <p className="text-sm text-cyan-700">
          No hay estanques en este terreno. Crea una zona tipo &quot;Estanque&quot; para almacenar agua.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      <h3 className="font-bold text-gray-900">Estanques de Agua</h3>

      <div className="bg-cyan-50 p-3 rounded">
        <div className="flex justify-between text-sm text-cyan-800 mb-1">
          <span>Total: {aguaTotal.toFixed(1)} m³</span>
          <span>Capacidad: {capacidadTotal.toFixed(1)} m³</span>
        </div>
        <div className="h-3 bg-cyan-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-cyan-600 transition-all"
            style={{ width: `${clamp(porcentajeTotal, 0, 100)}%` }}
          />
        </div>
        <div className="text-center text-xs text-cyan-600 mt-1">
          {porcentajeTotal.toFixed(0)}% de capacidad total
        </div>
      </div>

      <div className="space-y-3">
        {estanques.map((estanque) => {
          const config = estanque.estanque_config
          if (!config) return null

          const porcentaje = config.capacidad_m3 > 0
            ? (config.nivel_actual_m3 / config.capacidad_m3) * 100
            : 0

          return (
            <div key={estanque.id} className="border border-gray-200 rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <div className="font-medium text-gray-900">{estanque.nombre}</div>
                <div className="text-sm text-gray-600">
                  {config.nivel_actual_m3.toFixed(1)} / {config.capacidad_m3} m³
                </div>
              </div>

              <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-1">
                <div
                  className="h-full bg-cyan-500 transition-all"
                  style={{ width: `${clamp(porcentaje, 0, 100)}%` }}
                />
              </div>

              <div className="flex justify-between text-xs text-gray-500">
                <span>{porcentaje.toFixed(0)}%</span>
                {config.material && <span>{config.material}</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
