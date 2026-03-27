"use client";

import { useState } from "react";

interface AlertaBannerProps {
  alertasCriticas: number;
}

export function AlertaBanner({ alertasCriticas }: AlertaBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (alertasCriticas === 0 || dismissed) {
    return null;
  }

  return (
    <div className="bg-red-600 text-white px-4 py-2">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <span className="text-lg">🚨</span>
          <span className="text-sm font-medium">
            {alertasCriticas === 1
              ? "Tienes 1 alerta crítica que requiere atención"
              : `Tienes ${alertasCriticas} alertas críticas que requieren atención`}
          </span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-white/80 hover:text-white p-1"
          aria-label="Cerrar notificación"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
