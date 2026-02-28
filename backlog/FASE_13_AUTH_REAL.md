# FASE 13: Autenticación Real con Supabase Auth

**Status**: ⏳ PENDIENTE
**Prioridad**: 🔴 CRÍTICA
**Dependencias**: FASE_12
**Estimación**: 3-4 horas
**Última revisión**: 2026-03-01 (auditado + actualizado para Next.js 16 + @supabase/ssr)

## Estado Real del Código (auditado 2026-03-01)

| Aspecto                                      | Estado                                                               |
| -------------------------------------------- | -------------------------------------------------------------------- |
| `@supabase/ssr` instalado                    | ❌ NO                                                                |
| `src/lib/supabase/`                          | ❌ NO existe                                                         |
| `src/hooks/use-supabase-auth.ts`             | ❌ NO existe                                                         |
| `src/app/auth/callback/`                     | ❌ NO existe                                                         |
| `src/app/auth/login/page.tsx`                | ✅ Existe — usa auth mock, sin botón Google, sin password real       |
| `src/app/auth/registro/page.tsx`             | ✅ Existe — sin campo password real                                  |
| `src/components/providers/auth-provider.tsx` | ✅ Existe — wrappea `useAuth()` mock                                 |
| `src/hooks/use-auth.ts`                      | ✅ Existe — JWT mock, ignora password completamente                  |
| `src/proxy.ts`                               | ✅ Existe — guard correcto (Next.js 16), pero valida cookie JWT mock |
| `src/lib/auth/jwt.ts`                        | ✅ Existe — tokens triviales de falsificar                           |

**Resumen**: 0% implementado. El auth actual es un mock completo sin validación de contraseña. Esta fase reemplaza todo el sistema de auth.

### Pre-requisito: FASE_12 primero

`@supabase/ssr` y `src/lib/supabase/client.ts` se crean en FASE_12. Esta fase asume que ya existen.

---

---

## Objetivo

Reemplazar el sistema de autenticación JWT mock por autenticación real usando Supabase Auth,
manteniendo la arquitectura PWA offline-first con IndexedDB.

**Entregables:**

1. Login/Registro real con validación de contraseña (bcrypt vía Supabase)
2. OAuth con Google
3. Sesión persistente en cookies seguras (gestionada por Supabase)
4. Guard de rutas en `proxy.ts` validando sesión Supabase
5. Callback route para OAuth

---

## Decisiones Arquitectónicas

### ¿SSR, SSG, RSC o CSR?

**Respuesta: CSR para todo el flujo de auth. Solo Route Handler para el callback OAuth.**

Justificación:

- La app es **PWA offline-first**: los datos viven en IndexedDB del browser. Los Server Components no pueden acceder a IndexedDB.
- El `proxy.ts` (middleware Next.js 16) ya hace el guard en el edge — no necesitamos SSR para proteger rutas.
- Supabase tiene un cliente browser (`createBrowserClient`) perfecto para CSR.
- La única excepción es `/auth/callback`: recibe el `code` OAuth via redirect y debe canjearse por sesión. Eso requiere un Route Handler (`route.ts`).

### Librería correcta: `@supabase/ssr`

**NO usar `@supabase/auth-helpers-nextjs`** — está deprecada desde Supabase v2.

```
# CORRECTO
pnpm add @supabase/supabase-js @supabase/ssr

# INCORRECTO (deprecated)
pnpm add @supabase/auth-helpers-nextjs  ← NO
```

Los tres clientes que provee `@supabase/ssr`:

- `createBrowserClient(url, key)` → para hooks/componentes CSR
- `createServerClient(url, key, { cookies })` → para Route Handlers y Server Components
- El middleware usa `createServerClient` también, pasando `request/response cookies`

### Guard de rutas: `proxy.ts` (Next.js 16)

Next.js 16 usa `proxy.ts` (NO `middleware.ts` — ese nombre está deprecated).
La función se llama `proxy`, exportada como named export.

```typescript
// ✅ Next.js 16
export function proxy(request: NextRequest) { ... }
export const config = { matcher: ["/app/:path*"] };

// ❌ deprecated en Next.js 16
export default function middleware(request: NextRequest) { ... }
```

---

## Arquitectura del Flujo

```
┌─────────────────────────────────────────────────────┐
│                    USUARIO                          │
└──────────────────────┬──────────────────────────────┘
                       │
         ┌─────────────▼─────────────┐
         │   Landing /  (SSG)        │
         │   LandingAccessButton     │
         └─────────────┬─────────────┘
                       │ click "Entrar"
         ┌─────────────▼─────────────┐
         │   /auth/login  (CSR)      │
         │   Email + Password        │
         │   Botón "Google"          │
         └──────┬──────────┬─────────┘
                │          │ OAuth
                │          ▼
                │  supabase.auth.signInWithOAuth()
                │  → redirect Google → /auth/callback
                │
                ▼
         supabase.auth.signInWithPassword()
                │
                ▼
         ┌─────────────────────────────┐
         │   Supabase Auth API         │
         │   (valida bcrypt)           │
         └──────────────┬──────────────┘
                        │
                        ▼
         ┌─────────────────────────────┐
         │   Cookies: sb-access-token  │
         │            sb-refresh-token │
         │   (httpOnly, gestionadas    │
         │    por @supabase/ssr)        │
         └──────────────┬──────────────┘
                        │
                        ▼
         ┌─────────────────────────────┐
         │   proxy.ts (edge)           │
         │   createServerClient()      │
         │   supabase.auth.getUser()   │
         │   → si no hay sesión:       │
         │     redirect /auth/login    │
         └──────────────┬──────────────┘
                        │ sesión válida
                        ▼
         ┌─────────────────────────────┐
         │   /app/** (CSR)             │
         │   AuthProvider              │
         │   useSupabaseAuth()         │
         └─────────────────────────────┘
```

---

## Tareas

### Tarea 1: Instalar dependencia correcta

```bash
pnpm add @supabase/supabase-js @supabase/ssr
```

**NO instalar** `@supabase/auth-helpers-nextjs` (deprecated).
Si ya está instalado, removerlo: `pnpm remove @supabase/auth-helpers-nextjs`

---

### Tarea 2: Variables de entorno

**Archivo**: `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

Solo estas dos son necesarias para auth desde el browser.
`SUPABASE_SERVICE_ROLE_KEY` solo si se necesita acceso admin server-side (FASE_12).

---

### Tarea 3: Clientes Supabase

**Archivo**: `src/lib/supabase/client.ts` (browser / CSR)

```typescript
import { createBrowserClient } from "@supabase/ssr";

// Singleton para uso en hooks y componentes "use client"
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

// Instancia singleton reutilizable
export const supabase = createSupabaseBrowserClient();
```

**Archivo**: `src/lib/supabase/server.ts` (Route Handlers / proxy)

```typescript
import { createServerClient } from "@supabase/ssr";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

// Para Route Handlers: recibe cookieStore de `cookies()`
export function createSupabaseServerClient(
  cookieStore: ReadonlyRequestCookies,
) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    },
  );
}
```

**Archivo**: `src/lib/supabase/middleware.ts` (para uso en proxy.ts)

```typescript
import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";

// Para proxy.ts: recibe request y response para leer/escribir cookies
export function createSupabaseMiddlewareClient(
  request: NextRequest,
  response: NextResponse,
) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Escribir en request para que el middleware vea las cookies actualizadas
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          // Escribir en response para que el browser las reciba
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );
}
```

---

### Tarea 4: Actualizar `proxy.ts` (guard de rutas)

**Archivo**: `src/proxy.ts` (modificar)

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";
import { ROUTES } from "@/lib/constants/routes";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/app")) {
    const response = NextResponse.next({ request });
    const supabase = createSupabaseMiddlewareClient(request, response);

    // getUser() también refresca el access token si está por vencer
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const loginUrl = new URL(ROUTES.AUTH_LOGIN, request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Retornar response (contiene cookies refrescadas si hubo refresh)
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*"],
};
```

**Por qué `getUser()` y no `getSession()`:**

- `getSession()` lee la sesión de la cookie sin verificar con el servidor — puede ser stale.
- `getUser()` verifica con Supabase Auth API — es la forma segura para guards de rutas.

---

### Tarea 5: Hook `use-supabase-auth.ts`

**Archivo**: `src/hooks/use-supabase-auth.ts` (crear)

```typescript
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { usuariosDAL } from "@/lib/dal";
import { generateUUID, getCurrentTimestamp } from "@/lib/utils";
import { ROUTES } from "@/lib/constants/routes";
import type { User } from "@supabase/supabase-js";
import type { Usuario } from "@/types";

export interface UseSupabaseAuth {
  user: User | null;
  usuario: Usuario | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (
    email: string,
    password: string,
    nombre: string,
  ) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

// Sincroniza el usuario de Supabase Auth con el perfil local en IndexedDB
async function syncUsuarioLocal(user: User): Promise<Usuario> {
  const existing = await usuariosDAL.getById(user.id);
  if (existing) return existing;

  const nuevo: Usuario = {
    id: user.id,
    email: user.email!,
    nombre: user.user_metadata?.nombre ?? user.email!.split("@")[0],
    created_at: user.created_at,
    updated_at: getCurrentTimestamp(),
  };
  await usuariosDAL.add(nuevo);
  return nuevo;
}

export function useSupabaseAuth(): UseSupabaseAuth {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sesión inicial
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user);
      if (user) setUsuario(await syncUsuarioLocal(user));
      setLoading(false);
    });

    // Escuchar cambios de sesión (login, logout, refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        setUsuario(await syncUsuarioLocal(currentUser));
      } else {
        setUsuario(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { error: error.message };
    return {};
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, nombre: string) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nombre } },
      });
      if (error) return { error: error.message };
      return {};
    },
    [],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    router.push(ROUTES.AUTH_LOGIN);
  }, [router]);

  const signInWithGoogle = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }, []);

  return {
    user,
    usuario,
    loading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
  };
}
```

---

### Tarea 6: Actualizar `auth-provider.tsx`

**Archivo**: `src/components/providers/auth-provider.tsx` (modificar)

```typescript
"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useSupabaseAuth, type UseSupabaseAuth } from "@/hooks/use-supabase-auth";

const AuthContext = createContext<UseSupabaseAuth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useSupabaseAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): UseSupabaseAuth {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext debe usarse dentro de AuthProvider");
  }
  return context;
}
```

---

### Tarea 7: Actualizar páginas de auth

**Archivo**: `src/app/auth/login/page.tsx` (modificar)

Cambios mínimos respecto al actual:

- Agregar botón Google
- `login` → `signIn` (renombrar del hook)
- Agregar link a "¿Olvidaste tu contraseña?" (opcional en v1)

**Archivo**: `src/app/auth/registro/page.tsx` (modificar)

Agregar campo `password` y `confirmPassword` (actualmente no valida passwords).

---

### Tarea 8: Crear Route Handler para OAuth callback

**Archivo**: `src/app/auth/callback/route.ts` (crear)

```typescript
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ROUTES } from "@/lib/constants/routes";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? ROUTES.HOME;

  if (code) {
    const cookieStore = await cookies();
    const supabase = createSupabaseServerClient(cookieStore);
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Si algo falla, redirigir a login con error
  return NextResponse.redirect(
    `${origin}${ROUTES.AUTH_LOGIN}?error=oauth_callback`,
  );
}
```

---

### Tarea 9: Deprecar auth mock

**Archivo**: `src/lib/auth/jwt.ts` — marcar como deprecated:

```typescript
/**
 * @deprecated Reemplazado por Supabase Auth en FASE_13.
 * Ver: src/hooks/use-supabase-auth.ts
 * TODO FASE_14: Eliminar este archivo completamente.
 */
```

**Archivo**: `src/hooks/use-auth.ts` — marcar como deprecated:

```typescript
/**
 * @deprecated Reemplazado por useSupabaseAuth() en FASE_13.
 * Ver: src/hooks/use-supabase-auth.ts
 * TODO FASE_14: Eliminar este archivo completamente.
 */
```

No eliminar todavía — mantener hasta confirmar que el nuevo auth funciona en producción.

---

### Tarea 10: Configurar Google OAuth en Supabase Dashboard

1. Ir a **Authentication → Providers → Google**
2. Habilitar Google provider
3. Obtener credenciales en [Google Cloud Console](https://console.cloud.google.com):
   - Crear OAuth 2.0 Client ID
   - Authorized redirect URIs: `https://<project>.supabase.co/auth/v1/callback`
4. Pegar `Client ID` y `Client Secret` en Supabase Dashboard
5. En **Authentication → URL Configuration**:
   - Site URL: `https://tudominio.com`
   - Redirect URLs (añadir):
     ```
     http://localhost:3000/auth/callback
     https://tudominio.com/auth/callback
     ```

---

## Resumen de archivos a tocar

| Archivo                                      | Acción                                              |
| -------------------------------------------- | --------------------------------------------------- |
| `src/proxy.ts`                               | Modificar guard para usar `supabase.auth.getUser()` |
| `src/lib/supabase/client.ts`                 | Crear (browser client)                              |
| `src/lib/supabase/server.ts`                 | Crear (Route Handler client)                        |
| `src/lib/supabase/middleware.ts`             | Crear (proxy client)                                |
| `src/hooks/use-supabase-auth.ts`             | Crear                                               |
| `src/components/providers/auth-provider.tsx` | Modificar                                           |
| `src/app/auth/login/page.tsx`                | Modificar (botón Google + renombrar signIn)         |
| `src/app/auth/registro/page.tsx`             | Modificar (agregar password)                        |
| `src/app/auth/callback/route.ts`             | Crear (OAuth callback)                              |
| `src/lib/auth/jwt.ts`                        | Marcar @deprecated                                  |
| `src/hooks/use-auth.ts`                      | Marcar @deprecated                                  |

---

## Criterios de Aceptación

### Funcional

- [ ] Login email/password valida contraseñas reales (bcrypt vía Supabase)
- [ ] Registro crea usuario en Supabase Auth + IndexedDB local
- [ ] OAuth Google completa el flujo y crea sesión
- [ ] Sesión persiste al recargar (cookies httpOnly)
- [ ] Logout limpia sesión en Supabase y redirige
- [ ] Access token se refresca automáticamente

### Guard de rutas

- [ ] `/app/**` sin sesión → redirect `/auth/login?redirect=/app/...`
- [ ] `/app/**` con sesión válida → acceso permitido
- [ ] Token expirado → proxy refresca y continúa (o redirect si falla)

### Offline / PWA

- [ ] La app sigue funcionando offline después de autenticarse
- [ ] IndexedDB no se rompe con el nuevo sistema de auth
- [ ] `useAuthContext()` sigue siendo compatible en toda la app

---

## Tests manuales

1. **Registro email:** Crear cuenta → verificar en Supabase Dashboard → recargar → sigue autenticado
2. **Login email:** Login correcto → accede a `/app`. Login incorrecto → mensaje de error
3. **Google OAuth:** Click "Google" → consent screen → callback → autenticado en `/app`
4. **Guard:** Ir a `/app` sin login → redirect a `/auth/login` con `redirect` en query param
5. **Persistencia:** Login → cerrar tab → abrir → sigue autenticado
6. **Offline:** Autenticarse → desconectar red → navegar dentro de `/app` → funciona

---

## Notas de implementación

- `getUser()` en el proxy hace una llamada a Supabase API en cada request a `/app/**`. Si hay preocupación de latencia, considerar `getSession()` para rutas menos críticas (aceptando el riesgo de sesión stale).
- El `onAuthStateChange` en el hook maneja automáticamente el refresh de tokens — no hay que implementarlo manualmente.
- `signUp` en Supabase por defecto envía email de confirmación. En desarrollo, deshabilitar esto en **Authentication → Settings → Email confirmations**.
- Los errores de Supabase Auth están en inglés. Mapearlos a español en el hook si se quiere UX consistente.
