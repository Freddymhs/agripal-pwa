import type { Metadata } from "next";
import Link from "next/link";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import { ROUTES } from "@/lib/constants/routes";

export const dynamic = "force-static";
export const revalidate = false;

export const metadata: Metadata = {
  title:
    "AgriPlan vs Alternativas — El mejor software agrícola para el norte de Chile",
  description:
    "Compara AgriPlan con AGROsmart, SpaceAG, Instacrops y otras opciones. Descubre por qué AgriPlan es la única solución diseñada para los agricultores del norte de Chile.",
  keywords: [
    "comparativa software agrícola Chile",
    "AgriPlan vs AGROsmart",
    "AgriPlan vs SpaceAG",
    "alternativas software agrícola Chile",
    "mejor app agricultores norte Chile",
    "software riego comparativa Chile",
  ],
  openGraph: {
    title: "AgriPlan vs Alternativas — Comparativa Software Agrícola Chile",
    description:
      "La única comparativa honesta de software agrícola para el norte de Chile. Precio, offline, regiones cubiertas y funcionalidades.",
    type: "website",
    url: "https://agriplan.cl/comparativa",
    locale: "es_CL",
  },
  alternates: {
    canonical: "https://agriplan.cl/comparativa",
  },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Comparativa de software agrícola para el norte de Chile",
  description:
    "Análisis comparativo de AgriPlan, AGROsmart, SpaceAG e Instacrops para agricultores del norte de Chile.",
  url: "https://agriplan.cl/comparativa",
  inLanguage: "es-CL",
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

type CellValue = string | boolean;

interface Competitor {
  nombre: string;
  enfoque: string;
  precio: string;
  agriplan: boolean;
}

interface Feature {
  feature: string;
  agriplan: CellValue;
  agroSmart: CellValue;
  spaceAG: CellValue;
  instacrops: CellValue;
}

const COMPETIDORES: Competitor[] = [
  {
    nombre: "AGROsmart",
    enfoque: "Cuaderno de campo y fruticultura",
    precio: "Sin precio público",
    agriplan: false,
  },
  {
    nombre: "SpaceAG",
    enfoque: "Fitosanitario, riego, workers",
    precio: "Sin precio público",
    agriplan: false,
  },
  {
    nombre: "Instacrops",
    enfoque: "IoT + software riego",
    precio: "Sin precio público",
    agriplan: false,
  },
  {
    nombre: "AGRI.cl",
    enfoque: "ERP empresas medianas/grandes",
    precio: "Sin precio público",
    agriplan: false,
  },
];

const FEATURES: Feature[] = [
  {
    feature: "Norte de Chile (Arica, Tarapacá)",
    agriplan: true,
    agroSmart: false,
    spaceAG: false,
    instacrops: false,
  },
  {
    feature: "Funciona 100% sin internet",
    agriplan: true,
    agroSmart: false,
    spaceAG: true,
    instacrops: false,
  },
  {
    feature: "Precio público visible",
    agriplan: "$9.990/mes",
    agroSmart: false,
    spaceAG: false,
    instacrops: false,
  },
  {
    feature: "Prueba gratuita sin tarjeta",
    agriplan: "6 meses",
    agroSmart: "❓",
    spaceAG: "❓",
    instacrops: "❓",
  },
  {
    feature: "ROI proyectado por cultivo",
    agriplan: true,
    agroSmart: false,
    spaceAG: false,
    instacrops: false,
  },
  {
    feature: "Control de agua por zona",
    agriplan: true,
    agroSmart: false,
    spaceAG: true,
    instacrops: true,
  },
  {
    feature: "Catálogo cultivos norte Chile",
    agriplan: "25+ cultivos",
    agroSmart: false,
    spaceAG: false,
    instacrops: false,
  },
  {
    feature: "Alertas automáticas agua/riesgo",
    agriplan: true,
    agroSmart: false,
    spaceAG: true,
    instacrops: true,
  },
  {
    feature: "Diseñado para pequeño agricultor",
    agriplan: true,
    agroSmart: false,
    spaceAG: false,
    instacrops: false,
  },
  {
    feature: "Sin hardware requerido",
    agriplan: true,
    agroSmart: true,
    spaceAG: false,
    instacrops: false,
  },
];

function CellIcon({ value }: { value: CellValue }) {
  if (value === true)
    return (
      <span style={{ color: "#2d6a4f" }} className="font-bold text-lg">
        ✓
      </span>
    );
  if (value === false)
    return (
      <span style={{ color: "#c0392b" }} className="font-bold text-lg">
        ✗
      </span>
    );
  return (
    <span className="text-sm font-semibold" style={{ color: "#2d6a4f" }}>
      {value}
    </span>
  );
}

export default function ComparativaPage() {
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
          Comparativa honesta
        </p>
        <h1
          className="text-4xl md:text-5xl font-bold leading-tight mb-6"
          style={{ fontFamily: "var(--font-display)", color: "#1a2e1a" }}
        >
          AgriPlan vs las <span style={{ color: "#2d6a4f" }}>alternativas</span>
        </h1>
        <p
          className="text-lg md:text-xl leading-relaxed mb-6 mx-auto max-w-2xl"
          style={{ color: "#4a5a4a" }}
        >
          Ningún competidor tiene cobertura, precio visible ni funcionalidades
          específicas para el norte de Chile. Aquí está la comparativa completa.
        </p>
        <p className="text-base" style={{ color: "#8a9a80" }}>
          Última actualización: marzo 2026. Datos obtenidos de sitios públicos
          de cada empresa.
        </p>
      </section>

      {/* TABLA COMPARATIVA */}
      <section className="max-w-6xl mx-auto px-4 py-8 pb-16">
        <div
          className="overflow-x-auto rounded-2xl border"
          style={{ borderColor: "#e8e0d4" }}
        >
          <table
            className="w-full min-w-[700px]"
            style={{ background: "#fff" }}
          >
            <thead>
              <tr style={{ background: "#f0f4e8" }}>
                <th
                  className="text-left p-4 text-sm font-semibold"
                  style={{ color: "#4a5a4a", width: "30%" }}
                >
                  Característica
                </th>
                <th
                  className="p-4 text-center text-sm font-bold"
                  style={{ color: "#2d6a4f", background: "#e8f4ec" }}
                >
                  AgriPlan ✦
                </th>
                <th
                  className="p-4 text-center text-sm font-semibold"
                  style={{ color: "#4a5a4a" }}
                >
                  AGROsmart
                </th>
                <th
                  className="p-4 text-center text-sm font-semibold"
                  style={{ color: "#4a5a4a" }}
                >
                  SpaceAG
                </th>
                <th
                  className="p-4 text-center text-sm font-semibold"
                  style={{ color: "#4a5a4a" }}
                >
                  Instacrops
                </th>
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((f, i) => (
                <tr
                  key={f.feature}
                  style={{ background: i % 2 === 0 ? "#fff" : "#fafaf7" }}
                  className="border-t"
                >
                  <td
                    className="p-4 text-base"
                    style={{ color: "#1a2e1a", borderColor: "#f0ece8" }}
                  >
                    {f.feature}
                  </td>
                  <td
                    className="p-4 text-center"
                    style={{ background: i % 2 === 0 ? "#f8fcf8" : "#f0f8f0" }}
                  >
                    <CellIcon value={f.agriplan} />
                  </td>
                  <td className="p-4 text-center">
                    <CellIcon value={f.agroSmart} />
                  </td>
                  <td className="p-4 text-center">
                    <CellIcon value={f.spaceAG} />
                  </td>
                  <td className="p-4 text-center">
                    <CellIcon value={f.instacrops} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm mt-4 text-center" style={{ color: "#8a9a80" }}>
          ❓ = Información no disponible públicamente. ✦ = Datos verificados.
        </p>
      </section>

      {/* COMPETIDORES DETALLE */}
      <section className="py-16" style={{ background: "#f5ede0" }}>
        <div className="max-w-5xl mx-auto px-6">
          <h2
            className="text-3xl font-bold text-center mb-4"
            style={{ fontFamily: "var(--font-display)", color: "#1a2e1a" }}
          >
            Análisis de cada alternativa
          </h2>
          <p
            className="text-center text-base mb-12"
            style={{ color: "#6a5a4a" }}
          >
            Por qué ninguna cubre el norte de Chile como lo hace AgriPlan.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {COMPETIDORES.map((c) => (
              <div
                key={c.nombre}
                className="rounded-xl p-6 border"
                style={{ background: "#fff", borderColor: "#e8d8c4" }}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3
                    className="text-base font-bold"
                    style={{ color: "#1a2e1a" }}
                  >
                    {c.nombre}
                  </h3>
                  <span
                    className="text-sm px-2 py-0.5 rounded-full"
                    style={{ background: "#fde8d0", color: "#8a4a2a" }}
                  >
                    Sin foco norte Chile
                  </span>
                </div>
                <p
                  className="text-base leading-relaxed mb-2"
                  style={{ color: "#5a4a3a" }}
                >
                  <span className="font-semibold">Foco:</span> {c.enfoque}
                </p>
                <p
                  className="text-base leading-relaxed"
                  style={{ color: "#5a4a3a" }}
                >
                  <span className="font-semibold">Precio:</span> {c.precio}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LA DIFERENCIA */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h2
          className="text-3xl font-bold mb-6"
          style={{ fontFamily: "var(--font-display)", color: "#1a2e1a" }}
        >
          Lo que solo AgriPlan tiene
        </h2>
        <div className="grid md:grid-cols-3 gap-6 text-left mb-16">
          {[
            {
              titulo: "Datos reales del norte",
              texto:
                "Kc, evapotranspiración y consumo de agua calibrados para Arica, Tarapacá y Antofagasta. No son datos genéricos.",
            },
            {
              titulo: "Precio transparente",
              texto:
                "$9.990/mes con 6 meses gratis y sin tarjeta. Ningún competidor publica su precio.",
            },
            {
              titulo: "Sin hardware",
              texto:
                "No necesitas sensores ni instalación. Solo el celular que ya tienes.",
            },
          ].map((item) => (
            <div
              key={item.titulo}
              className="rounded-xl p-6 border"
              style={{ background: "#fff", borderColor: "#e8e0d4" }}
            >
              <h3
                className="text-base font-bold mb-2"
                style={{ color: "#2d6a4f" }}
              >
                {item.titulo}
              </h3>
              <p
                className="text-base leading-relaxed"
                style={{ color: "#5a6a50" }}
              >
                {item.texto}
              </p>
            </div>
          ))}
        </div>
        <Link
          href={ROUTES.AUTH_REGISTRO}
          className="inline-flex items-center gap-2 font-bold text-lg px-8 py-4 rounded-xl min-h-[56px] transition-opacity hover:opacity-90"
          style={{ background: "#2d6a4f", color: "#fff" }}
        >
          Probar AgriPlan gratis — 6 meses →
        </Link>
        <p className="mt-4 text-sm" style={{ color: "#8a9a80" }}>
          Sin tarjeta. Sin contrato. Sin instalación.
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
          <Link href="/norte-chile" className="underline hover:opacity-70">
            Norte de Chile
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
