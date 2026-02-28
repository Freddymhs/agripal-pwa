"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useAuth, type UseAuth } from "@/hooks/use-auth";

const AuthContext = createContext<UseAuth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): UseAuth {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext debe usarse dentro de AuthProvider");
  }
  return context;
}
