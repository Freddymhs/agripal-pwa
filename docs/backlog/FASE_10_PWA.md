# FASE 10: PWA y Sync Offline (MEJORADA)

**Status**: ✅ COMPLETADA
**Prioridad**: 🔴 Alta
**Dependencias**: FASE_9
**Estimación**: 8-10 horas

---

## Objetivo

Configurar PWA completa con:

1. **Service Worker** para cachear assets/UI (next-pwa)
2. **Sync Engine bidireccional** (push local → server + pull server → local)
3. **Resolución de conflictos** (user choice + fallback last-write-wins)
4. **Túnel CRUD único** que garantiza cero pérdida de datos

**CRÍTICO**: La app debe funcionar 100% offline. Sync es app-level via Dexie + fetch, NO via service worker.

---

## Contexto Técnico

| Componente   | Tecnología                       | Propósito                    |
| ------------ | -------------------------------- | ---------------------------- |
| DB Local     | **Dexie.js** (IndexedDB wrapper) | Almacenamiento offline-first |
| Backend      | API REST `/api/[entidad]`        | POST/PUT/DELETE + timestamps |
| Cache Assets | Service Worker (next-pwa)        | Solo UI/fonts/images         |
| Sync Data    | App-level (hooks + fetch)        | Datos usuario bidireccional  |

---

## Datos a Sincronizar

### ✅ USER-GENERATED (Bidireccional)

| Entidad         | Sync  | Conflict Strategy  | Razón          |
| --------------- | ----- | ------------------ | -------------- |
| `proyectos`     | ✅ Sí | User choice / LWW  | Datos usuario  |
| `terrenos`      | ✅ Sí | User choice / LWW  | Datos usuario  |
| `zonas`         | ✅ Sí | User choice / LWW  | Datos usuario  |
| `plantas`       | ✅ Sí | User choice / LWW  | Datos usuario  |
| `entradas_agua` | ✅ Sí | User choice / LWW  | Datos usuario  |
| `cosechas`      | ✅ Sí | User choice / LWW  | Datos usuario  |
| `alertas`       | ✅ Sí | Server wins (auto) | Sistema genera |

### ❌ NO SINCRONIZAR

| Entidad             | Razón                                        |
| ------------------- | -------------------------------------------- |
| `catalogo_cultivos` | Master data estática, pull one-time al login |
| `sync_queue`        | Metadata local                               |
| `historial`         | Logs locales                                 |

---

## Reglas de Negocio

1. **Offline-first**: UI siempre lee de Dexie local, nunca espera al server
2. **Túnel único**: Todo CRUD pasa por `useSyncMutation` que:
   - Muta DB local optimísticamente
   - Agrega a sync_queue
   - UI actualiza via Dexie liveQueries
3. **Bidireccional**:
   - **Push**: Cambios locales → server (al online)
   - **Pull**: Cambios server → local (delta sync con `since=lastSyncAt`)
4. **Conflicto**: Si `server.updatedAt > local.lastModified` → modal usuario o LWW
5. **Retry exponencial**: 1s → 5s → 30s → 2min → 5min (max 5 intentos)
6. **Cleanup**: Items sync_queue > 7 días se eliminan
7. **Timestamps**: Toda entidad syncable tiene `lastModified: Timestamp`

---

## Tareas

### Tarea 1: Actualizar Schema Dexie con lastModified

**Archivo**: `src/lib/db/index.ts` (modificar)

```typescript
import Dexie, { type Table } from "dexie";
import type {
  Usuario,
  Proyecto,
  Terreno,
  Zona,
  Planta,
  CatalogoCultivo,
  EntradaAgua,
  Cosecha,
  Alerta,
  HistorialEntrada,
  SyncItem,
  SyncMeta,
} from "@/types";

export class AgriPlanDB extends Dexie {
  usuarios!: Table<Usuario>;
  proyectos!: Table<Proyecto>;
  terrenos!: Table<Terreno>;
  zonas!: Table<Zona>;
  plantas!: Table<Planta>;
  catalogo_cultivos!: Table<CatalogoCultivo>;
  entradas_agua!: Table<EntradaAgua>;
  cosechas!: Table<Cosecha>;
  alertas!: Table<Alerta>;
  historial!: Table<HistorialEntrada>;
  sync_queue!: Table<SyncItem>;
  sync_meta!: Table<SyncMeta>;

  constructor() {
    super("AgriPlanDB");

    this.version(2).stores({
      usuarios: "id, email",
      proyectos: "id, usuario_id, nombre, lastModified",
      terrenos: "id, proyecto_id, nombre, lastModified",
      zonas: "id, terreno_id, tipo, nombre, lastModified",
      plantas: "id, zona_id, tipo_cultivo_id, estado, lastModified",
      catalogo_cultivos: "id, proyecto_id, nombre, tier",
      entradas_agua: "id, terreno_id, fecha, lastModified",
      cosechas: "id, zona_id, tipo_cultivo_id, fecha, lastModified",
      alertas: "id, terreno_id, tipo, estado, severidad, lastModified",
      historial: "id, usuario_id, terreno_id, tipo_accion, created_at",
      sync_queue: "id, entidad, estado, created_at, nextRetryAt",
      sync_meta: "key",
    });
  }
}

export const db = new AgriPlanDB();
```

---

### Tarea 2: Agregar Tipos de Sync

**Archivo**: `src/types/index.ts` (agregar al final)

```typescript
export type SyncEntidad =
  | "proyecto"
  | "terreno"
  | "zona"
  | "planta"
  | "entrada_agua"
  | "cosecha"
  | "alerta";

export type SyncAccion = "create" | "update" | "delete";
export type SyncEstado = "pendiente" | "sincronizando" | "error" | "conflicto";

export interface SyncItem {
  id: UUID;
  entidad: SyncEntidad;
  entidad_id: UUID;
  accion: SyncAccion;
  datos: Record<string, unknown>;
  datos_servidor?: Record<string, unknown>;
  estado: SyncEstado;
  error?: string;
  intentos: number;
  nextRetryAt?: Timestamp;
  resuelto_por?: "local" | "servidor";
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface SyncMeta {
  key: string;
  value: string;
}

export interface SyncConflict {
  item: SyncItem;
  localData: Record<string, unknown>;
  serverData: Record<string, unknown>;
}

export const SYNC_ENTIDADES: SyncEntidad[] = [
  "proyecto",
  "terreno",
  "zona",
  "planta",
  "entrada_agua",
  "cosecha",
  "alerta",
];

export const RETRY_DELAYS = [1000, 5000, 30000, 120000, 300000]; // 1s, 5s, 30s, 2m, 5m
export const MAX_RETRY_ATTEMPTS = 5;
export const SYNC_CLEANUP_DAYS = 7;
```

---

### Tarea 3: Crear Sync Queue Manager

**Archivo**: `src/lib/sync/queue.ts` (crear)

```typescript
import { db } from "@/lib/db";
import { generateUUID, getCurrentTimestamp } from "@/lib/utils";
import type {
  SyncItem,
  SyncEntidad,
  SyncAccion,
  UUID,
  RETRY_DELAYS,
  MAX_RETRY_ATTEMPTS,
  SYNC_CLEANUP_DAYS,
} from "@/types";

const RETRY_DELAYS = [1000, 5000, 30000, 120000, 300000];
const MAX_RETRY_ATTEMPTS = 5;
const SYNC_CLEANUP_DAYS = 7;

export async function agregarACola(
  entidad: SyncEntidad,
  entidadId: UUID,
  accion: SyncAccion,
  datos: Record<string, unknown>,
): Promise<SyncItem> {
  const existente = await db.sync_queue
    .where("[entidad+entidad_id]")
    .equals([entidad, entidadId])
    .first();

  if (existente && existente.estado !== "conflicto") {
    await db.sync_queue.update(existente.id, {
      accion:
        accion === "delete"
          ? "delete"
          : existente.accion === "create"
            ? "create"
            : accion,
      datos: { ...existente.datos, ...datos },
      estado: "pendiente",
      updated_at: getCurrentTimestamp(),
    });
    return existente;
  }

  const item: SyncItem = {
    id: generateUUID(),
    entidad,
    entidad_id: entidadId,
    accion,
    datos,
    estado: "pendiente",
    intentos: 0,
    created_at: getCurrentTimestamp(),
    updated_at: getCurrentTimestamp(),
  };

  await db.sync_queue.add(item);
  return item;
}

export async function obtenerPendientes(): Promise<SyncItem[]> {
  const ahora = getCurrentTimestamp();
  return db.sync_queue
    .where("estado")
    .anyOf(["pendiente", "error"])
    .filter((item) => !item.nextRetryAt || item.nextRetryAt <= ahora)
    .toArray();
}

export async function obtenerConflictos(): Promise<SyncItem[]> {
  return db.sync_queue.where("estado").equals("conflicto").toArray();
}

export async function contarPendientes(): Promise<number> {
  return db.sync_queue
    .where("estado")
    .anyOf(["pendiente", "error", "sincronizando"])
    .count();
}

export async function marcarSincronizando(id: UUID): Promise<void> {
  await db.sync_queue.update(id, {
    estado: "sincronizando",
    updated_at: getCurrentTimestamp(),
  });
}

export async function marcarCompletado(id: UUID): Promise<void> {
  await db.sync_queue.delete(id);
}

export async function marcarError(id: UUID, error: string): Promise<void> {
  const item = await db.sync_queue.get(id);
  if (!item) return;

  const intentos = item.intentos + 1;

  if (intentos >= MAX_RETRY_ATTEMPTS) {
    await db.sync_queue.update(id, {
      estado: "error",
      error: `Max intentos alcanzado: ${error}`,
      intentos,
      updated_at: getCurrentTimestamp(),
    });
    return;
  }

  const delay = RETRY_DELAYS[Math.min(intentos - 1, RETRY_DELAYS.length - 1)];
  const nextRetryAt = new Date(Date.now() + delay).toISOString();

  await db.sync_queue.update(id, {
    estado: "error",
    error,
    intentos,
    nextRetryAt,
    updated_at: getCurrentTimestamp(),
  });
}

export async function marcarConflicto(
  id: UUID,
  datosServidor: Record<string, unknown>,
): Promise<void> {
  await db.sync_queue.update(id, {
    estado: "conflicto",
    datos_servidor: datosServidor,
    updated_at: getCurrentTimestamp(),
  });
}

export async function resolverConflicto(
  id: UUID,
  decision: "local" | "servidor",
): Promise<void> {
  const item = await db.sync_queue.get(id);
  if (!item) return;

  if (decision === "local") {
    await db.sync_queue.update(id, {
      estado: "pendiente",
      resuelto_por: "local",
      intentos: 0,
      nextRetryAt: undefined,
      updated_at: getCurrentTimestamp(),
    });
  } else {
    if (item.datos_servidor) {
      const tabla = getTabla(item.entidad);
      if (tabla) {
        await tabla.update(item.entidad_id, {
          ...item.datos_servidor,
          lastModified: getCurrentTimestamp(),
        });
      }
    }
    await db.sync_queue.delete(id);
  }
}

export function getTabla(entidad: SyncEntidad) {
  const tablas = {
    proyecto: db.proyectos,
    terreno: db.terrenos,
    zona: db.zonas,
    planta: db.plantas,
    entrada_agua: db.entradas_agua,
    cosecha: db.cosechas,
    alerta: db.alertas,
  };
  return tablas[entidad];
}

export function getApiEndpoint(entidad: SyncEntidad): string {
  const endpoints = {
    proyecto: "/api/proyectos",
    terreno: "/api/terrenos",
    zona: "/api/zonas",
    planta: "/api/plantas",
    entrada_agua: "/api/entradas-agua",
    cosecha: "/api/cosechas",
    alerta: "/api/alertas",
  };
  return endpoints[entidad];
}

export async function limpiarColaAntigua(): Promise<number> {
  const limite = new Date(
    Date.now() - SYNC_CLEANUP_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const antiguos = await db.sync_queue
    .where("created_at")
    .below(limite)
    .filter(
      (item) => item.estado === "error" && item.intentos >= MAX_RETRY_ATTEMPTS,
    )
    .toArray();

  for (const item of antiguos) {
    await db.sync_queue.delete(item.id);
  }

  return antiguos.length;
}

export async function getLastSyncAt(): Promise<string | null> {
  const meta = await db.sync_meta.get("lastSyncAt");
  return meta?.value || null;
}

export async function setLastSyncAt(timestamp: string): Promise<void> {
  await db.sync_meta.put({ key: "lastSyncAt", value: timestamp });
}
```

---

### Tarea 4: Crear Sync Engine

**Archivo**: `src/lib/sync/engine.ts` (crear)

```typescript
import { db } from "@/lib/db";
import { getCurrentTimestamp } from "@/lib/utils";
import {
  obtenerPendientes,
  marcarSincronizando,
  marcarCompletado,
  marcarError,
  marcarConflicto,
  getTabla,
  getApiEndpoint,
  getLastSyncAt,
  setLastSyncAt,
  limpiarColaAntigua,
} from "./queue";
import type { SyncItem, SyncEntidad, SYNC_ENTIDADES } from "@/types";

const SYNC_ENTIDADES: SyncEntidad[] = [
  "proyecto",
  "terreno",
  "zona",
  "planta",
  "entrada_agua",
  "cosecha",
  "alerta",
];

interface SyncResult {
  pushed: number;
  pulled: number;
  conflicts: number;
  errors: number;
}

export async function ejecutarSync(): Promise<SyncResult> {
  const result: SyncResult = { pushed: 0, pulled: 0, conflicts: 0, errors: 0 };

  try {
    const pushResult = await pushChanges();
    result.pushed = pushResult.success;
    result.conflicts = pushResult.conflicts;
    result.errors = pushResult.errors;

    const pullResult = await pullChanges();
    result.pulled = pullResult.count;

    await limpiarColaAntigua();
  } catch (error) {
    console.error("Error en sync engine:", error);
  }

  return result;
}

async function pushChanges(): Promise<{
  success: number;
  conflicts: number;
  errors: number;
}> {
  const pendientes = await obtenerPendientes();
  let success = 0;
  let conflicts = 0;
  let errors = 0;

  for (const item of pendientes) {
    try {
      await marcarSincronizando(item.id);

      const endpoint = getApiEndpoint(item.entidad);
      const url =
        item.accion === "create" ? endpoint : `${endpoint}/${item.entidad_id}`;

      const method =
        item.accion === "delete"
          ? "DELETE"
          : item.accion === "create"
            ? "POST"
            : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: method !== "DELETE" ? JSON.stringify(item.datos) : undefined,
      });

      if (response.status === 409) {
        const serverData = await response.json();
        await marcarConflicto(item.id, serverData.data);
        conflicts++;
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();

      if (item.accion !== "delete" && responseData.data) {
        const tabla = getTabla(item.entidad);
        if (tabla) {
          await tabla.update(item.entidad_id, {
            ...responseData.data,
            lastModified: responseData.lastModified || getCurrentTimestamp(),
          });
        }
      }

      await marcarCompletado(item.id);
      success++;
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Error desconocido";
      await marcarError(item.id, errorMsg);
      errors++;
    }
  }

  return { success, conflicts, errors };
}

async function pullChanges(): Promise<{ count: number }> {
  const lastSyncAt = await getLastSyncAt();
  let totalPulled = 0;

  for (const entidad of SYNC_ENTIDADES) {
    try {
      const endpoint = getApiEndpoint(entidad);
      const url = lastSyncAt
        ? `${endpoint}?since=${encodeURIComponent(lastSyncAt)}`
        : endpoint;

      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) continue;

      const { data, lastModified } = await response.json();

      if (!Array.isArray(data)) continue;

      const tabla = getTabla(entidad);
      if (!tabla) continue;

      for (const serverItem of data) {
        const localItem = await tabla.get(serverItem.id);

        if (!localItem) {
          await tabla.add({
            ...serverItem,
            lastModified: serverItem.updatedAt,
          });
          totalPulled++;
          continue;
        }

        const serverTime = new Date(serverItem.updatedAt).getTime();
        const localTime = new Date(
          localItem.lastModified || localItem.updated_at,
        ).getTime();

        if (serverTime > localTime) {
          await tabla.update(serverItem.id, {
            ...serverItem,
            lastModified: serverItem.updatedAt,
          });
          totalPulled++;
        }
      }

      if (lastModified) {
        await setLastSyncAt(lastModified);
      }
    } catch (error) {
      console.error(`Error pulling ${entidad}:`, error);
    }
  }

  return { count: totalPulled };
}

export async function syncSingleItem(item: SyncItem): Promise<boolean> {
  try {
    await marcarSincronizando(item.id);

    const endpoint = getApiEndpoint(item.entidad);
    const url =
      item.accion === "create" ? endpoint : `${endpoint}/${item.entidad_id}`;

    const method =
      item.accion === "delete"
        ? "DELETE"
        : item.accion === "create"
          ? "POST"
          : "PUT";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: method !== "DELETE" ? JSON.stringify(item.datos) : undefined,
    });

    if (response.status === 409) {
      const serverData = await response.json();
      await marcarConflicto(item.id, serverData.data);
      return false;
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    await marcarCompletado(item.id);
    return true;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error";
    await marcarError(item.id, errorMsg);
    return false;
  }
}
```

---

### Tarea 5: Crear Hook useSyncMutation (Túnel CRUD)

**Archivo**: `src/hooks/useSyncMutation.ts` (crear)

```typescript
"use client";

import { useCallback } from "react";
import { db } from "@/lib/db";
import { generateUUID, getCurrentTimestamp } from "@/lib/utils";
import { agregarACola, getTabla } from "@/lib/sync/queue";
import type { SyncEntidad, SyncAccion, UUID } from "@/types";

interface MutationResult<T> {
  data: T | null;
  error: string | null;
}

export function useSyncMutation<T extends { id: UUID }>(entidad: SyncEntidad) {
  const create = useCallback(
    async (
      data: Omit<T, "id" | "created_at" | "updated_at" | "lastModified">,
    ): Promise<MutationResult<T>> => {
      try {
        const id = generateUUID();
        const timestamp = getCurrentTimestamp();

        const newItem = {
          ...data,
          id,
          created_at: timestamp,
          updated_at: timestamp,
          lastModified: timestamp,
        } as T;

        const tabla = getTabla(entidad);
        if (!tabla) throw new Error(`Tabla ${entidad} no encontrada`);

        await tabla.add(newItem);

        await agregarACola(
          entidad,
          id,
          "create",
          newItem as Record<string, unknown>,
        );

        return { data: newItem, error: null };
      } catch (error) {
        return {
          data: null,
          error: error instanceof Error ? error.message : "Error al crear",
        };
      }
    },
    [entidad],
  );

  const update = useCallback(
    async (id: UUID, changes: Partial<T>): Promise<MutationResult<T>> => {
      try {
        const timestamp = getCurrentTimestamp();
        const tabla = getTabla(entidad);
        if (!tabla) throw new Error(`Tabla ${entidad} no encontrada`);

        const existing = await tabla.get(id);
        if (!existing) throw new Error("Item no encontrado");

        const updatedItem = {
          ...existing,
          ...changes,
          updated_at: timestamp,
          lastModified: timestamp,
        } as T;

        await tabla.update(id, {
          ...changes,
          updated_at: timestamp,
          lastModified: timestamp,
        });

        await agregarACola(
          entidad,
          id,
          "update",
          updatedItem as Record<string, unknown>,
        );

        return { data: updatedItem, error: null };
      } catch (error) {
        return {
          data: null,
          error: error instanceof Error ? error.message : "Error al actualizar",
        };
      }
    },
    [entidad],
  );

  const remove = useCallback(
    async (id: UUID): Promise<MutationResult<null>> => {
      try {
        const tabla = getTabla(entidad);
        if (!tabla) throw new Error(`Tabla ${entidad} no encontrada`);

        const existing = await tabla.get(id);
        if (!existing) throw new Error("Item no encontrado");

        await tabla.delete(id);

        await agregarACola(entidad, id, "delete", { id });

        return { data: null, error: null };
      } catch (error) {
        return {
          data: null,
          error: error instanceof Error ? error.message : "Error al eliminar",
        };
      }
    },
    [entidad],
  );

  return { create, update, remove };
}
```

---

### Tarea 6: Crear Hook useSync

**Archivo**: `src/hooks/useSync.ts` (crear)

```typescript
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { ejecutarSync } from "@/lib/sync/engine";
import {
  contarPendientes,
  obtenerConflictos,
  resolverConflicto,
} from "@/lib/sync/queue";
import type { SyncItem, UUID } from "@/types";

interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  conflicts: SyncItem[];
  lastSyncAt: Date | null;
  error: string | null;
}

export function useSync() {
  const [state, setState] = useState<SyncState>({
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    isSyncing: false,
    pendingCount: 0,
    conflicts: [],
    lastSyncAt: null,
    error: null,
  });

  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const updateCounts = useCallback(async () => {
    if (!isMountedRef.current) return;
    const [pendingCount, conflicts] = await Promise.all([
      contarPendientes(),
      obtenerConflictos(),
    ]);
    setState((prev) => ({ ...prev, pendingCount, conflicts }));
  }, []);

  const doSync = useCallback(async () => {
    if (!isMountedRef.current || state.isSyncing || !state.isOnline) return;

    setState((prev) => ({ ...prev, isSyncing: true, error: null }));

    try {
      const result = await ejecutarSync();

      if (isMountedRef.current) {
        setState((prev) => ({
          ...prev,
          isSyncing: false,
          lastSyncAt: new Date(),
        }));
        await updateCounts();
      }
    } catch (error) {
      if (isMountedRef.current) {
        setState((prev) => ({
          ...prev,
          isSyncing: false,
          error: error instanceof Error ? error.message : "Error de sync",
        }));
      }
    }
  }, [state.isSyncing, state.isOnline, updateCounts]);

  const resolveConflict = useCallback(
    async (id: UUID, decision: "local" | "servidor") => {
      await resolverConflicto(id, decision);
      await updateCounts();
      if (decision === "local") {
        doSync();
      }
    },
    [updateCounts, doSync],
  );

  useEffect(() => {
    isMountedRef.current = true;

    const handleOnline = () => {
      setState((prev) => ({ ...prev, isOnline: true }));
      doSync();
    };

    const handleOffline = () => {
      setState((prev) => ({ ...prev, isOnline: false }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    updateCounts();

    if (navigator.onLine) {
      doSync();
    }

    const interval = setInterval(() => {
      if (navigator.onLine) {
        doSync();
      }
      updateCounts();
    }, 30000);

    return () => {
      isMountedRef.current = false;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [doSync, updateCounts]);

  return {
    ...state,
    sync: doSync,
    resolveConflict,
    refreshCounts: updateCounts,
  };
}
```

---

### Tarea 7: Crear Hook useOnlineStatus

**Archivo**: `src/hooks/useOnlineStatus.ts` (crear)

```typescript
"use client";

import { useEffect, useState } from "react";

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
```

---

### Tarea 8: Crear Componentes de UI Sync

**Archivo**: `src/components/sync/SyncIndicator.tsx` (crear)

```typescript
'use client'

import { useSync } from '@/hooks/useSync'

export function SyncIndicator() {
  const { isOnline, isSyncing, pendingCount, conflicts } = useSync()

  if (!isOnline) {
    return (
      <div className="flex items-center gap-2 text-red-600 text-sm">
        <div className="w-2 h-2 rounded-full bg-red-500" />
        <span>Offline {pendingCount > 0 && `(${pendingCount})`}</span>
      </div>
    )
  }

  if (conflicts.length > 0) {
    return (
      <div className="flex items-center gap-2 text-orange-600 text-sm">
        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
        <span>{conflicts.length} conflicto(s)</span>
      </div>
    )
  }

  if (isSyncing) {
    return (
      <div className="flex items-center gap-2 text-blue-600 text-sm">
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        <span>Sincronizando...</span>
      </div>
    )
  }

  if (pendingCount > 0) {
    return (
      <div className="flex items-center gap-2 text-yellow-600 text-sm">
        <div className="w-2 h-2 rounded-full bg-yellow-500" />
        <span>{pendingCount} pendiente(s)</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-green-600 text-sm">
      <div className="w-2 h-2 rounded-full bg-green-500" />
      <span>Sincronizado</span>
    </div>
  )
}
```

**Archivo**: `src/components/sync/OfflineBanner.tsx` (crear)

```typescript
'use client'

import { useOnlineStatus } from '@/hooks/useOnlineStatus'

export function OfflineBanner() {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div className="bg-yellow-500 text-yellow-900 px-4 py-2 text-center text-sm font-medium">
      📴 Sin conexión — Los cambios se guardarán localmente y se sincronizarán al reconectar
    </div>
  )
}
```

**Archivo**: `src/components/sync/ConflictModal.tsx` (crear)

```typescript
'use client'

import type { SyncItem } from '@/types'

interface ConflictModalProps {
  conflicts: SyncItem[]
  onResolve: (id: string, decision: 'local' | 'servidor') => void
  onClose: () => void
}

export function ConflictModal({ conflicts, onResolve, onClose }: ConflictModalProps) {
  if (conflicts.length === 0) return null

  const current = conflicts[0]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-red-600">
            ⚠️ Conflicto de Sincronización ({conflicts.length})
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <p className="text-gray-600 mb-4">
          <strong>{current.entidad}</strong> fue modificado tanto localmente como en el servidor.
        </p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
            <h4 className="font-medium mb-2 text-blue-700">📱 Tu versión (local)</h4>
            <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-40">
              {JSON.stringify(current.datos, null, 2)}
            </pre>
          </div>

          <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
            <h4 className="font-medium mb-2 text-green-700">☁️ Versión servidor</h4>
            <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-40">
              {JSON.stringify(current.datos_servidor, null, 2)}
            </pre>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => onResolve(current.id, 'local')}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium"
          >
            Mantener mi versión
          </button>
          <button
            onClick={() => onResolve(current.id, 'servidor')}
            className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-medium"
          >
            Usar versión servidor
          </button>
        </div>
      </div>
    </div>
  )
}
```

**Archivo**: `src/components/sync/index.ts` (crear)

```typescript
export { SyncIndicator } from "./SyncIndicator";
export { OfflineBanner } from "./OfflineBanner";
export { ConflictModal } from "./ConflictModal";
```

---

### Tarea 9: Configurar PWA Manifest + next-pwa

**Archivo**: `public/manifest.json` (crear)

```json
{
  "name": "AgriPlan - Planificador Agrícola",
  "short_name": "AgriPlan",
  "description": "Sistema de planificación agrícola offline-first",
  "start_url": "/",
  "display": "standalone",
  "orientation": "any",
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
  "categories": ["productivity", "utilities"],
  "lang": "es"
}
```

**Archivo**: `next.config.ts` (modificar)

```typescript
import type { NextConfig } from "next";
import createPWA from "@ducanh2912/next-pwa";

const withPWA = createPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
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
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts",
          expiration: { maxEntries: 4, maxAgeSeconds: 365 * 24 * 60 * 60 },
        },
      },
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "images",
          expiration: { maxEntries: 64, maxAgeSeconds: 30 * 24 * 60 * 60 },
        },
      },
      {
        urlPattern: /\/_next\/static\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "next-static",
          expiration: { maxEntries: 64, maxAgeSeconds: 30 * 24 * 60 * 60 },
        },
      },
      {
        urlPattern: /^https?:\/\/.*\.(?:js|css)$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-resources",
          expiration: { maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 },
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {};

export default withPWA(nextConfig);
```

---

### Tarea 10: Integrar en Layout

**Archivo**: `src/app/layout.tsx` (modificar)

```typescript
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AgriPlan - Planificador Agrícola',
  description: 'Sistema de planificación agrícola offline-first para pequeños agricultores',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AgriPlan',
  },
}

export const viewport: Viewport = {
  themeColor: '#22c55e',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

**Archivo**: `src/app/page.tsx` (agregar imports y componentes)

Agregar al inicio:

```typescript
import { SyncIndicator, OfflineBanner, ConflictModal } from "@/components/sync";
import { useSync } from "@/hooks/useSync";
```

Agregar en el componente:

```typescript
const { conflicts, resolveConflict } = useSync();
```

Agregar en el JSX (después del header):

```typescript
<OfflineBanner />

{conflicts.length > 0 && (
  <ConflictModal
    conflicts={conflicts}
    onResolve={resolveConflict}
    onClose={() => {}}
  />
)}
```

Agregar SyncIndicator en el header junto a AlertasDropdown:

```typescript
<SyncIndicator />
```

---

## Criterios de Aceptación

### PWA

- [ ] App se puede instalar como PWA en móvil y desktop
- [ ] Manifest configura nombre, iconos, colores correctamente
- [ ] Service worker cachea assets (JS, CSS, images, fonts)
- [ ] App carga offline después de primera visita

### Sync Engine

- [ ] **Push**: Cambios locales se envían al server cuando online
- [ ] **Pull**: Cambios del server se descargan (delta sync con `since`)
- [ ] Retry exponencial funciona (1s → 5s → 30s → 2m → 5m)
- [ ] Max 5 intentos, luego marca como error permanente
- [ ] Cleanup automático de items > 7 días

### Túnel CRUD

- [ ] Todo create/update/delete pasa por useSyncMutation
- [ ] UI actualiza inmediatamente (optimistic)
- [ ] Cambios se agregan a sync_queue automáticamente
- [ ] No hay pérdida de datos al trabajar offline

### Conflictos

- [ ] Detecta conflicto cuando server.updatedAt > local.lastModified
- [ ] Modal muestra ambas versiones claramente
- [ ] Usuario puede elegir "local" o "servidor"
- [ ] Decisión se aplica correctamente

### UI

- [ ] SyncIndicator muestra estado correcto (online/offline/syncing/pending/conflict)
- [ ] OfflineBanner aparece cuando no hay conexión
- [ ] ConflictModal aparece cuando hay conflictos pendientes

---

## Tests Manuales

1. **Test Offline Create**:
   - Desconectar internet
   - Crear proyecto/terreno/zona
   - Verificar que se guarda en IndexedDB
   - Verificar que aparece en sync_queue
   - Reconectar internet
   - Verificar que se sincroniza

2. **Test Conflict**:
   - Crear item en dispositivo A
   - Sincronizar
   - Modificar en dispositivo B y sincronizar
   - Modificar mismo item en dispositivo A (offline)
   - Reconectar dispositivo A
   - Verificar modal de conflicto

3. **Test Retry**:
   - Simular error de servidor (500)
   - Verificar que reintenta con delays exponenciales
   - Verificar que se detiene después de 5 intentos

---

## Siguiente Fase

**FASE_11_AUTH** - Autenticación JWT básica
