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
}

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
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) setUsuario(await syncUsuarioLocal(currentUser));
      setLoading(false);
    });

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
    if (error) {
      const MSG: Record<string, string> = {
        "Email not confirmed":
          "Debes confirmar tu email antes de ingresar. Revisá tu bandeja de entrada (y la carpeta de spam).",
        "Invalid login credentials": "Email o contraseña incorrectos.",
        "Too many requests":
          "Demasiados intentos. Esperá unos minutos e intentá de nuevo.",
      };
      return {
        error:
          MSG[error.message] ?? "Error al iniciar sesión. Intentá de nuevo.",
      };
    }
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

  return {
    user,
    usuario,
    loading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
  };
}
