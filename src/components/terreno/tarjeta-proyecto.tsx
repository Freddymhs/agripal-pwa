'use client'

import type { Proyecto } from '@/types'

interface TarjetaProyectoProps {
  proyecto: Proyecto
  seleccionado: boolean
  editando: boolean
  editandoProyecto: Proyecto | null
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
  onChangeEditando: (p: Proyecto) => void
  onGuardar: () => void
  onCancelar: () => void
}

export function TarjetaProyecto({
  proyecto,
  seleccionado,
  editando,
  editandoProyecto,
  onSelect,
  onEdit,
  onDelete,
  onChangeEditando,
  onGuardar,
  onCancelar,
}: TarjetaProyectoProps) {
  return (
    <div
      onClick={onSelect}
      className={`bg-white rounded-lg border-2 p-4 cursor-pointer transition-all ${
        seleccionado
          ? 'border-green-500 ring-2 ring-green-200'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {editando && editandoProyecto ? (
        <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
          <input
            type="text"
            value={editandoProyecto.nombre}
            onChange={(e) => onChangeEditando({ ...editandoProyecto, nombre: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            placeholder="Nombre del proyecto"
          />
          <input
            type="text"
            value={editandoProyecto.ubicacion_referencia || ''}
            onChange={(e) => onChangeEditando({ ...editandoProyecto, ubicacion_referencia: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            placeholder="Ubicacion"
          />
          <div className="flex gap-2">
            <button
              onClick={onGuardar}
              className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded text-sm"
            >
              Guardar
            </button>
            <button
              onClick={onCancelar}
              className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-gray-900">{proyecto.nombre}</h3>
            <div className="flex gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit()
                }}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                title="Editar"
              >
                ✏️
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                title="Eliminar"
              >
                🗑️
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-2">{proyecto.ubicacion_referencia || 'Sin ubicacion'}</p>
          {seleccionado && (
            <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
              Seleccionado
            </span>
          )}
        </>
      )}
    </div>
  )
}
