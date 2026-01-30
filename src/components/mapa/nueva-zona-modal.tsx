'use client'

import { useState } from 'react'
import type { TipoZona, EstanqueConfig, MaterialEstanque } from '@/types'
import { COLORES_ZONA } from '@/types'

interface NuevaZonaModalProps {
  rect: { x: number; y: number; ancho: number; alto: number }
  onConfirm: (data: { nombre: string; tipo: TipoZona; estanque_config?: EstanqueConfig }) => void
  onCancel: () => void
}

export function NuevaZonaModal({ rect, onConfirm, onCancel }: NuevaZonaModalProps) {
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState<TipoZona>('cultivo')

  const [capacidad, setCapacidad] = useState(10)
  const [material, setMaterial] = useState<MaterialEstanque>('plastico')
  const [tieneTapa, setTieneTapa] = useState(true)
  const [tieneFiltro, setTieneFiltro] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (nombre.trim()) {
      const data: { nombre: string; tipo: TipoZona; estanque_config?: EstanqueConfig } = {
        nombre: nombre.trim(),
        tipo,
      }

      if (tipo === 'estanque') {
        data.estanque_config = {
          capacidad_m3: capacidad,
          nivel_actual_m3: 0,
          material,
          tiene_tapa: tieneTapa,
          tiene_filtro: tieneFiltro,
        }
      }

      onConfirm(data)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Nueva Zona</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gray-50 p-3 rounded text-sm text-gray-900">
            <div><strong className="text-gray-900">Área:</strong> {(rect.ancho * rect.alto).toFixed(1)} m²</div>
            <div><strong className="text-gray-900">Dimensiones:</strong> {rect.ancho.toFixed(1)}m × {rect.alto.toFixed(1)}m</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Nombre *</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-green-500 text-gray-900"
              placeholder="Ej: Zona Norte, Huerta 1..."
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Tipo</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoZona)}
              className="w-full px-3 py-2 border rounded text-gray-900"
            >
              <option value="cultivo">Cultivo</option>
              <option value="estanque">Estanque de Agua</option>
              <option value="bodega">Bodega</option>
              <option value="casa">Casa</option>
              <option value="camino">Camino</option>
              <option value="decoracion">Decoración</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          {tipo === 'estanque' && (
            <div className="space-y-3 p-3 bg-cyan-50 rounded border border-cyan-200">
              <h4 className="font-medium text-cyan-800 text-sm">Configuración del Estanque</h4>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad (m³) *</label>
                <input
                  type="number"
                  value={capacidad}
                  onChange={(e) => setCapacidad(Number(e.target.value))}
                  min={1}
                  step={1}
                  className="w-full px-3 py-2 border rounded text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                <select
                  value={material}
                  onChange={(e) => setMaterial(e.target.value as MaterialEstanque)}
                  className="w-full px-3 py-2 border rounded text-gray-900"
                >
                  <option value="plastico">Plástico</option>
                  <option value="cemento">Cemento</option>
                  <option value="geomembrana">Geomembrana</option>
                  <option value="metalico">Metálico</option>
                </select>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={tieneTapa}
                    onChange={(e) => setTieneTapa(e.target.checked)}
                    className="rounded"
                  />
                  Tiene tapa
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={tieneFiltro}
                    onChange={(e) => setTieneFiltro(e.target.checked)}
                    className="rounded"
                  />
                  Tiene filtro
                </label>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded"
              style={{ backgroundColor: COLORES_ZONA[tipo] }}
            />
            <span className="text-sm text-gray-700">Color automático según tipo</span>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 font-medium"
            >
              Crear Zona
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300 font-medium"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
