import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

export type AuthStateChangeCallback = (
  event: AuthChangeEvent,
  session: Session | null,
) => void;

export const authDAL = {
  getSession: () => supabase.auth.getSession(),
  onAuthStateChange: (callback: AuthStateChangeCallback) =>
    supabase.auth.onAuthStateChange(callback),
  signInWithPassword: (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password }),
  signUp: (email: string, password: string, nombre: string) =>
    supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre } },
    }),
  signOut: () => supabase.auth.signOut(),
  updatePassword: (password: string) => supabase.auth.updateUser({ password }),
  exchangeCodeForSession: (code: string) =>
    supabase.auth.exchangeCodeForSession(code),
};
