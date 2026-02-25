'use client'

import type { UbicacionTerreno } from '@/types'

interface TabUbicacionProps {
  value: UbicacionTerreno
  onChange: (v: UbicacionTerreno) => void
}

export function TabUbicacion({ value, onChange }: TabUbicacionProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900">Ubicación Geográfica</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Región</label>
          <input
            type="text"
            value={value.region || ''}
            onChange={e => onChange({ ...value, region: e.target.value })}
            placeholder="Arica y Parinacota"
            className="w-full px-3 py-2 border rounded text-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Comuna</label>
          <input
            type="text"
            value={value.comuna || ''}
            onChange={e => onChange({ ...value, comuna: e.target.value })}
            placeholder="Arica"
            className="w-full px-3 py-2 border rounded text-gray-900"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Dirección o Referencia</label>
        <input
          type="text"
          value={value.direccion || ''}
          onChange={e => onChange({ ...value, direccion: e.target.value })}
          placeholder="Km 12 Valle de Azapa"
          className="w-full px-3 py-2 border rounded text-gray-900"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Coordenadas GPS</label>
        <input
          type="text"
          value={value.coordenadas || ''}
          onChange={e => onChange({ ...value, coordenadas: e.target.value })}
          placeholder="-18.36386, -70.02931"
          className="w-full px-3 py-2 border rounded text-gray-900"
        />
        <p className="text-xs text-gray-500 mt-1">Formato: latitud, longitud</p>
      </div>
    </div>
  )
}
