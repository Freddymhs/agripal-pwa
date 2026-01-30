# FASE 13: Autenticación Real con Supabase Auth

**Status**: ⏳ PENDIENTE
**Prioridad**: 🔴 CRÍTICA
**Dependencias**: FASE_12
**Estimación**: 3-4 horas

---

## Objetivo

Reemplazar el sistema de autenticación JWT mock por autenticación real usando Supabase Auth.

**Entregables:**
1. Login/Registro real con validación de contraseña
2. Sesión persistente con cookies seguras
3. Middleware de protección de rutas
4. OAuth con Google (opcional)
5. Recuperación de contraseña

---

## Contexto Técnico

### Estado Actual (FASE_11)
```typescript
// JWT mock sin validación real
function generarToken(usuario: Usuario): string {
  const payload = { userId, email, exp }
  return `${header}.${btoa(JSON.stringify(payload))}.${mockSignature}`
}

// Login acepta cualquier password
const login = async (email, password) => {
  const user = await db.usuarios.where('email').equals(email).first()
  if (!user && NODE_ENV === 'development') {
    // Crea usuario automáticamente
  }
  return generarToken(user)
}
```

**Problemas:**
- ❌ No valida contraseñas
- ❌ Token trivial de falsificar
- ❌ Sin expiración real
- ❌ Sin refresh tokens
- ❌ Sin OAuth

### Estado Deseado (FASE_13)
```typescript
// Supabase Auth con validación real
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
})

// Sesión segura con cookies httpOnly
// Validación en middleware
// Refresh automático
// OAuth integrado
```

---

## Arquitectura

```
┌────────────────────────┐
│  Usuario (navegador)   │
└───────────┬────────────┘
            │
       ┌────▼────┐
       │ Login   │
       └────┬────┘
            │ email + password
            │
       ┌────▼──────────────────┐
       │ Supabase Auth Client  │
       └────┬──────────────────┘
            │
       ┌────▼──────────────────┐
       │   Supabase Auth API   │
       │  (validación bcrypt)  │
       └────┬──────────────────┘
            │
       ┌────▼──────────────────┐
       │  Session (cookies)    │
       │  - Access token       │
       │  - Refresh token      │
       └───────────────────────┘
```

**Flujo de autenticación:**
```
1. Usuario ingresa email/password
2. supabase.auth.signInWithPassword()
3. Supabase valida con bcrypt
4. Retorna sesión con tokens
5. Cookies se guardan automáticamente (httpOnly)
6. Middleware verifica sesión en cada request
7. Refresh automático antes de expiración
```

---

## Tareas

### Tarea 1: Configurar Supabase Auth

**En Dashboard de Supabase:**

1. **Configurar Email Auth:**
   - Settings → Authentication → Email Auth: **Enabled**
   - Confirm email: **Enabled** (producción) / **Disabled** (desarrollo)
   - Secure password change: **Enabled**

2. **Configurar Redirect URLs:**
   - Allowed redirect URLs:
     ```
     http://localhost:3000/auth/callback
     https://tudominio.com/auth/callback
     ```

3. **Configurar Email Templates** (opcional):
   - Personalizar email de confirmación
   - Personalizar email de recuperación

4. **Configurar OAuth (opcional):**
   - Providers → Google → Enable
   - Client ID y Secret de Google Cloud Console

---

### Tarea 2: Crear Hooks de Autenticación

**Archivo**: `src/hooks/use-supabase-auth.ts` (crear)

```typescript
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { db } from '@/lib/db'
import type { User, Session } from '@supabase/supabase-js'
import type { Usuario } from '@/types'

interface UseSupabaseAuth {
  user: User | null
  usuario: Usuario | null
  session: Session | null
  loading: boolean
  isAuthenticated: boolean

  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string, nombre: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error?: string }>
}

export function useSupabaseAuth(): UseSupabaseAuth {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        await syncUsuario(session.user)
      }

      setLoading(false)
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          await syncUsuario(session.user)
        } else {
          setUsuario(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const syncUsuario = async (user: User) => {
    let localUsuario = await db.usuarios.get(user.id)

    if (!localUsuario) {
      const { data: remoteUsuario } = await supabase
        .from('usuarios')
        .select()
        .eq('id', user.id)
        .single()

      if (remoteUsuario) {
        await db.usuarios.add(remoteUsuario)
        localUsuario = remoteUsuario
      } else {
        const nuevoUsuario: Usuario = {
          id: user.id,
          email: user.email!,
          nombre: user.user_metadata?.nombre || user.email!.split('@')[0],
          created_at: user.created_at,
          updated_at: new Date().toISOString(),
        }

        await supabase.from('usuarios').insert(nuevoUsuario)
        await db.usuarios.add(nuevoUsuario)
        localUsuario = nuevoUsuario
      }
    }

    setUsuario(localUsuario)
  }

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      return {}
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Error al iniciar sesión',
      }
    }
  }, [])

  const signUp = useCallback(async (
    email: string,
    password: string,
    nombre: string
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nombre,
          },
        },
      })

      if (error) throw error

      if (data.user) {
        const nuevoUsuario: Usuario = {
          id: data.user.id,
          email: data.user.email!,
          nombre,
          created_at: data.user.created_at,
          updated_at: new Date().toISOString(),
        }

        await supabase.from('usuarios').insert(nuevoUsuario)
        await db.usuarios.add(nuevoUsuario)
      }

      return {}
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Error al registrarse',
      }
    }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }, [router])

  const signInWithGoogle = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error

      return {}
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Error al enviar email',
      }
    }
  }, [])

  return {
    user,
    usuario,
    session,
    loading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    resetPassword,
  }
}
```

---

### Tarea 3: Actualizar AuthProvider

**Archivo**: `src/components/providers/AuthProvider.tsx` (modificar)

```typescript
'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { useSupabaseAuth } from '@/hooks/use-supabase-auth'
import type { User, Session } from '@supabase/supabase-js'
import type { Usuario } from '@/types'

interface AuthContextType {
  user: User | null
  usuario: Usuario | null
  session: Session | null
  loading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string, nombre: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error?: string }>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useSupabaseAuth()

  if (auth.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext debe usarse dentro de AuthProvider')
  }
  return context
}
```

---

### Tarea 4: Crear Middleware de Protección

**Archivo**: `src/middleware.ts` (crear)

```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/supabase'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const isAuthPage = req.nextUrl.pathname.startsWith('/auth')

  if (!session && !isAuthPage) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/auth/login'
    redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (session && isAuthPage) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/'
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

---

### Tarea 5: Actualizar Páginas de Auth

**Archivo**: `src/app/auth/login/page.tsx` (modificar)

```typescript
'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthContext } from '@/components/providers/AuthProvider'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn, signInWithGoogle } = useAuthContext()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const redirectTo = searchParams.get('redirectedFrom') || '/'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await signIn(email, password)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.push(redirectTo)
    }
  }

  const handleGoogleSignIn = async () => {
    await signInWithGoogle()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-600">AgriPlan</h1>
          <p className="text-gray-500 mt-2">Planificación agrícola inteligente</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow space-y-4">
          <h2 className="text-xl font-bold text-center">Iniciar Sesión</h2>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              required
              autoComplete="current-password"
            />
          </div>

          <div className="text-right">
            <Link
              href="/auth/forgot-password"
              className="text-sm text-green-600 hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-medium text-white ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">O continúa con</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="font-medium">Google</span>
          </button>

          <div className="text-center text-sm text-gray-500">
            ¿No tienes cuenta?{' '}
            <Link href="/auth/registro" className="text-green-600 hover:underline">
              Regístrate
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
```

**Archivo**: `src/app/auth/registro/page.tsx` (crear)

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthContext } from '@/components/providers/AuthProvider'

export default function RegistroPage() {
  const router = useRouter()
  const { signUp } = useAuthContext()

  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)

    const result = await signUp(email, password, nombre)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-600">AgriPlan</h1>
          <p className="text-gray-500 mt-2">Crea tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow space-y-4">
          <h2 className="text-xl font-bold text-center">Registrarse</h2>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Confirmar Contraseña</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-medium text-white ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
          </button>

          <div className="text-center text-sm text-gray-500">
            ¿Ya tienes cuenta?{' '}
            <Link href="/auth/login" className="text-green-600 hover:underline">
              Inicia sesión
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
```

**Archivo**: `src/app/auth/callback/route.ts` (crear)

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(requestUrl.origin)
}
```

---

### Tarea 6: Deprecar Auth Mock

**Archivo**: `src/lib/auth/jwt.ts` (agregar advertencia)

```typescript
/**
 * @deprecated Este módulo está deprecado. Usa Supabase Auth en su lugar.
 * Ver: src/hooks/use-supabase-auth.ts
 */

// Mantener por retrocompatibilidad temporal
// TODO: Eliminar en próxima versión
```

---

## Criterios de Aceptación

### Autenticación
- [ ] Login con email/password valida contraseñas correctamente
- [ ] Registro crea usuario en Supabase y en tabla usuarios
- [ ] Sesión persiste en cookies seguras (httpOnly)
- [ ] Logout limpia sesión correctamente
- [ ] OAuth con Google funciona (opcional)

### Seguridad
- [ ] Middleware protege rutas privadas
- [ ] Usuarios no autenticados son redirigidos a /auth/login
- [ ] Usuarios autenticados no pueden acceder a /auth/*
- [ ] Tokens se refrescan automáticamente

### UX
- [ ] Spinner de carga mientras verifica sesión
- [ ] Redirección a página original después de login
- [ ] Mensajes de error claros y en español
- [ ] Recuperación de contraseña funciona

---

## Tests Manuales

1. **Test Registro:**
   - Crear cuenta nueva
   - Verificar que se crea en Supabase
   - Verificar que se sincroniza a IndexedDB

2. **Test Login:**
   - Intentar login con contraseña incorrecta → error
   - Login con contraseña correcta → éxito

3. **Test Middleware:**
   - Intentar acceder a / sin login → redirect a /auth/login
   - Login → redirect a /

4. **Test Persistencia:**
   - Login → recargar página → sigue autenticado
   - Logout → recargar página → sigue deslogueado

5. **Test OAuth:**
   - Click en "Continuar con Google"
   - Completar flow de OAuth
   - Verificar que crea usuario en DB

---

## Siguiente Fase

**FASE_14_BILLING_MERCADOPAGO** - Sistema de suscripciones y pagos
