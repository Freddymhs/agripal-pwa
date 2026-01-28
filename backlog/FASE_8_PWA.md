# FASE 8: PWA y Sync Offline

**Status**: ⏸️ PENDIENTE
**Prioridad**: 🔴 Alta
**Dependencias**: FASE_7
**Estimación**: 5-6 horas

---

## Objetivo

Configurar PWA completa con service worker, sincronización offline y resolución de conflictos.

**IMPORTANTE**: Esta fase es CRÍTICA porque la app debe funcionar 100% offline.

---

## Reglas de Negocio

1. **Offline-first**: La app debe funcionar sin conexión
2. **Sync queue**: Cambios offline se guardan en cola
3. **Conflictos**: Usuario decide entre versión local y servidor
4. **Indicador visual**: Siempre mostrar estado de conexión
5. **Auto-sync**: Sincronizar automáticamente al recuperar conexión

---

## Tareas

### Tarea 1: Configurar PWA Manifest
**Archivo**: `public/manifest.json` (crear)

```json
{
  "name": "AgriPlan - Planificador Agrícola",
  "short_name": "AgriPlan",
  "description": "Sistema de planificación agrícola offline-first para pequeños agricultores",
  "start_url": "/",
  "display": "standalone",
  "orientation": "landscape",
  "background_color": "#ffffff",
  "theme_color": "#22c55e",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/desktop.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide"
    },
    {
      "src": "/screenshots/mobile.png",
      "sizes": "750x1334",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ],
  "categories": ["productivity", "utilities"],
  "lang": "es"
}
```

---

### Tarea 2: Configurar next-pwa
**Archivo**: `next.config.ts` (modificar)

```typescript
import type { NextConfig } from 'next'
import createPWA from '@ducanh2912/next-pwa'

const withPWA = createPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: false,
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts',
          expiration: {
            maxEntries: 4,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
          },
        },
      },
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'images',
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
        },
      },
      {
        urlPattern: /^https?:\/\/.*$/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'others',
          networkTimeoutSeconds: 10,
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60, // 1 day
          },
        },
      },
    ],
  },
})

const nextConfig: NextConfig = {
  // ... otras configuraciones
}

export default withPWA(nextConfig)
```

---

### Tarea 3: Crear Sistema de Sync Queue
**Archivo**: `src/lib/sync/queue.ts` (crear)

```typescript
import { db } from '@/lib/db'
import { generateUUID, getCurrentTimestamp } from '@/lib/utils'
import type { SyncItem, SyncEntidad, SyncAccion, UUID } from '@/types'

// Agregar item a la cola
export async function agregarACola(
  entidad: SyncEntidad,
  entidadId: UUID,
  accion: SyncAccion,
  datos: Record<string, unknown>
): Promise<SyncItem> {
  const item: SyncItem = {
    id: generateUUID(),
    entidad,
    entidad_id: entidadId,
    accion,
    datos,
    estado: 'pendiente',
    intentos: 0,
    created_at: getCurrentTimestamp(),
    updated_at: getCurrentTimestamp(),
  }

  await db.sync_queue.add(item)
  return item
}

// Obtener items pendientes
export async function obtenerPendientes(): Promise<SyncItem[]> {
  return db.sync_queue
    .where('estado')
    .anyOf(['pendiente', 'error'])
    .toArray()
}

// Obtener conteo de pendientes
export async function contarPendientes(): Promise<number> {
  return db.sync_queue
    .where('estado')
    .anyOf(['pendiente', 'error'])
    .count()
}

// Marcar como sincronizando
export async function marcarSincronizando(id: UUID): Promise<void> {
  await db.sync_queue.update(id, {
    estado: 'sincronizando',
    updated_at: getCurrentTimestamp(),
  })
}

// Marcar como completado
export async function marcarCompletado(id: UUID): Promise<void> {
  await db.sync_queue.delete(id)
}

// Marcar como error
export async function marcarError(id: UUID, error: string): Promise<void> {
  const item = await db.sync_queue.get(id)
  if (!item) return

  await db.sync_queue.update(id, {
    estado: 'error',
    error,
    intentos: item.intentos + 1,
    updated_at: getCurrentTimestamp(),
  })
}

// Marcar como conflicto
export async function marcarConflicto(
  id: UUID,
  datosServidor: Record<string, unknown>
): Promise<void> {
  await db.sync_queue.update(id, {
    estado: 'conflicto',
    datos_servidor: datosServidor,
    updated_at: getCurrentTimestamp(),
  })
}

// Resolver conflicto
export async function resolverConflicto(
  id: UUID,
  decision: 'local' | 'servidor'
): Promise<void> {
  const item = await db.sync_queue.get(id)
  if (!item) return

  if (decision === 'local') {
    // Volver a intentar con datos locales
    await db.sync_queue.update(id, {
      estado: 'pendiente',
      resuelto_por: 'local',
      updated_at: getCurrentTimestamp(),
    })
  } else {
    // Aplicar datos del servidor localmente
    const tabla = getTabla(item.entidad)
    if (tabla && item.datos_servidor) {
      await tabla.update(item.entidad_id, item.datos_servidor)
    }
    await db.sync_queue.delete(id)
  }
}

// Helper para obtener tabla de Dexie
function getTabla(entidad: SyncEntidad) {
  const tablas: Record<SyncEntidad, any> = {
    proyecto: db.proyectos,
    terreno: db.terrenos,
    zona: db.zonas,
    planta: db.plantas,
    entrada_agua: db.entradas_agua,
    cosecha: db.cosechas,
    alerta: db.alertas,
    catalogo: db.catalogo_cultivos,
  }
  return tablas[entidad]
}

// Limpiar cola (items completados antiguos)
export async function limpiarCola(): Promise<number> {
  const unDiaAtras = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const antiguos = await db.sync_queue
    .where('estado')
    .equals('completado')
    .and(item => item.updated_at < unDiaAtras)
    .toArray()

  for (const item of antiguos) {
    await db.sync_queue.delete(item.id)
  }

  return antiguos.length
}
```

---

### Tarea 4: Crear Hook useOnlineStatus
**Archivo**: `src/hooks/useOnlineStatus.ts` (crear)

```typescript
'use client'

import { useEffect, useState, useCallback } from 'react'
import { contarPendientes } from '@/lib/sync/queue'

interface OnlineStatus {
  isOnline: boolean
  pendingCount: number
  lastOnlineAt: Date | null
}

export function useOnlineStatus(): OnlineStatus {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const [lastOnlineAt, setLastOnlineAt] = useState<Date | null>(null)

  // Verificar estado de conexión
  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      setLastOnlineAt(new Date())
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Contar items pendientes
  useEffect(() => {
    async function actualizar() {
      const count = await contarPendientes()
      setPendingCount(count)
    }

    actualizar()
    const interval = setInterval(actualizar, 5000) // Cada 5 segundos

    return () => clearInterval(interval)
  }, [])

  return {
    isOnline,
    pendingCount,
    lastOnlineAt,
  }
}
```

---

### Tarea 5: Crear Modal de Conflictos
**Archivo**: `src/components/sync/ConflictoModal.tsx` (crear)

```typescript
'use client'

import type { SyncItem } from '@/types'

interface ConflictoModalProps {
  conflicto: SyncItem
  onResolver: (decision: 'local' | 'servidor') => void
  onCancelar: () => void
}

export function ConflictoModal({ conflicto, onResolver, onCancelar }: ConflictoModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-red-600 mb-4">
          ⚠️ Conflicto de Sincronización
        </h3>

        <p className="text-gray-600 mb-4">
          Los datos de <strong>{conflicto.entidad}</strong> han sido modificados
          tanto localmente como en el servidor. ¿Cuál versión quieres conservar?
        </p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Versión local */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2 text-blue-600">📱 Versión Local</h4>
            <p className="text-xs text-gray-500 mb-2">Tus cambios offline</p>
            <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto max-h-32">
              {JSON.stringify(conflicto.datos, null, 2)}
            </pre>
          </div>

          {/* Versión servidor */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2 text-green-600">☁️ Versión Servidor</h4>
            <p className="text-xs text-gray-500 mb-2">Cambios más recientes</p>
            <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto max-h-32">
              {JSON.stringify(conflicto.datos_servidor, null, 2)}
            </pre>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => onResolver('local')}
            className="flex-1 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 font-medium"
          >
            Usar Local
          </button>
          <button
            onClick={() => onResolver('servidor')}
            className="flex-1 bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 font-medium"
          >
            Usar Servidor
          </button>
        </div>

        <button
          onClick={onCancelar}
          className="w-full mt-3 text-gray-500 text-sm hover:text-gray-700"
        >
          Decidir después
        </button>
      </div>
    </div>
  )
}
```

---

### Tarea 6: Crear Indicador de Estado Sync
**Archivo**: `src/components/sync/SyncIndicator.tsx` (crear)

```typescript
'use client'

import { useOnlineStatus } from '@/hooks/useOnlineStatus'

export function SyncIndicator() {
  const { isOnline, pendingCount } = useOnlineStatus()

  if (isOnline && pendingCount === 0) {
    return (
      <div className="flex items-center gap-2 text-green-600 text-sm">
        <div className="w-2 h-2 rounded-full bg-green-500" />
        <span>Sincronizado</span>
      </div>
    )
  }

  if (isOnline && pendingCount > 0) {
    return (
      <div className="flex items-center gap-2 text-yellow-600 text-sm">
        <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
        <span>Sincronizando ({pendingCount})</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-red-600 text-sm">
      <div className="w-2 h-2 rounded-full bg-red-500" />
      <span>Sin conexión {pendingCount > 0 && `(${pendingCount} pendientes)`}</span>
    </div>
  )
}
```

---

### Tarea 7: Crear Banner Offline
**Archivo**: `src/components/sync/OfflineBanner.tsx` (crear)

```typescript
'use client'

import { useOnlineStatus } from '@/hooks/useOnlineStatus'

export function OfflineBanner() {
  const { isOnline, pendingCount } = useOnlineStatus()

  if (isOnline) return null

  return (
    <div className="bg-yellow-500 text-yellow-900 px-4 py-2 text-center text-sm font-medium">
      <span>📴 Sin conexión</span>
      {pendingCount > 0 && (
        <span className="ml-2">
          — {pendingCount} cambio(s) se sincronizarán cuando vuelvas a conectarte
        </span>
      )}
    </div>
  )
}
```

---

## Criterios de Aceptación

- [ ] App se puede instalar como PWA
- [ ] Manifest configura correctamente nombre, iconos, colores
- [ ] App funciona 100% offline después de primera carga
- [ ] Cambios offline se guardan en sync_queue
- [ ] Indicador muestra estado de conexión correctamente
- [ ] Banner aparece cuando no hay conexión
- [ ] Al recuperar conexión, se sincronizan cambios automáticamente
- [ ] Conflictos muestran modal con ambas versiones
- [ ] Usuario puede elegir versión local o servidor
- [ ] Service worker cachea assets correctamente

---

## Siguiente Fase

**FASE_9_AUTH** - Autenticación JWT básica
