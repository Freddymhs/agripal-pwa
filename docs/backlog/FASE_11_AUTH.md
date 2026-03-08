# FASE 11: Autenticación JWT

**Status**: ✅ COMPLETADA
**Prioridad**: 🟢 Baja
**Dependencias**: FASE_10
**Estimación**: 2-3 horas

---

## Objetivo

Implementar autenticación JWT básica. Login mock para desarrollo, preparado para Supabase/Firebase en el futuro.

---

## Notas

- **Por ahora**: JWT simple con login mock (email/password fijos)
- **Futuro**: Integrar Supabase Auth o Firebase Auth
- **No bloquea**: Se puede usar la app sin auth para desarrollo

---

## Tareas

### Tarea 1: Crear Utilidades JWT

**Archivo**: `src/lib/auth/jwt.ts` (crear)

```typescript
import type { Usuario } from "@/types";

// En producción, usar jose o similar
// Por ahora, implementación simple para desarrollo

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";

interface JWTPayload {
  userId: string;
  email: string;
  exp: number;
}

// Codificar payload a base64 (simplificado para dev)
function encodePayload(payload: JWTPayload): string {
  return btoa(JSON.stringify(payload));
}

// Decodificar payload
function decodePayload(token: string): JWTPayload | null {
  try {
    const [, payloadB64] = token.split(".");
    return JSON.parse(atob(payloadB64));
  } catch {
    return null;
  }
}

// Generar token (mock para desarrollo)
export function generarToken(usuario: Usuario): string {
  const payload: JWTPayload = {
    userId: usuario.id,
    email: usuario.email,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 días
  };

  // Mock JWT: header.payload.signature
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payloadEncoded = encodePayload(payload);
  const signature = btoa(JWT_SECRET); // Simplificado

  return `${header}.${payloadEncoded}.${signature}`;
}

// Verificar token
export function verificarToken(token: string): JWTPayload | null {
  const payload = decodePayload(token);

  if (!payload) return null;
  if (payload.exp < Date.now()) return null; // Expirado

  return payload;
}

// Obtener usuario del token
export function obtenerUsuarioDeToken(
  token: string,
): { userId: string; email: string } | null {
  const payload = verificarToken(token);
  if (!payload) return null;

  return {
    userId: payload.userId,
    email: payload.email,
  };
}
```

---

### Tarea 2: Crear Hook useAuth

**Archivo**: `src/hooks/useAuth.ts` (crear)

```typescript
"use client";

import { useEffect, useState, useCallback } from "react";
import { db } from "@/lib/db";
import {
  generarToken,
  verificarToken,
  obtenerUsuarioDeToken,
} from "@/lib/auth/jwt";
import { generateUUID, getCurrentTimestamp } from "@/lib/utils";
import type { Usuario } from "@/types";

const TOKEN_KEY = "agriplan_token";

interface UseAuth {
  usuario: Usuario | null;
  loading: boolean;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => void;
  registrar: (
    email: string,
    nombre: string,
    password: string,
  ) => Promise<{ error?: string }>;
}

export function useAuth(): UseAuth {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar usuario al iniciar
  useEffect(() => {
    async function cargar() {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        setLoading(false);
        return;
      }

      const datos = obtenerUsuarioDeToken(token);
      if (!datos) {
        localStorage.removeItem(TOKEN_KEY);
        setLoading(false);
        return;
      }

      // Buscar usuario en DB local
      const user = await db.usuarios.get(datos.userId);
      setUsuario(user || null);
      setLoading(false);
    }

    cargar();
  }, []);

  // Login
  const login = useCallback(async (email: string, password: string) => {
    // Buscar usuario por email
    const user = await db.usuarios
      .where("email")
      .equals(email.toLowerCase())
      .first();

    if (!user) {
      // Para desarrollo: crear usuario automáticamente
      if (process.env.NODE_ENV === "development") {
        const nuevoUsuario: Usuario = {
          id: generateUUID(),
          email: email.toLowerCase(),
          nombre: email.split("@")[0],
          created_at: getCurrentTimestamp(),
          updated_at: getCurrentTimestamp(),
        };
        await db.usuarios.add(nuevoUsuario);

        const token = generarToken(nuevoUsuario);
        localStorage.setItem(TOKEN_KEY, token);
        setUsuario(nuevoUsuario);
        return {};
      }

      return { error: "Usuario no encontrado" };
    }

    // En producción, verificar password con hash
    // Por ahora, aceptamos cualquier password

    const token = generarToken(user);
    localStorage.setItem(TOKEN_KEY, token);
    setUsuario(user);
    return {};
  }, []);

  // Logout
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUsuario(null);
  }, []);

  // Registrar
  const registrar = useCallback(
    async (email: string, nombre: string, password: string) => {
      // Verificar si ya existe
      const existente = await db.usuarios
        .where("email")
        .equals(email.toLowerCase())
        .first();

      if (existente) {
        return { error: "El email ya está registrado" };
      }

      const nuevoUsuario: Usuario = {
        id: generateUUID(),
        email: email.toLowerCase(),
        nombre,
        created_at: getCurrentTimestamp(),
        updated_at: getCurrentTimestamp(),
      };

      await db.usuarios.add(nuevoUsuario);

      const token = generarToken(nuevoUsuario);
      localStorage.setItem(TOKEN_KEY, token);
      setUsuario(nuevoUsuario);

      return {};
    },
    [],
  );

  return {
    usuario,
    loading,
    isAuthenticated: !!usuario,
    login,
    logout,
    registrar,
  };
}
```

---

### Tarea 3: Crear Página de Login

**Archivo**: `src/app/auth/login/page.tsx` (crear)

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await login(email, password)

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
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          <div className="text-center text-sm text-gray-500">
            ¿No tienes cuenta?{' '}
            <Link href="/auth/registro" className="text-green-600 hover:underline">
              Regístrate
            </Link>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-3 bg-yellow-50 rounded text-xs text-yellow-800">
              <strong>Modo desarrollo:</strong> Cualquier email/password funcionará
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
```

---

### Tarea 4: Crear Provider de Auth

**Archivo**: `src/components/providers/AuthProvider.tsx` (crear)

```typescript
'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import type { Usuario } from '@/types'

interface AuthContextType {
  usuario: Usuario | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ error?: string }>
  logout: () => void
  registrar: (email: string, nombre: string, password: string) => Promise<{ error?: string }>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth()

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

## Criterios de Aceptación

- [x] Hook useAuth maneja estado de autenticación
- [x] Login guarda token en localStorage
- [x] Logout elimina token
- [x] Token se verifica al cargar la app
- [x] Página de login funciona
- [x] En desarrollo, cualquier email/password crea usuario
- [x] AuthProvider disponible para toda la app
- [x] Usuario persistido en IndexedDB

---

## Futuro (Post-MVP)

- Integrar Supabase Auth
- Password hashing con bcrypt
- Refresh tokens
- OAuth (Google, GitHub)
- Recuperación de contraseña
