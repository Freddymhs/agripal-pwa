import Link from "next/link";
import { ROUTES } from "@/lib/constants/routes";
import { LandingAccessButton } from "@/components/landing/landing-access-button";

export const dynamic = "force-static";

const painPoints = [
  {
    icon: "💧",
    problema: "Plantas sin saber si el agua aguanta",
    solucion:
      "AgriPlan analiza salinidad, boro y conductividad de tu fuente. Te dice si tu agua es compatible con cada cultivo antes de que inviertas.",
  },
  {
    icon: "📊",
    problema: "No sabes qué cultivo es más rentable",
    solucion:
      "ROI proyectado a 4 años por zona. Compara pitahaya vs higuera vs maracuyá con tus números reales, no con promedios nacionales.",
  },
  {
    icon: "📡",
    problema: "Sin señal en el campo, sin información",
    solucion:
      "Funciona 100% offline. Diseña zonas, registra agua y consulta alertas aunque estés en el cerro sin conexión.",
  },
];

const features = [
  {
    icon: "🗺️",
    title: "Mapa de tu terreno",
    description:
      "Dibuja cada zona de cultivo con dimensiones reales. Ve cuántas plantas entran, cuánto espacio ocupan y cuánta agua necesita cada sector.",
  },
  {
    icon: "💧",
    title: "Control de agua por zona",
    description:
      "Sabe exactamente cuántos m³ consume cada cultivo por semana según etapa de crecimiento. Alerta si el estanque no alcanza.",
  },
  {
    icon: "💰",
    title: "ROI antes de plantar",
    description:
      "Ingresa el precio del kg, tu costo de agua y plantas. El sistema calcula en cuántos meses recuperas la inversión.",
  },
  {
    icon: "🚨",
    title: "Alertas antes del problema",
    description:
      "Déficit hídrico crítico, momento de replanta, riesgo de plagas por temperatura. Te avisa antes de que el daño sea irreversible.",
  },
];

const cultivos = [
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
    beneficio: "Ventana adelantada de Arica = precio 3–5x vs temporada normal.",
    tier: "Exportación",
  },
  {
    nombre: "Maracuyá",
    beneficio: "Retorno rápido (6–8 meses). Útil para liquidez año 1.",
    tier: "Liquidez",
  },
];

const proyecciones = [
  {
    año: "Año 1",
    ingreso: "$500K – $1M CLP",
    detalle: "Primeras cosechas de maracuyá. Inversión inicial.",
  },
  {
    año: "Año 2",
    ingreso: "$5M – $8M CLP",
    detalle: "Break-even. Campo + suscripciones del software.",
  },
  {
    año: "Año 3",
    ingreso: "$10M – $15M CLP",
    detalle: "70–80% del terreno produciendo. Margen neto $4–6M.",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* NAV */}
      <nav className="border-b border-gray-100 bg-white/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌱</span>
            <span className="font-bold text-gray-900 text-lg">AgriPlan</span>
            <span className="hidden sm:inline text-xs text-gray-500 border border-gray-200 rounded px-2 py-0.5 ml-1">
              Arica, Chile
            </span>
          </div>
          <Link
            href={ROUTES.AUTH_REGISTRO}
            className="text-sm font-semibold text-green-700 border border-green-700 rounded-lg px-4 py-2 hover:bg-green-50 transition-colors"
          >
            Probar gratis
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="bg-gradient-to-br from-green-50 via-white to-emerald-50">
        <div className="max-w-6xl mx-auto px-6 py-20 lg:py-28">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-green-700 uppercase tracking-wider mb-4">
              Software para agricultores de Arica
            </p>
            <h1 className="text-4xl lg:text-6xl font-extrabold leading-tight text-gray-900">
              Deja de plantar
              <br />
              <span className="text-green-600">a ojo.</span>
            </h1>
            <p className="mt-6 text-xl text-gray-600 leading-relaxed max-w-2xl">
              AgriPlan te dice cuánta agua consume cada zona, cuándo recuperas
              tu inversión y qué cultivos tienen mejor ROI{" "}
              <strong>antes de gastar un peso</strong>.
            </p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                20 días gratis, sin tarjeta
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                Funciona sin internet
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                Datos reales de Arica
              </span>
            </div>
            {/* Client island — única parte interactiva de la landing */}
            <LandingAccessButton />
          </div>
        </div>
      </section>

      {/* PAIN POINTS */}
      <section className="border-y border-gray-100 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            El problema que resuelve AgriPlan
          </h2>
          <p className="text-gray-500 mb-10">
            La mayoría de agricultores en Arica operan sin datos estructurados.
            Eso cuesta plata.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {painPoints.map((p) => (
              <div
                key={p.problema}
                className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
              >
                <div className="text-3xl mb-3">{p.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {p.problema}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {p.solucion}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Todo lo que necesitas para tomar decisiones con datos
        </h2>
        <p className="text-gray-500 mb-10">
          Sin Excel, sin hojas de papel. Todo en tu celular, aunque no tengas
          señal.
        </p>
        <div className="grid sm:grid-cols-2 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="flex gap-4 p-6 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <span className="text-3xl shrink-0">{f.icon}</span>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {f.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CULTIVOS ARICA */}
      <section className="bg-green-50 border-y border-green-100">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Datos reales de Arica, no promedios nacionales
          </h2>
          <p className="text-gray-600 mb-10">
            El catálogo de AgriPlan está calibrado para el clima desértico, la
            ventana de primor y las condiciones de agua del norte de Chile.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cultivos.map((c) => (
              <div
                key={c.nombre}
                className="bg-white rounded-xl border border-green-100 p-5 shadow-sm"
              >
                <span className="text-xs font-semibold text-green-700 bg-green-50 rounded px-2 py-0.5">
                  {c.tier}
                </span>
                <h3 className="font-bold text-gray-900 mt-3 mb-1">
                  {c.nombre}
                </h3>
                <p className="text-sm text-gray-600">{c.beneficio}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-gray-500">
            + 20 cultivos más en el catálogo: higuera, guayaba, mandarina,
            limón, palta, papaya y otros viables en la región.
          </p>
        </div>
      </section>

      {/* PROYECCIONES */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          ¿En cuánto tiempo se paga el proyecto?
        </h2>
        <p className="text-gray-500 mb-10">
          Proyección realista para 1 hectárea en Arica, empezando con 30% del
          terreno. El software te calcula esto con tus datos reales.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {proyecciones.map((p, i) => (
            <div
              key={p.año}
              className={`rounded-xl border p-6 ${
                i === 2
                  ? "border-green-300 bg-green-50 shadow-md"
                  : "border-gray-200 bg-white shadow-sm"
              }`}
            >
              <div
                className={`text-sm font-semibold mb-1 ${
                  i === 2 ? "text-green-700" : "text-gray-500"
                }`}
              >
                {p.año}
              </div>
              <div
                className={`text-2xl font-extrabold mb-2 ${
                  i === 2 ? "text-green-700" : "text-gray-900"
                }`}
              >
                {p.ingreso}
              </div>
              <p className="text-sm text-gray-600">{p.detalle}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-gray-400">
          * Proyección referencial. Depende de agua, suelo y mix de cultivos.
          AgriPlan calcula la tuya con los datos reales de tu terreno.
        </p>
      </section>

      {/* FACTOR AGUA */}
      <section className="bg-blue-50 border-y border-blue-100">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              El agua define todo en Arica
            </h2>
            <p className="text-gray-700 mb-4 leading-relaxed">
              Si tu fuente tiene <strong>más de 2 dS/m</strong> de salinidad o{" "}
              <strong>más de 1 ppm de boro</strong>, la mayoría de cultivos
              fracasan. AgriPlan analiza tu agua y te dice exactamente qué
              puedes plantar y qué mezcla necesitas.
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="bg-white border border-blue-200 rounded-lg px-3 py-1.5 text-blue-800 font-medium">
                ✓ Análisis de salinidad
              </span>
              <span className="bg-white border border-blue-200 rounded-lg px-3 py-1.5 text-blue-800 font-medium">
                ✓ Control de boro
              </span>
              <span className="bg-white border border-blue-200 rounded-lg px-3 py-1.5 text-blue-800 font-medium">
                ✓ Compatibilidad por cultivo
              </span>
              <span className="bg-white border border-blue-200 rounded-lg px-3 py-1.5 text-blue-800 font-medium">
                ✓ Control de estanques
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING / CTA FINAL */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
            Empieza hoy. 20 días gratis.
          </h2>
          <p className="text-gray-600 mb-8 text-lg">
            Sin tarjeta de crédito. Sin compromisos. Si en 20 días no te sirve,
            no pagas nada.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-2xl p-8 mb-6">
            <div className="text-4xl font-extrabold text-green-700 mb-1">
              $9.990
              <span className="text-lg font-normal text-gray-500">
                {" "}
                CLP/mes
              </span>
            </div>
            <p className="text-gray-500 text-sm mb-6">
              Un solo plan. Terrenos, zonas, cultivos, agua y alertas —
              ilimitados.
            </p>
            <ul className="text-sm text-gray-700 space-y-2 text-left max-w-xs mx-auto mb-8">
              {[
                "Mapa de terreno con zonas y plantas",
                "Control de agua por zona y estanque",
                "ROI proyectado a 4 años",
                "Alertas automáticas de riesgo",
                "Catálogo con 25+ cultivos de Arica",
                "Funciona 100% sin internet",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-green-600 shrink-0 mt-0.5">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href={ROUTES.AUTH_REGISTRO}
              className="inline-flex items-center justify-center w-full py-4 rounded-xl bg-green-600 text-white font-bold text-lg hover:bg-green-700 transition-colors shadow-md"
            >
              Crear cuenta gratis →
            </Link>
          </div>
          <p className="text-xs text-gray-400">
            ¿Ya tienes cuenta?{" "}
            <Link
              href={ROUTES.AUTH_LOGIN}
              className="text-green-700 underline underline-offset-2 hover:text-green-800"
            >
              Ingresa aquí
            </Link>
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-100 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <span>🌱</span>
            <span className="font-semibold text-gray-600">AgriPlan</span>
            <span>— Hecho para agricultores de Arica, Chile</span>
          </div>
          <div className="flex gap-6">
            <Link
              href={ROUTES.AUTH_LOGIN}
              className="hover:text-gray-600 transition-colors"
            >
              Ingresar
            </Link>
            <Link
              href={ROUTES.AUTH_REGISTRO}
              className="hover:text-gray-600 transition-colors"
            >
              Registrarse
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
