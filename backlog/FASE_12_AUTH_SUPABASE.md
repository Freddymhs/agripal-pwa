# FASE 12: Autenticación Real con Supabase Auth

**Status**: ✅ COMPLETADA
**Prioridad**: 🔴 CRÍTICA
**Dependencias**: FASE_11 (auth mock existente)
**Última revisión**: 2026-03-01

---

## Decisión: solo email + password

Google OAuth fue descartado — agrega complejidad (Google Cloud Console, redirect URIs)
sin valor inmediato. El flujo email/password + reset por correo cubre todas las necesidades.

---

## Decisión arquitectónica: `getSession()` en el middleware, NO `getUser()`

|                  | `getSession()`                  | `getUser()`                         |
| ---------------- | ------------------------------- | ----------------------------------- |
| Fuente           | Cookies locales del dispositivo | Supabase Auth API (requiere red)    |
| Funciona offline | ✅ Sí                           | ❌ No — manda al login sin conexión |

El usuario se loguea una vez (requiere red). Las cookies quedan en el dispositivo.
Sin red, `getSession()` las lee localmente. `onAuthStateChange` refresca el token
en background cuando hay red. Token stale máx 1h — aceptable porque los datos están
en IndexedDB, no en una API remota.

---

## Archivos implementados

| Archivo                                            | Acción                                          |
| -------------------------------------------------- | ----------------------------------------------- |
| `src/lib/supabase/client.ts`                       | ✅ Creado — `createBrowserClient`               |
| `src/lib/supabase/middleware.ts`                   | ✅ Creado — `createSupabaseMiddlewareClient`    |
| `src/lib/supabase/index.ts`                        | ✅ Creado — barrel export                       |
| `src/middleware.ts`                                | ✅ Creado — guard global con `getSession()`     |
| `src/hooks/use-supabase-auth.ts`                   | ✅ Creado — signIn, signUp, signOut             |
| `src/components/providers/auth-provider.tsx`       | ✅ Modificado — usa nuevo hook                  |
| `src/app/auth/login/page.tsx`                      | ✅ Modificado — password real                   |
| `src/app/auth/registro/page.tsx`                   | ✅ Modificado — password + confirmPassword      |
| `src/app/auth/recuperar/page.tsx`                  | ✅ Creado — reset password por email            |
| `src/app/auth/nueva-password/page.tsx`             | ✅ Creado — setear nueva contraseña             |
| `src/app/auth/recuperar/error.tsx`                 | ✅ Creado — error boundary                      |
| `src/app/auth/nueva-password/error.tsx`            | ✅ Creado — error boundary                      |
| `src/components/landing/landing-access-button.tsx` | ✅ Modificado — usa Supabase session            |
| `src/lib/constants/routes.ts`                      | ✅ Agregado AUTH_RECUPERAR, AUTH_NUEVA_PASSWORD |
| `src/hooks/use-auth.ts`                            | 🗑️ Eliminado — era JWT mock                     |
| `src/lib/auth/jwt.ts`                              | 🗑️ Eliminado — era JWT mock                     |
| `src/lib/auth/` (carpeta)                          | 🗑️ Eliminada — quedó vacía                      |

---

## Flujo de recuperación de contraseña

```
/auth/login → "¿Olvidaste tu contraseña?" → /auth/recuperar
  → supabase.auth.resetPasswordForEmail() → email con magic link
  → usuario clickea link → /auth/nueva-password
  → supabase.auth.updateUser({ password }) → redirect a /auth/login
```

Rutas `/auth/recuperar` y `/auth/nueva-password` registradas como públicas en `src/middleware.ts`.

---

## Variables de entorno requeridas

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

`SUPABASE_SERVICE_ROLE_KEY` se agrega en FASE_14 (billing webhooks).

---

## Criterios de Aceptación

- [x] `pnpm add @supabase/supabase-js @supabase/ssr` ejecutado sin errores
- [x] `.env.local` con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [x] Login email/password valida contraseñas reales
- [x] Registro crea usuario en Supabase Auth + perfil en IndexedDB
- [x] Sesión persiste al cerrar y reabrir el browser
- [x] Sin conexión: navegar `/app/**` funciona con sesión previa
- [x] Sin conexión: ir a `/app` sin sesión → redirect a `/auth/login`
- [x] Logout limpia sesión, redirect a login
- [x] Reset password: llega email con link → nueva contraseña → login
- [x] `pnpm type-check` sin errores · `pnpm lint` 0 errores

---

## Siguiente fase

**FASE_13** — Supabase Backend: schema PostgreSQL, RLS, SupabaseAdapter, sync real
