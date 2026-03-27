# FASE 25: QA Fixes — Gantt, Auth PKCE, Economía UX (2026-03-27)

**Status**: ✅ COMPLETADA
**Prioridad**: 🔴 CRÍTICA (bloqueos de usuario)
**Dependencias**: FASE_18B (Gantt), FASE_12 (Auth Supabase)
**Fecha completada**: 2026-03-27

---

## Contexto

Auditoría QA sobre 4 bugs críticos identificados en sesión de uso real.
Todos resueltos en un solo ciclo de fixes + commit verificado con lint y type-check.

---

## FIX-01: Gantt — "Error al crear tarea" (tabla inexistente)

**Severidad**: CRÍTICA — bloqueaba completamente la funcionalidad de tareas manuales
**Causa raíz**: La tabla `tareas_gantt` no existía en Supabase. El hook `use-tareas-gantt.ts` y el DAL
`tareas-gantt.ts` estaban correctamente implementados, pero faltaba la migración SQL.

**Fix aplicado**:

```
supabase/migrations/20260327000000_create_tareas_gantt.sql
```

Crea tabla con FKs a `auth.users`, `proyectos`, `terrenos`. Cuatro políticas RLS
owner-only (SELECT, INSERT, UPDATE, DELETE). Índices en `terreno_id`, `proyecto_id`,
`usuario_id`, y `(fecha_inicio, fecha_fin)`.

---

## FIX-02: Gantt — ESLint `react-hooks/set-state-in-effect` en modal

**Severidad**: ALTA — bloqueaba build/CI
**Causa raíz**: `gantt-tarea-modal.tsx` usaba `useEffect` con múltiples `setState` calls
(violación del patrón del proyecto según CLAUDE.md: "Prohibido `setState` dentro de `useEffect`").

**Fix aplicado**: Reemplazado `useEffect` por patrón "adjusting state during render":

```tsx
// Antes (❌):
useEffect(() => {
  if (open) { setTitulo(tarea?.titulo ?? ""); ... }
}, [open, tarea]);

// Después (✅):
const [prevOpen, setPrevOpen] = useState(open);
const [prevTareaId, setPrevTareaId] = useState(tarea?.id);

if (open !== prevOpen || tarea?.id !== prevTareaId) {
  setPrevOpen(open); setPrevTareaId(tarea?.id);
  if (open) { setTitulo(tarea?.titulo ?? ""); ... }
}
```

**Archivo**: `src/components/calendario/gantt-tarea-modal.tsx`

---

## FIX-03: Auth — Flujo PKCE de recuperación de contraseña

**Severidad**: ALTA — usuarios no podían resetear contraseña
**Causa raíz**: Supabase usa PKCE (Proof Key for Code Exchange) para email links.
El link de reset enviado por Supabase lleva un `?code=` que debe intercambiarse
server-side por una sesión. Sin el Route Handler, el código llegaba al cliente sin
procesarse y la sesión no se establecía.

**Fix aplicado**: Dos archivos nuevos:

### `src/app/(auth)/auth/callback/route.ts`

Route Handler server-side que recibe `?code=`, llama a
`supabase.auth.exchangeCodeForSession(code)` y redirige a `/auth/nueva-password`.

```
GET /auth/callback?code=XXX
  → exchangeCodeForSession(code)
  → redirect /auth/nueva-password
```

### `src/hooks/use-password-recovery.ts`

Hook cliente que maneja dos flujos:

1. **Redirigido desde callback** (sin `?code=` en URL): llama `getSession()` → sesión
   ya está en cookie.
2. **Link directo** (con `?code=`): llama `exchangeCodeForSession()` client-side como
   fallback.
3. Escucha `onAuthStateChange` para evento `PASSWORD_RECOVERY`.

### `src/lib/dal/auth.ts`

Centraliza todas las llamadas a `supabase.auth.*`. `use-supabase-auth.ts` migrado
a usar `authDAL.*` en vez de `supabase.auth.*` directo.

**Archivos modificados**:

- `src/lib/constants/routes.ts` → agrega `AUTH_CALLBACK: "/auth/callback"`
- `src/hooks/use-supabase-auth.ts` → migrado a `authDAL`
- `src/app/(auth)/auth/recuperar/page.tsx` → URL de redirect apunta a `/auth/callback`
- `src/app/(auth)/auth/nueva-password/page.tsx` → usa `use-password-recovery`

---

## FIX-04: Economía — Scroll horizontal + highlight + label

**Severidad**: MEDIA — tabla se cortaba en pantallas < 768px, highlight confuso

### 4A. Overflow horizontal

**Causa**: tabla con columnas fijas sin contenedor scrollable.
**Fix**: `<div className="overflow-x-auto relative w-full">` + `<table className="w-full text-sm min-w-max">`.

### 4B. Highlight de simulación activa

**Causa**: no había feedback visual cuando el usuario cambiaba precio agua/venta.
**Fix**: `isActiveScenario` derivado de `idSimulacionActiva` y precio simulado por cultivo.
Fila activa recibe: `bg-blue-50/60`, `border-l-4 border-blue-500`, badge "Activo".

### 4C. Label "Agua (año 1)" → "Agua/año"

**Causa**: la inversión mostraba `totalCostoAgua` (costo adulto año 5, ~$32.6M) etiquetado
como "Agua (año 1)" — valor y label no coincidían.
**Fix**: etiqueta cambiada a "Agua/año" para reflejar que es el costo anual real del agua.

**Archivo**: `src/app/(app)/economia/page.tsx`

---

## Verificación Final

```
pnpm lint       → 0 errores (was 3 errors before FIX-02)
pnpm type-check → 0 errores
pnpm test       → 412 tests passing
```

Commits: `e3de38a` (refactor rutas) + fixes adicionales en sesión 2026-03-27.
