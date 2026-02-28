# 01: Dashboard Agua Día a Día

**Status**: ✅ COMPLETADO
**Prioridad**: 🔴 CRÍTICA
**Estimación**: 1 semana (5-6 días)
**Dependencias**: Ninguna (base de todo)

---

## 🎯 Objetivo

Transformar `/agua` en **herramienta día a día** que responde en segundos:

> **"¿Me alcanza el agua para las próximas 2 semanas?"**

---

## 📋 Problema Actual

**Lo que existe ahora** (`/agua`):

- ✅ Muestra nivel estanque
- ✅ Muestra consumo semanal
- ✅ Muestra días restantes
- ⚠️ PERO: No considera frecuencia de recarga real del usuario
- ⚠️ PERO: Cálculo consumo no usa goteros/planta ni etapas
- ⚠️ PERO: No muestra "¿alcanza hasta próxima recarga?"

**Ejemplo del problema**:

```
Usuario: "Cargo agua cada 14 días"
App actual: "Tienes agua para 7 días"
Usuario: "¿Me alcanza hasta la próxima recarga?"
App actual: ❌ No responde esta pregunta crítica
```

---

## 💡 Solución

### Configuración Rápida (Usuario ingresa 1 vez)

```typescript
interface ConfiguracionRecarga {
  frecuencia_dias: number; // ej: 14 días
  cantidad_litros: number; // ej: 5000 L
  proxima_recarga: Date; // calculada automáticamente
}
```

**Flujo**:

1. Usuario clickea estanque en mapa
2. Modal: "¿Cada cuántos días cargas agua?"
3. Usuario: "14 días"
4. Modal: "¿Cuántos litros cargas?"
5. Usuario: "5000 L"
6. Sistema calcula: `proxima_recarga = ultima_entrada + 14 días`

### Dashboard Mejorado

```
┌────────────────────────────────────────┐
│ 💧 Dashboard Agua                      │
├────────────────────────────────────────┤
│                                        │
│ Estanque Principal                     │
│ ┌────────────────┐                     │
│ │ 60% (3,000 L)  │                     │
│ │ ████████░░░    │ 🟨 AJUSTADO         │
│ └────────────────┘                     │
│                                        │
│ Consumo Actual                         │
│ • Hoy: 400 L/día                       │
│ • Semana: 2,800 L                      │
│                                        │
│ Próxima Recarga                        │
│ • Fecha: 10 Feb (3 días)               │
│ • ❌ NO ALCANZA                        │
│ • Falta: 1 día de agua                 │
│                                        │
│ ┌──────────────────────────────────┐   │
│ │ ⚠️ ALERTA CRÍTICA                │   │
│ │ Agua se agota el 9 Feb           │   │
│ │ Recarga programada: 10 Feb       │   │
│ │ Recomendación:                   │   │
│ │ • Adelanta recarga 1 día         │   │
│ │ • O reduce consumo 50 L/día      │   │
│ └──────────────────────────────────┘   │
│                                        │
│ Plantas Activas (20)                   │
│ ├─ 🍅 10 Tomates (Adultos)             │
│ │  └─ 250 L/día (62%)                  │
│ ├─ 🥭 5 Mangos (Jóvenes)               │
│ │  └─ 100 L/día (25%)                  │
│ └─ 🥕 5 Zanahorias (Plántulas)         │
│    └─ 50 L/día (13%)                   │
│                                        │
│ [⚙️ Configurar Recarga]                │
│ [📊 Ver Planificador Largo Plazo →]   │
└────────────────────────────────────────┘
```

---

## 🏗️ Implementación

### Tarea 1.1: Agregar Configuración Recarga a Estanque

**Archivo**: `src/types/index.ts`

```typescript
export interface EstanqueConfig {
  // ... campos existentes
  capacidad_m3: MetrosCubicos;
  nivel_actual_m3: MetrosCubicos;
  tasa_consumo_m3_hora?: number;

  // NUEVO: Configuración recarga
  recarga?: {
    frecuencia_dias: number; // ej: 14
    cantidad_litros: number; // ej: 5000
    ultima_recarga: Timestamp;
    proxima_recarga: Timestamp; // auto-calculada
    costo_recarga_clp?: number; // opcional
  };
}
```

---

### Tarea 1.2: Crear Componente Configuración Recarga

**Archivo**: `src/components/agua/configurar-recarga-modal.tsx` (CREAR)

```typescript
'use client'

import { useState } from 'react'
import type { Zona, EstanqueConfig } from '@/types'
import { addDays, format } from 'date-fns'
import { es } from 'date-fns/locale'

interface ConfigurarRecargaModalProps {
  estanque: Zona
  onGuardar: (config: {
    frecuencia_dias: number
    cantidad_litros: number
  }) => Promise<void>
  onCerrar: () => void
}

export function ConfigurarRecargaModal({
  estanque,
  onGuardar,
  onCerrar,
}: ConfigurarRecargaModalProps) {
  const config = estanque.estanque_config?.recarga

  const [frecuenciaDias, setFrecuenciaDias] = useState(
    config?.frecuencia_dias || 14
  )
  const [cantidadLitros, setCantidadLitros] = useState(
    config?.cantidad_litros || 5000
  )

  // Calcular próxima recarga
  const proximaRecarga = addDays(new Date(), frecuenciaDias)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">
          ⚙️ Configurar Recarga de Agua
        </h2>

        <div className="space-y-4">
          {/* Frecuencia */}
          <div>
            <label className="block text-sm font-medium mb-2">
              ¿Cada cuántos días cargas agua?
            </label>
            <input
              type="number"
              value={frecuenciaDias}
              onChange={(e) => setFrecuenciaDias(Number(e.target.value))}
              min={1}
              max={90}
              className="w-full px-3 py-2 border rounded"
            />
            <p className="text-xs text-gray-500 mt-1">
              Recomendado: 7-14 días
            </p>
          </div>

          {/* Cantidad */}
          <div>
            <label className="block text-sm font-medium mb-2">
              ¿Cuántos litros cargas por recarga?
            </label>
            <input
              type="number"
              value={cantidadLitros}
              onChange={(e) => setCantidadLitros(Number(e.target.value))}
              min={100}
              step={100}
              className="w-full px-3 py-2 border rounded"
            />
            <p className="text-xs text-gray-500 mt-1">
              Capacidad estanque: {estanque.estanque_config?.capacidad_m3 || 0} m³
              ({(estanque.estanque_config?.capacidad_m3 || 0) * 1000} L)
            </p>
          </div>

          {/* Preview */}
          <div className="bg-blue-50 p-3 rounded">
            <div className="text-sm">
              <strong>Próxima recarga:</strong>
            </div>
            <div className="text-lg font-bold text-blue-700">
              {format(proximaRecarga, "d 'de' MMMM", { locale: es })}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              En {frecuenciaDias} días
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-2">
            <button
              onClick={async () => {
                await onGuardar({
                  frecuencia_dias: frecuenciaDias,
                  cantidad_litros: cantidadLitros,
                })
                onCerrar()
              }}
              className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            >
              Guardar
            </button>
            <button
              onClick={onCerrar}
              className="flex-1 bg-gray-200 py-2 rounded hover:bg-gray-300"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

### Tarea 1.3: Actualizar ResumenAgua

**Archivo**: `src/components/agua/resumen-agua.tsx` (MODIFICAR)

Agregar:

- Sección "Próxima Recarga"
- Cálculo "¿Alcanza hasta próxima recarga?"
- Alerta si NO alcanza
- Desglose consumo por tipo planta

```typescript
// AGREGAR a ResumenAgua:

interface ResumenAguaProps {
  // ... props existentes
  proximaRecarga?: Date
  frecuenciaRecarga?: number
  plantas: Planta[]           // NUEVO
  catalogoCultivos: CatalogoCultivo[]  // NUEVO
}

export function ResumenAgua({
  aguaActual,
  aguaMaxima,
  consumoSemanal,
  estadoAgua,
  proximaRecarga,
  frecuenciaRecarga,
  plantas,
  catalogoCultivos,
}: ResumenAguaProps) {
  const consumoDiario = consumoSemanal / 7
  const diasRestantes = consumoDiario > 0 ? aguaActual / consumoDiario : Infinity

  // NUEVO: Calcular si alcanza hasta próxima recarga
  let alcanzaHastaRecarga = true
  let diasFaltantes = 0

  if (proximaRecarga && frecuenciaRecarga) {
    const diasHastaRecarga = Math.ceil(
      (proximaRecarga.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    alcanzaHastaRecarga = diasRestantes >= diasHastaRecarga
    diasFaltantes = diasHastaRecarga - diasRestantes
  }

  // NUEVO: Agrupar consumo por tipo planta
  const consumoPorTipo = agruparConsumoPorTipo(
    plantas,
    catalogoCultivos
  )

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      {/* ... contenido existente ... */}

      {/* NUEVO: Sección Próxima Recarga */}
      {proximaRecarga && (
        <div className={`p-3 rounded ${
          alcanzaHastaRecarga
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
        }`}>
          <h3 className="text-sm font-bold mb-1">
            Próxima Recarga
          </h3>
          <div className="text-lg font-bold">
            {format(proximaRecarga, "d 'de' MMMM", { locale: es })}
          </div>
          <div className="text-sm">
            {alcanzaHastaRecarga ? (
              <span className="text-green-700">
                ✅ Alcanza ({Math.abs(diasFaltantes)} días de margen)
              </span>
            ) : (
              <span className="text-red-700">
                ❌ NO alcanza (falta {Math.abs(diasFaltantes)} días de agua)
              </span>
            )}
          </div>

          {!alcanzaHastaRecarga && (
            <div className="mt-2 text-xs text-red-600">
              <strong>Recomendación:</strong>
              <ul className="ml-4 mt-1 list-disc">
                <li>Adelanta recarga {Math.abs(diasFaltantes)} días</li>
                <li>O reduce consumo {Math.ceil(consumoDiario * 0.2)} L/día</li>
              </ul>
            </div>
          )}
        </div>
      )}

      {/* NUEVO: Desglose consumo por planta */}
      {plantas.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer font-medium text-gray-700">
            Plantas Activas ({plantas.length})
          </summary>
          <div className="mt-2 space-y-1 ml-4">
            {consumoPorTipo.map(item => (
              <div key={item.tipo} className="flex justify-between">
                <span>
                  {item.emoji} {item.cantidad}× {item.nombre} ({item.etapa})
                </span>
                <span className="font-medium">
                  {item.consumo.toFixed(1)} L/día
                  <span className="text-gray-500 text-xs ml-1">
                    ({item.porcentaje}%)
                  </span>
                </span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}

// NUEVA función helper
function agruparConsumoPorTipo(
  plantas: Planta[],
  catalogoCultivos: CatalogoCultivo[]
) {
  // Agrupar por tipo + etapa
  const grupos = new Map<string, {
    tipo: string
    nombre: string
    emoji: string
    etapa: string
    cantidad: number
    consumo: number
  }>()

  for (const planta of plantas) {
    if (planta.estado === 'muerta') continue

    const cultivo = catalogoCultivos.find(c => c.id === planta.tipo_cultivo_id)
    if (!cultivo) continue

    const key = `${planta.tipo_cultivo_id}_${planta.etapa_actual}`
    const consumoPlanta = calcularConsumoPlan ta(planta, cultivo)

    if (grupos.has(key)) {
      const grupo = grupos.get(key)!
      grupo.cantidad += 1
      grupo.consumo += consumoPlanta
    } else {
      grupos.set(key, {
        tipo: cultivo.tipo,
        nombre: cultivo.nombre_comun,
        emoji: cultivo.emoji || '🌱',
        etapa: planta.etapa_actual || 'adulta',
        cantidad: 1,
        consumo: consumoPlanta,
      })
    }
  }

  // Ordenar por consumo descendente
  return Array.from(grupos.values())
    .sort((a, b) => b.consumo - a.consumo)
    .map(item => ({
      ...item,
      porcentaje: Math.round((item.consumo / consumoTotal) * 100),
    }))
}
```

---

### Tarea 1.4: Integrar en Página /agua

**Archivo**: `src/app/agua/page.tsx` (MODIFICAR)

```typescript
// AGREGAR:
const [showConfigRecarga, setShowConfigRecarga] = useState(false)

// Calcular próxima recarga
const estanquePrincipal = estanques[0] // o seleccionado por usuario
const proximaRecarga = estanquePrincipal?.estanque_config?.recarga
  ? addDays(
      new Date(estanquePrincipal.estanque_config.recarga.ultima_recarga),
      estanquePrincipal.estanque_config.recarga.frecuencia_dias
    )
  : undefined

// Handler guardar configuración
const handleGuardarConfigRecarga = async (config: {
  frecuencia_dias: number
  cantidad_litros: number
}) => {
  if (!estanquePrincipal) return

  await zonasDAL.update(estanquePrincipal.id, {
    'estanque_config.recarga': {
      frecuencia_dias: config.frecuencia_dias,
      cantidad_litros: config.cantidad_litros,
      ultima_recarga: getCurrentTimestamp(),
      proxima_recarga: addDays(new Date(), config.frecuencia_dias).toISOString(),
    },
    updated_at: getCurrentTimestamp(),
  })

  await fetchData()
}

return (
  <>
    {/* ... contenido existente ... */}

    <ResumenAgua
      aguaActual={terreno.agua_actual_m3}
      aguaMaxima={terreno.agua_disponible_m3}
      consumoSemanal={consumoSemanal}
      estadoAgua={estadoAgua}
      proximaRecarga={proximaRecarga}  // NUEVO
      frecuenciaRecarga={estanquePrincipal?.estanque_config?.recarga?.frecuencia_dias}
      plantas={plantas}  // NUEVO
      catalogoCultivos={catalogoCultivos}  // NUEVO
    />

    <button
      onClick={() => setShowConfigRecarga(true)}
      className="w-full bg-gray-100 text-gray-700 py-2 rounded hover:bg-gray-200"
    >
      ⚙️ Configurar Recarga
    </button>

    {showConfigRecarga && estanquePrincipal && (
      <ConfigurarRecargaModal
        estanque={estanquePrincipal}
        onGuardar={handleGuardarConfigRecarga}
        onCerrar={() => setShowConfigRecarga(false)}
      />
    )}
  </>
)
```

---

## ✅ Criterios de Aceptación

- [ ] Usuario puede configurar frecuencia recarga (ej: 14 días)
- [ ] Usuario puede configurar cantidad recarga (ej: 5000 L)
- [ ] Dashboard muestra próxima recarga calculada automáticamente
- [ ] Dashboard muestra si agua alcanza hasta próxima recarga
- [ ] Alerta ROJA si NO alcanza (con recomendaciones)
- [ ] Alerta VERDE si SÍ alcanza (con margen en días)
- [ ] Desglose consumo por tipo planta y etapa
- [ ] Porcentaje de consumo por planta visible
- [ ] Configuración se guarda en IndexedDB
- [ ] Al registrar entrada agua, actualiza `ultima_recarga` automáticamente
- [ ] Próxima recarga se recalcula automáticamente

---

## 🎯 Resultado Esperado

**Antes** (confuso):

```
Usuario: "¿Me alcanza el agua?"
App: "Tienes 7 días de agua"
Usuario: "¿Pero cargo cada 14 días... alcanza?"
App: 🤷 (no responde)
```

**Después** (claro):

```
Usuario: "¿Me alcanza el agua?"
App: "❌ NO alcanza
      Agua se agota: 9 Feb
      Próxima recarga: 10 Feb
      Falta: 1 día de agua

      Recomendación:
      • Adelanta recarga 1 día
      • O reduce consumo 50 L/día"
```

---

## 📝 Notas Técnicas

1. **Recarga automática**: Al registrar entrada agua (EntradaAgua), actualizar `ultima_recarga` y recalcular `proxima_recarga`
2. **Múltiples estanques**: Por ahora, usar primer estanque. Futuro: selector
3. **Cálculo preciso**: Usar `date-fns` para fechas (considera timezones)
4. **Persistencia**: Todo se guarda en `EstanqueConfig.recarga` (IndexedDB)
5. **Actualización real-time**: Si planta cambia etapa, recalcular consumo automáticamente

---

## 🔗 Archivos Afectados

| Archivo                                            | Acción       | Descripción                        |
| -------------------------------------------------- | ------------ | ---------------------------------- |
| `src/types/index.ts`                               | ✏️ Modificar | Agregar `EstanqueConfig.recarga`   |
| `src/components/agua/configurar-recarga-modal.tsx` | ✅ Crear     | Modal configuración                |
| `src/components/agua/resumen-agua.tsx`             | ✏️ Modificar | Agregar sección recarga + desglose |
| `src/app/agua/page.tsx`                            | ✏️ Modificar | Integrar modal + cálculos          |
| `src/lib/utils/agua-calculo-anual.ts`              | ✏️ Modificar | Helper `calcularConsumoPlanta()`   |

---

## 🚀 Siguiente Paso

Una vez completada esta tarea:
→ **02_etapas_crecimiento_kc.md** (etapas automáticas que afectan consumo)
