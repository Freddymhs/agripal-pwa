'use client'

import type { DistanciasTerreno } from '@/types'

interface TabDistanciasProps {
  value: DistanciasTerreno
  onChange: (v: DistanciasTerreno) => void
}

const CAMPOS = [
  { key: 'pueblo_cercano_km', label: 'Pueblo más cercano' },
  { key: 'ciudad_principal_km', label: 'Ciudad principal' },
  { key: 'hospital_km', label: 'Hospital/Centro de salud' },
  { key: 'ferreteria_agricola_km', label: 'Ferretería agrícola' },
  { key: 'mercado_mayorista_km', label: 'Mercado mayorista' },
] as const

export function TabDistancias({ value, onChange }: TabDistanciasProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900">Distancias a Servicios (km)</h3>
      <p className="text-sm text-gray-500">Distancia aproximada en kilómetros desde el terreno</p>

      <div className="space-y-3">
        {CAMPOS.map(campo => (
          <div key={campo.key} className="flex items-center gap-4">
            <label className="w-48 text-sm text-gray-700">{campo.label}</label>
            <input
              type="number"
              step="0.1"
              value={value[campo.key] ?? ''}
              onChange={e => onChange({ ...value, [campo.key]: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
              placeholder="km"
              className="w-24 px-3 py-2 border rounded text-gray-900"
            />
            <span className="text-sm text-gray-500">km</span>
          </div>
        ))}
      </div>
    </div>
  )
}
