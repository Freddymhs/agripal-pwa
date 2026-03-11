"use client";

import Link from "next/link";
import { ROUTES } from "@/lib/constants/routes";

export default function BillingPendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
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
          Pago en proceso
        </h1>
        <p className="text-gray-600 mb-6">
          Tu pago esta siendo procesado por MercadoPago. En cuanto se confirme,
          tu suscripcion se activara automaticamente.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Puedes cerrar esta ventana. Te avisaremos cuando este listo.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href={ROUTES.BILLING_MANAGE}
            className="inline-block bg-amber-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-amber-600 transition-colors"
          >
            Ver estado de suscripcion
          </Link>
          <Link
            href={ROUTES.HOME}
            className="inline-block text-gray-600 hover:text-gray-800 text-sm"
          >
            Ir a la app
          </Link>
        </div>
      </div>
    </div>
  );
}
