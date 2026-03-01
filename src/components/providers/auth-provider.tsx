"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  useSupabaseAuth,
  type UseSupabaseAuth,
} from "@/hooks/use-supabase-auth";

const AuthContext = createContext<UseSupabaseAuth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useSupabaseAuth();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): UseSupabaseAuth {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext debe usarse dentro de AuthProvider");
  }
  return context;
}
