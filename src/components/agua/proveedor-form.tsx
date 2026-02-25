'use client'

import type { ProveedorAgua, ConfiabilidadProveedor } from '@/types'

interface ProveedorFormProps {
  form: Partial<ProveedorAgua>
  isNew: boolean
  onFormChange: (form: Partial<ProveedorAgua>) => void
  onSave: () => void
  onCancel: () => void
}

const CONFIABILIDADES: { value: ConfiabilidadProveedor; label: string }[] = [
  { value: 'alta', label: 'Alta' },
  { value: 'media', label: 'Media' },
  { value: 'baja', label: 'Baja' },
]

export function ProveedorForm({ form, isNew, onFormChange, onSave, onCancel }: ProveedorFormProps) {
  return (
    <div className="p-4 border-2 border-dashed border-green-300 rounded-lg bg-green-50">
      <h4 className="font-medium text-gray-900 mb-3">
        {isNew ? 'Nuevo Proveedor' : 'Editar Proveedor'}
      </h4>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
          <input
            type="text"
            value={form.nombre || ''}
            onChange={e => onFormChange({ ...form, nombre: e.target.value })}
            placeholder="Nombre del proveedor"
            className="w-full px-3 py-2 border rounded text-gray-900"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input
              type="text"
              value={form.telefono || ''}
              onChange={e => onFormChange({ ...form, telefono: e.target.value })}
              placeholder="+56 9 1234 5678"
              className="w-full px-3 py-2 border rounded text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Precio (CLP/m³)</label>
            <input
              type="number"
              value={form.precio_m3_clp || ''}
              onChange={e => onFormChange({ ...form, precio_m3_clp: parseInt(e.target.value) || undefined })}
              className="w-full px-3 py-2 border rounded text-gray-900"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confiabilidad</label>
          <select
            value={form.confiabilidad || ''}
            onChange={e => onFormChange({ ...form, confiabilidad: e.target.value as ConfiabilidadProveedor || undefined })}
            className="w-full px-3 py-2 border rounded text-gray-900"
          >
            <option value="">Seleccionar...</option>
            {CONFIABILIDADES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
          <textarea
            value={form.notas || ''}
            onChange={e => onFormChange({ ...form, notas: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border rounded text-gray-900"
          />
        </div>
        <div className="flex gap-2 pt-2">
          <button
            onClick={onSave}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
          >
            Guardar
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
