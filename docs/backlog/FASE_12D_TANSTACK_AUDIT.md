# FASE 12D — Auditoría TanStack Query: Estado Actual y Decisión de Arquitectura

## Contexto

Auditoría realizada para entender el rol real de `@tanstack/react-query` en el proyecto y evaluar si su uso es justificado dado el modelo offline-first con Dexie.js.

---

## Hallazgos

### Cobertura real

- **Total archivos del proyecto:** 267 (`.ts` + `.tsx`)
- **Archivos que usan `@tanstack/react-query`:** 5 (1.8%)

| Archivo                                       | Rol                                   |
| --------------------------------------------- | ------------------------------------- |
| `src/lib/react-query.ts`                      | QueryClient singleton (config global) |
| `src/components/providers/query-provider.tsx` | QueryClientProvider + DevTools        |
| `src/hooks/use-terrenos.ts`                   | CRUD terrenos                         |
| `src/hooks/use-proyectos.ts`                  | CRUD proyectos                        |
| `src/hooks/use-catalogo.ts`                   | CRUD catálogo de cultivos             |

### Configuración global

```typescript
// src/lib/react-query.ts
staleTime: 5 minutos
gcTime: 10 minutos
retry: 1
refetchOnWindowFocus: false  // correcto para PWA offline
```

- ReactQueryDevtools: carga condicional (`dev` only), lazy via `next/dynamic`, SSR deshabilitado. ✅
- Query keys centralizadas en `src/lib/constants/query-keys.ts`. ✅

### Patrón en los 3 hooks con TanStack

Los hooks `useCatalogo`, `useProyectos` y `useTerrenos` siguen el mismo patrón:

```typescript
// 1 useQuery para lectura
useQuery({ queryKey: QUERY_KEYS.entidad(id), queryFn: DAL.get(), enabled: !!id })

// N useMutation para escritura
useMutation({ mutationFn: DAL.write(), onSuccess: () => invalidateQueries(...) })
```

Todas las mutaciones invalidan su query correspondiente en `onSuccess`. ✅

### Inconsistencia: 15 hooks sin TanStack

Los hooks `useAgua`, `usePlantas`, `useZonas`, `useEstanques`, `useActualizarEtapas`, etc. hacen operaciones CRUD equivalentes pero con un patrón completamente diferente:

- `useState` + `useEffect` para carga inicial
- DAL directo en callbacks
- `onRefetch` prop del componente padre para refrescar datos
- Helper `ejecutarMutacion()` en `src/lib/helpers/dal-mutation.ts` para try/catch + refetch

**El proyecto tiene dos patrones paralelos para el mismo tipo de operación.**

### Dexie useLiveQuery

**Uso: cero.** Dexie expone `useLiveQuery` (de `dexie-react-hooks`) que es reactivo por naturaleza — se actualiza automáticamente cuando cambia la DB, sin invalidación manual. El proyecto no lo usa en ningún lugar.

---

## Por qué se introdujo TanStack (sin solicitud explícita)

### Origen identificado

Commit `4c47f4e` — **12 febrero 2026** — mensaje: `review:nextjs-architecture`

Este commit fue generado por el skill `review:nextjs-architecture`, un agente de arquitectura que revisó el proyecto de forma autónoma y aplicó cambios considerados "mejores prácticas" de Next.js. En ese commit se introdujeron simultáneamente:

- `package.json` → 2 nuevas dependencias (`@tanstack/react-query`, `@tanstack/react-query-devtools`)
- `src/lib/react-query.ts` → creado desde cero
- `src/components/providers/query-provider.tsx` → creado desde cero
- `src/app/layout.tsx` → envuelto en `QueryProvider`
- `src/hooks/use-catalogo.ts`, `use-proyectos.ts`, `use-terrenos.ts` → refactorizados para usar TanStack

**No fue una decisión del usuario. Fue una decisión unilateral del agente de arquitectura.**

### Por qué el agente lo introdujo

El agente identificó un problema real: los 3 hooks leían datos de Dexie en `useEffect` sin caché. Cada vez que un componente montaba o el contexto se re-renderizaba, se relanzaba la query a IndexedDB. Con TanStack resolvió:

1. **Caché entre renders** — si `useTerrenos` se llama en dos componentes distintos, solo hace una query a Dexie por período de `staleTime`
2. **Deduplicación de requests** — múltiples llamadas simultáneas al mismo queryKey se colapsan en una sola
3. **Estados loading/error automáticos** — sin necesidad de `useState` extra para cada estado
4. **Invalidación controlada** — tras un `useMutation`, sabe exactamente qué datos refrescar sin recargar todo

### ¿Resuelve un problema real?

**Sí, pero parcialmente.** El problema que resuelve (re-renders y re-fetches innecesarios) es legítimo para las entidades de "alto nivel" (proyectos, terrenos, catálogo) que se leen frecuentemente y cambian poco.

**Pero no lo aplicó consistentemente.** Los hooks de entidades "operacionales" (plantas, zonas, agua) — que cambian constantemente — quedaron fuera del refactor, creando la inconsistencia actual.

### Conclusión

TanStack entró como **optimización de performance no solicitada**, aplicada solo a la mitad del problema. El resultado es arquitectura mixta: útil en los 3 hooks donde está, pero generando confusión al coexistir con el patrón `useState + onRefetch` del resto.

---

## ¿Es posible quitarlo?

**Sí, es perfectamente posible.** Los 3 hooks afectados son autocontenidos y sus consumidores (`project-context.tsx`, `terrenos/page.tsx`, `catalogo/page.tsx`) usan la API expuesta por los hooks, no TanStack directamente.

### Esfuerzo estimado de remoción

| Tarea                                                  | Complejidad |
| ------------------------------------------------------ | ----------- |
| Reescribir `use-proyectos.ts` sin TanStack             | Baja        |
| Reescribir `use-terrenos.ts` sin TanStack              | Baja        |
| Reescribir `use-catalogo.ts` sin TanStack              | Baja        |
| Eliminar `src/lib/react-query.ts`                      | Trivial     |
| Eliminar `src/components/providers/query-provider.tsx` | Trivial     |
| Ajustar `src/app/layout.tsx`                           | Trivial     |
| Remover dependencias del `package.json`                | Trivial     |

El API pública de los hooks (`terrenos`, `crearTerreno`, `eliminarTerreno`, etc.) **no cambiaría** — los consumidores no necesitarían modificarse.

La alternativa más natural para este proyecto sería `useLiveQuery` de Dexie (ya incluido como dependencia transitiva), que es reactivo por diseño y no requiere invalidación manual.

---

## Opciones de arquitectura

### Opción A — Unificar hacia TanStack Query

Migrar `usePlantas`, `useZonas`, `useAgua`, etc. al mismo patrón de `useQuery + useMutation`.

**Pros:**

- Un solo patrón en todo el proyecto
- Caché global + invalidación consistente
- Elimina el patrón `onRefetch` callback (frágil)

**Contras:**

- Requiere agregar query keys para plantas, zonas, agua, etc.
- Mayor acoplamiento a TanStack
- Las entidades como plantas/zonas cambian con mucha frecuencia (mapa interactivo), el caché puede ser contraproducente

### Opción B — Quitar TanStack Query

Reemplazar los 3 hooks con `useState + useEffect` directo, o migrar a `useLiveQuery` de Dexie.

**Pros:**

- Una dependencia menos
- `useLiveQuery` es más natural para offline-first (reactivo automático)
- Consistencia con el patrón ya usado en 15 hooks

**Contras:**

- Requiere reescribir 3 hooks + ajustar `project-context.tsx` y páginas consumidoras
- Se pierde el caché cross-component que TanStack provee

### Opción C — Dejar como está

No cambiar nada. La inconsistencia existe pero el proyecto funciona.

**Pros:** Cero esfuerzo.

**Contras:** Deuda técnica acumulada. Onboarding más confuso para nuevos devs.

---

## Contexto futuro: integración con Supabase

Cuando se integre Supabase como backend (FASE 13), la arquitectura cambia fundamentalmente y TanStack Query **sí tendrá sentido real**:

| Escenario actual (offline-first)       | Escenario futuro (Supabase + SSR)                |
| -------------------------------------- | ------------------------------------------------ |
| Datos viven en Dexie (IndexedDB local) | Datos viven en Supabase (PostgreSQL remoto)      |
| `useEffect + DAL` es válido            | `useEffect` para fetching es anti-patrón         |
| RSC/ISR no aplica (PWA pura)           | RSC + ISR para páginas con datos iniciales       |
| TanStack: optimización opcional        | TanStack: necesario para hidratación client-side |
| Dexie: fuente de verdad                | Dexie: caché offline + sync queue                |

### Patrón objetivo (post-Supabase)

```
RSC (page.tsx) → fetch desde Supabase → pasa initialData a Client Component
Client Component → useQuery({ initialData }) → TanStack hidrata sin waterfall
Mutación → useMutation → invalida query → Supabase actualizado
Background → Dexie como caché offline cuando no hay conexión
```

En ese modelo, TanStack + RSC + `initialData` es exactamente el patrón que recomienda el skill `review:nextjs-architecture`. **La implementación actual es prematura pero apunta en la dirección correcta.**

### Recomendación actualizada

Con el modelo de negocio confirmado (**offline-first por defecto, Supabase opcional**), TanStack no aporta valor hoy. Cuando llegue FASE 13, se evaluará si reintroducirlo con RSC + `initialData` tiene sentido, pero no se asume de antemano.

---

## ✅ Decisión tomada: Quitar TanStack (Opción B)

**Motivo:** App offline-first con Dexie como fuente de verdad. TanStack fue introducido por un agente sin solicitud explícita, no forma parte del stack conocido del desarrollador, y `useLiveQuery` de Dexie es más natural para este modelo.

**Nota:** `useLiveQuery` ya está disponible — viene incluido en `dexie` v4 que ya está instalado. Sin dependencia nueva.

---

## Plan de migración

### Paso 1 — Migrar `use-proyectos.ts`

- Reemplazar `useQuery` por `useLiveQuery(() => proyectosDAL.getByUsuarioId(USUARIO_ID))`
- Eliminar `useMutation` + `invalidateQueries` → las mutaciones escriben en Dexie directo, `useLiveQuery` re-renderiza solo
- Eliminar `useQueryClient`

### Paso 2 — Migrar `use-terrenos.ts`

- Reemplazar `useQuery` por `useLiveQuery(() => terrenosDAL.getByProyectoId(proyectoId), [proyectoId])`
- Mismo patrón: mutaciones escriben en Dexie, UI reacciona sola
- Eliminar `useQueryClient` + `invalidateQueries`

### Paso 3 — Migrar `use-catalogo.ts`

- Reemplazar `useQuery` por `useLiveQuery(() => catalogoDAL.getByProyectoId(proyectoId), [proyectoId])`
- Mismo patrón

### Paso 4 — Limpiar infraestructura TanStack

- Eliminar `src/lib/react-query.ts`
- Eliminar `src/components/providers/query-provider.tsx`
- Eliminar `QueryProvider` de `src/app/layout.tsx`
- Eliminar `src/lib/constants/query-keys.ts`
- Desinstalar `@tanstack/react-query` y `@tanstack/react-query-devtools` del `package.json`

### Paso 5 — Verificar consumidores

- `src/contexts/project-context.tsx` — ajustar si cambió la API de los hooks
- `src/app/terrenos/page.tsx` — verificar que sigue funcionando
- `src/app/catalogo/page.tsx` — verificar que sigue funcionando

### Resultado final

- 2 dependencias menos
- Patrón unificado en los 18 hooks
- Cero invalidación manual — Dexie reactivo por diseño
- Stack 100% conocido por el desarrollador

---

## Archivos clave

- `src/lib/react-query.ts` — config QueryClient
- `src/components/providers/query-provider.tsx` — provider global
- `src/hooks/use-catalogo.ts` — hook con TanStack
- `src/hooks/use-proyectos.ts` — hook con TanStack
- `src/hooks/use-terrenos.ts` — hook con TanStack
- `src/lib/constants/query-keys.ts` — query keys centralizadas
- `src/lib/helpers/dal-mutation.ts` — helper para hooks sin TanStack
- `src/contexts/project-context.tsx` — consume los 3 hooks TanStack
