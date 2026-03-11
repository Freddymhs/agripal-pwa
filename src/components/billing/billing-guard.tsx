"use client";

import { useEffect, useState, useCallback, type ReactNode } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useAuthContext } from "@/components/providers/auth-provider";
import { ROUTES } from "@/lib/constants/routes";

const CACHE_PREFIX = "agriplan-sub-expires-";
const RECHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutos
const ALLOWED_STATES = new Set(["active", "trialing", "past_due"]);

function getCacheKey(userId: string): string {
  return `${CACHE_PREFIX}${userId.slice(0, 8)}`;
}

function getLocalExpiry(userId: string): Date | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(getCacheKey(userId));
  if (!raw) return null;
  const date = new Date(raw);
  return isNaN(date.getTime()) ? null : date;
}

function setLocalExpiry(userId: string, dateStr: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(getCacheKey(userId), dateStr);
  }
}

function clearLocalExpiry(userId: string) {
  if (typeof window !== "undefined") {
    localStorage.removeItem(getCacheKey(userId));
  }
}

interface BillingGuardProps {
  children: ReactNode;
}

export function BillingGuard({ children }: BillingGuardProps) {
  const { user, loading: authLoading } = useAuthContext();
  const [status, setStatus] = useState<"loading" | "active" | "blocked">(
    "loading",
  );

  const checkSubscription = useCallback(async (userId: string) => {
    if (navigator.onLine) {
      const { data } = await supabase
        .from("suscripciones")
        .select("estado, trial_end, current_period_end")
        .eq("usuario_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (data && ALLOWED_STATES.has(data.estado)) {
        const expiry =
          data.estado === "trialing" ? data.trial_end : data.current_period_end;

        if (expiry) {
          // Verificar que la fecha no haya pasado
          if (new Date(expiry) > new Date()) {
            setLocalExpiry(userId, expiry);
            setStatus("active");
            return;
          }
        }
      }

      clearLocalExpiry(userId);
      setStatus("blocked");
      return;
    }

    // Offline: usar cache local
    const expiry = getLocalExpiry(userId);
    if (expiry && expiry > new Date()) {
      setStatus("active");
      return;
    }

    setStatus("blocked");
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;

    // Deferred call to avoid synchronous setState in effect
    const t = setTimeout(() => checkSubscription(user.id), 0);

    // Re-check periodico para detectar expiracion durante sesion
    const interval = setInterval(() => {
      checkSubscription(user.id);
    }, RECHECK_INTERVAL_MS);

    return () => {
      clearTimeout(t);
      clearInterval(interval);
    };
  }, [user, authLoading, checkSubscription]);

  if (status === "loading" || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (status === "blocked") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <span className="text-2xl font-bold text-green-600">AgriPlan</span>
          </div>
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-amber-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Suscripcion requerida
          </h1>
          <p className="text-gray-600 mb-6">
            Tu periodo de prueba o suscripcion ha expirado. Renueva para seguir
            usando AgriPlan.
          </p>
          <Link
            href={ROUTES.BILLING_SUBSCRIBE}
            className="inline-block bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Ver planes
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
