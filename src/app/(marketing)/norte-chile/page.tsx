import type { Metadata } from "next";
import Link from "next/link";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import { ROUTES } from "@/lib/constants/routes";

export const dynamic = "force-static";
export const revalidate = false;

export const metadata: Metadata = {
  title: "Software Agrícola para el Norte de Chile — AgriPlan",
  description:
    "AgriPlan es el software de gestión agrícola diseñado para el norte de Chile: Arica, Tarapacá y Antofagasta. Control de agua, ROI por cultivo y alertas automáticas. 6 meses gratis.",
  keywords: [
    "software agrícola norte de Chile",
    "gestión agua agrícola norte Chile",
    "planificación cultivos desierto Chile",
    "app agrícola Arica Tarapacá Antofagasta",
    "horticultura norte Chile software",
    "riego goteo norte Chile",
    "software campo offline norte Chile",
  ],
  openGraph: {
    title: "Software Agrícola para el Norte de Chile — AgriPlan",
    description:
      "Control de agua, ROI por cultivo y alertas automáticas para agricultores de Arica, Tarapacá y Antofagasta. 6 meses gratis, sin tarjeta.",
    type: "website",
    url: "https://agriplan.cl/norte-chile",
    locale: "es_CL",
  },
  alternates: {
    canonical: "https://agriplan.cl/norte-chile",
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
    "Software agrícola para el norte de Chile. Diseñado para las condiciones únicas de Arica, Tarapacá y Antofagasta: escasez hídrica, clima desértico y cultivos hortícolas de exportación.",
  inLanguage: "es-CL",
  areaServed: "Norte de Chile",
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

const REGIONES = [
  {
    nombre: "Arica y Parinacota",
    slug: "/arica",
    cultivos: ["Tomate Azapa", "Cebolla", "Pimiento", "Pepino"],
    desafio:
      "Escasez hídrica extrema. El valle de Azapa depende del río San José y pozos profundos.",
    color: "#2d6a4f",
  },
  {
    nombre: "Tarapacá",
    slug: "/tarapaca",
    cultivos: ["Cebolla", "Ajo", "Maracuyá", "Maíz"],
    desafio:
      "Valles con riego tecnificado. Presión sobre las fuentes de agua del altiplano.",
    color: "#1d4e89",
  },
  {
    nombre: "Antofagasta",
    slug: "#",
    cultivos: ["Tuna", "Pitahaya", "Alfalfa"],
    desafio:
      "El agua más cara del país. Agricultura de alta demanda tecnológica.",
    color: "#6b4226",
  },
];

const VENTAJAS = [
  {
    icon: "💧",
    titulo: "Diseñado para la escasez hídrica",
    texto:
      "AgriPlan calcula el agua exacta que necesita cada zona según el cultivo, la etapa de crecimiento y el clima de tu región. Evita el desperdicio y planifica recargas con anticipación.",
  },
  {
    icon: "📊",
    titulo: "ROI real por cultivo",
    texto:
      "Proyecta cuánto vas a ganar antes de plantar. Incluye precios de mercado del norte de Chile, costos de agua y producción estimada por hectárea.",
  },
  {
    icon: "📵",
    titulo: "Funciona sin internet",
    texto:
      "En zonas remotas del norte de Chile la señal no llega. AgriPlan guarda todos tus datos en el celular y sincroniza cuando hay conexión.",
  },
  {
    icon: "🌱",
    titulo: "Catálogo adaptado a la región",
    texto:
      "25+ cultivos del norte de Chile con datos de coeficiente Kc, duración de etapas y consumo de agua específicos para el clima desértico.",
  },
  {
    icon: "🔔",
    titulo: "Alertas automáticas",
    texto:
      "Te avisa cuándo el estanque está por quedarse sin agua, cuándo hay riesgo de encharcamiento o cuándo es momento de hacer el lavado salino.",
  },
  {
    icon: "💰",
    titulo: "Al alcance del pequeño agricultor",
    texto:
      "$9.990 CLP/mes. 6 meses de prueba gratuita, sin tarjeta de crédito. Sin contratos. Sin letra chica.",
  },
];

export default function NorteChilePage() {
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
          style={{ background: "#2d6a4f", color: "#fff" }}
        >
          Probar 6 meses gratis
        </Link>
      </nav>

      {/* HERO */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <p
          className="text-sm font-semibold uppercase tracking-widest mb-4"
          style={{ color: "#5a9a70" }}
        >
          Solución regional
        </p>
        <h1
          className="text-4xl md:text-5xl font-bold leading-tight mb-6"
          style={{ fontFamily: "var(--font-display)", color: "#1a2e1a" }}
        >
          Software agrícola para el{" "}
          <span style={{ color: "#2d6a4f" }}>norte de Chile</span>
        </h1>
        <p
          className="text-lg md:text-xl leading-relaxed mb-10 mx-auto max-w-2xl"
          style={{ color: "#4a5a4a" }}
        >
          Arica, Tarapacá y Antofagasta tienen condiciones únicas: escasez de
          agua, clima desértico y cultivos de exportación. AgriPlan fue
          construido específicamente para estas regiones.
        </p>
        <Link
          href={ROUTES.AUTH_REGISTRO}
          className="inline-flex items-center gap-2 font-bold text-lg px-8 py-4 rounded-xl min-h-[56px] transition-opacity hover:opacity-90"
          style={{ background: "#2d6a4f", color: "#fff" }}
        >
          Empezar gratis — 6 meses sin tarjeta
        </Link>
        <p className="mt-4 text-sm" style={{ color: "#8a9a80" }}>
          Después $9.990 CLP/mes. Sin contrato.
        </p>
      </section>

      {/* REGIONES */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2
          className="text-3xl font-bold text-center mb-12"
          style={{ fontFamily: "var(--font-display)", color: "#1a2e1a" }}
        >
          Cobertura por región
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {REGIONES.map((r) => (
            <div
              key={r.nombre}
              className="rounded-2xl p-6 border"
              style={{ background: "#fff", borderColor: "#e8e0d4" }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mb-4 text-sm"
                style={{ background: r.color }}
              >
                {r.nombre.charAt(0)}
              </div>
              <h3
                className="text-lg font-bold mb-2"
                style={{ color: "#1a2e1a" }}
              >
                {r.nombre}
              </h3>
              <p
                className="text-base leading-relaxed mb-4"
                style={{ color: "#5a6a50" }}
              >
                {r.desafio}
              </p>
              <div className="flex flex-wrap gap-2">
                {r.cultivos.map((c) => (
                  <span
                    key={c}
                    className="text-sm px-2.5 py-1 rounded-full font-medium"
                    style={{ background: "#f0f4e8", color: "#2d6a4f" }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* VENTAJAS */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2
          className="text-3xl font-bold text-center mb-4"
          style={{ fontFamily: "var(--font-display)", color: "#1a2e1a" }}
        >
          Por qué AgriPlan es diferente
        </h2>
        <p className="text-center text-base mb-12" style={{ color: "#5a6a50" }}>
          No es software genérico adaptado. Fue construido desde cero para el
          norte de Chile.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {VENTAJAS.map((v) => (
            <div
              key={v.titulo}
              className="rounded-xl p-6 border"
              style={{ background: "#fff", borderColor: "#e8e0d4" }}
            >
              <div className="text-3xl mb-3">{v.icon}</div>
              <h3
                className="text-base font-bold mb-2"
                style={{ color: "#1a2e1a" }}
              >
                {v.titulo}
              </h3>
              <p
                className="text-base leading-relaxed"
                style={{ color: "#5a6a50" }}
              >
                {v.texto}
              </p>
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
          Empieza hoy. Sin riesgos.
        </h2>
        <p
          className="text-lg leading-relaxed mb-10"
          style={{ color: "#4a5a4a" }}
        >
          6 meses gratis. Sin tarjeta de crédito. Sin instalación. Funciona en
          tu celular.
        </p>
        <Link
          href={ROUTES.AUTH_REGISTRO}
          className="inline-flex items-center gap-2 font-bold text-lg px-8 py-4 rounded-xl min-h-[56px] transition-opacity hover:opacity-90"
          style={{ background: "#2d6a4f", color: "#fff" }}
        >
          Crear cuenta gratis →
        </Link>
        <p className="mt-6">
          <Link
            href="/"
            className="text-sm underline"
            style={{ color: "#5a9a70" }}
          >
            ← Ver todas las funcionalidades
          </Link>
        </p>
      </section>

      {/* FOOTER */}
      <footer
        className="border-t py-8 text-center text-sm"
        style={{ borderColor: "#e8e0d4", color: "#8a9a80" }}
      >
        <p>
          © {new Date().getFullYear()} AgriPlan · Software agrícola para el
          norte de Chile
        </p>
        <p className="mt-2">
          <Link href="/" className="underline hover:opacity-70">
            Inicio
          </Link>
          {" · "}
          <Link href="/arica" className="underline hover:opacity-70">
            Arica
          </Link>
          {" · "}
          <Link href="/tarapaca" className="underline hover:opacity-70">
            Tarapacá
          </Link>
        </p>
      </footer>
    </div>
  );
}
