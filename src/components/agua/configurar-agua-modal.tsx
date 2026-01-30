'use client'

import { useState } from 'react'
import type { Zona } from '@/types'

interface ConfigurarAguaModalProps {
  estanque: Zona
  onGuardar: (config: {
    frecuencia_dias: number
    cantidad_litros: number
    costo_recarga_clp?: number
  }) => Promise<void>
  onCerrar: () => void
}

export function ConfigurarAguaModal({
  estanque,
  onGuardar,
  onCerrar,
}: ConfigurarAguaModalProps) {
  const config = estanque.estanque_config
  const capacidadLitros = (config?.capacidad_m3 || 0) * 1000

  const [frecuenciaDias, setFrecuenciaDias] = useState(
    config?.recarga?.frecuencia_dias || 14
  )
  const [cantidadLitros, setCantidadLitros] = useState(
    config?.recarga?.cantidad_litros || Math.min(15000, capacidadLitros)
  )
  const [costoRecarga, setCostoRecarga] = useState<number | ''>(
    config?.recarga?.costo_recarga_clp || ''
  )
  const [guardando, setGuardando] = useState(false)

  const handleGuardar = async () => {
    setGuardando(true)
    try {
      await onGuardar({
        frecuencia_dias: frecuenciaDias,
        cantidad_litros: cantidadLitros,
        costo_recarga_clp: costoRecarga || undefined,
      })
      onCerrar()
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-gray-900">
          Configurar Recarga
        </h2>

        <div className="space-y-5">
          <div className="bg-cyan-50 p-3 rounded-lg">
            <div className="text-sm text-cyan-700">Estanque: <strong className="text-cyan-900">{estanque.nombre}</strong></div>
            <div className="text-sm text-cyan-600">Capacidad: {config?.capacidad_m3 || 0} m³</div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700">
                Frecuencia de recarga
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={frecuenciaDias}
                  onChange={(e) => setFrecuenciaDias(Math.max(1, Number(e.target.value)))}
                  min={1}
                  max={90}
                  className="flex-1 px-3 py-2 border rounded focus:ring-2 focus:ring-cyan-500 text-gray-900"
                />
                <span className="px-3 py-2 bg-gray-100 rounded text-gray-600">días</span>
              </div>
              <div className="flex gap-2 mt-2">
                {[7, 14, 21, 30].map(dias => (
                  <button
                    key={dias}
                    type="button"
                    onClick={() => setFrecuenciaDias(dias)}
                    className={`px-3 py-1 text-sm rounded ${
                      frecuenciaDias === dias
                        ? 'bg-cyan-500 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {dias}d
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700">
                Cantidad por recarga
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={cantidadLitros}
                  onChange={(e) => setCantidadLitros(Math.max(100, Number(e.target.value)))}
                  min={100}
                  step={1000}
                  className="flex-1 px-3 py-2 border rounded focus:ring-2 focus:ring-cyan-500 text-gray-900"
                />
                <span className="px-3 py-2 bg-gray-100 rounded text-gray-600">L</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700">
                Costo por recarga (opcional)
              </label>
              <div className="flex gap-2">
                <span className="px-3 py-2 bg-gray-100 rounded text-gray-600">$</span>
                <input
                  type="number"
                  value={costoRecarga}
                  onChange={(e) => setCostoRecarga(e.target.value ? Number(e.target.value) : '')}
                  min={0}
                  step={1000}
                  placeholder="Ej: 7500"
                  className="flex-1 px-3 py-2 border rounded focus:ring-2 focus:ring-cyan-500 text-gray-900"
                />
                <span className="px-3 py-2 bg-gray-100 rounded text-gray-600">CLP</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleGuardar}
              disabled={guardando}
              className="flex-1 bg-cyan-600 text-white py-3 rounded-lg hover:bg-cyan-700 disabled:opacity-50 font-medium"
            >
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              onClick={onCerrar}
              disabled={guardando}
              className="flex-1 bg-gray-100 py-3 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
