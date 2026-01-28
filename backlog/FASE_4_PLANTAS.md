# FASE 4: Sistema de Plantas

**Status**: ⏸️ PENDIENTE
**Prioridad**: 🔴 Alta
**Dependencias**: FASE_3
**Estimación**: 4-5 horas

---

## Objetivo

Implementar colocación de plantas: individual (click) y en grilla automática con preview.

---

## Reglas de Negocio

1. **Solo en zonas tipo "cultivo"** - No se pueden poner plantas en bodega/casa/etc.
2. **Espaciado mínimo**: 0.5m entre plantas
3. **Espaciado recomendado**: Según catálogo del cultivo
4. **Posición relativa**: Coordenadas son relativas a la zona, no al terreno
5. **Dentro de la zona**: Planta no puede exceder límites de la zona
6. **Grid automático**: Preview antes de confirmar
7. **Estados**: plantada → creciendo → produciendo → muerta
8. **Mover plantas**: Arrastrar individualmente

---

## Tareas

### Tarea 1: Crear Validaciones de Planta
**Archivo**: `src/lib/validations/planta.ts` (crear)

```typescript
import type { Planta, Zona, CatalogoCultivo } from '@/types'

export interface ValidationResult {
  valida: boolean
  error?: string
  advertencia?: string
}

// Espaciado mínimo absoluto
export const ESPACIADO_MINIMO = 0.5 // metros

// Calcular distancia entre dos puntos
function distancia(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
}

// Validar posición de nueva planta
export function validarNuevaPlanta(
  posicion: { x: number; y: number },
  zona: Zona,
  plantasExistentes: Planta[],
  cultivo?: CatalogoCultivo
): ValidationResult {
  // Verificar que la zona es de tipo cultivo
  if (zona.tipo !== 'cultivo') {
    return { valida: false, error: 'Solo puedes plantar en zonas de tipo "cultivo"' }
  }

  // Verificar que está dentro de la zona
  if (posicion.x < 0 || posicion.y < 0 ||
      posicion.x > zona.ancho || posicion.y > zona.alto) {
    return { valida: false, error: 'La planta debe estar dentro de la zona' }
  }

  // Verificar espaciado con otras plantas
  const espaciadoRequerido = cultivo?.espaciado_min_m || ESPACIADO_MINIMO

  for (const planta of plantasExistentes) {
    if (planta.zona_id !== zona.id) continue

    const dist = distancia(posicion, planta)
    if (dist < ESPACIADO_MINIMO) {
      return {
        valida: false,
        error: `Muy cerca de otra planta (${dist.toFixed(2)}m). Mínimo: ${ESPACIADO_MINIMO}m`,
      }
    }
    if (dist < espaciadoRequerido) {
      // Es válido pero con advertencia
      return {
        valida: true,
        advertencia: `Espaciado menor al recomendado (${espaciadoRequerido}m)`,
      }
    }
  }

  return { valida: true }
}

// Generar posiciones de grilla
export function generarGridPlantas(
  zona: Zona,
  espaciado: number,
  margen = 0.5 // margen desde el borde de la zona
): Array<{ x: number; y: number }> {
  const posiciones: Array<{ x: number; y: number }> = []

  // Espaciado mínimo
  const espaciadoFinal = Math.max(espaciado, ESPACIADO_MINIMO)

  // Calcular número de filas y columnas
  const anchoDisponible = zona.ancho - (margen * 2)
  const altoDisponible = zona.alto - (margen * 2)

  if (anchoDisponible <= 0 || altoDisponible <= 0) {
    return []
  }

  const columnas = Math.floor(anchoDisponible / espaciadoFinal) + 1
  const filas = Math.floor(altoDisponible / espaciadoFinal) + 1

  for (let fila = 0; fila < filas; fila++) {
    for (let col = 0; col < columnas; col++) {
      const x = margen + (col * espaciadoFinal)
      const y = margen + (fila * espaciadoFinal)

      // Verificar que está dentro de la zona
      if (x <= zona.ancho - margen && y <= zona.alto - margen) {
        posiciones.push({ x, y })
      }
    }
  }

  return posiciones
}

// Validar grid completo
export function validarGridPlantas(
  posiciones: Array<{ x: number; y: number }>,
  zona: Zona,
  plantasExistentes: Planta[]
): {
  validas: Array<{ x: number; y: number }>
  invalidas: Array<{ x: number; y: number; razon: string }>
} {
  const validas: Array<{ x: number; y: number }> = []
  const invalidas: Array<{ x: number; y: number; razon: string }> = []

  for (const pos of posiciones) {
    // Verificar conflicto con plantas existentes
    let conflicto = false
    for (const planta of plantasExistentes) {
      if (planta.zona_id !== zona.id) continue

      const dist = distancia(pos, planta)
      if (dist < ESPACIADO_MINIMO) {
        invalidas.push({ ...pos, razon: 'Muy cerca de planta existente' })
        conflicto = true
        break
      }
    }

    if (!conflicto) {
      validas.push(pos)
    }
  }

  return { validas, invalidas }
}
```

---

### Tarea 2: Crear Hook usePlantas
**Archivo**: `src/hooks/usePlantas.ts` (crear)

```typescript
'use client'

import { useCallback } from 'react'
import { db } from '@/lib/db'
import { generateUUID, getCurrentTimestamp } from '@/lib/utils'
import { validarNuevaPlanta, validarGridPlantas, generarGridPlantas } from '@/lib/validations/planta'
import type { Planta, Zona, CatalogoCultivo, EstadoPlanta, UUID } from '@/types'

interface UsePlantas {
  crearPlanta: (data: {
    zona: Zona
    tipoCultivoId: UUID
    x: number
    y: number
    plantasExistentes: Planta[]
    cultivo?: CatalogoCultivo
  }) => Promise<{ planta?: Planta; error?: string; advertencia?: string }>

  crearPlantasGrid: (data: {
    zona: Zona
    tipoCultivoId: UUID
    espaciado: number
    plantasExistentes: Planta[]
  }) => Promise<{ plantas: Planta[]; errores: number }>

  moverPlanta: (id: UUID, nuevaPosicion: { x: number; y: number }) => Promise<{ error?: string }>

  cambiarEstado: (id: UUID, estado: EstadoPlanta) => Promise<void>

  eliminarPlanta: (id: UUID) => Promise<void>

  eliminarPlantasMuertas: (zonaId: UUID) => Promise<number>
}

export function usePlantas(onRefetch: () => void): UsePlantas {
  const crearPlanta = useCallback(async (data: {
    zona: Zona
    tipoCultivoId: UUID
    x: number
    y: number
    plantasExistentes: Planta[]
    cultivo?: CatalogoCultivo
  }) => {
    const validacion = validarNuevaPlanta(
      { x: data.x, y: data.y },
      data.zona,
      data.plantasExistentes,
      data.cultivo
    )

    if (!validacion.valida) {
      return { error: validacion.error }
    }

    const nuevaPlanta: Planta = {
      id: generateUUID(),
      zona_id: data.zona.id,
      tipo_cultivo_id: data.tipoCultivoId,
      x: data.x,
      y: data.y,
      estado: 'plantada',
      fecha_plantacion: getCurrentTimestamp(),
      notas: '',
      created_at: getCurrentTimestamp(),
      updated_at: getCurrentTimestamp(),
    }

    await db.plantas.add(nuevaPlanta)
    onRefetch()

    return {
      planta: nuevaPlanta,
      advertencia: validacion.advertencia,
    }
  }, [onRefetch])

  const crearPlantasGrid = useCallback(async (data: {
    zona: Zona
    tipoCultivoId: UUID
    espaciado: number
    plantasExistentes: Planta[]
  }) => {
    const posiciones = generarGridPlantas(data.zona, data.espaciado)
    const { validas, invalidas } = validarGridPlantas(
      posiciones,
      data.zona,
      data.plantasExistentes
    )

    const plantas: Planta[] = []
    const timestamp = getCurrentTimestamp()

    for (const pos of validas) {
      const planta: Planta = {
        id: generateUUID(),
        zona_id: data.zona.id,
        tipo_cultivo_id: data.tipoCultivoId,
        x: pos.x,
        y: pos.y,
        estado: 'plantada',
        fecha_plantacion: timestamp,
        notas: '',
        created_at: timestamp,
        updated_at: timestamp,
      }
      plantas.push(planta)
    }

    // Insertar todas en batch
    await db.plantas.bulkAdd(plantas)
    onRefetch()

    return {
      plantas,
      errores: invalidas.length,
    }
  }, [onRefetch])

  const moverPlanta = useCallback(async (
    id: UUID,
    nuevaPosicion: { x: number; y: number }
  ) => {
    await db.plantas.update(id, {
      x: nuevaPosicion.x,
      y: nuevaPosicion.y,
      updated_at: getCurrentTimestamp(),
    })
    onRefetch()
    return {}
  }, [onRefetch])

  const cambiarEstado = useCallback(async (id: UUID, estado: EstadoPlanta) => {
    await db.plantas.update(id, {
      estado,
      updated_at: getCurrentTimestamp(),
    })
    onRefetch()
  }, [onRefetch])

  const eliminarPlanta = useCallback(async (id: UUID) => {
    await db.plantas.delete(id)
    onRefetch()
  }, [onRefetch])

  const eliminarPlantasMuertas = useCallback(async (zonaId: UUID) => {
    const muertas = await db.plantas
      .where('zona_id')
      .equals(zonaId)
      .and(p => p.estado === 'muerta')
      .toArray()

    for (const planta of muertas) {
      await db.plantas.delete(planta.id)
    }

    onRefetch()
    return muertas.length
  }, [onRefetch])

  return {
    crearPlanta,
    crearPlantasGrid,
    moverPlanta,
    cambiarEstado,
    eliminarPlanta,
    eliminarPlantasMuertas,
  }
}
```

---

### Tarea 3: Crear Componente PlantaMarker
**Archivo**: `src/components/mapa/PlantaMarker.tsx` (crear)

```typescript
'use client'

import { PIXELS_POR_METRO } from '@/lib/utils/coordinates'
import { COLORES_ESTADO_PLANTA } from '@/types'
import type { Planta } from '@/types'

interface PlantaMarkerProps {
  planta: Planta
  zonaX: number
  zonaY: number
  isSelected?: boolean
  isDragging?: boolean
  onClick?: () => void
  onDragStart?: () => void
  onDrag?: (x: number, y: number) => void
  onDragEnd?: () => void
}

export function PlantaMarker({
  planta,
  zonaX,
  zonaY,
  isSelected,
  isDragging,
  onClick,
}: PlantaMarkerProps) {
  // Posición absoluta = posición zona + posición relativa planta
  const cx = (zonaX + planta.x) * PIXELS_POR_METRO
  const cy = (zonaY + planta.y) * PIXELS_POR_METRO

  // Radio según estado
  const radio = planta.estado === 'muerta' ? 3 : 4

  return (
    <g>
      {/* Círculo de la planta */}
      <circle
        cx={cx}
        cy={cy}
        r={radio}
        fill={COLORES_ESTADO_PLANTA[planta.estado]}
        stroke={isSelected ? '#000' : 'rgba(0,0,0,0.3)'}
        strokeWidth={isSelected ? 2 : 1}
        className={`cursor-pointer transition-transform ${
          isDragging ? 'opacity-50' : 'hover:scale-110'
        }`}
        onClick={(e) => {
          e.stopPropagation()
          onClick?.()
        }}
      />

      {/* Marca si está muerta */}
      {planta.estado === 'muerta' && (
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-[6px] pointer-events-none"
          fill="#fff"
        >
          ✕
        </text>
      )}

      {/* Indicador de selección */}
      {isSelected && (
        <circle
          cx={cx}
          cy={cy}
          r={radio + 4}
          fill="none"
          stroke="#000"
          strokeWidth="1"
          strokeDasharray="2,2"
        />
      )}
    </g>
  )
}
```

---

### Tarea 4: Crear Modal Grid Automático
**Archivo**: `src/components/plantas/GridAutomaticoModal.tsx` (crear)

```typescript
'use client'

import { useState, useMemo } from 'react'
import { generarGridPlantas, validarGridPlantas, ESPACIADO_MINIMO } from '@/lib/validations/planta'
import type { Zona, CatalogoCultivo, Planta } from '@/types'

interface GridAutomaticoModalProps {
  zona: Zona
  cultivo: CatalogoCultivo
  plantasExistentes: Planta[]
  onConfirm: (espaciado: number) => void
  onCancel: () => void
}

export function GridAutomaticoModal({
  zona,
  cultivo,
  plantasExistentes,
  onConfirm,
  onCancel,
}: GridAutomaticoModalProps) {
  const [espaciado, setEspaciado] = useState(cultivo.espaciado_recomendado_m)

  // Calcular preview
  const preview = useMemo(() => {
    const posiciones = generarGridPlantas(zona, espaciado)
    const { validas, invalidas } = validarGridPlantas(posiciones, zona, plantasExistentes)
    return { total: posiciones.length, validas: validas.length, invalidas: invalidas.length }
  }, [zona, espaciado, plantasExistentes])

  const espaciadoValido = espaciado >= ESPACIADO_MINIMO

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">Plantar en Grilla</h3>

        {/* Info del cultivo */}
        <div className="bg-gray-50 p-3 rounded mb-4 text-sm">
          <div><strong>Cultivo:</strong> {cultivo.nombre}</div>
          <div><strong>Zona:</strong> {zona.nombre} ({zona.area_m2} m²)</div>
          <div><strong>Espaciado recomendado:</strong> {cultivo.espaciado_recomendado_m}m</div>
        </div>

        {/* Input de espaciado */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Espaciado entre plantas (metros)
          </label>
          <input
            type="number"
            value={espaciado}
            onChange={(e) => setEspaciado(Number(e.target.value))}
            min={ESPACIADO_MINIMO}
            step={0.1}
            className={`w-full px-3 py-2 border rounded ${
              !espaciadoValido ? 'border-red-500' : ''
            }`}
          />
          {!espaciadoValido && (
            <p className="text-red-500 text-sm mt-1">
              Mínimo: {ESPACIADO_MINIMO}m
            </p>
          )}
        </div>

        {/* Preview */}
        <div className="bg-green-50 p-4 rounded mb-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {preview.validas}
            </div>
            <div className="text-sm text-green-700">plantas se crearán</div>
          </div>

          {preview.invalidas > 0 && (
            <div className="text-center mt-2 text-yellow-700 text-sm">
              {preview.invalidas} posiciones omitidas (conflicto con plantas existentes)
            </div>
          )}

          <div className="mt-3 text-xs text-gray-500 text-center">
            Grid de {espaciado}m × {espaciado}m con margen de 0.5m
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-2">
          <button
            onClick={() => onConfirm(espaciado)}
            disabled={!espaciadoValido || preview.validas === 0}
            className={`flex-1 py-2 rounded font-medium ${
              espaciadoValido && preview.validas > 0
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Plantar {preview.validas} plantas
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

### Tarea 5: Crear Panel de Información de Planta
**Archivo**: `src/components/plantas/PlantaInfo.tsx` (crear)

```typescript
'use client'

import { formatDate } from '@/lib/utils'
import type { Planta, CatalogoCultivo, EstadoPlanta } from '@/types'
import { COLORES_ESTADO_PLANTA } from '@/types'

interface PlantaInfoProps {
  planta: Planta
  cultivo?: CatalogoCultivo
  onCambiarEstado: (estado: EstadoPlanta) => void
  onEliminar: () => void
  onClose: () => void
}

export function PlantaInfo({
  planta,
  cultivo,
  onCambiarEstado,
  onEliminar,
  onClose,
}: PlantaInfoProps) {
  const estados: EstadoPlanta[] = ['plantada', 'creciendo', 'produciendo', 'muerta']

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">
          {cultivo?.nombre || 'Planta'}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      {/* Estado actual */}
      <div className="flex items-center gap-2">
        <div
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: COLORES_ESTADO_PLANTA[planta.estado] }}
        />
        <span className="capitalize font-medium">{planta.estado}</span>
      </div>

      {/* Info */}
      <div className="space-y-2 text-sm">
        <div>
          <span className="text-gray-500">Plantada:</span>{' '}
          {formatDate(planta.fecha_plantacion)}
        </div>
        <div>
          <span className="text-gray-500">Posición:</span>{' '}
          ({planta.x.toFixed(1)}m, {planta.y.toFixed(1)}m)
        </div>
        {cultivo && (
          <>
            <div>
              <span className="text-gray-500">Tiempo producción:</span>{' '}
              {cultivo.tiempo_produccion_meses} meses
            </div>
            <div>
              <span className="text-gray-500">Vida útil:</span>{' '}
              {cultivo.vida_util_años} años
            </div>
          </>
        )}
      </div>

      {/* Cambiar estado */}
      <div>
        <label className="block text-sm font-medium mb-2">Cambiar estado</label>
        <div className="grid grid-cols-2 gap-2">
          {estados.map((estado) => (
            <button
              key={estado}
              onClick={() => onCambiarEstado(estado)}
              disabled={planta.estado === estado}
              className={`
                px-3 py-2 rounded text-sm capitalize flex items-center gap-2
                ${planta.estado === estado
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-50 hover:bg-gray-100'
                }
              `}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORES_ESTADO_PLANTA[estado] }}
              />
              {estado}
            </button>
          ))}
        </div>
      </div>

      {/* Eliminar */}
      <button
        onClick={onEliminar}
        className="w-full text-red-600 hover:text-red-800 text-sm py-2"
      >
        Eliminar planta
      </button>
    </div>
  )
}
```

---

## Criterios de Aceptación

- [ ] Solo se puede plantar en zonas tipo "cultivo"
- [ ] Click en zona cultivo coloca planta individual
- [ ] Validación de espaciado mínimo (0.5m) funciona
- [ ] Advertencia si espaciado menor al recomendado
- [ ] Grid automático muestra preview con conteo
- [ ] Grid respeta plantas existentes
- [ ] Plantas muestran color según estado
- [ ] Se puede cambiar estado de planta
- [ ] Plantas muertas tienen visual diferente (X)
- [ ] Se puede eliminar planta individual
- [ ] Panel de info muestra datos del cultivo

---

## Siguiente Fase

**FASE_5_CATALOGO** - Gestión del catálogo de cultivos por proyecto
