"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSubscription } from "@/hooks/use-subscription";
import { BILLING } from "@/lib/constants/billing";
import { ROUTES } from "@/lib/constants/routes";
import { logger } from "@/lib/logger";

const STATUS_STYLES = {
  green: {
    container: "bg-green-50 border-2 border-green-200 rounded-lg p-4",
    dot: "w-3 h-3 bg-green-500 rounded-full",
    text: "font-medium text-green-700",
  },
  amber: {
    container: "bg-amber-50 border-2 border-amber-200 rounded-lg p-4",
    dot: "w-3 h-3 bg-amber-500 rounded-full",
    text: "font-medium text-amber-700",
  },
  red: {
    container: "bg-red-50 border-2 border-red-200 rounded-lg p-4",
    dot: "w-3 h-3 bg-red-500 rounded-full",
    text: "font-medium text-red-700",
  },
} as const;

type StatusColor = keyof typeof STATUS_STYLES;

function CancelModal({
  onConfirm,
  onClose,
  loading,
}: {
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Cancelar suscripcion
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Tu suscripcion seguira activa hasta el fin del periodo actual. Despues
          de eso, perderas acceso a AgriPlan.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Volver
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Cancelando..." : "Si, cancelar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ManageBillingPage() {
  const { subscription, loading, isActive, isTrialing, daysRemaining } =
    useSubscription();
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelResult, setCancelResult] = useState<{
    success: boolean;
    activeUntil?: string;
    error?: string;
  } | null>(null);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const response = await fetch("/api/billing/cancel", { method: "POST" });
      const data = await response.json();

      if (response.ok) {
        setCancelResult({ success: true, activeUntil: data.activeUntil });
      } else {
        setCancelResult({ success: false, error: data.error });
      }
    } catch (err) {
      logger.error("billing.manage.cancel", {
        message: err instanceof Error ? err.message : "Unknown",
      });
      setCancelResult({ success: false, error: "Error de conexion" });
    } finally {
      setCancelling(false);
      setShowCancelModal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const subscriptionActive = isActive || isTrialing;
  const isCancelPending = subscription?.cancel_at_period_end;
  const statusLabel = isCancelPending
    ? "Cancelada — activa hasta fin del periodo"
    : isTrialing
      ? `Trial (${daysRemaining} dias restantes)`
      : isActive
        ? `Activa — renueva en ${daysRemaining} dias`
        : "Inactiva";

  const statusColor: StatusColor = isCancelPending
    ? "amber"
    : subscriptionActive
      ? "green"
      : "red";

  const styles = STATUS_STYLES[statusColor];
  const precio = BILLING.PRECIO_CLP.toLocaleString("es-CL");

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Gestionar Suscripcion</h1>
          <Link
            href={ROUTES.HOME}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Volver a la app
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Estado Actual</h2>
          <div className={styles.container}>
            <div className="flex items-center gap-2">
              <div className={styles.dot} />
              <span className={styles.text}>{statusLabel}</span>
            </div>
          </div>

          {!subscriptionActive && !isCancelPending && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-3">
                Tu suscripcion esta inactiva. Renueva para seguir usando
                AgriPlan.
              </p>
              <Link
                href={ROUTES.BILLING_SUBSCRIBE}
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Renovar suscripcion
              </Link>
            </div>
          )}
        </div>

        {cancelResult && (
          <div
            className={`rounded-lg p-4 mb-6 ${
              cancelResult.success
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            {cancelResult.success ? (
              <p className="text-sm text-green-700">
                Suscripcion cancelada. Seguiras con acceso hasta{" "}
                {cancelResult.activeUntil
                  ? new Date(cancelResult.activeUntil).toLocaleDateString(
                      "es-CL",
                    )
                  : "el fin del periodo actual"}
                .
              </p>
            ) : (
              <p className="text-sm text-red-700">{cancelResult.error}</p>
            )}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Plan</h2>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-medium">{BILLING.PLAN_NOMBRE}</div>
              <div className="text-sm text-gray-500">${precio} CLP/mes</div>
            </div>
          </div>

          {subscription?.current_period_end && !isTrialing && (
            <p className="text-sm text-gray-600 mb-4">
              Proxima facturacion:{" "}
              {new Date(subscription.current_period_end).toLocaleDateString(
                "es-CL",
              )}
            </p>
          )}

          {isTrialing && subscription?.trial_end && (
            <p className="text-sm text-gray-600 mb-4">
              Trial finaliza:{" "}
              {new Date(subscription.trial_end).toLocaleDateString("es-CL")}
            </p>
          )}

          {subscriptionActive && !isCancelPending && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Cancelar suscripcion
            </button>
          )}
        </div>

        {/* Historial de pagos */}
        <PaymentHistory />
      </div>

      {showCancelModal && (
        <CancelModal
          onConfirm={handleCancel}
          onClose={() => setShowCancelModal(false)}
          loading={cancelling}
        />
      )}
    </div>
  );
}

function PaymentHistory() {
  const [payments, setPayments] = useState<
    Array<{
      id: string;
      monto: number;
      estado: string;
      created_at: string;
      descripcion: string | null;
    }>
  >([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    import("@/lib/supabase/client").then(({ supabase }) => {
      supabase
        .from("pagos")
        .select("id, monto, estado, created_at, descripcion")
        .order("created_at", { ascending: false })
        .limit(10)
        .then(({ data, error }) => {
          if (error) {
            import("@/lib/logger").then(({ logger }) => {
              logger.error("billing.payment_history", {
                message: error.message,
              });
            });
          }
          if (data) setPayments(data);
          setLoaded(true);
        });
    });
  }, []);

  if (!loaded || payments.length === 0) return null;

  const ESTADO_LABELS: Record<string, { label: string; className: string }> = {
    approved: { label: "Aprobado", className: "text-green-700 bg-green-50" },
    pending: { label: "Pendiente", className: "text-amber-700 bg-amber-50" },
    authorized: { label: "Autorizado", className: "text-blue-700 bg-blue-50" },
    in_process: {
      label: "En proceso",
      className: "text-amber-700 bg-amber-50",
    },
    in_mediation: {
      label: "En mediacion",
      className: "text-amber-700 bg-amber-50",
    },
    rejected: { label: "Rechazado", className: "text-red-700 bg-red-50" },
    cancelled: { label: "Cancelado", className: "text-gray-700 bg-gray-100" },
    refunded: { label: "Reembolsado", className: "text-blue-700 bg-blue-50" },
    charged_back: { label: "Contracargo", className: "text-red-700 bg-red-50" },
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Historial de Pagos</h2>
      <div className="space-y-3">
        {payments.map((p) => {
          const badge = ESTADO_LABELS[p.estado] ?? {
            label: p.estado,
            className: "text-gray-700 bg-gray-100",
          };
          return (
            <div
              key={p.id}
              className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
            >
              <div>
                <div className="text-sm font-medium">
                  ${p.monto.toLocaleString("es-CL")} CLP
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(p.created_at).toLocaleDateString("es-CL")}
                </div>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full ${badge.className}`}
              >
                {badge.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
