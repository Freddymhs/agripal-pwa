# FASE 13: Supabase Backend — Schema + RLS + Sync Opt-In

**Status**: ✅ COMPLETADA — pipeline end-to-end verificado en browser real
**Prioridad**: 🔴 CRÍTICA
**Dependencias**: FASE_12 (`@supabase/supabase-js`, `@supabase/ssr` y clientes en `src/lib/supabase/`)
**Última revisión**: 2026-03-10

---

## Contexto

Con el auth real funcionando (FASE_12), esta fase conecta la app a PostgreSQL de Supabase.

**Filosofía clave**: privacidad primero. El sync es **opt-in** — el usuario puede activarlo
desde `/configuracion`. Si no lo activa, la app sigue funcionando 100% offline con IndexedDB
exactamente igual que hoy.

**Regla de sync**: Activar sync = subir todo lo local a la nube. Siempre. Local gana.

---

## Arquitectura

```
IndexedDB (siempre, offline-first)
     ↕ Dexie hooks (auto-enqueue)
 sync_queue (si sync activo)
     ↕
 sync engine (push + pull cada 30s)
     ↕
 SupabaseAdapter (serializa/deserializa JSONB)
     ↕
 Supabase PostgreSQL (RLS por usuario)
```

### Flujo de datos

1. **Cualquier escritura** a las 9 tablas → Dexie hook intercepta → encola en `sync_queue` (si sync habilitado)
2. **Push**: sync engine procesa cola → upsert/delete en Supabase
3. **Pull**: sync engine consulta Supabase → actualiza IndexedDB (solo si server es más reciente)
4. **suppressSyncEnqueue**: flag global que el engine activa durante push/pull/carga inicial para evitar loops

### Reglas de activación

| Acción            | Comportamiento                                                      |
| ----------------- | ------------------------------------------------------------------- |
| Activar sync      | Sube TODO lo local a la nube (upsert batch) + pull inmediato        |
| Desactivar sync   | Solo apaga el flag. Nube queda congelada.                           |
| Reactivar sync    | Mismo flujo que activar: sube todo local (sobreescribe nube) + pull |
| CRUD con sync ON  | Auto-enqueue via Dexie hooks → push periódico                       |
| CRUD con sync OFF | Solo local, hooks no encolan                                        |

---

## Qué sube a Supabase (datos del usuario)

| SyncEntidad        | Tabla Supabase      | Por qué sube                   |
| ------------------ | ------------------- | ------------------------------ |
| `proyecto`         | `proyectos`         | Contenedor raíz                |
| `terreno`          | `terrenos`          | Unidad de trabajo principal    |
| `zona`             | `zonas`             | Áreas del terreno              |
| `planta`           | `plantas`           | Plantas individuales           |
| `entrada_agua`     | `entradas_agua`     | Historial de agua              |
| `cosecha`          | `cosechas`          | Registro de cosechas           |
| `alerta`           | `alertas`           | Estado de alertas              |
| `catalogo_cultivo` | `catalogo_cultivos` | Personalizaciones por proyecto |
| `insumo_usuario`   | `insumos_usuario`   | Insumos del usuario            |

## Qué NO sube (datos estáticos de referencia)

Viven en `data/static/` y nunca cambian por usuario. No se sincronizan.

---

## Archivos Implementados

### Creados

| Archivo                                      | Función                                                 |
| -------------------------------------------- | ------------------------------------------------------- |
| `supabase/migrations/001_initial_schema.sql` | 9 tablas + RLS + triggers + índices                     |
| `src/lib/sync/supabase-adapter.ts`           | Implementa SyncAdapter (push/pull/isAvailable)          |
| `src/lib/sync/schema.ts`                     | Constantes compartidas: mapeos, serialización JSONB     |
| `src/lib/sync/db-hooks.ts`                   | Dexie hooks: auto-enqueue en todas las tablas           |
| `src/lib/sync/enqueue.ts`                    | Helper fire-and-forget con check de sync habilitado     |
| `src/lib/sync/initial-upload.ts`             | Carga batch al activar sync                             |
| `src/lib/dal/sync-meta.ts`                   | DAL para sync_meta (isSyncHabilitado/setSyncHabilitado) |
| `src/lib/dal/cosechas.ts`                    | DAL para cosechas (faltaba)                             |
| `src/app/(app)/configuracion/page.tsx`       | Toggle UI con confirmación + progreso                   |
| `src/app/(app)/configuracion/error.tsx`      | Error boundary                                          |
| `scripts/verify-sync.ts`                     | Script CLI para verificar datos en Supabase             |
| `docs/backlog/FASE_13_TEST_BROWSER.md`       | 8 flujos de test manuales                               |
| `docs/backlog/FASE_13_TEST_BACKEND.md`       | Comandos de verificación backend                        |

### Modificados

| Archivo                              | Cambio                                                |
| ------------------------------------ | ----------------------------------------------------- |
| `src/lib/db/index.ts`                | Registra Dexie hooks al inicializar                   |
| `src/lib/sync/engine.ts`             | suppressSyncEnqueue durante push/pull                 |
| `src/lib/sync/adapters/index.ts`     | Exporta SupabaseAdapter                               |
| `src/hooks/use-sync.ts`              | supabaseAdapter + check syncHabilitado                |
| `src/hooks/use-proyectos.ts`         | useAuthContext() en vez de "usuario-demo"             |
| `src/lib/constants/sync.ts`          | 9 entidades (agregó catalogo_cultivo, insumo_usuario) |
| `src/lib/constants/routes.ts`        | Ruta /configuracion                                   |
| `src/lib/sync/queue.ts`              | getTabla() con 9 entidades                            |
| `src/types/index.ts`                 | SyncEntidad con 9 entidades                           |
| `src/components/layout/page-nav.tsx` | Link a /configuracion en dropdown                     |
| `src/lib/dal/index.ts`               | Exporta cosechasDAL y syncMetaDAL                     |

### No modificados (intactos)

- Todos los DALs originales (proyectos, terrenos, zonas, plantas, agua, alertas, catalogo, insumos) — limpios, sin lógica de sync (Dexie hooks lo cubren)
- `src/lib/dal/transactions.ts` — cubierto automáticamente por Dexie hooks
- Todos los hooks de features existentes

---

## Schema PostgreSQL

9 tablas con estructura híbrida: columnas explícitas (FKs, identificadores) + `datos JSONB` (resto del modelo Dexie).

- RLS por usuario en todas las tablas (via `auth.uid()`)
- FK con `ON DELETE CASCADE` (cascade deletes manejados por PostgreSQL)
- Triggers `updated_at` automáticos
- Índices en FKs + `updated_at` para sync incremental

---

## Criterios de Aceptación

- [x] `pnpm type-check` sin errores
- [x] `pnpm lint` sin errores (solo warnings pre-existentes)
- [x] App funciona offline sin activar sync
- [x] Toggle OFF (default) → use-sync no procesa la cola
- [x] Toggle ON → datos suben a Supabase en batch
- [x] CRUD con sync activo → auto-enqueue via Dexie hooks
- [x] transactions.ts cubierto por hooks (cascade, batch, agua, alertas)
- [x] 9 entidades sincronizables (incluye catalogo_cultivo, insumo_usuario)
- [x] Pull trae datos de la nube sin sobreescribir cambios locales más recientes
- [x] RLS: usuario A no puede ver datos de usuario B
- [x] Migration aplicada en Supabase
- [x] isAvailable() usa session check (liviano)
- [ ] Remote deletes (pendiente FASE 13.5)

---

## Pendiente: FASE 13.5 — Remote Deletes

El pull actual no detecta eliminaciones remotas. Si se borra en dispositivo A, dispositivo B no lo sabe.

**Solución propuesta**: columna `deleted_at` (soft-delete) + migración SQL + lógica en pull para marcar/ocultar registros eliminados.

---

## Siguiente fase

**FASE_14** — Billing con MercadoPago (suscripciones 9,990 CLP/mes)
