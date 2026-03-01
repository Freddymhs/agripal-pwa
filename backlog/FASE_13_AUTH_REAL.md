# FASE 13: Autenticación Real con Supabase Auth

**Status**: ⏳ PENDIENTE
**Prioridad**: 🔴 CRÍTICA
**Dependencias**: FASE_12 (clientes Supabase instalados)
**Estimación**: 3-4 horas
**Última revisión**: 2026-03-01

---

## Estado Real del Código (auditado 2026-03-01)

| Aspecto                                      | Estado                                                   |
| -------------------------------------------- | -------------------------------------------------------- |
| `@supabase/ssr` instalado                    | ❌ NO (se instala en FASE_12)                            |
| `src/lib/supabase/client.ts`                 | ❌ NO (se crea en FASE_12)                               |
| `src/hooks/use-supabase-auth.ts`             | ❌ NO existe                                             |
| `src/app/auth/callback/`                     | ❌ NO existe                                             |
| `src/app/auth/login/page.tsx`                | ✅ Existe — auth mock, sin Google, sin password real     |
| `src/app/auth/registro/page.tsx`             | ✅ Existe — sin campo password                           |
| `src/components/providers/auth-provider.tsx` | ✅ Existe — wrappea `useAuth()` mock                     |
| `src/hooks/use-auth.ts`                      | ✅ Existe — JWT mock, ignora password                    |
| `src/proxy.ts`                               | ✅ Existe — guard correcto (Next.js 16), valida JWT mock |
| `src/lib/auth/jwt.ts`                        | ✅ Existe — tokens triviales de falsificar               |

---

## Objetivo

Reemplazar el auth mock por Supabase Auth real. El usuario se loguea una vez (necesita red) y puede usar la app indefinidamente sin conexión hasta que se desloguee explícitamente.

**Entregables:**

1. Login/Registro con email + password real (bcrypt vía Supabase)
2. OAuth con Google
3. Sesión persistente en cookies del browser (funciona offline)
4. Guard de rutas en `proxy.ts` actualizado (offline-safe)
5. Route Handler `/auth/callback` para OAuth

---

## Decisión arquitectónica: `getSession()` en el guard, NO `getUser()`

El `proxy.ts` debe usar `getSession()`, no `getUser()`:

|                  | `getSession()`                  | `getUser()`                         |
| ---------------- | ------------------------------- | ----------------------------------- |
| Fuente           | Cookies locales del dispositivo | Supabase Auth API (requiere red)    |
| Funciona offline | ✅ Sí                           | ❌ No — manda al login sin conexión |
| Riesgo           | Token stale hasta 1h máx        | Ninguno                             |

El usuario se loguea, las cookies quedan en el dispositivo. Sin red, `getSession()` las lee localmente y permite acceso. Cuando hay red, `onAuthStateChange` refresca el token en background automáticamente. El token stale de máx 1h es aceptable porque no hay API remota que proteger en el guard — los datos están en IndexedDB.

---

## Tarea 1: Actualizar `proxy.ts`

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

    // getSession() lee cookies locales — funciona offline
    // NO usar getUser(): requiere red → rompe offline-first
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      const loginUrl = new URL(ROUTES.AUTH_LOGIN, request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*"],
};
```

---

## Tarea 2: Hook `use-supabase-auth.ts`

**Archivo**: `src/hooks/use-supabase-auth.ts` (crear)

```typescript
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { usuariosDAL } from "@/lib/dal";
import { getCurrentTimestamp } from "@/lib/utils";
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

// Crea o devuelve el perfil local del usuario en IndexedDB
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
    // Carga sesión inicial desde cookies locales (funciona offline)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) setUsuario(await syncUsuarioLocal(currentUser));
      setLoading(false);
    });

    // Escucha cambios: login, logout, refresh de token
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
      options: { redirectTo: `${window.location.origin}/auth/callback` },
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

## Tarea 3: Actualizar `auth-provider.tsx`

**Archivo**: `src/components/providers/auth-provider.tsx` (modificar)

```typescript
"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useSupabaseAuth, type UseSupabaseAuth } from "@/hooks/use-supabase-auth";

const AuthContext = createContext<UseSupabaseAuth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useSupabaseAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): UseSupabaseAuth {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuthContext debe usarse dentro de AuthProvider");
  return context;
}
```

---

## Tarea 4: Actualizar páginas de auth

**`src/app/auth/login/page.tsx`** — cambios:

- `login` → `signIn` (del nuevo hook)
- Agregar botón Google
- Agregar campo password con `autoComplete="current-password"`

**`src/app/auth/registro/page.tsx`** — cambios:

- Agregar campo `password` + `confirmPassword`
- `registrar` → `signUp` (del nuevo hook)
- Validar `password.length >= 6` antes de enviar

---

## Tarea 5: Route Handler para OAuth callback

**Archivo**: `src/app/auth/callback/route.ts` (crear)

```typescript
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { ROUTES } from "@/lib/constants/routes";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? ROUTES.HOME;

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (list) =>
            list.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            ),
        },
      },
    );
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(
    `${origin}${ROUTES.AUTH_LOGIN}?error=oauth_callback`,
  );
}
```

---

## Tarea 6: Actualizar `LandingAccessButton`

Al migrar a Supabase, `hasAuthToken()` busca la cookie JWT mock. Debe pasar a leer la sesión de Supabase.

**Archivo**: `src/components/landing/landing-access-button.tsx` (modificar)

```typescript
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { ROUTES } from "@/lib/constants/routes";

export function LandingAccessButton() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session);
    });
  }, []);

  const handlePrimary = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    router.push(session ? ROUTES.HOME : ROUTES.AUTH_LOGIN);
  }, [router]);

  return (
    <div className="mt-8 flex flex-col gap-2">
      <button
        onClick={handlePrimary}
        className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-green-600 text-white font-semibold shadow-md hover:bg-green-700 transition-colors"
      >
        {authed ? "Ver planner" : "Ingresar / Registrarse"}
      </button>
      <p className="text-sm text-gray-600">
        {authed
          ? "Ya tienes sesión: te llevamos directo al planner."
          : "Si ya tienes sesión, te llevamos directo. Si no, verás el login/registro."}
      </p>
    </div>
  );
}
```

---

## Tarea 7: Deprecar auth mock

```typescript
// src/lib/auth/jwt.ts — agregar al inicio
/** @deprecated Reemplazado por Supabase Auth en FASE_13. Eliminar en FASE_14+. */

// src/hooks/use-auth.ts — agregar al inicio
/** @deprecated Reemplazado por useSupabaseAuth() en FASE_13. Eliminar en FASE_14+. */
```

---

## Tarea 8: Configurar Google OAuth en Supabase Dashboard

1. **Authentication → Providers → Google** → Habilitar
2. En [Google Cloud Console](https://console.cloud.google.com): crear OAuth 2.0 Client ID
   - Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
3. Pegar Client ID + Secret en Supabase Dashboard
4. **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000` (dev) / `https://tudominio.com` (prod)
   - Redirect URLs: `http://localhost:3000/auth/callback` y `https://tudominio.com/auth/callback`
5. **Authentication → Settings → Email confirmations**: deshabilitar en desarrollo

---

## Resumen de archivos

| Archivo                                            | Acción                                  |
| -------------------------------------------------- | --------------------------------------- |
| `src/proxy.ts`                                     | Modificar → `getSession()` offline-safe |
| `src/hooks/use-supabase-auth.ts`                   | Crear                                   |
| `src/components/providers/auth-provider.tsx`       | Modificar → usa nuevo hook              |
| `src/app/auth/login/page.tsx`                      | Modificar → password + Google           |
| `src/app/auth/registro/page.tsx`                   | Modificar → password real               |
| `src/app/auth/callback/route.ts`                   | Crear → OAuth exchange                  |
| `src/components/landing/landing-access-button.tsx` | Modificar → Supabase session            |
| `src/lib/auth/jwt.ts`                              | @deprecated                             |
| `src/hooks/use-auth.ts`                            | @deprecated                             |

---

## Criterios de Aceptación

- [ ] Login email/password valida contraseñas reales
- [ ] Registro crea usuario en Supabase Auth + fila en tabla `usuarios` + perfil en IndexedDB
- [ ] OAuth Google: click → consent → callback → autenticado
- [ ] Sesión persiste al cerrar y reabrir el browser
- [ ] Sin conexión: navegar `/app/**` funciona con sesión previa
- [ ] Sin conexión: ir a `/app` sin sesión → redirect a `/auth/login`
- [ ] Logout limpia sesión, redirect a login
- [ ] `pnpm type-check` sin errores

---

## Siguiente fase

**FASE_14** — Billing con MercadoPago (suscripciones)
