import Link from "next/link";
import { ROUTES } from "@/lib/constants/routes";
import { LandingAccessButton } from "@/components/landing/landing-access-button";

export const dynamic = "force-static";

const features = [
  {
    title: "PWA offline-first",
    description:
      "Funciona sin señal; datos en IndexedDB + Dexie con sincronización preparada.",
  },
  {
    title: "Mapa PixiJS",
    description:
      "Canvas 2D con snap-to-grid, selección múltiple y drag & drop para terrenos y zonas.",
  },
  {
    title: "Motor hídrico y ROI",
    description:
      "Kc por etapa, proyección anual, punto de equilibrio y alertas de riesgo.",
  },
  {
    title: "Alertas inteligentes",
    description:
      "Déficit hídrico, GDD para plagas, salinidad y eventos simulados.",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-100 text-gray-900">
      <div className="max-w-6xl mx-auto px-6 py-16 lg:py-20">
        <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 mb-14">
          <div>
            <p className="text-sm uppercase tracking-widest text-green-700 font-semibold">
              AgriPlan
            </p>
            <h1 className="mt-3 text-4xl lg:text-5xl font-extrabold leading-tight text-gray-900">
              Planificación agrícola offline-first
              <br />
              para agricultores de Arica
            </h1>
            <p className="mt-4 text-lg text-gray-700 max-w-2xl">
              PWA en Next.js 16. Datos locales en IndexedDB, lógica de agua y
              ROI multi-año, y un mapa PixiJS para diseñar terrenos, zonas y
              cultivos sin depender de la red.
            </p>
            <LandingAccessButton />
          </div>
          <div className="w-full lg:w-auto">
            <div className="rounded-2xl border border-green-100 bg-white/70 shadow-xl p-6 backdrop-blur">
              <div className="text-sm text-green-700 font-semibold mb-2">
                Arquitectura
              </div>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Next.js App Router usado como router + bundler</li>
                <li>• 100% client-side para flujos del planner</li>
                <li>• Dexie.js sobre IndexedDB (sin backend en runtime)</li>
                <li>• React Query para cache e invalidación</li>
              </ul>
            </div>
          </div>
        </header>

        <section className="grid lg:grid-cols-2 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-green-100 bg-white/80 p-6 shadow-sm"
            >
              <h3 className="text-xl font-semibold text-gray-900">
                {feature.title}
              </h3>
              <p className="mt-2 text-gray-700">{feature.description}</p>
            </div>
          ))}
        </section>

        <section className="mt-10 rounded-2xl border border-green-100 bg-white p-6 shadow-md">
          <h2 className="text-2xl font-bold text-gray-900">Por qué probarlo</h2>
          <p className="mt-3 text-gray-700">
            Es un MVP técnico con dominio rico: cálculo hídrico, ROI agrícola,
            alertas y mapa PixiJS. Falta backend real y más tests E2E, pero es
            ideal para demostraciones offline en terreno.
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <Link
              href={ROUTES.AUTH_LOGIN}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors"
            >
              Probar ahora
            </Link>
            <span className="text-sm text-gray-600 self-center">
              ¿Ya tienes sesión? entra directo al planner.
            </span>
          </div>
        </section>
      </div>
    </main>
  );
}
