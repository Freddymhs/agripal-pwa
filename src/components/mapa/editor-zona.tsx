'use client'

import { useState, useEffect } from 'react'
import type { Zona, TipoZona } from '@/types'
import { COLORES_ZONA } from '@/lib/constants/entities'
import { ZoneEditorForm } from '@/components/mapa/zone-editor-form'

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
  zona, cantidadPlantas = 0,
  onSave, onRedimensionar, onMover, onDelete, onClose, onPreviewChange, validarCambios, advertenciaEliminacion,
}: EditorZonaProps) {
  const [nombre, setNombre] = useState(zona.nombre)
  const [tipo, setTipo] = useState<TipoZona>(zona.tipo)
  const [color, setColor] = useState(zona.color)
  const [notas, setNotas] = useState<string | undefined>(zona.notas)
  const [x, setX] = useState(zona.x)
  const [y, setY] = useState(zona.y)
  const [ancho, setAncho] = useState(zona.ancho)
  const [alto, setAlto] = useState(zona.alto)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const hayCambiosGeometricos = x !== zona.x || y !== zona.y || ancho !== zona.ancho || alto !== zona.alto
  const validacion = validarCambios({ x, y }, { ancho, alto })

  useEffect(() => {
    setNombre(zona.nombre); setTipo(zona.tipo); setColor(zona.color); setNotas(zona.notas)
    setX(zona.x); setY(zona.y); setAncho(zona.ancho); setAlto(zona.alto)
    setError(null)
  }, [zona])

  useEffect(() => {
    if (!onPreviewChange) return
    if (hayCambiosGeometricos) {
      onPreviewChange({ zonaId: zona.id, x, y, ancho, alto, esValida: validacion.valida })
    } else {
      onPreviewChange(null)
    }
  }, [x, y, ancho, alto, zona.id, zona.x, zona.y, zona.ancho, zona.alto, hayCambiosGeometricos, validacion.valida, onPreviewChange])

  useEffect(() => { return () => { onPreviewChange?.(null) } }, [onPreviewChange])

  const handleTipoChange = (nuevoTipo: TipoZona) => { setTipo(nuevoTipo); setColor(COLORES_ZONA[nuevoTipo]) }

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
        if (result.error) { setError(result.error); setSaving(false); return }
      }
      if (ancho !== zona.ancho || alto !== zona.alto) {
        const result = await onRedimensionar({ ancho, alto })
        if (result.error) { setError(result.error); setSaving(false); return }
      }
      onSave({ nombre, tipo, color, notas })
      onPreviewChange?.(null)
    } finally {
      setSaving(false)
    }
  }

  return (
    <ZoneEditorForm
      zona={zona} nombre={nombre} tipo={tipo} color={color} notas={notas}
      x={x} y={y} ancho={ancho} alto={alto}
      cantidadPlantas={cantidadPlantas} hayCambiosGeometricos={hayCambiosGeometricos}
      validacion={validacion} error={error} saving={saving} advertenciaEliminacion={advertenciaEliminacion}
      onNombreChange={setNombre} onTipoChange={handleTipoChange} onColorChange={setColor}
      onNotasChange={setNotas} onXChange={setX} onYChange={setY} onAnchoChange={setAncho} onAltoChange={setAlto}
      onSave={handleSave} onClose={() => { onPreviewChange?.(null); onClose() }} onDelete={onDelete}
    />
  )
}
