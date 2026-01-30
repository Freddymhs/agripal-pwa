'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Zona, TipoZona } from '@/types'
import { COLORES_ZONA } from '@/types'

export interface ZonaPreviewData {
  zonaId: string
  x: number
  y: number
  ancho: number
  alto: number
  esValida: boolean
}

interface EditorZonaProps {
  zona: Zona
  cantidadPlantas?: number
  onSave: (cambios: Partial<Zona>) => void
  onRedimensionar: (nuevoTamaño: { ancho: number; alto: number }) => Promise<{ error?: string }>
  onMover: (nuevaPosicion: { x: number; y: number }) => Promise<{ error?: string }>
  onDelete: () => void
  onClose: () => void
  onPreviewChange?: (preview: ZonaPreviewData | null) => void
  validarCambios: (nuevaPos: { x: number; y: number }, nuevoTam: { ancho: number; alto: number }) => { valida: boolean; error?: string }
  advertenciaEliminacion?: string | null
}

export function EditorZona({
  zona,
  cantidadPlantas = 0,
  onSave,
  onRedimensionar,
  onMover,
  onDelete,
  onClose,
  onPreviewChange,
  validarCambios,
  advertenciaEliminacion,
}: EditorZonaProps) {
  const [nombre, setNombre] = useState(zona.nombre)
  const [tipo, setTipo] = useState<TipoZona>(zona.tipo)
  const [color, setColor] = useState(zona.color)
  const [notas, setNotas] = useState(zona.notas)

  const [x, setX] = useState(zona.x)
  const [y, setY] = useState(zona.y)
  const [ancho, setAncho] = useState(zona.ancho)
  const [alto, setAlto] = useState(zona.alto)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const hayCambiosGeometricos = x !== zona.x || y !== zona.y || ancho !== zona.ancho || alto !== zona.alto

  const validacion = validarCambios({ x, y }, { ancho, alto })

  useEffect(() => {
    setNombre(zona.nombre)
    setTipo(zona.tipo)
    setColor(zona.color)
    setNotas(zona.notas)
    setX(zona.x)
    setY(zona.y)
    setAncho(zona.ancho)
    setAlto(zona.alto)
    setError(null)
    setShowDeleteConfirm(false)
  }, [zona])

  useEffect(() => {
    if (hayCambiosGeometricos && onPreviewChange) {
      onPreviewChange({
        zonaId: zona.id,
        x,
        y,
        ancho,
        alto,
        esValida: validacion.valida,
      })
    } else if (!hayCambiosGeometricos && onPreviewChange) {
      onPreviewChange(null)
    }
  }, [x, y, ancho, alto, zona.id, zona.x, zona.y, zona.ancho, zona.alto, hayCambiosGeometricos, validacion.valida, onPreviewChange])

  useEffect(() => {
    return () => {
      onPreviewChange?.(null)
    }
  }, [onPreviewChange])

  const handleTipoChange = (nuevoTipo: TipoZona) => {
    setTipo(nuevoTipo)
    setColor(COLORES_ZONA[nuevoTipo])
  }

  const handleSave = async () => {
    setError(null)
    setSaving(true)

    if (tipo !== zona.tipo && cantidadPlantas > 0) {
      setError(`No se puede cambiar el tipo: hay ${cantidadPlantas} planta(s) en esta zona`)
      setSaving(false)
      return
    }

    try {
      if (x !== zona.x || y !== zona.y) {
        const result = await onMover({ x, y })
        if (result.error) {
          setError(result.error)
          setSaving(false)
          return
        }
      }

      if (ancho !== zona.ancho || alto !== zona.alto) {
        const result = await onRedimensionar({ ancho, alto })
        if (result.error) {
          setError(result.error)
          setSaving(false)
          return
        }
      }

      onSave({ nombre, tipo, color, notas })
      onPreviewChange?.(null)
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    onPreviewChange?.(null)
    onClose()
  }

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-bold text-gray-900">Editar Zona</h3>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded text-sm">
          {error}
        </div>
      )}

      {hayCambiosGeometricos && !validacion.valida && (
        <div className="bg-red-50 text-red-700 p-3 rounded text-sm">
          {validacion.error}
        </div>
      )}

      {hayCambiosGeometricos && validacion.valida && (
        <div className="bg-green-50 text-green-700 p-3 rounded text-sm">
          Preview válido - puedes guardar
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">Nombre</label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-green-500 text-gray-900"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">Tipo</label>
        <select
          value={tipo}
          onChange={(e) => handleTipoChange(e.target.value as TipoZona)}
          disabled={cantidadPlantas > 0}
          className={`w-full px-3 py-2 border rounded text-gray-900 ${
            cantidadPlantas > 0 ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
          }`}
        >
          <option value="cultivo">Cultivo</option>
          <option value="bodega">Bodega</option>
          <option value="casa">Casa</option>
          <option value="camino">Camino</option>
          <option value="decoracion">Decoración</option>
          <option value="otro">Otro</option>
        </select>
        {cantidadPlantas > 0 && (
          <p className="text-xs text-amber-600 mt-1">
            No se puede cambiar el tipo: hay {cantidadPlantas} planta(s) en esta zona. Elimínalas primero.
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">Color</label>
        <div className="flex gap-2 items-center">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-12 h-10 rounded cursor-pointer"
          />
          <span className="text-sm text-gray-700">{color}</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">Notas</label>
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          className="w-full px-3 py-2 border rounded resize-none text-gray-900"
          rows={2}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">Posición (metros)</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-700">X</label>
            <input
              type="number"
              value={x}
              onChange={(e) => setX(Number(e.target.value))}
              min={0}
              step={0.5}
              className={`w-full px-3 py-2 border rounded text-gray-900 ${
                hayCambiosGeometricos && !validacion.valida ? 'border-red-300' : ''
              }`}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-700">Y</label>
            <input
              type="number"
              value={y}
              onChange={(e) => setY(Number(e.target.value))}
              min={0}
              step={0.5}
              className={`w-full px-3 py-2 border rounded text-gray-900 ${
                hayCambiosGeometricos && !validacion.valida ? 'border-red-300' : ''
              }`}
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">Dimensiones (metros)</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-700">Ancho</label>
            <input
              type="number"
              value={ancho}
              onChange={(e) => setAncho(Number(e.target.value))}
              min={1}
              step={0.5}
              className={`w-full px-3 py-2 border rounded text-gray-900 ${
                hayCambiosGeometricos && !validacion.valida ? 'border-red-300' : ''
              }`}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-700">Alto</label>
            <input
              type="number"
              value={alto}
              onChange={(e) => setAlto(Number(e.target.value))}
              min={1}
              step={0.5}
              className={`w-full px-3 py-2 border rounded text-gray-900 ${
                hayCambiosGeometricos && !validacion.valida ? 'border-red-300' : ''
              }`}
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-3 rounded text-sm text-gray-900">
        <span className="text-gray-700 font-medium">Área:</span> {ancho * alto} m²
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving || (hayCambiosGeometricos && !validacion.valida)}
          className="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
        <button
          onClick={handleClose}
          className="flex-1 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300"
        >
          Cancelar
        </button>
      </div>

      <div className="border-t pt-4">
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full text-red-600 hover:text-red-800 text-sm"
          >
            Eliminar zona
          </button>
        ) : (
          <ConfirmDeleteZona
            zona={zona}
            advertencia={advertenciaEliminacion}
            onConfirm={onDelete}
            onCancel={() => setShowDeleteConfirm(false)}
          />
        )}
      </div>
    </div>
  )
}

function ConfirmDeleteZona({
  zona,
  advertencia,
  onConfirm,
  onCancel,
}: {
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

      {advertencia && (
        <p className="text-red-700 text-sm bg-red-100 p-2 rounded">
          {advertencia}
        </p>
      )}

      <div>
        <label className="block text-sm mb-1 text-gray-700">
          Escribe: <code className="bg-white px-1 text-gray-900">{zona.nombre}</code>
        </label>
        <input
          type="text"
          value={inputNombre}
          onChange={(e) => setInputNombre(e.target.value)}
          className="w-full px-2 py-1 border rounded text-sm text-gray-900"
          placeholder={zona.nombre}
        />
      </div>

      <div>
        <label className="block text-sm mb-1 text-gray-700">
          Fecha de hoy: <code className="bg-white px-1 text-gray-900">{today}</code>
        </label>
        <input
          type="text"
          value={inputFecha}
          onChange={(e) => setInputFecha(e.target.value)}
          className="w-full px-2 py-1 border rounded text-sm text-gray-900"
          placeholder="YYYY-MM-DD"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          disabled={!canDelete}
          className={`flex-1 py-2 rounded text-sm font-medium ${
            canDelete
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Eliminar
        </button>
        <button
          onClick={onCancel}
          className="flex-1 bg-gray-200 text-gray-700 py-2 rounded text-sm"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
