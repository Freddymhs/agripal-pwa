"use client";

import { useState } from "react";
import Link from "next/link";
import type { GuiaPaso } from "./guia-datos";

interface GuiaPasoCardProps {
  paso: GuiaPaso;
  accentClasses: {
    button: string;
    border: string;
  };
}

export function GuiaPasoCard({ paso, accentClasses }: GuiaPasoCardProps) {
  const [abierto, setAbierto] = useState(false);

  return (
    <div
      className={`border rounded-xl bg-white transition-colors ${
        abierto
          ? accentClasses.border
          : "border-stone-200 hover:border-stone-300"
      }`}
    >
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        className="w-full text-left px-4 py-3.5 flex items-center gap-3"
      >
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-stone-900 leading-tight">
            {paso.titulo}
          </p>
          <p className="text-sm text-stone-500 mt-0.5 leading-snug">
            {paso.valor}
          </p>
        </div>
        <svg
          className={`w-4 h-4 text-stone-400 shrink-0 transition-transform duration-200 ${
            abierto ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {abierto && (
        <div className="px-4 pb-4 space-y-3">
          <div className="border-t border-stone-100 pt-3">
            <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5">
              ¿Cómo funciona?
            </p>
            <p className="text-sm text-stone-600 leading-relaxed">
              {paso.comoFunciona}
            </p>
          </div>

          <div className="bg-amber-50/60 border border-amber-200/50 rounded-lg px-3 py-2.5">
            <p className="text-xs font-medium text-amber-700/70 mb-0.5">
              Ejemplo
            </p>
            <p className="text-sm text-amber-900 font-medium">{paso.ejemplo}</p>
          </div>

          <Link
            href={paso.ruta}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 ${accentClasses.button}`}
          >
            {paso.rutaLabel}
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
}
