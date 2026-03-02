import Link from "next/link";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import { ROUTES } from "@/lib/constants/routes";
import { LandingAccessButton } from "@/components/landing/landing-access-button";
import { NavAccessButton } from "@/components/landing/nav-access-button";

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

const ANIMATION_CSS = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes slideInRight {
    from { opacity: 0; transform: translateX(48px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  .anim-tag    { animation: fadeIn     0.5s ease both; animation-delay: 0.1s;  opacity: 0; }
  .anim-h1     { animation: fadeInUp   0.7s ease both; animation-delay: 0.25s; opacity: 0; }
  .anim-sub    { animation: fadeInUp   0.7s ease both; animation-delay: 0.42s; opacity: 0; }
  .anim-badges { animation: fadeInUp   0.6s ease both; animation-delay: 0.58s; opacity: 0; }
  .anim-cta    { animation: fadeInUp   0.6s ease both; animation-delay: 0.72s; opacity: 0; }
  .anim-deco   { animation: slideInRight 1.1s ease both; animation-delay: 0.2s; opacity: 0; }
  .section-label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(196,98,45,0.1);
    color: #c4622d;
    border: 1px solid rgba(196,98,45,0.2);
    padding: 3px 10px;
    border-radius: 99px;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    margin-bottom: 1rem;
  }
  .section-label.green {
    background: rgba(45,106,79,0.1);
    color: #2d6a4f;
    border-color: rgba(45,106,79,0.2);
  }
  .section-label.light {
    background: rgba(127,179,138,0.15);
    color: #7fb38a;
    border-color: rgba(127,179,138,0.2);
  }
`;

const NAV_LINKS = [
  { label: "El problema", href: "#problema" },
  { label: "Funciones", href: "#funciones" },
  { label: "Cómo funciona", href: "#como" },
  { label: "ROI", href: "#roi" },
  { label: "Precio", href: "#precio" },
] as const;

const STATS = [
  { value: "25+", label: "cultivos de la región norte" },
  { value: "100%", label: "operativo sin internet" },
  { value: "6 meses", label: "de prueba, sin tarjeta" },
] as const;

const BEFORE_AFTER = [
  {
    before:
      "Riegas por intuición y pierdes la cosecha porque el agua tenía boro sin saberlo.",
    after:
      "AgriPlan analiza tu calidad de agua y te dice exactamente qué puedes plantar.",
  },
  {
    before:
      "Calculas en papel cuánta agua tienes. Un día te quedas sin ella y ya es tarde.",
    after:
      "La app te avisa 7 días antes de quedarte sin agua. Sin sorpresas a mitad de temporada.",
  },
  {
    before:
      "Plantas lo mismo de siempre sin saber si conviene o si hay algo más rentable.",
    after:
      "Ves el ROI de cada cultivo antes de gastar un peso. Decides con datos, no con suerte.",
  },
  {
    before:
      "Sin señal en el campo no sabes nada. Excel en casa, campo a ciegas.",
    after:
      "Funciona 100% sin internet. Tus datos siempre contigo, aunque estés en el cerro.",
  },
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
      "ROI proyectado con precios reales de la región. Sabes si un cultivo va a dar plata o pérdidas antes de invertir un peso.",
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
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
  },
  {
    label: "Agua",
    title: "Control de agua",
    description:
      "Sabes cuánta agua gasta cada zona. Te avisa si te falta agua o hay exceso antes de que sea tarde.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" />
      </svg>
    ),
  },
  {
    label: "Economía",
    title: "¿Cuánto voy a ganar?",
    description:
      "Calcula costos, ganancias y cuándo recuperas la inversión. Sin planillas. Sin lápiz.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    label: "Alertas",
    title: "Alertas automáticas",
    description:
      "Plagas, replanta, lavado salino, encharcamiento. Te avisa antes de que el daño sea irreversible.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    label: "Catálogo",
    title: "25+ cultivos de la región",
    description:
      "Datos reales del norte de Chile: tomate, maracuyá, pitahaya, guayaba y más. No promedios nacionales.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M12 22V12m0 0C12 7 8 4 4 5c0 4 2.5 8 8 7zm0 0c0-5 4-8 8-7-1 4-3.5 7-8 7z" />
      </svg>
    ),
  },
  {
    label: "Offline",
    title: "Funciona sin internet",
    description:
      "Entra una vez con señal y la app funciona aunque te quedes sin conexión. Tus datos siempre disponibles.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0M12 20h.01" />
        <line x1="2" y1="2" x2="22" y2="22" />
      </svg>
    ),
  },
] as const;

const STEPS = [
  {
    num: "1",
    title: "Registra tu terreno",
    desc: "Dibuja tus zonas de cultivo con las medidas reales. Agrega tus estanques y fuentes de agua.",
    accent: "#2d6a4f",
  },
  {
    num: "2",
    title: "Configura tu agua",
    desc: "Indica cuánta agua tienes disponible. AgriPlan calcula al instante cuánto necesita cada zona y qué tan lejos estás del límite.",
    accent: "#2d6a4f",
  },
  {
    num: "3",
    title: "Agrega tus cultivos",
    desc: "Elige del catálogo de la región. La app se calibra sola según el clima y la época del año.",
    accent: "#2d6a4f",
  },
  {
    num: "4",
    title: "Gestiona y decide",
    desc: "Alertas de agua, rentabilidad proyectada y riesgos de plagas — todo en tu celular, sin señal.",
    accent: "#c4622d",
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

const ROI_PUNTOS = [
  {
    num: "$9.990",
    context: "al mes",
    desc: "Lo que cuesta AgriPlan. Menos que una jornada de trabajo manual en el campo.",
  },
  {
    num: "$3M–$5M",
    context: "por hectárea al año",
    desc: "Lo que puede generar un campo bien gestionado con pitahaya o uva primor.",
  },
  {
    num: "Año 3",
    context: "punto de madurez",
    desc: "Con el 60–80% del terreno produciendo, la operación se sostiene sola.",
  },
] as const;

const CHECKLIST = [
  "Mapa de terreno con zonas y plantas",
  "Control de agua por zona y estanque",
  "ROI proyectado a 4 años",
  "Alertas automáticas de riesgo",
  "Catálogo con 25+ cultivos de la región",
  "Funciona 100% sin internet",
] as const;

export default function LandingPage() {
  return (
    <main
      className={`${playfair.variable} ${jakarta.variable} min-h-screen`}
      style={{
        fontFamily: "var(--font-body, sans-serif)",
        background: "#fdf9f2",
        color: "#1c2e1a",
      }}
    >
      <style>{ANIMATION_CSS}</style>

      {/* ─── NAV ─── */}
      <nav
        style={{
          background: "rgba(253,249,242,0.96)",
          borderBottom: "1px solid #e0d4be",
        }}
        className="sticky top-0 z-10 backdrop-blur"
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
          {/* Logo → siempre lleva al home */}
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <span
              className="font-bold text-xl tracking-tight transition-opacity group-hover:opacity-75"
              style={{ fontFamily: "var(--font-display)", color: "#1c2e1a" }}
            >
              AgriPlan
            </span>
            <span
              className="hidden sm:inline text-xs rounded-full px-2 py-0.5 font-medium"
              style={{ background: "#e8ddd0", color: "#5a4a30" }}
            >
              Norte de Chile
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm transition-opacity hover:opacity-60"
                style={{ color: "#4a5a40" }}
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Botón auth-aware: "Probar gratis" o "Ver planner" según sesión */}
          <NavAccessButton />
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
            pointerEvents: "none",
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
            opacity: 0.5,
          }}
        />
        {/* Accent glow */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "-20%",
            right: "-10%",
            width: "55%",
            height: "90%",
            background:
              "radial-gradient(ellipse, rgba(44,106,79,0.18) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div className="max-w-6xl mx-auto px-6 pt-20 pb-0 lg:pt-28 relative">
          <div className="flex items-start gap-12">
            {/* Copy */}
            <div className="flex-1 min-w-0 pb-10 lg:pb-14">
              <p
                className="anim-tag text-xs font-bold uppercase tracking-widest mb-6"
                style={{ color: "#7fb38a", letterSpacing: "0.16em" }}
              >
                Software de campo para agricultores de Chile
              </p>

              <h1
                className="anim-h1"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(2.8rem, 7vw, 5rem)",
                  fontWeight: 700,
                  color: "#f5f0e8",
                  lineHeight: 1.07,
                  marginBottom: "1.5rem",
                }}
              >
                Deja de plantar
                <br />
                <em style={{ color: "#c4622d", fontStyle: "italic" }}>
                  a ojo.
                </em>
              </h1>

              <p
                className="anim-sub"
                style={{
                  color: "#9db89e",
                  fontSize: "1.15rem",
                  lineHeight: 1.7,
                  maxWidth: "38rem",
                  marginBottom: "2rem",
                }}
              >
                Cada temporada, agricultores del norte pierden agua, dinero y
                cosechas enteras por no tener datos.{" "}
                <strong style={{ color: "#d4c9b0" }}>
                  AgriPlan termina con eso.
                </strong>
              </p>

              <div className="anim-badges flex flex-wrap items-center gap-4 mb-10">
                <span
                  className="inline-flex items-center gap-2 text-sm font-bold px-4 py-1.5 rounded-full"
                  style={{
                    background: "rgba(196,98,45,0.15)",
                    color: "#e8895a",
                    border: "1px solid rgba(196,98,45,0.3)",
                  }}
                >
                  ★ 6 meses gratis, sin tarjeta
                </span>
                {(
                  ["Funciona sin internet", "Datos del norte de Chile"] as const
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

              <div className="anim-cta">
                <LandingAccessButton />
              </div>
            </div>

            {/* Decorative field map SVG */}
            <div
              className="anim-deco hidden lg:block shrink-0 self-end"
              style={{ width: 300, paddingBottom: 0 }}
            >
              <svg viewBox="0 0 300 340" fill="none" aria-hidden>
                <rect
                  x="8"
                  y="8"
                  width="130"
                  height="90"
                  rx="6"
                  stroke="#2d6a4f"
                  strokeWidth="1.5"
                  fill="#2d6a4f"
                  fillOpacity="0.08"
                />
                <rect
                  x="150"
                  y="8"
                  width="85"
                  height="90"
                  rx="6"
                  stroke="#7fb38a"
                  strokeWidth="1.5"
                  fill="#7fb38a"
                  fillOpacity="0.06"
                />
                <rect
                  x="247"
                  y="8"
                  width="45"
                  height="90"
                  rx="6"
                  stroke="#3a7a5a"
                  strokeWidth="1"
                  fill="none"
                />
                <rect
                  x="8"
                  y="110"
                  width="85"
                  height="110"
                  rx="6"
                  stroke="#c4622d"
                  strokeWidth="1.5"
                  fill="#c4622d"
                  fillOpacity="0.06"
                />
                <rect
                  x="105"
                  y="110"
                  width="115"
                  height="110"
                  rx="6"
                  stroke="#2d6a4f"
                  strokeWidth="1.5"
                  fill="#2d6a4f"
                  fillOpacity="0.1"
                />
                <rect
                  x="232"
                  y="110"
                  width="60"
                  height="110"
                  rx="6"
                  stroke="#4a8a6a"
                  strokeWidth="1"
                  fill="#4a8a6a"
                  fillOpacity="0.04"
                />
                <rect
                  x="8"
                  y="232"
                  width="284"
                  height="60"
                  rx="6"
                  stroke="#3a7a5a"
                  strokeWidth="1"
                  fill="#3a7a5a"
                  fillOpacity="0.04"
                />
                <circle
                  cx="247"
                  cy="53"
                  r="18"
                  stroke="#7fb38a"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  fill="#7fb38a"
                  fillOpacity="0.06"
                />
                <path
                  d="M247 43v10l6 5"
                  stroke="#7fb38a"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <text
                  x="20"
                  y="32"
                  fill="#7fb38a"
                  fillOpacity="0.7"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  ZONA A
                </text>
                <text
                  x="158"
                  y="32"
                  fill="#7fb38a"
                  fillOpacity="0.5"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  ZONA B
                </text>
                <text
                  x="16"
                  y="134"
                  fill="#c4622d"
                  fillOpacity="0.6"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  ESTANQUE
                </text>
                <text
                  x="113"
                  y="134"
                  fill="#7fb38a"
                  fillOpacity="0.7"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  CULTIVO PRINCIPAL
                </text>
                {[30, 55, 80, 105, 30, 55, 80, 105].map((cx, i) => (
                  <circle
                    key={`a${i}`}
                    cx={cx}
                    cy={i < 4 ? 55 : 78}
                    r="3"
                    fill="#7fb38a"
                    fillOpacity="0.35"
                  />
                ))}
                {[120, 145, 170, 195, 120, 145, 170, 195, 120, 145].map(
                  (cx, i) => (
                    <circle
                      key={`b${i}`}
                      cx={cx}
                      cy={i < 4 ? 155 : i < 8 ? 180 : 205}
                      r="3"
                      fill="#7fb38a"
                      fillOpacity="0.5"
                    />
                  ),
                )}
                <line
                  x1="247"
                  y1="71"
                  x2="247"
                  y2="110"
                  stroke="#7fb38a"
                  strokeWidth="1"
                  strokeOpacity="0.25"
                  strokeDasharray="4 3"
                />
                <rect
                  x="8"
                  y="302"
                  width="284"
                  height="30"
                  rx="5"
                  fill="#2d6a4f"
                  fillOpacity="0.15"
                />
                <text
                  x="20"
                  y="321"
                  fill="#7fb38a"
                  fillOpacity="0.8"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  AGUA HOY: 12.4 m³ · ROI: +38% · SIN ALERTAS
                </text>
              </svg>
            </div>
          </div>
        </div>

        <div
          aria-hidden
          style={{
            height: 56,
            background: "#fdf9f2",
            clipPath: "polygon(0 100%, 100% 0, 100% 100%)",
          }}
        />
      </section>

      {/* ─── STATS STRIP ─── */}
      <section
        style={{ background: "#fdf9f2", borderBottom: "1px solid #e0d4be" }}
      >
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="grid grid-cols-3 divide-x divide-[#e0d4be]">
            {STATS.map((s) => (
              <div
                key={s.value}
                className="text-center px-6 first:pl-0 last:pr-0"
              >
                <div
                  className="font-extrabold leading-none mb-1.5"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
                    color: "#1c2e1a",
                  }}
                >
                  {s.value}
                </div>
                <div className="text-sm" style={{ color: "#5a6a50" }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── EL PROBLEMA ─── */}
      <section id="problema" style={{ background: "#fdf9f2" }}>
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="section-label">El problema</div>
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
          <p className="mb-16 max-w-lg text-base" style={{ color: "#5a6a50" }}>
            La mayoría de los agricultores operan sin información. Eso cuesta
            plata, agua y tiempo.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {PAIN_POINTS.map((p) => (
              <div
                key={p.num}
                className="rounded-xl p-7 relative overflow-hidden"
                style={{
                  background: "#f5ede0",
                  borderLeft: "3px solid #c4622d",
                }}
              >
                <div
                  className="absolute top-3 right-4 font-bold leading-none select-none"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "4.5rem",
                    color: "#e8d8c4",
                    lineHeight: 1,
                  }}
                >
                  {p.num}
                </div>
                <h3
                  className="font-semibold mb-3 relative"
                  style={{ color: "#1c2e1a", fontSize: "1.05rem" }}
                >
                  {p.problema}
                </h3>
                <p
                  className="text-sm leading-relaxed relative"
                  style={{ color: "#4a5a40" }}
                >
                  {p.solucion}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ANTES / AHORA ─── */}
      <section
        style={{
          background: "#f5ede0",
          borderTop: "1px solid #e0d4be",
          borderBottom: "1px solid #e0d4be",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="section-label">El antes y el después</div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
              fontWeight: 700,
              color: "#1c2e1a",
              lineHeight: 1.2,
              marginBottom: "0.75rem",
            }}
          >
            ¿Cómo vivías antes sin esto?
          </h2>
          <p className="mb-14 max-w-lg text-base" style={{ color: "#5a6a50" }}>
            Esto es lo que cambia cuando tienes datos reales de tu campo en la
            palma de tu mano.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            {BEFORE_AFTER.map((item, i) => (
              <div
                key={i}
                className="grid grid-cols-2 rounded-2xl overflow-hidden"
                style={{ border: "1px solid #ddd0ba" }}
              >
                {/* ANTES */}
                <div
                  className="p-6 flex flex-col gap-3"
                  style={{ background: "#ede0ce" }}
                >
                  <span
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: "#a07050", letterSpacing: "0.14em" }}
                  >
                    Antes
                  </span>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "#5a4030" }}
                  >
                    {item.before}
                  </p>
                </div>
                {/* AHORA */}
                <div
                  className="p-6 flex flex-col gap-3 relative overflow-hidden"
                  style={{ background: "#1c2e1a" }}
                >
                  <div
                    aria-hidden
                    style={{
                      position: "absolute",
                      top: "-40%",
                      right: "-20%",
                      width: "70%",
                      height: "120%",
                      background:
                        "radial-gradient(ellipse, rgba(44,106,79,0.2) 0%, transparent 70%)",
                      pointerEvents: "none",
                    }}
                  />
                  <span
                    className="text-xs font-bold uppercase tracking-widest relative"
                    style={{ color: "#7fb38a", letterSpacing: "0.14em" }}
                  >
                    Con AgriPlan
                  </span>
                  <p
                    className="text-sm leading-relaxed relative"
                    style={{ color: "#c8dcc0" }}
                  >
                    {item.after}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section
        id="funciones"
        style={{
          background: "#eee6d4",
          borderTop: "1px solid #ddd0ba",
          borderBottom: "1px solid #ddd0ba",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="section-label green">Qué hace AgriPlan</div>
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
          <p className="mb-14 max-w-lg" style={{ color: "#5a6a50" }}>
            Sin Excel, sin hojas de papel. Todo en el teléfono, aunque no tengas
            señal.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl p-6 group transition-all hover:-translate-y-0.5 hover:shadow-md"
                style={{ background: "#fdf9f2", border: "1px solid #ddd0ba" }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ background: "#dceede", color: "#2d6a4f" }}
                >
                  <div className="w-5 h-5">{f.icon}</div>
                </div>
                <span
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: "#2d6a4f", letterSpacing: "0.12em" }}
                >
                  {f.label}
                </span>
                <h3
                  className="font-semibold mt-1.5 mb-2"
                  style={{ color: "#1c2e1a", fontSize: "1rem" }}
                >
                  {f.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "#4a5a40" }}
                >
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CÓMO FUNCIONA ─── */}
      <section id="como" style={{ background: "#fdf9f2" }}>
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="section-label">Cómo funciona</div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
              fontWeight: 700,
              color: "#1c2e1a",
              marginBottom: "1rem",
            }}
          >
            Listo en 10 minutos
          </h2>
          <p className="mb-16 max-w-lg" style={{ color: "#5a6a50" }}>
            Sin configuración compleja. Sin manual. Cuatro pasos y tienes tu
            campo digitalizado.
          </p>

          <div className="grid md:grid-cols-4 gap-8 relative">
            {/* Connecting line */}
            <div
              className="hidden md:block absolute h-px"
              style={{
                background:
                  "linear-gradient(to right, transparent 5%, #ddd0ba 15%, #ddd0ba 85%, transparent 95%)",
                top: "2rem",
                left: 0,
                right: 0,
              }}
              aria-hidden
            />

            {STEPS.map((s) => (
              <div key={s.num} className="relative">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 font-extrabold text-xl relative z-10"
                  style={{
                    fontFamily: "var(--font-display)",
                    background: s.num === "4" ? "#c4622d" : "#1c2e1a",
                    color: s.num === "4" ? "#fff" : "#7fb38a",
                  }}
                >
                  {s.num}
                </div>
                <h3
                  className="font-semibold mb-2"
                  style={{ color: "#1c2e1a", fontSize: "1rem" }}
                >
                  {s.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "#4a5a40" }}
                >
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CULTIVOS ─── */}
      <section
        style={{ background: "#eee6d4", borderTop: "1px solid #ddd0ba" }}
      >
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="section-label">Catálogo</div>
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
            Datos reales del norte de Chile,
            <br />
            no promedios nacionales
          </h2>
          <p className="mb-14 max-w-xl" style={{ color: "#5a6a50" }}>
            El catálogo está calibrado para el clima desértico, la ventana de
            primor y las condiciones de agua del norte del país.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {CULTIVOS.map((c) => (
              <div
                key={c.nombre}
                className="rounded-xl p-6 transition-transform hover:-translate-y-0.5"
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
        style={{ background: "#fdf9f2", borderTop: "1px solid #e0d4be" }}
      >
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="section-label">¿Vale la inversión?</div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
              fontWeight: 700,
              color: "#1c2e1a",
              marginBottom: "1rem",
            }}
          >
            Los números hablan solos
          </h2>
          <p
            className="mb-5 max-w-xl text-base font-semibold"
            style={{ color: "#1c2e1a" }}
          >
            Un agricultor que usa AgriPlan sabe exactamente cuándo recupera su
            inversión. Uno que no lo usa, adivina.
          </p>
          <p className="mb-14 max-w-xl" style={{ color: "#5a6a50" }}>
            Cálculo orientativo basado en cultivos de la región norte de Chile.
            Tu resultado exacto lo calcula AgriPlan con los datos de tu propio
            terreno.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {ROI_PUNTOS.map((p) => (
              <div
                key={p.num}
                className="rounded-xl p-8 relative overflow-hidden group"
                style={{ background: "#f0e8d8", border: "1px solid #ddd0ba" }}
              >
                {/* Decorative accent line top */}
                <div
                  className="absolute top-0 left-8 right-8 h-0.5 rounded-full"
                  style={{ background: "#c4622d", opacity: 0.4 }}
                />
                <div
                  className="font-extrabold leading-none mb-1"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
                    color: "#1c2e1a",
                  }}
                >
                  {p.num}
                </div>
                <div
                  className="text-xs font-bold uppercase tracking-widest mb-4"
                  style={{ color: "#c4622d", letterSpacing: "0.1em" }}
                >
                  {p.context}
                </div>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "#4a5a40" }}
                >
                  {p.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FACTOR AGUA ─── */}
      <section style={{ background: "#1c2e1a" }}>
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="section-label light">El factor determinante</div>
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
                <em style={{ color: "#c4622d" }}>en el norte</em>
              </h2>
              <p
                className="leading-relaxed mb-8 text-base"
                style={{ color: "#9db89e" }}
              >
                Si tu fuente tiene demasiada sal o boro, la mayoría de cultivos
                fracasan antes de la primera cosecha. AgriPlan analiza tu agua y
                te dice exactamente qué puedes plantar y qué mezcla necesitas —
                sin que tengas que entender de química.
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

            {/* Water quality bars */}
            <div className="hidden md:flex flex-col gap-4">
              {(
                [
                  {
                    label: "Salinidad (dS/m)",
                    value: 1.4,
                    max: 3,
                    threshold: "límite 2 dS/m",
                  },
                  {
                    label: "Boro (ppm)",
                    value: 0.7,
                    max: 2,
                    threshold: "límite 1 ppm",
                  },
                  { label: "pH", value: 7.2, max: 9, threshold: "rango 6–8" },
                ] as const
              ).map((row) => (
                <div
                  key={row.label}
                  className="rounded-xl p-5"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="text-sm font-medium"
                      style={{ color: "#9db89e" }}
                    >
                      {row.label}
                    </span>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded"
                      style={{ background: "#2d6a4f", color: "#7fb38a" }}
                    >
                      ✓ OK
                    </span>
                  </div>
                  <div
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.08)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(row.value / row.max) * 100}%`,
                        background:
                          "linear-gradient(to right, #2d6a4f, #7fb38a)",
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span
                      className="text-xs font-bold"
                      style={{ color: "#7fb38a" }}
                    >
                      {row.value}
                    </span>
                    <span className="text-xs" style={{ color: "#4a6a55" }}>
                      {row.threshold}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── PRICING / CTA ─── */}
      <section id="precio" style={{ background: "#fdf9f2" }}>
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
              <em style={{ color: "#c4622d" }}>6 meses gratis.</em>
            </h2>
            <p className="mb-10 text-lg" style={{ color: "#5a6a50" }}>
              Sin tarjeta de crédito. Sin compromisos. Úsala con calma, aprende
              a tu ritmo. Si después quieres seguir, pagas. Si no, no pasa nada.
            </p>

            <div
              className="rounded-2xl p-8 mb-6 text-left relative overflow-hidden"
              style={{ background: "#1c2e1a" }}
            >
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  top: "-30%",
                  right: "-10%",
                  width: "50%",
                  height: "80%",
                  background:
                    "radial-gradient(ellipse, rgba(44,106,79,0.2) 0%, transparent 70%)",
                  pointerEvents: "none",
                }}
              />
              <div className="relative">
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
            <Link
              href="/"
              className="font-bold transition-opacity hover:opacity-70"
              style={{ fontFamily: "var(--font-display)", color: "#f5f0e8" }}
            >
              AgriPlan
            </Link>
            <span style={{ color: "#4a7a5a" }}>
              — Hecho para agricultores del norte de Chile
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
