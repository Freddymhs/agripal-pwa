"use client";

import Link from "next/link";
import { ROUTES } from "@/lib/constants/routes";

export default function BillingFailurePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Pago no completado
        </h1>
        <p className="text-gray-600 mb-6">
          El pago no se pudo procesar. Puedes intentar de nuevo o usar otro
          medio de pago.
        </p>

        <Link
          href={ROUTES.BILLING_SUBSCRIBE}
          className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Intentar de nuevo
        </Link>
      </div>
    </div>
  );
}
