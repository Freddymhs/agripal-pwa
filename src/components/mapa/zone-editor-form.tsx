'use client'

import { useState } from 'react'
import type { Zona, TipoZona } from '@/types'
import { TIPO_ZONA } from '@/lib/constants/entities'

interface ZoneEditorFormProps {
  zona: Zona
  nombre: string
  tipo: TipoZona
  color: string
  notas: string | undefined
  x: number
  y: number
  ancho: number
  alto: number
  cantidadPlantas: number
  hayCambiosGeometricos: boolean
  validacion: { valida: boolean; error?: string }
  error: string | null
  saving: boolean
  advertenciaEliminacion?: string | null
  onNombreChange: (v: string) => void
  onTipoChange: (v: TipoZona) => void
  onColorChange: (v: string) => void
  onNotasChange: (v: string | undefined) => void
  onXChange: (v: number) => void
  onYChange: (v: number) => void
  onAnchoChange: (v: number) => void
  onAltoChange: (v: number) => void
  onSave: () => void
  onClose: () => void
  onDelete: () => void
}

function ConfirmDeleteZona({ zona, advertencia, onConfirm, onCancel }: {
  zona: Zona
  advertencia?: string | null
  onConfirm: () => void
  onCancel: () => void
}) {
  const [inputNombre, setInputNombre] = useState('')
  const [inputFecha, setInputFecha] = useState('')
  const today = new Date().toISOString().split('T')[0]
  const canDelete = inputNombre === zona.nombre && inputFecha === today

  return (
    <div className="bg-red-50 p-4 rounded space-y-3">
      <p className="text-red-800 font-medium">Confirmar eliminación</p>
      {advertencia && <p className="text-red-700 text-sm bg-red-100 p-2 rounded">{advertencia}</p>}
      <div>
        <label className="block text-sm mb-1 text-gray-700">Escribe: <code className="bg-white px-1 text-gray-900">{zona.nombre}</code></label>
        <input type="text" value={inputNombre} onChange={(e) => setInputNombre(e.target.value)} className="w-full px-2 py-1 border rounded text-sm text-gray-900" placeholder={zona.nombre} />
      </div>
      <div>
        <label className="block text-sm mb-1 text-gray-700">Fecha de hoy: <code className="bg-white px-1 text-gray-900">{today}</code></label>
        <input type="text" value={inputFecha} onChange={(e) => setInputFecha(e.target.value)} className="w-full px-2 py-1 border rounded text-sm text-gray-900" placeholder="YYYY-MM-DD" />
      </div>
      <div className="flex gap-2">
        <button onClick={onConfirm} disabled={!canDelete} className={`flex-1 py-2 rounded text-sm font-medium ${canDelete ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>Eliminar</button>
        <button onClick={onCancel} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded text-sm">Cancelar</button>
      </div>
    </div>
  )
}

export function ZoneEditorForm({
  zona, nombre, tipo, color, notas, x, y, ancho, alto,
  cantidadPlantas, hayCambiosGeometricos, validacion, error, saving, advertenciaEliminacion,
  onNombreChange, onTipoChange, onColorChange, onNotasChange,
  onXChange, onYChange, onAnchoChange, onAltoChange,
  onSave, onClose, onDelete,
}: ZoneEditorFormProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const borderClass = hayCambiosGeometricos && !validacion.valida ? 'border-red-300' : ''

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-bold text-gray-900">Editar Zona</h3>

      {error && <div className="bg-red-50 text-red-700 p-3 rounded text-sm">{error}</div>}
      {hayCambiosGeometricos && !validacion.valida && <div className="bg-red-50 text-red-700 p-3 rounded text-sm">{validacion.error}</div>}
      {hayCambiosGeometricos && validacion.valida && <div className="bg-green-50 text-green-700 p-3 rounded text-sm">Preview válido - puedes guardar</div>}

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">Nombre</label>
        <input type="text" value={nombre} onChange={(e) => onNombreChange(e.target.value)} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-green-500 text-gray-900" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">Tipo</label>
        <select value={tipo} onChange={(e) => onTipoChange(e.target.value as TipoZona)} disabled={cantidadPlantas > 0} className={`w-full px-3 py-2 border rounded text-gray-900 ${cantidadPlantas > 0 ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}>
          <option value={TIPO_ZONA.CULTIVO}>Cultivo</option>
          <option value={TIPO_ZONA.BODEGA}>Bodega</option>
          <option value={TIPO_ZONA.CASA}>Casa</option>
          <option value={TIPO_ZONA.CAMINO}>Camino</option>
          <option value={TIPO_ZONA.DECORACION}>Decoración</option>
          <option value={TIPO_ZONA.OTRO}>Otro</option>
        </select>
        {cantidadPlantas > 0 && <p className="text-xs text-amber-600 mt-1">No se puede cambiar el tipo: hay {cantidadPlantas} planta(s) en esta zona. Elimínalas primero.</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">Color</label>
        <div className="flex gap-2 items-center">
          <input type="color" value={color} onChange={(e) => onColorChange(e.target.value)} className="w-12 h-10 rounded cursor-pointer" />
          <span className="text-sm text-gray-700">{color}</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">Notas</label>
        <textarea value={notas} onChange={(e) => onNotasChange(e.target.value)} className="w-full px-3 py-2 border rounded resize-none text-gray-900" rows={2} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">Posición (metros)</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-700">X</label>
            <input type="number" value={x} onChange={(e) => onXChange(Number(e.target.value))} min={0} step={0.5} className={`w-full px-3 py-2 border rounded text-gray-900 ${borderClass}`} />
          </div>
          <div>
            <label className="block text-xs text-gray-700">Y</label>
            <input type="number" value={y} onChange={(e) => onYChange(Number(e.target.value))} min={0} step={0.5} className={`w-full px-3 py-2 border rounded text-gray-900 ${borderClass}`} />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">Dimensiones (metros)</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-700">Ancho</label>
            <input type="number" value={ancho} onChange={(e) => onAnchoChange(Number(e.target.value))} min={1} step={0.5} className={`w-full px-3 py-2 border rounded text-gray-900 ${borderClass}`} />
          </div>
          <div>
            <label className="block text-xs text-gray-700">Alto</label>
            <input type="number" value={alto} onChange={(e) => onAltoChange(Number(e.target.value))} min={1} step={0.5} className={`w-full px-3 py-2 border rounded text-gray-900 ${borderClass}`} />
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-3 rounded text-sm text-gray-900">
        <span className="text-gray-700 font-medium">Área:</span> {ancho * alto} m²
      </div>

      <div className="flex gap-2">
        <button onClick={onSave} disabled={saving || (hayCambiosGeometricos && !validacion.valida)} className="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed">
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
        <button onClick={onClose} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300">Cancelar</button>
      </div>

      <div className="border-t pt-4">
        {!showDeleteConfirm ? (
          <button onClick={() => setShowDeleteConfirm(true)} className="w-full text-red-600 hover:text-red-800 text-sm">Eliminar zona</button>
        ) : (
          <ConfirmDeleteZona zona={zona} advertencia={advertenciaEliminacion} onConfirm={onDelete} onCancel={() => setShowDeleteConfirm(false)} />
        )}
      </div>
    </div>
  )
}
