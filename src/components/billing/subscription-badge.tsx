"use client";

import Link from "next/link";
import { useSubscription } from "@/hooks/use-subscription";
import { ROUTES } from "@/lib/constants/routes";

export function SubscriptionBadge() {
  const { isActive, isTrialing, daysRemaining, loading } = useSubscription();

  if (loading) return null;

  if (isActive) {
    return (
      <Link
        href={ROUTES.BILLING_MANAGE}
        className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm hover:bg-green-100 transition-colors"
      >
        <div className="w-2 h-2 bg-green-500 rounded-full" />
        <span>Activa</span>
      </Link>
    );
  }

  if (isTrialing) {
    return (
      <Link
        href={ROUTES.BILLING_SUBSCRIBE}
        className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm hover:bg-blue-100 transition-colors"
      >
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        <span>Trial ({daysRemaining}d)</span>
      </Link>
    );
  }

  return (
    <Link
      href={ROUTES.BILLING_SUBSCRIBE}
      className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-sm hover:bg-red-100 transition-colors"
    >
      <div className="w-2 h-2 bg-red-500 rounded-full" />
      <span>Inactiva</span>
    </Link>
  );
}
