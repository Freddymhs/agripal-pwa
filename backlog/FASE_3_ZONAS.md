# FASE 3: CRUD de Zonas

**Status**: ✅ COMPLETADO
**Prioridad**: 🔴 Alta
**Dependencias**: FASE_2
**Estimación**: 4-5 horas

---

## Objetivo

Implementar CRUD completo de zonas: crear (click y arrastrar), editar, redimensionar, eliminar con validaciones.

---

## Funcionalidades Implementadas (adicionales al plan original)

### Sistema de Snap Automático
Al crear zonas, el cursor se "pega" automáticamente a los bordes cuando está cerca (< 0.5m):
- **Bordes del terreno**: x=0, x=ancho_m, y=0, y=alto_m
- **Bordes de zonas existentes**: Todos los lados de cada zona
- **Guías visuales**: Líneas naranjas punteadas que aparecen cuando el snap está activo
- **Indicador en UI**: Badge "SNAP activo" con las coordenadas de alineación
- **Beneficio**: Evita dejar espacios vacíos entre zonas y maximiza el uso del terreno

### Etiquetas con Dimensiones
Las etiquetas de las zonas ahora muestran:
- **Formato**: `nombre · ancho×alto m` (antes solo mostraba área)
- **Beneficio**: Permite al usuario calcular espacios disponibles fácilmente
- **Zonas pequeñas (<10m²)**: Mini-label al costado con dimensiones

---

## Reglas de Negocio

1. **Zonas siempre son rectángulos** - No polígonos irregulares
2. **Zonas son exclusivas** - No se pueden superponer
3. **Tamaño mínimo** - 1m × 1m
4. **Dentro del terreno** - No pueden exceder límites
5. **Redimensionar** - No puede achicar si hay plantas que quedarían fuera
6. **Mover** - No puede mover si nueva posición causa superposición o sale del terreno
7. **Mover con plantas** - Las plantas se mueven junto con la zona (mismas coordenadas relativas)
8. **Eliminar** - Requiere confirmación seria (nombre + fecha)
9. **Eliminar con plantas** - Advertir que se eliminarán las plantas

---

## Tareas

### Tarea 1: Crear Validaciones de Zona
**Archivo**: `src/lib/validations/zona.ts` (crear)

```typescript
import type { Zona, Terreno, Planta } from '@/types'

export interface ValidationResult {
  valida: boolean
  error?: string
}

// Verificar si dos rectángulos se superponen
export function zonasSeSuperponen(
  zona1: { x: number; y: number; ancho: number; alto: number },
  zona2: { x: number; y: number; ancho: number; alto: number }
): boolean {
  return !(
    zona1.x + zona1.ancho <= zona2.x ||
    zona2.x + zona2.ancho <= zona1.x ||
    zona1.y + zona1.alto <= zona2.y ||
    zona2.y + zona2.alto <= zona1.y
  )
}

// Validar nueva zona
export function validarNuevaZona(
  nuevaZona: { x: number; y: number; ancho: number; alto: number },
  zonasExistentes: Zona[],
  terreno: Terreno
): ValidationResult {
  // Tamaño mínimo
  if (nuevaZona.ancho < 1 || nuevaZona.alto < 1) {
    return { valida: false, error: 'La zona debe tener al menos 1m × 1m' }
  }

  // Dentro del terreno
  if (nuevaZona.x < 0 || nuevaZona.y < 0) {
    return { valida: false, error: 'La zona no puede tener coordenadas negativas' }
  }
  if (nuevaZona.x + nuevaZona.ancho > terreno.ancho_m) {
    return { valida: false, error: 'La zona excede el ancho del terreno' }
  }
  if (nuevaZona.y + nuevaZona.alto > terreno.alto_m) {
    return { valida: false, error: 'La zona excede el alto del terreno' }
  }

  // No superposición
  for (const zona of zonasExistentes) {
    if (zonasSeSuperponen(nuevaZona, zona)) {
      return { valida: false, error: `La zona se superpone con "${zona.nombre}"` }
    }
  }

  return { valida: true }
}

// Validar redimensionamiento
export function validarRedimensionarZona(
  zona: Zona,
  nuevoTamaño: { ancho: number; alto: number },
  plantas: Planta[],
  zonasExistentes: Zona[],
  terreno: Terreno
): ValidationResult {
  // Tamaño mínimo
  if (nuevoTamaño.ancho < 1 || nuevoTamaño.alto < 1) {
    return { valida: false, error: 'La zona debe tener al menos 1m × 1m' }
  }

  // Dentro del terreno
  if (zona.x + nuevoTamaño.ancho > terreno.ancho_m) {
    return { valida: false, error: 'La zona excedería el ancho del terreno' }
  }
  if (zona.y + nuevoTamaño.alto > terreno.alto_m) {
    return { valida: false, error: 'La zona excedería el alto del terreno' }
  }

  // Verificar plantas que quedarían fuera
  const plantasFuera = plantas.filter(planta =>
    planta.x >= nuevoTamaño.ancho || planta.y >= nuevoTamaño.alto
  )
  if (plantasFuera.length > 0) {
    return {
      valida: false,
      error: `No puedes achicar la zona: ${plantasFuera.length} planta(s) quedarían fuera`,
    }
  }

  // No superposición con otras zonas
  const zonaModificada = { ...zona, ancho: nuevoTamaño.ancho, alto: nuevoTamaño.alto }
  for (const otraZona of zonasExistentes) {
    if (otraZona.id === zona.id) continue
    if (zonasSeSuperponen(zonaModificada, otraZona)) {
      return { valida: false, error: `La zona se superpondría con "${otraZona.nombre}"` }
    }
  }

  return { valida: true }
}

// Validar mover zona a nueva posición
export function validarMoverZona(
  zona: Zona,
  nuevaPosicion: { x: number; y: number },
  zonasExistentes: Zona[],
  terreno: Terreno
): ValidationResult {
  // Coordenadas no negativas
  if (nuevaPosicion.x < 0 || nuevaPosicion.y < 0) {
    return { valida: false, error: 'La posición no puede tener coordenadas negativas' }
  }

  // Dentro del terreno
  if (nuevaPosicion.x + zona.ancho > terreno.ancho_m) {
    return { valida: false, error: 'La zona excedería el ancho del terreno' }
  }
  if (nuevaPosicion.y + zona.alto > terreno.alto_m) {
    return { valida: false, error: 'La zona excedería el alto del terreno' }
  }

  // No superposición con otras zonas
  const zonaMovida = { ...zona, x: nuevaPosicion.x, y: nuevaPosicion.y }
  for (const otraZona of zonasExistentes) {
    if (otraZona.id === zona.id) continue
    if (zonasSeSuperponen(zonaMovida, otraZona)) {
      return { valida: false, error: `La zona se superpondría con "${otraZona.nombre}"` }
    }
  }

  return { valida: true }
}

// Advertencia al eliminar zona con plantas
export function advertenciaEliminarZona(
  zona: Zona,
  plantas: Planta[]
): string | null {
  const plantasEnZona = plantas.filter(p => p.zona_id === zona.id)
  if (plantasEnZona.length > 0) {
    return `Esta zona tiene ${plantasEnZona.length} planta(s). Al eliminarla, también se eliminarán las plantas.`
  }
  return null
}
```

---

### Tarea 2: Crear Hook useZonas
**Archivo**: `src/hooks/useZonas.ts` (crear)

```typescript
'use client'

import { useState, useCallback } from 'react'
import { db } from '@/lib/db'
import { generateUUID, getCurrentTimestamp } from '@/lib/utils'
import { validarNuevaZona, validarRedimensionarZona, validarMoverZona } from '@/lib/validations/zona'
import type { Zona, Terreno, Planta, TipoZona, UUID } from '@/types'
import { COLORES_ZONA } from '@/types'

interface UseZonas {
  crearZona: (data: {
    nombre: string
    tipo: TipoZona
    x: number
    y: number
    ancho: number
    alto: number
  }) => Promise<{ zona?: Zona; error?: string }>

  actualizarZona: (id: UUID, cambios: Partial<Zona>) => Promise<{ error?: string }>

  redimensionarZona: (
    id: UUID,
    nuevoTamaño: { ancho: number; alto: number }
  ) => Promise<{ error?: string }>

  moverZona: (
    id: UUID,
    nuevaPosicion: { x: number; y: number }
  ) => Promise<{ error?: string }>

  eliminarZona: (id: UUID) => Promise<{ error?: string }>
}

export function useZonas(
  terrenoId: UUID,
  terreno: Terreno,
  zonas: Zona[],
  plantas: Planta[],
  onRefetch: () => void
): UseZonas {
  const crearZona = useCallback(async (data: {
    nombre: string
    tipo: TipoZona
    x: number
    y: number
    ancho: number
    alto: number
  }) => {
    // Validar
    const validacion = validarNuevaZona(data, zonas, terreno)
    if (!validacion.valida) {
      return { error: validacion.error }
    }

    const nuevaZona: Zona = {
      id: generateUUID(),
      terreno_id: terrenoId,
      nombre: data.nombre,
      tipo: data.tipo,
      estado: 'vacia',
      x: data.x,
      y: data.y,
      ancho: data.ancho,
      alto: data.alto,
      area_m2: data.ancho * data.alto,
      color: COLORES_ZONA[data.tipo],
      notas: '',
      created_at: getCurrentTimestamp(),
      updated_at: getCurrentTimestamp(),
    }

    await db.zonas.add(nuevaZona)
    onRefetch()
    return { zona: nuevaZona }
  }, [terrenoId, terreno, zonas, onRefetch])

  const actualizarZona = useCallback(async (id: UUID, cambios: Partial<Zona>) => {
    // Si cambia el tipo, actualizar el color
    if (cambios.tipo && !cambios.color) {
      cambios.color = COLORES_ZONA[cambios.tipo]
    }

    await db.zonas.update(id, {
      ...cambios,
      updated_at: getCurrentTimestamp(),
    })
    onRefetch()
    return {}
  }, [onRefetch])

  const redimensionarZona = useCallback(async (
    id: UUID,
    nuevoTamaño: { ancho: number; alto: number }
  ) => {
    const zona = zonas.find(z => z.id === id)
    if (!zona) {
      return { error: 'Zona no encontrada' }
    }

    const plantasZona = plantas.filter(p => p.zona_id === id)
    const validacion = validarRedimensionarZona(
      zona,
      nuevoTamaño,
      plantasZona,
      zonas,
      terreno
    )

    if (!validacion.valida) {
      return { error: validacion.error }
    }

    await db.zonas.update(id, {
      ancho: nuevoTamaño.ancho,
      alto: nuevoTamaño.alto,
      area_m2: nuevoTamaño.ancho * nuevoTamaño.alto,
      updated_at: getCurrentTimestamp(),
    })
    onRefetch()
    return {}
  }, [zonas, plantas, terreno, onRefetch])

  const moverZona = useCallback(async (
    id: UUID,
    nuevaPosicion: { x: number; y: number }
  ) => {
    const zona = zonas.find(z => z.id === id)
    if (!zona) {
      return { error: 'Zona no encontrada' }
    }

    const validacion = validarMoverZona(zona, nuevaPosicion, zonas, terreno)
    if (!validacion.valida) {
      return { error: validacion.error }
    }

    await db.zonas.update(id, {
      x: nuevaPosicion.x,
      y: nuevaPosicion.y,
      updated_at: getCurrentTimestamp(),
    })
    onRefetch()
    return {}
  }, [zonas, terreno, onRefetch])

  const eliminarZona = useCallback(async (id: UUID) => {
    // Eliminar plantas de la zona primero
    const plantasZona = plantas.filter(p => p.zona_id === id)
    for (const planta of plantasZona) {
      await db.plantas.delete(planta.id)
    }

    // Eliminar zona
    await db.zonas.delete(id)
    onRefetch()
    return {}
  }, [plantas, onRefetch])

  return {
    crearZona,
    actualizarZona,
    redimensionarZona,
    moverZona,
    eliminarZona,
  }
}
```

---

### Tarea 3: Crear Modo Creación de Zona
**Archivo**: `src/components/mapa/CrearZonaOverlay.tsx` (crear)

```typescript
'use client'

import { useState, useCallback } from 'react'
import { PIXELS_POR_METRO, pixelsToMetros, snapToGrid } from '@/lib/utils/coordinates'

interface Point {
  x: number
  y: number
}

interface CrearZonaOverlayProps {
  onComplete: (rect: { x: number; y: number; ancho: number; alto: number }) => void
  onCancel: () => void
}

export function CrearZonaOverlay({ onComplete, onCancel }: CrearZonaOverlayProps) {
  const [start, setStart] = useState<Point | null>(null)
  const [current, setCurrent] = useState<Point | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleMouseDown = useCallback((e: React.MouseEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = pixelsToMetros(e.clientX - rect.left)
    const y = pixelsToMetros(e.clientY - rect.top)

    setStart({ x: snapToGrid(x), y: snapToGrid(y) })
    setCurrent({ x: snapToGrid(x), y: snapToGrid(y) })
    setIsDragging(true)
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGRectElement>) => {
    if (!isDragging || !start) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = pixelsToMetros(e.clientX - rect.left)
    const y = pixelsToMetros(e.clientY - rect.top)

    setCurrent({ x: snapToGrid(x), y: snapToGrid(y) })
  }, [isDragging, start])

  const handleMouseUp = useCallback(() => {
    if (!start || !current) {
      setIsDragging(false)
      return
    }

    const rectMetros = {
      x: Math.min(start.x, current.x),
      y: Math.min(start.y, current.y),
      ancho: Math.abs(current.x - start.x),
      alto: Math.abs(current.y - start.y),
    }

    // Mínimo 1m × 1m
    if (rectMetros.ancho >= 1 && rectMetros.alto >= 1) {
      onComplete(rectMetros)
    }

    setStart(null)
    setCurrent(null)
    setIsDragging(false)
  }, [start, current, onComplete])

  // Preview del rectángulo siendo dibujado
  const previewRect = start && current ? {
    x: Math.min(start.x, current.x) * PIXELS_POR_METRO,
    y: Math.min(start.y, current.y) * PIXELS_POR_METRO,
    width: Math.abs(current.x - start.x) * PIXELS_POR_METRO,
    height: Math.abs(current.y - start.y) * PIXELS_POR_METRO,
  } : null

  return (
    <>
      {/* Área interactiva transparente */}
      <rect
        x={0}
        y={0}
        width="100%"
        height="100%"
        fill="transparent"
        className="cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setIsDragging(false)}
      />

      {/* Preview */}
      {previewRect && (
        <rect
          x={previewRect.x}
          y={previewRect.y}
          width={previewRect.width}
          height={previewRect.height}
          fill="rgba(34, 197, 94, 0.3)"
          stroke="#22c55e"
          strokeWidth="2"
          strokeDasharray="5,5"
          pointerEvents="none"
        />
      )}

      {/* Dimensiones del preview */}
      {previewRect && start && current && (
        <text
          x={previewRect.x + previewRect.width / 2}
          y={previewRect.y + previewRect.height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-sm font-bold"
          fill="#22c55e"
          pointerEvents="none"
        >
          {Math.abs(current.x - start.x).toFixed(1)}m × {Math.abs(current.y - start.y).toFixed(1)}m
        </text>
      )}
    </>
  )
}
```

---

### Tarea 4: Crear Modal de Edición de Zona
**Archivo**: `src/components/mapa/EditorZona.tsx` (crear)

> ⚠️ **IMPORTANTE**: Este componente DEBE incluir inputs editables para posición (x, y) y dimensiones (ancho, alto). NO solo mostrarlos como texto.

```typescript
'use client'

import { useState, useEffect } from 'react'
import type { Zona, TipoZona } from '@/types'
import { COLORES_ZONA } from '@/types'

interface EditorZonaProps {
  zona: Zona
  onSave: (cambios: Partial<Zona>) => void
  onRedimensionar: (nuevoTamaño: { ancho: number; alto: number }) => Promise<{ error?: string }>
  onMover: (nuevaPosicion: { x: number; y: number }) => Promise<{ error?: string }>
  onDelete: () => void
  onClose: () => void
  advertenciaEliminacion?: string | null
}

export function EditorZona({
  zona,
  onSave,
  onRedimensionar,
  onMover,
  onDelete,
  onClose,
  advertenciaEliminacion,
}: EditorZonaProps) {
  const [nombre, setNombre] = useState(zona.nombre)
  const [tipo, setTipo] = useState<TipoZona>(zona.tipo)
  const [color, setColor] = useState(zona.color)
  const [notas, setNotas] = useState(zona.notas)

  // Estados editables para posición y dimensiones
  const [x, setX] = useState(zona.x)
  const [y, setY] = useState(zona.y)
  const [ancho, setAncho] = useState(zona.ancho)
  const [alto, setAlto] = useState(zona.alto)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Resetear estados cuando cambia la zona
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
  }, [zona])

  const handleTipoChange = (nuevoTipo: TipoZona) => {
    setTipo(nuevoTipo)
    setColor(COLORES_ZONA[nuevoTipo])
  }

  const handleSave = async () => {
    setError(null)

    // Si cambió posición, mover
    if (x !== zona.x || y !== zona.y) {
      const result = await onMover({ x, y })
      if (result.error) {
        setError(result.error)
        return
      }
    }

    // Si cambió dimensiones, redimensionar
    if (ancho !== zona.ancho || alto !== zona.alto) {
      const result = await onRedimensionar({ ancho, alto })
      if (result.error) {
        setError(result.error)
        return
      }
    }

    // Guardar otros cambios (nombre, tipo, color, notas)
    onSave({ nombre, tipo, color, notas })
  }

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-bold">Editar Zona</h3>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Nombre</label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Tipo</label>
        <select
          value={tipo}
          onChange={(e) => handleTipoChange(e.target.value as TipoZona)}
          className="w-full px-3 py-2 border rounded"
        >
          <option value="cultivo">Cultivo</option>
          <option value="bodega">Bodega</option>
          <option value="casa">Casa</option>
          <option value="camino">Camino</option>
          <option value="decoracion">Decoración</option>
          <option value="otro">Otro</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Color</label>
        <div className="flex gap-2 items-center">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-12 h-10 rounded cursor-pointer"
          />
          <span className="text-sm text-gray-500">{color}</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Notas</label>
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          className="w-full px-3 py-2 border rounded resize-none"
          rows={3}
        />
      </div>

      {/* Posición - EDITABLE */}
      <div>
        <label className="block text-sm font-medium mb-1">Posición (metros)</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-500">X</label>
            <input
              type="number"
              value={x}
              onChange={(e) => setX(Number(e.target.value))}
              min={0}
              step={0.5}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500">Y</label>
            <input
              type="number"
              value={y}
              onChange={(e) => setY(Number(e.target.value))}
              min={0}
              step={0.5}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
        </div>
      </div>

      {/* Dimensiones - EDITABLE */}
      <div>
        <label className="block text-sm font-medium mb-1">Dimensiones (metros)</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-500">Ancho</label>
            <input
              type="number"
              value={ancho}
              onChange={(e) => setAncho(Number(e.target.value))}
              min={1}
              step={0.5}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500">Alto</label>
            <input
              type="number"
              value={alto}
              onChange={(e) => setAlto(Number(e.target.value))}
              min={1}
              step={0.5}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
        </div>
      </div>

      {/* Área calculada (solo lectura) */}
      <div className="bg-gray-50 p-3 rounded text-sm">
        <span className="text-gray-500">Área:</span> {ancho * alto} m²
      </div>

      {/* Botones */}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600 font-medium"
        >
          Guardar Cambios
        </button>
        <button
          onClick={onClose}
          className="flex-1 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300"
        >
          Cancelar
        </button>
      </div>

      {/* Eliminar */}
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

// Componente de confirmación seria
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
      <p className="text-red-800 font-medium">⚠️ Confirmar eliminación</p>

      {advertencia && (
        <p className="text-red-700 text-sm bg-red-100 p-2 rounded">
          {advertencia}
        </p>
      )}

      <div>
        <label className="block text-sm mb-1">
          Escribe: <code className="bg-white px-1">{zona.nombre}</code>
        </label>
        <input
          type="text"
          value={inputNombre}
          onChange={(e) => setInputNombre(e.target.value)}
          className="w-full px-2 py-1 border rounded text-sm"
          placeholder={zona.nombre}
        />
      </div>

      <div>
        <label className="block text-sm mb-1">
          Fecha de hoy: <code className="bg-white px-1">{today}</code>
        </label>
        <input
          type="text"
          value={inputFecha}
          onChange={(e) => setInputFecha(e.target.value)}
          className="w-full px-2 py-1 border rounded text-sm"
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
```

---

### Tarea 5: Crear Modal Nueva Zona
**Archivo**: `src/components/mapa/NuevaZonaModal.tsx` (crear)

```typescript
'use client'

import { useState } from 'react'
import type { TipoZona } from '@/types'
import { COLORES_ZONA } from '@/types'

interface NuevaZonaModalProps {
  rect: { x: number; y: number; ancho: number; alto: number }
  onConfirm: (data: { nombre: string; tipo: TipoZona }) => void
  onCancel: () => void
}

export function NuevaZonaModal({ rect, onConfirm, onCancel }: NuevaZonaModalProps) {
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState<TipoZona>('cultivo')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (nombre.trim()) {
      onConfirm({ nombre: nombre.trim(), tipo })
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm">
        <h3 className="text-lg font-bold mb-4">Nueva Zona</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Info del rectángulo */}
          <div className="bg-gray-50 p-3 rounded text-sm">
            <div><strong>Área:</strong> {(rect.ancho * rect.alto).toFixed(1)} m²</div>
            <div><strong>Dimensiones:</strong> {rect.ancho.toFixed(1)}m × {rect.alto.toFixed(1)}m</div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Nombre *</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-green-500"
              placeholder="Ej: Zona Norte, Huerta 1..."
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tipo</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoZona)}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="cultivo">🌱 Cultivo</option>
              <option value="bodega">📦 Bodega</option>
              <option value="casa">🏠 Casa</option>
              <option value="camino">🛤️ Camino</option>
              <option value="decoracion">🌸 Decoración</option>
              <option value="otro">📍 Otro</option>
            </select>
          </div>

          {/* Preview del color */}
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded"
              style={{ backgroundColor: COLORES_ZONA[tipo] }}
            />
            <span className="text-sm text-gray-500">Color automático según tipo</span>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600 font-medium"
            >
              Crear Zona
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

---

### Tarea 6: INTEGRAR Zonas en Página Principal
**Archivo**: `src/app/page.tsx` (actualizar)

Esta tarea es CRÍTICA. Sin ella, los componentes existen pero el usuario no puede usarlos.

**Cambios requeridos:**

1. **Barra de herramientas** con botones:
   - "Seleccionar" (modo ver)
   - "+ Nueva Zona" (modo crear_zona)

2. **Estado de modo** en el componente:
   ```typescript
   type Modo = 'ver' | 'crear_zona'
   const [modo, setModo] = useState<Modo>('ver')
   ```

3. **Integrar MapaTerreno** con modo y callbacks:
   ```typescript
   <MapaTerreno
     modo={modo}
     onZonaClick={(zona) => setZonaSeleccionada(zona)}
     onZonaCreada={(rect) => setRectNuevaZona(rect)}
   />
   ```

4. **Cargar datos de IndexedDB** (NO datos demo):
   ```typescript
   const zonasData = await db.zonas.where('terreno_id').equals(TERRENO_ID).toArray()
   ```

5. **Mostrar EditorZona en sidebar** cuando zona seleccionada:
   ```typescript
   <EditorZona
     zona={zonaSeleccionada}
     onSave={handleGuardarZona}
     onRedimensionar={(size) => zonasHook.redimensionarZona(zonaSeleccionada.id, size)}
     onMover={(pos) => zonasHook.moverZona(zonaSeleccionada.id, pos)}
     onDelete={handleEliminarZona}
     onClose={() => setZonaSeleccionada(null)}
     advertenciaEliminacion={advertenciaEliminarZona(zonaSeleccionada, plantas)}
   />
   ```

6. **Mostrar NuevaZonaModal** cuando rectNuevaZona existe

7. **Conectar useZonas** para operaciones CRUD (crear, actualizar, redimensionar, mover, eliminar)

---

## UX: Preview en Tiempo Real

Al editar posición (X, Y) o dimensiones (ancho, alto) en el sidebar:
1. **Preview visual en el mapa** - Mostrar rectángulo punteado con la nueva posición/tamaño
2. **Indicador de validez** - Verde si es válido, rojo si hay superposición o sale del terreno
3. **Solo guardar si es válido** - Botón Guardar deshabilitado si la preview es inválida

Implementación:
- `page.tsx` pasa `zonaPreview` al `MapaTerreno`
- `MapaTerreno` renderiza un `<rect>` punteado con la preview
- `EditorZona` valida en tiempo real y muestra estado

---

## Criterios de Aceptación

- [x] Validación de superposición funciona correctamente
- [x] Validación de límites del terreno funciona
- [x] No se puede crear zona menor a 1m × 1m
- [x] Click y arrastrar crea zona con preview visual
- [x] Modal pide nombre y tipo antes de crear
- [x] Editor de zona permite cambiar nombre, tipo, color, notas
- [x] **Editor permite cambiar posición (x, y) con inputs numéricos**
- [x] **Editor permite cambiar dimensiones (ancho, alto) con inputs numéricos**
- [x] **No se puede mover zona si causaría superposición**
- [x] **No se puede mover zona fuera de los límites del terreno**
- [x] Color cambia automáticamente según tipo
- [x] No se puede achicar zona si plantas quedarían fuera
- [x] Eliminación requiere escribir nombre + fecha
- [x] Advertencia si zona tiene plantas al eliminar
- [x] **Usuario puede crear zonas desde la UI** (botón + dibujar)
- [x] **Usuario puede mover y redimensionar zonas desde el sidebar**
- [x] **Datos se guardan en IndexedDB** (persisten al recargar)
- [x] **Sistema de snap automático** a bordes de terreno y zonas existentes
- [x] **Guías visuales** (líneas naranjas) cuando snap está activo
- [x] **Etiquetas muestran dimensiones** (ancho×alto) en vez de solo área
- [x] **Preview de zona en edición** con validación visual (verde/rojo)

---

## Siguiente Fase

**FASE_4_PLANTAS** - Sistema de colocación de plantas individual y grilla
