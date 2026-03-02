import type { Metadata } from "next";
import Link from "next/link";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import { ROUTES } from "@/lib/constants/routes";

export const dynamic = "force-static";
export const revalidate = false;

export const metadata: Metadata = {
  title: "Software Agrícola para Tarapacá e Iquique — AgriPlan",
  description:
    "AgriPlan es el software de gestión agrícola para Tarapacá. Controla el agua en los valles de Camiña, Pica y Quisma. ROI por cultivo, alertas automáticas. 6 meses gratis.",
  keywords: [
    "software agrícola Tarapacá",
    "app agricultores Iquique",
    "gestión agua Pica Tarapacá",
    "riego Camiña Tarapacá",
    "planificación cultivos Tarapacá",
    "software campo Iquique",
    "horticultura Tarapacá software",
    "control agua valle Pica",
  ],
  openGraph: {
    title: "Software Agrícola para Tarapacá e Iquique — AgriPlan",
    description:
      "Gestión de agua, ROI por cultivo y alertas automáticas para los valles de Tarapacá. 6 meses gratis, sin tarjeta.",
    type: "website",
    url: "https://agriplan.cl/tarapaca",
    locale: "es_CL",
  },
  alternates: {
    canonical: "https://agriplan.cl/tarapaca",
  },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "AgriPlan",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web, iOS, Android",
  url: "https://agriplan.cl",
  description:
    "Software de gestión agrícola para los valles y quebradas de Tarapacá. Incluye catálogo de cultivos para el clima desértico del norte de Chile con datos de riego tecnificado.",
  inLanguage: "es-CL",
  areaServed: "Tarapacá, Chile",
  offers: {
    "@type": "Offer",
    price: "9990",
    priceCurrency: "CLP",
    description: "6 meses de prueba gratuita, sin tarjeta de crédito",
    availability: "https://schema.org/InStock",
  },
};

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const ZONAS_TARAPACA = [
  {
    nombre: "Valle de Camiña",
    cultivos: ["Cebolla", "Ajo", "Maíz andino"],
    caracteristica: "Cultivos tradicionales andinos con riego de vertiente.",
  },
  {
    nombre: "Oasis de Pica",
    cultivos: ["Limonero", "Naranja de Pica", "Mango"],
    caracteristica:
      "Cultivos subtropicales de alta valorización con agua de Quisma.",
  },
  {
    nombre: "Pampa del Tamarugal",
    cultivos: ["Alfalfa", "Maíz", "Tomate industrial"],
    caracteristica:
      "Riego tecnificado con agua subterránea del acuífero Pampa.",
  },
];

const FUNCIONES = [
  {
    icon: "💧",
    titulo: "Control de estanques y fuentes",
    texto:
      "Registra tus fuentes de agua (pozo, canal, vertiente) y calcula cuántos días te quedan antes de necesitar recarga.",
  },
  {
    icon: "📈",
    titulo: "Proyección de rentabilidad",
    texto:
      "Ingresa tus costos de agua, semillas y mano de obra. AgriPlan proyecta el ROI del ciclo completo antes de que plantes.",
  },
  {
    icon: "🗓️",
    titulo: "Calendario de cultivo",
    texto:
      "Planifica hasta 12 meses hacia adelante. Visualiza replantas, cosechas y lavados salinos en un solo calendario.",
  },
  {
    icon: "📵",
    titulo: "Sin internet en terreno",
    texto:
      "Desde Camiña hasta Pica la señal es intermitente. AgriPlan funciona offline y sincroniza cuando hay conexión.",
  },
];

export default function TarapacaPage() {
  return (
    <div
      className={`${playfair.variable} ${jakarta.variable} min-h-screen`}
      style={{
        background: "#fafaf7",
        fontFamily: "var(--font-body, sans-serif)",
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />

      {/* NAV */}
      <nav
        className="sticky top-0 z-50 border-b flex items-center justify-between px-6 py-3"
        style={{ background: "#fafaf7", borderColor: "#e8e0d4" }}
      >
        <Link
          href="/"
          className="font-bold text-lg tracking-tight"
          style={{ color: "#1a2e1a", fontFamily: "var(--font-display)" }}
        >
          AgriPlan
        </Link>
        <Link
          href={ROUTES.AUTH_REGISTRO}
          className="text-sm font-semibold rounded-lg px-4 py-2 min-h-[44px] flex items-center transition-opacity hover:opacity-90"
          style={{ background: "#1d4e89", color: "#fff" }}
        >
          Probar 6 meses gratis
        </Link>
      </nav>

      {/* HERO */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <p
          className="text-sm font-semibold uppercase tracking-widest mb-4"
          style={{ color: "#4a7abf" }}
        >
          Camiña · Pica · Quisma · Pampa del Tamarugal
        </p>
        <h1
          className="text-4xl md:text-5xl font-bold leading-tight mb-6"
          style={{ fontFamily: "var(--font-display)", color: "#1a2e1a" }}
        >
          Software agrícola para{" "}
          <span style={{ color: "#1d4e89" }}>Tarapacá</span>
        </h1>
        <p
          className="text-lg md:text-xl leading-relaxed mb-10 mx-auto max-w-2xl"
          style={{ color: "#4a5a4a" }}
        >
          Para los valles y quebradas de Tarapacá: Camiña, Pica y la Pampa del
          Tamarugal. Gestión de agua, planificación de cultivos y ROI
          proyectado.
        </p>
        <Link
          href={ROUTES.AUTH_REGISTRO}
          className="inline-flex items-center gap-2 font-bold text-lg px-8 py-4 rounded-xl min-h-[56px] transition-opacity hover:opacity-90"
          style={{ background: "#1d4e89", color: "#fff" }}
        >
          Empezar gratis — 6 meses sin tarjeta
        </Link>
        <p className="mt-4 text-sm" style={{ color: "#8a9a80" }}>
          Después $9.990 CLP/mes. Sin contrato.
        </p>
      </section>

      {/* ZONAS */}
      <section className="py-16" style={{ background: "#f0f4f8" }}>
        <div className="max-w-5xl mx-auto px-6">
          <h2
            className="text-3xl font-bold text-center mb-12"
            style={{ fontFamily: "var(--font-display)", color: "#1a2e1a" }}
          >
            Zonas agrícolas de Tarapacá
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {ZONAS_TARAPACA.map((z) => (
              <div
                key={z.nombre}
                className="rounded-xl p-6 border"
                style={{ background: "#fff", borderColor: "#c8d8e8" }}
              >
                <h3
                  className="text-base font-bold mb-2"
                  style={{ color: "#1a2e1a" }}
                >
                  {z.nombre}
                </h3>
                <p
                  className="text-base leading-relaxed mb-4"
                  style={{ color: "#5a6a7a" }}
                >
                  {z.caracteristica}
                </p>
                <div className="flex flex-wrap gap-2">
                  {z.cultivos.map((c) => (
                    <span
                      key={c}
                      className="text-sm px-2.5 py-1 rounded-full font-medium"
                      style={{ background: "#e8f0f8", color: "#1d4e89" }}
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FUNCIONES */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2
          className="text-3xl font-bold text-center mb-12"
          style={{ fontFamily: "var(--font-display)", color: "#1a2e1a" }}
        >
          Lo que AgriPlan hace por ti
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {FUNCIONES.map((f) => (
            <div
              key={f.titulo}
              className="rounded-xl p-6 border flex gap-4"
              style={{ background: "#fff", borderColor: "#e8e0d4" }}
            >
              <div className="text-3xl shrink-0">{f.icon}</div>
              <div>
                <h3
                  className="text-base font-bold mb-2"
                  style={{ color: "#1a2e1a" }}
                >
                  {f.titulo}
                </h3>
                <p
                  className="text-base leading-relaxed"
                  style={{ color: "#5a6a50" }}
                >
                  {f.texto}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h2
          className="text-3xl font-bold mb-6"
          style={{ fontFamily: "var(--font-display)", color: "#1a2e1a" }}
        >
          Prueba AgriPlan en Tarapacá
        </h2>
        <p
          className="text-lg leading-relaxed mb-10"
          style={{ color: "#4a5a4a" }}
        >
          6 meses gratis. Sin tarjeta. Sin instalación. Desde el celular.
        </p>
        <Link
          href={ROUTES.AUTH_REGISTRO}
          className="inline-flex items-center gap-2 font-bold text-lg px-8 py-4 rounded-xl min-h-[56px] transition-opacity hover:opacity-90"
          style={{ background: "#1d4e89", color: "#fff" }}
        >
          Crear cuenta gratis →
        </Link>
        <p className="mt-6">
          <Link
            href="/norte-chile"
            className="text-sm underline"
            style={{ color: "#4a7abf" }}
          >
            ← Ver software para el norte de Chile
          </Link>
        </p>
      </section>

      {/* FOOTER */}
      <footer
        className="border-t py-8 text-center text-sm"
        style={{ borderColor: "#e8e0d4", color: "#8a9a80" }}
      >
        <p>
          © {new Date().getFullYear()} AgriPlan · Software agrícola para
          Tarapacá
        </p>
        <p className="mt-2">
          <Link href="/" className="underline hover:opacity-70">
            Inicio
          </Link>
          {" · "}
          <Link href="/norte-chile" className="underline hover:opacity-70">
            Norte de Chile
          </Link>
          {" · "}
          <Link href="/arica" className="underline hover:opacity-70">
            Arica
          </Link>
        </p>
      </footer>
    </div>
  );
}
