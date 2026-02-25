'use client'

import type { ToleranciaHeladas } from '@/types'

interface CultivoClimaFieldsProps {
  tempMin: number | undefined
  tempMax: number | undefined
  toleranciaHeladas: ToleranciaHeladas | undefined
  onTempMinChange: (v: number | undefined) => void
  onTempMaxChange: (v: number | undefined) => void
  onToleranciaHeladasChange: (v: ToleranciaHeladas | undefined) => void
}

export function CultivoClimaFields({
  tempMin,
  tempMax,
  toleranciaHeladas,
  onTempMinChange,
  onTempMaxChange,
  onToleranciaHeladasChange,
}: CultivoClimaFieldsProps) {
  return (
    <div className="border-t pt-4 mt-4">
      <h4 className="text-sm font-bold text-gray-700 mb-3">Clima (opcional)</h4>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium mb-1">Temp mín (°C)</label>
          <input
            type="number"
            value={tempMin ?? ''}
            onChange={(e) => onTempMinChange(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full px-3 py-2 border rounded"
            placeholder="-5"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Temp máx (°C)</label>
          <input
            type="number"
            value={tempMax ?? ''}
            onChange={(e) => onTempMaxChange(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full px-3 py-2 border rounded"
            placeholder="40"
          />
        </div>
      </div>
      <div className="mt-2">
        <label className="block text-sm font-medium mb-1">Tolerancia heladas</label>
        <select
          value={toleranciaHeladas ?? ''}
          onChange={(e) => onToleranciaHeladasChange(e.target.value as ToleranciaHeladas || undefined)}
          className="w-full px-3 py-2 border rounded"
        >
          <option value="">No especificado</option>
          <option value="alta">Alta</option>
          <option value="media">Media</option>
          <option value="baja">Baja</option>
          <option value="nula">Nula (muy sensible)</option>
        </select>
      </div>
    </div>
  )
}
