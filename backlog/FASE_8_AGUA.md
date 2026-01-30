# FASE 8: Control de Agua

**Status**: ✅ COMPLETADA
**Prioridad**: 🟡 Media
**Dependencias**: FASE_7
**Estimación**: 4-5 horas

---

## Objetivo

Sistema de gestión de agua: entradas (aljibe), cálculo de consumo con factores de temporada, descuento automático.

---

## Reglas de Negocio

1. **Agua es por terreno** - Cada terreno tiene su propio balance
2. **Entradas**: Registrar cuando llega agua (aljibe)
3. **Consumo automático**: Calculado según plantas y sistema de riego
4. **Factores de temporada**:
   - Verano: 1.4× (Dic-Feb)
   - Primavera: 1.2× (Sep-Nov)
   - Otoño: 1.0× (Mar-May)
   - Invierno: 0.6× (Jun-Ago)
5. **Descuento automático**: Basado en `litros_hora` del sistema de riego
6. **Estados**: ok, ajustado, deficit

---

## Tareas

### Tarea 1: Crear Utilidades de Cálculo de Agua
**Archivo**: `src/lib/utils/agua.ts` (crear)

```typescript
import type { Terreno, Zona, Planta, CatalogoCultivo, Temporada, EstadoAgua } from '@/types'
import { FACTORES_TEMPORADA } from '@/types'
import { getTemporadaActual } from '@/lib/utils'

// Calcular consumo de una zona (m³/semana)
export function calcularConsumoZona(
  zona: Zona,
  plantas: Planta[],
  catalogoCultivos: CatalogoCultivo[],
  temporada: Temporada = getTemporadaActual()
): number {
  if (zona.tipo !== 'cultivo' || plantas.length === 0) {
    return 0
  }

  const factorTemporada = FACTORES_TEMPORADA[temporada]
  let consumoTotal = 0

  for (const planta of plantas) {
    if (planta.estado === 'muerta') continue

    const cultivo = catalogoCultivos.find(c => c.id === planta.tipo_cultivo_id)
    if (!cultivo) continue

    // Promedio de agua (m³/ha/año) convertido a m³/planta/semana
    const aguaPromedio = (cultivo.agua_m3_ha_año_min + cultivo.agua_m3_ha_año_max) / 2
    const espaciadoM2 = cultivo.espaciado_recomendado_m ** 2
    const plantasPorHa = 10000 / espaciadoM2
    const aguaPorPlantaAño = aguaPromedio / plantasPorHa
    const aguaPorPlantaSemana = aguaPorPlantaAño / 52

    consumoTotal += aguaPorPlantaSemana * factorTemporada
  }

  return consumoTotal
}

// Calcular consumo total del terreno (m³/semana)
export function calcularConsumoTerreno(
  zonas: Zona[],
  plantas: Planta[],
  catalogoCultivos: CatalogoCultivo[],
  temporada: Temporada = getTemporadaActual()
): number {
  let consumoTotal = 0

  for (const zona of zonas) {
    const plantasZona = plantas.filter(p => p.zona_id === zona.id)
    consumoTotal += calcularConsumoZona(zona, plantasZona, catalogoCultivos, temporada)
  }

  return consumoTotal
}

// Calcular descuento automático por riego (m³)
export function calcularDescuentoRiego(
  terreno: Terreno,
  horasDesdeUltimaActualizacion: number
): number {
  if (!terreno.sistema_riego.descuento_auto) {
    return 0
  }

  const litrosPorHora = terreno.sistema_riego.litros_hora
  const litrosConsumidos = litrosPorHora * horasDesdeUltimaActualizacion
  const m3Consumidos = litrosConsumidos / 1000

  return m3Consumidos
}

// Determinar estado del agua
export function determinarEstadoAgua(
  aguaDisponible: number,
  aguaNecesaria: number
): EstadoAgua {
  const margen = aguaDisponible - aguaNecesaria

  if (margen > aguaNecesaria * 0.2) {
    return 'ok'         // Más de 20% de margen
  } else if (margen >= 0) {
    return 'ajustado'   // Entre 0% y 20%
  } else {
    return 'deficit'    // Negativo
  }
}

// Proyectar agua para X semanas
export function proyectarAgua(
  aguaActual: number,
  consumoSemanal: number,
  semanas: number
): { semana: number; agua: number }[] {
  const proyeccion: { semana: number; agua: number }[] = []
  let agua = aguaActual

  for (let i = 0; i <= semanas; i++) {
    proyeccion.push({ semana: i, agua: Math.max(0, agua) })
    agua -= consumoSemanal
  }

  return proyeccion
}
```

---

### Tarea 2: Crear Hook useAgua
**Archivo**: `src/hooks/useAgua.ts` (crear)

```typescript
'use client'

import { useEffect, useState, useCallback } from 'react'
import { db } from '@/lib/db'
import { generateUUID, getCurrentTimestamp } from '@/lib/utils'
import { calcularConsumoTerreno, determinarEstadoAgua, calcularDescuentoRiego } from '@/lib/utils/agua'
import type { EntradaAgua, Terreno, Zona, Planta, CatalogoCultivo, UUID, EstadoAgua } from '@/types'

interface UseAgua {
  entradas: EntradaAgua[]
  consumoSemanal: number
  estadoAgua: EstadoAgua
  loading: boolean

  registrarEntrada: (data: {
    cantidad_m3: number
    costo_clp?: number
    proveedor?: string
    notas?: string
  }) => Promise<EntradaAgua>

  actualizarAguaTerreno: (cantidad: number) => Promise<void>

  aplicarDescuentoAutomatico: () => Promise<number>
}

export function useAgua(
  terreno: Terreno | null,
  zonas: Zona[],
  plantas: Planta[],
  catalogoCultivos: CatalogoCultivo[],
  onRefetch: () => void
): UseAgua {
  const [entradas, setEntradas] = useState<EntradaAgua[]>([])
  const [loading, setLoading] = useState(true)

  // Cargar historial de entradas
  useEffect(() => {
    if (!terreno) return

    async function cargar() {
      setLoading(true)
      const data = await db.entradas_agua
        .where('terreno_id')
        .equals(terreno.id)
        .reverse()
        .sortBy('fecha')
      setEntradas(data)
      setLoading(false)
    }

    cargar()
  }, [terreno])

  // Calcular consumo semanal
  const consumoSemanal = terreno
    ? calcularConsumoTerreno(zonas, plantas, catalogoCultivos)
    : 0

  // Determinar estado
  const estadoAgua = terreno
    ? determinarEstadoAgua(terreno.agua_actual_m3, consumoSemanal)
    : 'ok'

  // Registrar entrada de agua
  const registrarEntrada = useCallback(async (data: {
    cantidad_m3: number
    costo_clp?: number
    proveedor?: string
    notas?: string
  }) => {
    if (!terreno) throw new Error('No hay terreno')

    const entrada: EntradaAgua = {
      id: generateUUID(),
      terreno_id: terreno.id,
      fecha: getCurrentTimestamp(),
      cantidad_m3: data.cantidad_m3,
      costo_clp: data.costo_clp,
      proveedor: data.proveedor,
      notas: data.notas || '',
      created_at: getCurrentTimestamp(),
    }

    await db.entradas_agua.add(entrada)

    // Actualizar agua del terreno
    const nuevaAgua = Math.min(
      terreno.agua_disponible_m3,
      terreno.agua_actual_m3 + data.cantidad_m3
    )
    await db.terrenos.update(terreno.id, {
      agua_actual_m3: nuevaAgua,
      updated_at: getCurrentTimestamp(),
    })

    setEntradas(prev => [entrada, ...prev])
    onRefetch()

    return entrada
  }, [terreno, onRefetch])

  // Actualizar agua manualmente
  const actualizarAguaTerreno = useCallback(async (cantidad: number) => {
    if (!terreno) return

    const nuevaAgua = Math.max(0, Math.min(terreno.agua_disponible_m3, cantidad))
    await db.terrenos.update(terreno.id, {
      agua_actual_m3: nuevaAgua,
      updated_at: getCurrentTimestamp(),
    })
    onRefetch()
  }, [terreno, onRefetch])

  // Aplicar descuento automático
  const aplicarDescuentoAutomatico = useCallback(async () => {
    if (!terreno) return 0

    const ahora = new Date()
    const ultimaActualizacion = new Date(terreno.sistema_riego.ultima_actualizacion)
    const horasTranscurridas = (ahora.getTime() - ultimaActualizacion.getTime()) / (1000 * 60 * 60)

    const descuento = calcularDescuentoRiego(terreno, horasTranscurridas)

    if (descuento > 0) {
      const nuevaAgua = Math.max(0, terreno.agua_actual_m3 - descuento)
      await db.terrenos.update(terreno.id, {
        agua_actual_m3: nuevaAgua,
        'sistema_riego.ultima_actualizacion': getCurrentTimestamp(),
        updated_at: getCurrentTimestamp(),
      })
      onRefetch()
    }

    return descuento
  }, [terreno, onRefetch])

  return {
    entradas,
    consumoSemanal,
    estadoAgua,
    loading,
    registrarEntrada,
    actualizarAguaTerreno,
    aplicarDescuentoAutomatico,
  }
}
```

---

### Tarea 3: Crear Formulario de Entrada de Agua
**Archivo**: `src/components/agua/EntradaAguaForm.tsx` (crear)

```typescript
'use client'

import { useState } from 'react'

interface EntradaAguaFormProps {
  aguaActual: number
  aguaMaxima: number
  onRegistrar: (data: {
    cantidad_m3: number
    costo_clp?: number
    proveedor?: string
    notas?: string
  }) => void
  onCancelar: () => void
}

export function EntradaAguaForm({
  aguaActual,
  aguaMaxima,
  onRegistrar,
  onCancelar,
}: EntradaAguaFormProps) {
  const [cantidad, setCantidad] = useState(20) // Default: 20 m³ (camión típico)
  const [costo, setCosto] = useState<number | ''>('')
  const [proveedor, setProveedor] = useState('')
  const [notas, setNotas] = useState('')

  const espacioDisponible = aguaMaxima - aguaActual
  const cantidadFinal = Math.min(cantidad, espacioDisponible)
  const excede = cantidad > espacioDisponible

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onRegistrar({
      cantidad_m3: cantidadFinal,
      costo_clp: costo || undefined,
      proveedor: proveedor || undefined,
      notas,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <h3 className="text-lg font-bold">Registrar Entrada de Agua</h3>

      {/* Estado actual */}
      <div className="bg-blue-50 p-3 rounded text-sm">
        <div><strong>Agua actual:</strong> {aguaActual.toFixed(1)} m³</div>
        <div><strong>Capacidad máxima:</strong> {aguaMaxima.toFixed(1)} m³</div>
        <div><strong>Espacio disponible:</strong> {espacioDisponible.toFixed(1)} m³</div>
      </div>

      {/* Cantidad */}
      <div>
        <label className="block text-sm font-medium mb-1">Cantidad (m³) *</label>
        <input
          type="number"
          value={cantidad}
          onChange={(e) => setCantidad(Number(e.target.value))}
          min={0.1}
          step={0.1}
          className={`w-full px-3 py-2 border rounded ${excede ? 'border-yellow-500' : ''}`}
          required
        />
        {excede && (
          <p className="text-yellow-600 text-sm mt-1">
            Solo se agregarán {cantidadFinal.toFixed(1)} m³ (capacidad máxima)
          </p>
        )}
      </div>

      {/* Costo */}
      <div>
        <label className="block text-sm font-medium mb-1">Costo (CLP)</label>
        <input
          type="number"
          value={costo}
          onChange={(e) => setCosto(e.target.value ? Number(e.target.value) : '')}
          min={0}
          className="w-full px-3 py-2 border rounded"
          placeholder="Opcional"
        />
      </div>

      {/* Proveedor */}
      <div>
        <label className="block text-sm font-medium mb-1">Proveedor</label>
        <input
          type="text"
          value={proveedor}
          onChange={(e) => setProveedor(e.target.value)}
          className="w-full px-3 py-2 border rounded"
          placeholder="Ej: Camión municipal"
        />
      </div>

      {/* Notas */}
      <div>
        <label className="block text-sm font-medium mb-1">Notas</label>
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          className="w-full px-3 py-2 border rounded"
          rows={2}
        />
      </div>

      {/* Resultado final */}
      <div className="bg-green-50 p-3 rounded text-center">
        <div className="text-sm text-green-700">Agua después de entrada:</div>
        <div className="text-2xl font-bold text-green-800">
          {(aguaActual + cantidadFinal).toFixed(1)} m³
        </div>
      </div>

      {/* Botones */}
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        >
          Registrar Entrada
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="flex-1 bg-gray-200 py-2 rounded hover:bg-gray-300"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
```

---

### Tarea 4: Crear Página de Agua
**Archivo**: `src/app/terrenos/[id]/agua/page.tsx` (crear)

```typescript
'use client'

import { use, useState } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { EntradaAguaForm } from '@/components/agua/EntradaAguaForm'
import { HistorialAgua } from '@/components/agua/HistorialAgua'
import { ResumenAgua } from '@/components/agua/ResumenAgua'
import { useTerreno } from '@/hooks/useTerreno'
import { useAgua } from '@/hooks/useAgua'
import { useCatalogo } from '@/hooks/useCatalogo'

export default function AguaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: terrenoId } = use(params)
  const { terreno, zonas, plantas, refetch } = useTerreno(terrenoId)
  const { cultivos } = useCatalogo(terreno?.proyecto_id || '')
  const {
    entradas,
    consumoSemanal,
    estadoAgua,
    registrarEntrada,
  } = useAgua(terreno, zonas, plantas, cultivos, refetch)

  const [showEntradaForm, setShowEntradaForm] = useState(false)

  if (!terreno) {
    return <div className="flex items-center justify-center h-screen">Cargando...</div>
  }

  return (
    <div className="flex flex-col h-screen">
      <Navbar terrenoId={terrenoId} />

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-auto p-4 space-y-4">
          {/* Resumen */}
          <ResumenAgua
            aguaActual={terreno.agua_actual_m3}
            aguaMaxima={terreno.agua_disponible_m3}
            consumoSemanal={consumoSemanal}
            estadoAgua={estadoAgua}
          />

          {/* Botón registrar */}
          <button
            onClick={() => setShowEntradaForm(true)}
            className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 font-medium"
          >
            + Registrar Entrada de Agua
          </button>

          {/* Historial */}
          <HistorialAgua entradas={entradas} />
        </main>

        <Sidebar>
          {showEntradaForm && (
            <EntradaAguaForm
              aguaActual={terreno.agua_actual_m3}
              aguaMaxima={terreno.agua_disponible_m3}
              onRegistrar={async (data) => {
                await registrarEntrada(data)
                setShowEntradaForm(false)
              }}
              onCancelar={() => setShowEntradaForm(false)}
            />
          )}
        </Sidebar>
      </div>
    </div>
  )
}
```

---

### Tarea 5: Crear Componente Resumen de Agua
**Archivo**: `src/components/agua/ResumenAgua.tsx` (crear)

```typescript
import type { EstadoAgua } from '@/types'

interface ResumenAguaProps {
  aguaActual: number
  aguaMaxima: number
  consumoSemanal: number
  estadoAgua: EstadoAgua
}

export function ResumenAgua({
  aguaActual,
  aguaMaxima,
  consumoSemanal,
  estadoAgua,
}: ResumenAguaProps) {
  const porcentaje = (aguaActual / aguaMaxima) * 100
  const semanasRestantes = consumoSemanal > 0 ? aguaActual / consumoSemanal : Infinity

  const estadoConfig = {
    ok: { color: 'green', label: 'OK', bg: 'bg-green-500' },
    ajustado: { color: 'yellow', label: 'Ajustado', bg: 'bg-yellow-500' },
    deficit: { color: 'red', label: 'Déficit', bg: 'bg-red-500' },
  }

  const config = estadoConfig[estadoAgua]

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Estado del Agua</h2>
        <span className={`px-3 py-1 rounded-full text-white text-sm font-medium ${config.bg}`}>
          {config.label}
        </span>
      </div>

      {/* Barra de nivel */}
      <div>
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>{aguaActual.toFixed(1)} m³</span>
          <span>{aguaMaxima.toFixed(1)} m³</span>
        </div>
        <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${config.bg} transition-all`}
            style={{ width: `${Math.min(100, porcentaje)}%` }}
          />
        </div>
        <div className="text-center text-sm text-gray-500 mt-1">
          {porcentaje.toFixed(0)}% de capacidad
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-4 pt-2">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {consumoSemanal.toFixed(1)}
          </div>
          <div className="text-sm text-gray-500">m³/semana consumo</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {semanasRestantes === Infinity ? '∞' : semanasRestantes.toFixed(1)}
          </div>
          <div className="text-sm text-gray-500">semanas restantes</div>
        </div>
      </div>

      {/* Advertencia si déficit */}
      {estadoAgua === 'deficit' && (
        <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-800">
          ⚠️ Agua insuficiente para el consumo semanal. Considera reducir cultivos o aumentar entradas.
        </div>
      )}
    </div>
  )
}
```

---

### Tarea 6: INTEGRAR Agua en Navegación
**Archivos**: `src/app/agua/page.tsx` (crear), `src/app/page.tsx` (actualizar)

**Cambios requeridos:**

1. **Crear ruta /agua** con página dedicada:
   ```
   src/app/agua/page.tsx
   ```

2. **Link en header** de la página principal:
   ```typescript
   <Link href="/agua">Agua</Link>
   ```

3. **Widget de agua en página principal**:
   - Mostrar ResumenAgua compacto en sidebar o header
   - Indicador visual del estado (verde/amarillo/rojo)

4. **Página /agua completa** con:
   - ResumenAgua grande
   - Botón "+ Registrar Entrada"
   - EntradaAguaForm en modal/sidebar
   - HistorialAgua con lista de entradas

5. **Conectar useAgua** con datos reales

---

## Criterios de Aceptación

- [ ] Cálculo de consumo usa factores de temporada correctos
- [ ] Registro de entrada actualiza agua del terreno
- [ ] No se puede exceder capacidad máxima
- [ ] Estado de agua (ok/ajustado/deficit) se calcula bien
- [ ] Barra de nivel muestra porcentaje correcto
- [ ] Semanas restantes se calcula correctamente
- [ ] Historial muestra entradas ordenadas por fecha
- [ ] Descuento automático funciona según L/h configurado
- [ ] **Página /agua accesible desde navegación**
- [ ] **Widget de estado en página principal**

---

## Siguiente Fase

**FASE_7_ALERTAS** - Sistema de alertas automáticas y dashboard
