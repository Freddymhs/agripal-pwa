"use client";

import { useState } from "react";
import { GuiaPasoCard } from "./guia-paso-card";
import type { GuiaSeccionData } from "./guia-datos";

const SECCION_ESTILOS: Record<
  string,
  {
    headerBg: string;
    resultadoBg: string;
    resultadoText: string;
    cardButton: string;
    cardBorder: string;
    badge: string;
  }
> = {
  configurar: {
    headerBg: "bg-amber-700",
    resultadoBg: "bg-amber-50",
    resultadoText: "text-amber-800",
    cardButton: "bg-amber-700",
    cardBorder: "border-amber-300",
    badge: "bg-amber-100 text-amber-700",
  },
  operar: {
    headerBg: "bg-green-700",
    resultadoBg: "bg-green-50",
    resultadoText: "text-green-800",
    cardButton: "bg-green-700",
    cardBorder: "border-green-300",
    badge: "bg-green-100 text-green-700",
  },
  analizar: {
    headerBg: "bg-teal-700",
    resultadoBg: "bg-teal-50",
    resultadoText: "text-teal-800",
    cardButton: "bg-teal-700",
    cardBorder: "border-teal-300",
    badge: "bg-teal-100 text-teal-700",
  },
};

interface GuiaSeccionProps {
  seccion: GuiaSeccionData;
  inicialmenteAbierta?: boolean;
}

export function GuiaSeccion({
  seccion,
  inicialmenteAbierta = false,
}: GuiaSeccionProps) {
  const [abierta, setAbierta] = useState(inicialmenteAbierta);
  const estilos = SECCION_ESTILOS[seccion.id] ?? SECCION_ESTILOS.configurar;

  return (
    <section className="border border-stone-200 rounded-2xl overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setAbierta(!abierta)}
        className="w-full text-left px-5 py-4 flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-stone-900">{seccion.titulo}</h2>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${estilos.badge}`}
          >
            {seccion.pasos.length}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-stone-400 hidden sm:block">
            {seccion.subtitulo}
          </span>
          <svg
            className={`w-5 h-5 text-stone-400 transition-transform duration-200 ${
              abierta ? "rotate-180" : ""
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
        </div>
      </button>

      <div
        className={`px-5 pb-1 ${estilos.resultadoBg} border-t border-stone-100`}
      >
        <p className={`text-sm py-2 ${estilos.resultadoText} font-medium`}>
          {seccion.resultado}
        </p>
      </div>

      {abierta && (
        <div className="px-4 pb-4 pt-3 space-y-2.5">
          {seccion.pasos.map((paso) => (
            <GuiaPasoCard
              key={paso.id}
              paso={paso}
              accentClasses={{
                button: estilos.cardButton,
                border: estilos.cardBorder,
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
