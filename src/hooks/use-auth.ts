'use client'

import { useEffect, useState, useCallback } from 'react'
import { usuariosDAL } from '@/lib/dal'
import { generarToken, obtenerUsuarioDeToken } from '@/lib/auth/jwt'
import { generateUUID, getCurrentTimestamp } from '@/lib/utils'
import type { Usuario } from '@/types'

const TOKEN_KEY = 'agriplan_token'

export interface UseAuth {
  usuario: Usuario | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ error?: string }>
  logout: () => void
  registrar: (email: string, nombre: string, password: string) => Promise<{ error?: string }>
}

export function useAuth(): UseAuth {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargar() {
      const token = localStorage.getItem(TOKEN_KEY)
      if (!token) {
        setLoading(false)
        return
      }

      const datos = obtenerUsuarioDeToken(token)
      if (!datos) {
        localStorage.removeItem(TOKEN_KEY)
        setLoading(false)
        return
      }

      const user = await usuariosDAL.getById(datos.userId)
      setUsuario(user || null)

      if (!user) {
        localStorage.removeItem(TOKEN_KEY)
      }

      setLoading(false)
    }

    cargar()
  }, [])

  const login = useCallback(async (email: string, _password: string) => {
    const user = await usuariosDAL.getByEmail(email.toLowerCase())

    if (!user) {
      if (process.env.NODE_ENV === 'development') {
        const nuevoUsuario: Usuario = {
          id: generateUUID(),
          email: email.toLowerCase(),
          nombre: email.split('@')[0],
          created_at: getCurrentTimestamp(),
          updated_at: getCurrentTimestamp(),
        }
        await usuariosDAL.add(nuevoUsuario)

        const token = generarToken(nuevoUsuario)
        localStorage.setItem(TOKEN_KEY, token)
        setUsuario(nuevoUsuario)
        return {}
      }

      return { error: 'Usuario no encontrado' }
    }

    const token = generarToken(user)
    localStorage.setItem(TOKEN_KEY, token)
    setUsuario(user)
    return {}
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setUsuario(null)
  }, [])

  const registrar = useCallback(async (email: string, nombre: string, _password: string) => {
    const existente = await usuariosDAL.getByEmail(email.toLowerCase())

    if (existente) {
      return { error: 'El email ya está registrado' }
    }

    const nuevoUsuario: Usuario = {
      id: generateUUID(),
      email: email.toLowerCase(),
      nombre,
      created_at: getCurrentTimestamp(),
      updated_at: getCurrentTimestamp(),
    }

    await usuariosDAL.add(nuevoUsuario)

    const token = generarToken(nuevoUsuario)
    localStorage.setItem(TOKEN_KEY, token)
    setUsuario(nuevoUsuario)

    return {}
  }, [])

  return {
    usuario,
    loading,
    isAuthenticated: !!usuario,
    login,
    logout,
    registrar,
  }
}
