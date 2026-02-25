'use client'

import type { InfraestructuraTerreno } from '@/types'

interface TabInfraestructuraProps {
  value: InfraestructuraTerreno
  onChange: (v: InfraestructuraTerreno) => void
}

export function TabInfraestructura({ value, onChange }: TabInfraestructuraProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900">Infraestructura Existente</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de acceso</label>
          <select
            value={value.acceso || ''}
            onChange={e => onChange({ ...value, acceso: e.target.value as InfraestructuraTerreno['acceso'] })}
            className="w-full px-3 py-2 border rounded text-gray-900"
          >
            <option value="">Seleccionar...</option>
            <option value="pavimentado">Pavimentado</option>
            <option value="ripio">Ripio</option>
            <option value="tierra">Tierra</option>
            <option value="inexistente">Sin acceso vehicular</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estado del cerco</label>
          <select
            value={value.cerco || ''}
            onChange={e => onChange({ ...value, cerco: e.target.value as InfraestructuraTerreno['cerco'] })}
            className="w-full px-3 py-2 border rounded text-gray-900"
          >
            <option value="">Seleccionar...</option>
            <option value="completo">Completo</option>
            <option value="parcial">Parcial</option>
            <option value="sin_cerco">Sin cerco</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={value.electricidad || false}
            onChange={e => onChange({ ...value, electricidad: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm text-gray-700">Electricidad disponible</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={value.agua_potable || false}
            onChange={e => onChange({ ...value, agua_potable: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm text-gray-700">Agua potable</span>
        </label>
      </div>
    </div>
  )
}
