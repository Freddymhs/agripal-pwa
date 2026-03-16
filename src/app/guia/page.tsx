"use client";

import { useRef } from "react";
import { PageLayout } from "@/components/layout";
import { GuiaHero } from "@/components/guia/guia-hero";
import { GuiaSeccion } from "@/components/guia/guia-seccion";
import { GUIA_SECCIONES } from "@/components/guia/guia-datos";

export default function GuiaPage() {
  const seccionesRef = useRef<HTMLDivElement>(null);

  const handleEmpezar = () => {
    const el = seccionesRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 16;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <PageLayout headerColor="amber">
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <GuiaHero onEmpezar={handleEmpezar} />

        <div ref={seccionesRef} className="space-y-4">
          {GUIA_SECCIONES.map((seccion, i) => (
            <GuiaSeccion
              key={seccion.id}
              seccion={seccion}
              inicialmenteAbierta={i === 0}
            />
          ))}
        </div>

        <footer className="text-center text-xs text-stone-400 py-4">
          Esta guía es de referencia. Puedes volver cuando quieras desde el menú
          Avanzado.
        </footer>
      </main>
    </PageLayout>
  );
}
