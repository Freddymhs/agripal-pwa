import type { Metadata } from "next";
import Link from "next/link";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import { ROUTES } from "@/lib/constants/routes";

export const dynamic = "force-static";
export const revalidate = false;

export const metadata: Metadata = {
  title: "Software Agrícola para Agricultores de Arica — AgriPlan",
  description:
    "AgriPlan es el software de gestión agrícola para el valle de Azapa y Lluta. Controla el agua de tus zonas, proyecta el ROI del tomate, pimiento y cebolla. 6 meses gratis.",
  keywords: [
    "software agrícola Arica",
    "app agricultores Arica Parinacota",
    "gestión agua Azapa",
    "riego tomate Azapa",
    "planificación cultivos valle Azapa",
    "software campo Arica",
    "cuánta agua necesita el tomate Arica",
    "control riego Lluta",
  ],
  openGraph: {
    title: "Software Agrícola para Arica y el Valle de Azapa — AgriPlan",
    description:
      "Controla el agua, proyecta el ROI del tomate y pimiento, y recibe alertas automáticas. Diseñado para el valle de Azapa y Lluta.",
    type: "website",
    url: "https://agriplan.cl/arica",
    locale: "es_CL",
  },
  alternates: {
    canonical: "https://agriplan.cl/arica",
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
    "Software de gestión agrícola para los valles de Azapa y Lluta en Arica. Calcula el agua exacta para tomate, pimiento, cebolla y pepino según el clima desértico de la región.",
  inLanguage: "es-CL",
  areaServed: "Arica y Parinacota, Chile",
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

const CULTIVOS_ARICA = [
  {
    nombre: "Tomate Azapa",
    kc: "1.15",
    agua: "5.200 m³/ha/año",
    ciclo: "120-150 días",
    roi: "Alto — mercado de exportación",
  },
  {
    nombre: "Pimiento",
    kc: "1.05",
    agua: "4.800 m³/ha/año",
    ciclo: "110-130 días",
    roi: "Muy alto — demanda constante",
  },
  {
    nombre: "Cebolla",
    kc: "1.00",
    agua: "4.200 m³/ha/año",
    ciclo: "90-120 días",
    roi: "Medio-alto — cultivo base",
  },
  {
    nombre: "Pepino",
    kc: "0.95",
    agua: "3.900 m³/ha/año",
    ciclo: "80-100 días",
    roi: "Alto — ciclo corto, rápido retorno",
  },
];

const PROBLEMAS = [
  {
    titulo: "El agua es el recurso más crítico",
    texto:
      "En Azapa, cada metro cúbico cuenta. AgriPlan calcula exactamente cuánta agua necesita cada zona según el cultivo y la etapa del ciclo. Sin estimaciones a ojo.",
  },
  {
    titulo: "El tomate Azapa tiene su propio Kc",
    texto:
      "El coeficiente de cultivo (Kc) del tomate varía por etapa: 0.45 en plántula, 0.75 en crecimiento, 1.15 en floración. AgriPlan lo aplica automáticamente.",
  },
  {
    titulo: "La salinidad del suelo acumula daño",
    texto:
      "El agua de Azapa tiene alto contenido de sales. AgriPlan te recuerda cuándo hacer el lavado salino para evitar pérdidas de producción.",
  },
  {
    titulo: "La señal no llega a todo el valle",
    texto:
      "En zonas remotas de Lluta y el interior de Azapa no hay señal. AgriPlan funciona 100% sin internet y sincroniza cuando estás en zona con cobertura.",
  },
];

export default function AricaPage() {
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
          Valle de Azapa · Valle de Lluta · Arica y Parinacota
        </p>
        <h1
          className="text-4xl md:text-5xl font-bold leading-tight mb-6"
          style={{ fontFamily: "var(--font-display)", color: "#1a2e1a" }}
        >
          Software agrícola para <span style={{ color: "#2d6a4f" }}>Arica</span>
        </h1>
        <p
          className="text-lg md:text-xl leading-relaxed mb-10 mx-auto max-w-2xl"
          style={{ color: "#4a5a4a" }}
        >
          Diseñado para los valles de Azapa y Lluta. Controla el agua, proyecta
          el ROI del tomate y pimiento, y recibe alertas antes de perder
          producción.
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

      {/* CULTIVOS */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2
          className="text-3xl font-bold text-center mb-4"
          style={{ fontFamily: "var(--font-display)", color: "#1a2e1a" }}
        >
          Cultivos del norte de Arica en AgriPlan
        </h2>
        <p className="text-center text-base mb-12" style={{ color: "#5a6a50" }}>
          Datos de coeficiente Kc, consumo hídrico y ROI específicos para el
          clima de Arica.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {CULTIVOS_ARICA.map((c) => (
            <div
              key={c.nombre}
              className="rounded-xl p-5 border"
              style={{ background: "#fff", borderColor: "#e8e0d4" }}
            >
              <h3
                className="text-base font-bold mb-3"
                style={{ color: "#1a2e1a" }}
              >
                {c.nombre}
              </h3>
              <div className="space-y-1.5 text-sm" style={{ color: "#5a6a50" }}>
                <p>
                  <span className="font-semibold">Kc máx:</span> {c.kc}
                </p>
                <p>
                  <span className="font-semibold">Agua:</span> {c.agua}
                </p>
                <p>
                  <span className="font-semibold">Ciclo:</span> {c.ciclo}
                </p>
                <p>
                  <span className="font-semibold">ROI:</span> {c.roi}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PROBLEMAS ESPECÍFICOS */}
      <section className="py-16" style={{ background: "#f0f4e8" }}>
        <div className="max-w-5xl mx-auto px-6">
          <h2
            className="text-3xl font-bold text-center mb-12"
            style={{ fontFamily: "var(--font-display)", color: "#1a2e1a" }}
          >
            Los problemas reales del agricultor de Arica
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {PROBLEMAS.map((p) => (
              <div
                key={p.titulo}
                className="rounded-xl p-6 border"
                style={{ background: "#fff", borderColor: "#d4e8d4" }}
              >
                <h3
                  className="text-base font-bold mb-2"
                  style={{ color: "#1a2e1a" }}
                >
                  {p.titulo}
                </h3>
                <p
                  className="text-base leading-relaxed"
                  style={{ color: "#5a6a50" }}
                >
                  {p.texto}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h2
          className="text-3xl font-bold mb-6"
          style={{ fontFamily: "var(--font-display)", color: "#1a2e1a" }}
        >
          Prueba AgriPlan en tu campo de Arica
        </h2>
        <p
          className="text-lg leading-relaxed mb-10"
          style={{ color: "#4a5a4a" }}
        >
          6 meses gratis. Sin tarjeta. Funciona en celular Android e iPhone.
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
            href="/norte-chile"
            className="text-sm underline"
            style={{ color: "#5a9a70" }}
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
          © {new Date().getFullYear()} AgriPlan · Software agrícola para Arica y
          Parinacota
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
          <Link href="/tarapaca" className="underline hover:opacity-70">
            Tarapacá
          </Link>
        </p>
      </footer>
    </div>
  );
}
