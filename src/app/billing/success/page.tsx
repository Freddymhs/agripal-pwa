"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSubscription } from "@/hooks/use-subscription";
import { ROUTES } from "@/lib/constants/routes";

const MAX_POLLS = 10;
const POLL_INTERVAL_MS = 2000;

export default function BillingSuccessPage() {
  const { isActive, loading } = useSubscription();
  const [polls, setPolls] = useState(0);

  // Polling: el webhook puede tardar unos segundos en procesar
  useEffect(() => {
    if (isActive || loading) return;
    if (polls >= MAX_POLLS) return;

    const timer = setTimeout(() => {
      setPolls((p) => p + 1);
      // useSubscription se re-fetcha via Realtime, pero por si acaso
      // forzamos un re-render que re-evalua isActive
    }, POLL_INTERVAL_MS);

    return () => clearTimeout(timer);
  }, [isActive, loading, polls]);

  const confirmed = isActive;
  const stillWaiting = !confirmed && polls < MAX_POLLS;
  const timedOut = !confirmed && polls >= MAX_POLLS;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {stillWaiting && (
          <>
            <div className="animate-spin h-12 w-12 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Procesando pago...
            </h1>
            <p className="text-gray-600">
              Estamos confirmando tu pago con MercadoPago. Esto puede tomar unos
              segundos.
            </p>
          </>
        )}

        {confirmed && (
          <>
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Pago exitoso
            </h1>
            <p className="text-gray-600 mb-6">
              Tu suscripcion a AgriPlan esta activa. Ya puedes usar todas las
              funcionalidades.
            </p>
            <Link
              href={ROUTES.HOME}
              className="inline-block bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Ir a la app
            </Link>
          </>
        )}

        {timedOut && (
          <>
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Pago recibido
            </h1>
            <p className="text-gray-600 mb-6">
              Tu pago fue recibido pero la confirmacion esta tardando mas de lo
              esperado. En unos minutos tu suscripcion estara activa.
            </p>
            <Link
              href={ROUTES.HOME}
              className="inline-block bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Ir a la app
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
