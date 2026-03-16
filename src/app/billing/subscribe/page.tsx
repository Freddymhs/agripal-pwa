"use client";

import { useState } from "react";
import Link from "next/link";
import { initMercadoPago, Wallet } from "@mercadopago/sdk-react";
import { useSubscription } from "@/hooks/use-subscription";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { logger } from "@/lib/logger";
import { BILLING } from "@/lib/constants/billing";
import { ROUTES } from "@/lib/constants/routes";
import type { CheckoutResponse } from "@/types/billing";

const mpPublicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;
if (mpPublicKey) {
  initMercadoPago(mpPublicKey);
}

const FEATURES = [
  "Planificacion ilimitada de terrenos",
  "Recomendaciones inteligentes de cultivos",
  "Gestion de agua y alertas",
  "Sincronizacion multi-dispositivo",
  "Soporte prioritario",
] as const;

function CheckIcon() {
  return (
    <svg
      className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function SubscribePage() {
  const {
    isActive,
    isTrialing,
    daysRemaining,
    loading: subLoading,
  } = useSubscription();
  const { signOut } = useSupabaseAuth();
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? "Error al crear checkout");
        return;
      }

      const data: CheckoutResponse = await response.json();
      if (data.preferenceId) {
        setPreferenceId(data.preferenceId);
      }
    } catch (err) {
      logger.error("billing.subscribe", {
        message: err instanceof Error ? err.message : "Unknown error",
      });
      setError("Error de conexion. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // Si ya tiene suscripcion activa, redirigir a manage
  if (!subLoading && (isActive || isTrialing)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            {isTrialing ? "Trial activo" : "Suscripcion activa"}
          </h1>
          <p className="text-gray-600 mb-2">
            {isTrialing
              ? `Tu periodo de prueba gratuito esta activo. Quedan ${daysRemaining} dias.`
              : "Ya tienes una suscripcion activa."}
          </p>
          <div className="flex gap-3 justify-center mt-6">
            <Link
              href={ROUTES.HOME}
              className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Ir a la app
            </Link>
            <Link
              href={ROUTES.BILLING_MANAGE}
              className="inline-block border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Gestionar
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const precio = BILLING.PRECIO_CLP.toLocaleString("es-CL");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <span className="text-2xl font-bold text-green-600">AgriPlan</span>
          <h1 className="text-3xl font-bold text-gray-900 mt-3 mb-2">
            Activa tu suscripcion
          </h1>
          <p className="text-gray-600">
            Tu periodo de prueba gratuito de 6 meses ha finalizado. Suscribete
            para seguir usando todas las funcionalidades.
          </p>
        </div>

        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">
              ${precio}
              <span className="text-lg text-gray-500 font-normal">
                {" "}
                CLP/mes
              </span>
            </div>
            <p className="text-sm text-gray-600">Facturacion mensual</p>
          </div>

          <div className="mt-6 space-y-3">
            {FEATURES.map((feature) => (
              <div key={feature} className="flex items-start gap-2">
                <CheckIcon />
                <span className="text-sm text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {!preferenceId ? (
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className={`w-full py-4 rounded-lg font-semibold text-white text-lg transition-colors ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Preparando..." : "Suscribirme Ahora"}
          </button>
        ) : (
          <div className="mt-4">
            <Wallet initialization={{ preferenceId }} />
          </div>
        )}

        <p className="text-xs text-gray-500 text-center mt-4">
          Pago seguro con MercadoPago. Cancela cuando quieras.
        </p>

        <div className="text-center mt-6 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={signOut}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
