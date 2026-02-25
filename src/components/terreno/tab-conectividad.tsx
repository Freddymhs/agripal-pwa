'use client'

import type { ConectividadTerreno } from '@/types'

interface TabConectividadProps {
  value: ConectividadTerreno
  onChange: (v: ConectividadTerreno) => void
}

export function TabConectividad({ value, onChange }: TabConectividadProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900">Conectividad</h3>

      <div className="space-y-4">
        <SeccionCelular value={value} onChange={onChange} />
        <SeccionInternet value={value} onChange={onChange} />
      </div>
    </div>
  )
}

function SeccionCelular({ value, onChange }: TabConectividadProps) {
  return (
    <div>
      <h4 className="text-sm font-medium text-gray-700 mb-2">Señal Celular</h4>
      <label className="flex items-center gap-2 mb-2">
        <input
          type="checkbox"
          checked={value.señal_celular || false}
          onChange={e => onChange({ ...value, señal_celular: e.target.checked })}
          className="rounded"
        />
        <span className="text-sm text-gray-700">Hay señal celular</span>
      </label>

      {value.señal_celular && (
        <div className="grid grid-cols-2 gap-3 ml-6">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Operador</label>
            <input
              type="text"
              value={value.operador_celular || ''}
              onChange={e => onChange({ ...value, operador_celular: e.target.value })}
              placeholder="Entel, Movistar, etc."
              className="w-full px-3 py-2 border rounded text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Calidad</label>
            <select
              value={value.calidad_señal || ''}
              onChange={e => onChange({ ...value, calidad_señal: e.target.value as ConectividadTerreno['calidad_señal'] })}
              className="w-full px-3 py-2 border rounded text-gray-900"
            >
              <option value="">Seleccionar...</option>
              <option value="buena">Buena</option>
              <option value="regular">Regular</option>
              <option value="mala">Mala</option>
            </select>
          </div>
        </div>
      )}
    </div>
  )
}

function SeccionInternet({ value, onChange }: TabConectividadProps) {
  return (
    <div>
      <h4 className="text-sm font-medium text-gray-700 mb-2">Internet</h4>
      <label className="flex items-center gap-2 mb-2">
        <input
          type="checkbox"
          checked={value.internet_disponible || false}
          onChange={e => onChange({ ...value, internet_disponible: e.target.checked })}
          className="rounded"
        />
        <span className="text-sm text-gray-700">Internet disponible</span>
      </label>

      {value.internet_disponible && (
        <div className="ml-6">
          <label className="block text-sm text-gray-600 mb-1">Tipo de conexión</label>
          <select
            value={value.tipo_internet || ''}
            onChange={e => onChange({ ...value, tipo_internet: e.target.value as ConectividadTerreno['tipo_internet'] })}
            className="w-full px-3 py-2 border rounded text-gray-900"
          >
            <option value="">Seleccionar...</option>
            <option value="fibra">Fibra óptica</option>
            <option value="4g">4G/LTE</option>
            <option value="satelital">Satelital</option>
          </select>
        </div>
      )}
    </div>
  )
}
