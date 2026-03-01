import Link from "next/link";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import { ROUTES } from "@/lib/constants/routes";
import { LandingAccessButton } from "@/components/landing/landing-access-button";

export const dynamic = "force-static";
export const revalidate = false;

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

const NAV_LINKS = [
  { label: "El problema", href: "#problema" },
  { label: "Funciones", href: "#funciones" },
  { label: "ROI", href: "#roi" },
  { label: "Precio", href: "#precio" },
] as const;

const PAIN_POINTS = [
  {
    num: "01",
    problema: "¿El agua alcanza?",
    solucion:
      "AgriPlan te dice exactamente cuánta agua necesita cada zona según el cultivo y la época. Sin sorpresas de mitad de temporada.",
  },
  {
    num: "02",
    problema: "¿Conviene plantar esto?",
    solucion:
      "ROI proyectado con precios reales de Arica. Sabes si un cultivo va a dar plata o pérdidas antes de invertir un peso.",
  },
  {
    num: "03",
    problema: "Sin señal, sin herramientas",
    solucion:
      "Funciona 100% offline. Diseña zonas, registra agua y consulta alertas aunque estés en el cerro sin conexión.",
  },
] as const;

const FEATURES = [
  {
    label: "Terreno",
    title: "Dibuja tu campo",
    description:
      "Marca tus zonas de cultivo, bodega y estanques en un mapa fácil de usar. Ve todo tu campo en pantalla.",
  },
  {
    label: "Agua",
    title: "Control de agua",
    description:
      "Sabes cuánta agua gasta cada zona. Te avisa si te falta agua o hay exceso antes de que sea tarde.",
  },
  {
    label: "Economía",
    title: "¿Cuánto voy a ganar?",
    description:
      "Calcula costos, ganancias y cuándo recuperas la inversión. Sin planillas. Sin lápiz.",
  },
  {
    label: "Alertas",
    title: "Alertas automáticas",
    description:
      "Plagas, replanta, lavado salino, encharcamiento. Te avisa antes de que el daño sea irreversible.",
  },
  {
    label: "Catálogo",
    title: "25+ cultivos de Arica",
    description:
      "Datos reales de la región: tomate, maracuyá, pitahaya, guayaba y más. No promedios nacionales.",
  },
  {
    label: "Offline",
    title: "Funciona sin internet",
    description:
      "100% operativo offline. Ideal para el campo donde no hay señal. Se sincroniza cuando hay conexión.",
  },
] as const;

const CULTIVOS = [
  {
    nombre: "Tuna",
    beneficio: "Bajo costo, poca agua. Base estable del ingreso.",
    tier: "Base",
  },
  {
    nombre: "Pitahaya",
    beneficio: "Alto precio por kg. Alto margen con poca superficie.",
    tier: "Premium",
  },
  {
    nombre: "Uva Primor",
    beneficio: "Ventana adelantada = precio 3–5x vs temporada normal.",
    tier: "Exportación",
  },
  {
    nombre: "Maracuyá",
    beneficio: "Retorno rápido (6–8 meses). Útil para liquidez año 1.",
    tier: "Liquidez",
  },
] as const;

const PROYECCIONES = [
  {
    año: "Año 1",
    ingreso: "$500K – $1M",
    detalle: "Primeras cosechas. Inversión inicial recuperándose.",
    highlight: false,
  },
  {
    año: "Año 2",
    ingreso: "$5M – $8M",
    detalle: "Inversiones campo + suscripciones del software.",
    highlight: false,
  },
  {
    año: "Año 3",
    ingreso: "$10M – $15M",
    detalle: "60–80% del terreno produciendo. Margen neto $4–6M.",
    highlight: true,
  },
] as const;

const CHECKLIST = [
  "Mapa de terreno con zonas y plantas",
  "Control de agua por zona y estanque",
  "ROI proyectado a 4 años",
  "Alertas automáticas de riesgo",
  "Catálogo con 25+ cultivos de Arica",
  "Funciona 100% sin internet",
] as const;

export default function LandingPage() {
  return (
    <main
      className={`${playfair.variable} ${jakarta.variable} min-h-screen`}
      style={{
        fontFamily: "var(--font-body, sans-serif)",
        background: "#faf7f2",
        color: "#1c2e1a",
      }}
    >
      {/* ─── NAV ─── */}
      <nav
        style={{
          background: "rgba(250,247,242,0.95)",
          borderBottom: "1px solid #e0d4be",
        }}
        className="sticky top-0 z-10 backdrop-blur"
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="font-bold text-xl tracking-tight"
              style={{ fontFamily: "var(--font-display)", color: "#1c2e1a" }}
            >
              AgriPlan
            </span>
            <span
              className="hidden sm:inline text-xs rounded px-2 py-0.5 font-medium"
              style={{ background: "#e0d4be", color: "#5a4a30" }}
            >
              Arica, Chile
            </span>
          </div>

          <div className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm transition-colors hover:opacity-70"
                style={{ color: "#4a5a40" }}
              >
                {l.label}
              </a>
            ))}
          </div>

          <Link
            href={ROUTES.AUTH_REGISTRO}
            className="text-sm font-semibold rounded-lg px-4 py-2 transition-opacity hover:opacity-90 shrink-0"
            style={{ background: "#2d6a4f", color: "#fff" }}
          >
            Probar gratis
          </Link>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section
        style={{
          background: "#1c2e1a",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Grain texture */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
            pointerEvents: "none",
            opacity: 0.6,
          }}
        />
        {/* Accent glow */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "-20%",
            right: "-10%",
            width: "50%",
            height: "80%",
            background:
              "radial-gradient(ellipse, rgba(44,106,79,0.15) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div className="max-w-6xl mx-auto px-6 pt-20 pb-8 lg:pt-28 lg:pb-10 relative">
          <div className="max-w-3xl">
            <p
              className="text-xs font-bold uppercase tracking-widest mb-6"
              style={{ color: "#7fb38a", letterSpacing: "0.16em" }}
            >
              Software para agricultores de Arica
            </p>

            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2.8rem, 7vw, 5rem)",
                fontWeight: 700,
                color: "#f5f0e8",
                lineHeight: 1.08,
                marginBottom: "1.5rem",
              }}
            >
              Deja de plantar
              <br />
              <em style={{ color: "#c4622d", fontStyle: "italic" }}>a ojo.</em>
            </h1>

            <p
              style={{
                color: "#9db89e",
                fontSize: "1.15rem",
                lineHeight: 1.7,
                maxWidth: "38rem",
                marginBottom: "2rem",
              }}
            >
              AgriPlan te dice cuánta agua consume cada zona, cuándo recuperas
              tu inversión y qué cultivos tienen mejor ROI{" "}
              <strong style={{ color: "#d4c9b0" }}>
                antes de gastar un peso
              </strong>
              .
            </p>

            <div className="flex flex-wrap gap-5 mb-10">
              {(
                [
                  "20 días gratis, sin tarjeta",
                  "Funciona sin internet",
                  "Datos reales de Arica",
                ] as const
              ).map((b) => (
                <span
                  key={b}
                  className="flex items-center gap-2 text-sm"
                  style={{ color: "#9db89e" }}
                >
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: "#7fb38a" }}
                  />
                  {b}
                </span>
              ))}
            </div>

            <LandingAccessButton />
          </div>
        </div>

        {/* Diagonal cut to next section */}
        <div
          aria-hidden
          style={{
            height: 56,
            background: "#faf7f2",
            clipPath: "polygon(0 100%, 100% 0, 100% 100%)",
          }}
        />
      </section>

      {/* ─── EL PROBLEMA ─── */}
      <section id="problema" style={{ background: "#faf7f2" }}>
        <div className="max-w-6xl mx-auto px-6 py-20">
          <p
            className="text-xs font-bold uppercase tracking-widest mb-4"
            style={{ color: "#c4622d", letterSpacing: "0.16em" }}
          >
            El problema
          </p>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
              fontWeight: 700,
              color: "#1c2e1a",
              lineHeight: 1.2,
              marginBottom: "1rem",
            }}
          >
            Plantar sin datos cuesta caro
          </h2>
          <p className="mb-16 max-w-lg text-base" style={{ color: "#6b7a60" }}>
            La mayoría de los agricultores de Arica operan sin información. Eso
            cuesta plata, agua y tiempo.
          </p>

          <div className="grid md:grid-cols-3 gap-10">
            {PAIN_POINTS.map((p) => (
              <div key={p.num}>
                <div
                  className="text-6xl font-bold mb-5 leading-none select-none"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "#e0d4be",
                  }}
                >
                  {p.num}
                </div>
                <h3
                  className="font-semibold mb-3"
                  style={{ color: "#1c2e1a", fontSize: "1.05rem" }}
                >
                  {p.problema}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "#5a6a50" }}
                >
                  {p.solucion}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section
        id="funciones"
        style={{
          background: "#f0e8d8",
          borderTop: "1px solid #e0d4be",
          borderBottom: "1px solid #e0d4be",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-20">
          <p
            className="text-xs font-bold uppercase tracking-widest mb-4"
            style={{ color: "#c4622d", letterSpacing: "0.16em" }}
          >
            Qué hace AgriPlan
          </p>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
              fontWeight: 700,
              color: "#1c2e1a",
              marginBottom: "1rem",
            }}
          >
            Todo lo que necesitas, en tu celular
          </h2>
          <p className="mb-14 max-w-lg" style={{ color: "#6b7a60" }}>
            Sin Excel, sin hojas de papel. Todo en el teléfono, aunque no tengas
            señal.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl p-6 transition-shadow hover:shadow-md"
                style={{ background: "#faf7f2", border: "1px solid #e0d4be" }}
              >
                <span
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: "#2d6a4f", letterSpacing: "0.12em" }}
                >
                  {f.label}
                </span>
                <h3
                  className="font-semibold mt-2 mb-2"
                  style={{ color: "#1c2e1a", fontSize: "1rem" }}
                >
                  {f.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "#5a6a50" }}
                >
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CULTIVOS ─── */}
      <section style={{ background: "#faf7f2" }}>
        <div className="max-w-6xl mx-auto px-6 py-20">
          <p
            className="text-xs font-bold uppercase tracking-widest mb-4"
            style={{ color: "#c4622d", letterSpacing: "0.16em" }}
          >
            Catálogo
          </p>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
              fontWeight: 700,
              color: "#1c2e1a",
              lineHeight: 1.2,
              marginBottom: "1rem",
            }}
          >
            Datos reales de Arica,
            <br />
            no promedios nacionales
          </h2>
          <p className="mb-14 max-w-xl" style={{ color: "#6b7a60" }}>
            El catálogo está calibrado para el clima desértico, la ventana de
            primor y las condiciones de agua del norte de Chile.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {CULTIVOS.map((c) => (
              <div
                key={c.nombre}
                className="rounded-xl p-6"
                style={{ background: "#1c2e1a" }}
              >
                <span
                  className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                  style={{ background: "#2d6a4f", color: "#9db89e" }}
                >
                  {c.tier}
                </span>
                <h3
                  className="font-bold mt-4 mb-2"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "#f5f0e8",
                    fontSize: "1.2rem",
                  }}
                >
                  {c.nombre}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "#9db89e" }}
                >
                  {c.beneficio}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm" style={{ color: "#8a9a80" }}>
            + 20 cultivos más: higuera, guayaba, mandarina, limón, palta, papaya
            y otros viables en la región.
          </p>
        </div>
      </section>

      {/* ─── ROI ─── */}
      <section
        id="roi"
        style={{
          background: "#f0e8d8",
          borderTop: "1px solid #e0d4be",
          borderBottom: "1px solid #e0d4be",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-20">
          <p
            className="text-xs font-bold uppercase tracking-widest mb-4"
            style={{ color: "#c4622d", letterSpacing: "0.16em" }}
          >
            Retorno de inversión
          </p>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
              fontWeight: 700,
              color: "#1c2e1a",
              marginBottom: "1rem",
            }}
          >
            ¿En cuánto tiempo se paga?
          </h2>
          <p className="mb-14 max-w-xl" style={{ color: "#6b7a60" }}>
            Proyección realista para 1 hectárea en Arica, empezando con 30% del
            terreno.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {PROYECCIONES.map((p) => (
              <div
                key={p.año}
                className="rounded-xl p-8"
                style={
                  p.highlight
                    ? { background: "#1c2e1a" }
                    : { background: "#faf7f2", border: "1px solid #e0d4be" }
                }
              >
                <div
                  className="text-xs font-bold uppercase tracking-widest mb-5"
                  style={{ color: p.highlight ? "#7fb38a" : "#8a9a80" }}
                >
                  {p.año}
                </div>
                <div
                  className="font-extrabold leading-none mb-5"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(1.4rem, 2.5vw, 2rem)",
                    color: p.highlight ? "#c4622d" : "#1c2e1a",
                  }}
                >
                  {p.ingreso}{" "}
                  <span
                    className="text-sm font-normal"
                    style={{ color: p.highlight ? "#7fb38a" : "#8a9a80" }}
                  >
                    CLP
                  </span>
                </div>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: p.highlight ? "#9db89e" : "#5a6a50" }}
                >
                  {p.detalle}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-xs" style={{ color: "#8a9a80" }}>
            * Proyección referencial. Depende de agua, suelo y mix de cultivos.
            AgriPlan calcula la tuya con los datos reales de tu terreno.
          </p>
        </div>
      </section>

      {/* ─── FACTOR AGUA ─── */}
      <section style={{ background: "#1c2e1a" }}>
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="max-w-2xl">
            <p
              className="text-xs font-bold uppercase tracking-widest mb-4"
              style={{ color: "#7fb38a", letterSpacing: "0.16em" }}
            >
              El factor determinante
            </p>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
                fontWeight: 700,
                color: "#f5f0e8",
                lineHeight: 1.2,
                marginBottom: "1.5rem",
              }}
            >
              El agua define todo
              <br />
              <em style={{ color: "#c4622d" }}>en Arica</em>
            </h2>
            <p
              className="leading-relaxed mb-8 text-base"
              style={{ color: "#9db89e" }}
            >
              Si tu fuente tiene más de{" "}
              <strong style={{ color: "#d4c9b0" }}>2 dS/m de salinidad</strong>{" "}
              o más de{" "}
              <strong style={{ color: "#d4c9b0" }}>1 ppm de boro</strong>, la
              mayoría de cultivos fracasan. AgriPlan analiza tu agua y te dice
              exactamente qué puedes plantar y qué mezcla necesitas.
            </p>
            <div className="flex flex-wrap gap-3">
              {(
                [
                  "Análisis de salinidad",
                  "Control de boro",
                  "Compatibilidad por cultivo",
                  "Control de estanques",
                ] as const
              ).map((tag) => (
                <span
                  key={tag}
                  className="text-sm font-medium rounded-lg px-3 py-1.5"
                  style={{ background: "#2d6a4f", color: "#9db89e" }}
                >
                  ✓ {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── PRECIO / CTA ─── */}
      <section id="precio" style={{ background: "#faf7f2" }}>
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="max-w-lg mx-auto text-center">
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2rem, 4.5vw, 3.2rem)",
                fontWeight: 700,
                color: "#1c2e1a",
                lineHeight: 1.15,
                marginBottom: "1rem",
              }}
            >
              Empieza hoy.
              <br />
              <em style={{ color: "#c4622d" }}>20 días gratis.</em>
            </h2>
            <p className="mb-10 text-lg" style={{ color: "#6b7a60" }}>
              Sin tarjeta de crédito. Sin compromisos. Si en 20 días no te
              sirve, no pagas nada.
            </p>

            <div
              className="rounded-2xl p-8 mb-6 text-left"
              style={{ background: "#1c2e1a" }}
            >
              <div className="mb-1">
                <span
                  className="font-extrabold"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "2.75rem",
                    color: "#f5f0e8",
                  }}
                >
                  $9.990
                </span>
                <span className="text-lg ml-2" style={{ color: "#7fb38a" }}>
                  CLP/mes
                </span>
              </div>
              <p className="text-sm mb-8" style={{ color: "#7fb38a" }}>
                Un solo plan. Terrenos, zonas, cultivos, agua y alertas —
                ilimitados.
              </p>

              <ul className="space-y-3 mb-8">
                {CHECKLIST.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <span
                      className="shrink-0 mt-0.5 font-bold"
                      style={{ color: "#7fb38a" }}
                    >
                      ✓
                    </span>
                    <span style={{ color: "#d4c9b0" }}>{item}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={ROUTES.AUTH_REGISTRO}
                className="flex items-center justify-center w-full py-4 rounded-xl font-bold text-lg transition-opacity hover:opacity-90"
                style={{ background: "#2d6a4f", color: "#fff" }}
              >
                Crear cuenta gratis →
              </Link>
            </div>

            <p className="text-xs" style={{ color: "#8a9a80" }}>
              ¿Ya tienes cuenta?{" "}
              <Link
                href={ROUTES.AUTH_LOGIN}
                className="underline underline-offset-2 transition-opacity hover:opacity-70"
                style={{ color: "#2d6a4f" }}
              >
                Ingresa aquí
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ background: "#1c2e1a", borderTop: "1px solid #2d4a35" }}>
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span
              className="font-bold"
              style={{ fontFamily: "var(--font-display)", color: "#f5f0e8" }}
            >
              AgriPlan
            </span>
            <span style={{ color: "#4a7a5a" }}>
              — Hecho para agricultores de Arica, Chile
            </span>
          </div>
          <div className="flex gap-6">
            <Link
              href={ROUTES.AUTH_LOGIN}
              className="transition-opacity hover:opacity-70"
              style={{ color: "#7fb38a" }}
            >
              Ingresar
            </Link>
            <Link
              href={ROUTES.AUTH_REGISTRO}
              className="transition-opacity hover:opacity-70"
              style={{ color: "#7fb38a" }}
            >
              Registrarse
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
