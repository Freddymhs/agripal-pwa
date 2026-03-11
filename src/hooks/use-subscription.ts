"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuthContext } from "@/components/providers/auth-provider";
import type { Suscripcion } from "@/types/billing";
import type { EstadoSuscripcion } from "@/lib/constants/billing";

interface UseSubscription {
  subscription: Suscripcion | null;
  loading: boolean;
  isActive: boolean;
  isTrialing: boolean;
  daysRemaining: number;
  needsPayment: boolean;
}

const ACTIVE_STATES: EstadoSuscripcion[] = ["active", "trialing"];

function calcDaysRemaining(dateStr: string | null): number {
  if (!dateStr) return 0;
  return Math.max(
    0,
    Math.ceil(
      (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    ),
  );
}

export function useSubscription(): UseSubscription {
  const { user } = useAuthContext();
  const [subscription, setSubscription] = useState<Suscripcion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      const t = setTimeout(() => {
        setSubscription(null);
        setLoading(false);
      }, 0);
      return () => clearTimeout(t);
    }

    let cancelled = false;

    supabase
      .from("suscripciones")
      .select("*")
      .eq("usuario_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        if (!cancelled) {
          setSubscription(data as Suscripcion | null);
          setLoading(false);
        }
      });

    const channel = supabase
      .channel(`sub-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "suscripciones",
          filter: `usuario_id=eq.${user.id}`,
        },
        (payload) => {
          setSubscription(payload.new as Suscripcion);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      channel.unsubscribe();
    };
  }, [user]);

  const isActive = subscription?.estado === "active";
  const isTrialing = subscription?.estado === "trialing";

  const endDate = isTrialing
    ? subscription?.trial_end
    : subscription?.current_period_end;

  const daysRemaining = calcDaysRemaining(endDate ?? null);
  const needsPayment =
    !subscription || !ACTIVE_STATES.includes(subscription.estado);

  return {
    subscription,
    loading,
    isActive,
    isTrialing,
    daysRemaining,
    needsPayment,
  };
}
