import Link from "next/link";
import { ROUTES } from "@/lib/constants/routes";

export function GuiaPasoProyecto() {
  return (
    <section
      id="paso-2"
      className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm space-y-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Paso 1: Crear proyecto y terreno
          </h2>
          <p className="text-base text-gray-600">
            Antes de tocar agua, suelo o clima, necesitas un contexto donde
            guardar todo: proyectos (tu negocio o ensayo) y terrenos (la
            superficie que vas a disenar).
          </p>
        </div>
        <Link
          href={ROUTES.TERRENOS}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-green-600 text-white text-sm font-medium hover:bg-green-700"
        >
          Gestionar Terrenos
        </Link>
      </div>

      <div className="space-y-2 text-base text-gray-700">
        <ul className="list-disc list-inside space-y-1">
          <li>
            Al entrar por primera vez, la app te ofrece{" "}
            <strong>&quot;Crear mi primer proyecto&quot;</strong>
            (ej: &quot;Huerto Lluta 0.5 ha&quot;).
          </li>
          <li>
            Cada proyecto puede tener uno o varios <strong>terrenos</strong> con
            ancho y alto en metros.
          </li>
          <li>
            En{" "}
            <Link
              href={ROUTES.TERRENOS}
              className="font-mono text-green-700 underline hover:text-green-800"
            >
              {ROUTES.TERRENOS}
            </Link>{" "}
            puedes crear/editar/eliminar proyectos y terrenos, y ver un resumen
            rapido (area, zonas, plantas).
          </li>
          <li>
            Desde la tarjeta de un terreno, usa{" "}
            <strong>&quot;Ver en Mapa&quot;</strong> para trabajar sobre el en
            la pantalla principal.
          </li>
        </ul>

        <div className="bg-green-50 border border-green-200 rounded p-3 text-sm text-green-800">
          Consejo: usa nombres claros para proyectos y terrenos (ej:
          &quot;Ensayo tomates 2025&quot;, &quot;Parcela 1 norte&quot;). Te
          ayuda mucho cuando tienes varios escenarios.
        </div>
      </div>
    </section>
  );
}

export function GuiaPasoCatalogo() {
  return (
    <section
      id="paso-3"
      className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm space-y-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Paso 2: Revisar/editar el Catalogo de Cultivos
          </h2>
          <p className="text-base text-gray-600">
            El catalogo define los cultivos disponibles y sus parametros
            tecnicos (demanda de agua, rendimiento, precios, etc.). Todo lo
            demas (agua, economia, recomendaciones) se basa en estos datos.
          </p>
        </div>
        <Link
          href={ROUTES.CATALOGO}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-green-600 text-white text-sm font-medium hover:bg-green-700"
        >
          Abrir Catalogo
        </Link>
      </div>

      <div className="grid gap-3 text-base text-gray-700 md:grid-cols-2">
        <div className="space-y-1">
          <h3 className="font-semibold text-gray-900">
            3.1 Seleccionar proyecto
          </h3>
          <ul className="list-disc list-inside space-y-1">
            <li>
              En{" "}
              <Link
                href={ROUTES.CATALOGO}
                className="font-mono text-green-700 underline hover:text-green-800"
              >
                {ROUTES.CATALOGO}
              </Link>
              , arriba a la derecha selecciona el proyecto sobre el que quieres
              trabajar.
            </li>
            <li>La seleccion se guarda en el navegador para la proxima vez.</li>
          </ul>
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold text-gray-900">
            3.2 Catalogo predeterminado
          </h3>
          <ul className="list-disc list-inside space-y-1">
            <li>
              Todos los proyectos incluyen automaticamente una base de datos de
              cultivos adaptados para la region de Arica.
            </li>
            <li>
              Puedes editar cualquier cultivo para ajustarlo a tu realidad
              especifica.
            </li>
            <li>
              Tambien puedes agregar nuevos cultivos o eliminar los que no uses.
            </li>
          </ul>
        </div>
      </div>

      <div className="space-y-1 text-base text-gray-700">
        <h3 className="font-semibold text-gray-900">3.3 Tecnicas de mejora</h3>
        <p>
          En la parte inferior veras tarjetas de{" "}
          <strong>Tecnicas de Mejora</strong> (fertilizacion, manejo, etc.), con
          efecto, dosis, frecuencia y costo. No se aplican automaticamente, pero
          sirven como referencia tecnica para tus decisiones.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded p-3 text-base text-blue-800">
        Consejo: primero adapta el catalogo a las especies y variedades que
        realmente vas a usar. Esto hace que el planificador de agua y la
        economia sean mucho mas realistas.
      </div>
    </section>
  );
}

export function GuiaPasoAgua() {
  return (
    <section
      id="paso-4"
      className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm space-y-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Paso 3: Configurar Agua (calidad, fuentes, contingencias, ahorro)
          </h2>
          <p className="text-base text-gray-600">
            Aqui solo defines reglas de agua: calidad, fuentes, contingencias y
            ahorro. El registro de litros y recargas vendra despues, cuando ya
            tengas un estanque creado en el mapa.
          </p>
        </div>
        <Link
          href={ROUTES.AGUA_CONFIGURACION}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-700"
        >
          Configurar Agua
        </Link>
      </div>

      <div className="grid gap-3 text-base text-gray-700 md:grid-cols-2">
        <div className="space-y-1">
          <h3 className="font-semibold text-gray-900">4.1 Calidad del agua</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>
              En <strong>&quot;Calidad del Agua&quot;</strong> ingresa
              resultados de laboratorio (pH, salinidad, boro, etc.). Sin
              analisis real, los calculos seran solo aproximados.
            </li>
          </ul>
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold text-gray-900">
            4.2 Proveedores de agua
          </h3>
          <ul className="list-disc list-inside space-y-1">
            <li>
              En <strong>&quot;Proveedores&quot;</strong> define de donde viene
              tu agua (canal, pozo, camion, etc.) y su costo aproximado; se usa
              luego en los calculos economicos.
            </li>
          </ul>
        </div>
      </div>

      <div className="grid gap-3 text-base text-gray-700 md:grid-cols-2">
        <div className="space-y-1">
          <h3 className="font-semibold text-gray-900">
            4.3 Contingencias (plan B si no llega agua)
          </h3>
          <ul className="list-disc list-inside space-y-1">
            <li>
              Define buffer minimo del estanque y que haras si no llega agua
              (proveedor alternativo, cantidad a comprar, etc.).
            </li>
          </ul>
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold text-gray-900">
            4.4 Tecnicas de ahorro de agua
          </h3>
          <ul className="list-disc list-inside space-y-1">
            <li>
              En <strong>&quot;Tecnicas Ahorro&quot;</strong> registra practicas
              como mulch, riego nocturno, etc. Es tu checklist de manejo para
              usar menos agua.
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-cyan-50 border border-cyan-200 rounded p-3 text-base text-cyan-800">
        Importante:
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>
            Para poder registrar agua real o configurar recargas en{" "}
            <Link
              href={ROUTES.AGUA}
              className="font-mono underline text-cyan-800 hover:text-cyan-900"
            >
              {ROUTES.AGUA}
            </Link>
            , primero necesitas crear al menos un <strong>estanque</strong> en
            el mapa (ver Paso 6).
          </li>
          <li>
            Luego, en{" "}
            <Link
              href={ROUTES.AGUA_PLANIFICADOR}
              className="font-mono underline text-cyan-800 hover:text-cyan-900"
            >
              {ROUTES.AGUA_PLANIFICADOR}
            </Link>
            , estas configuraciones (calidad, proveedores, contingencias,
            ahorro) se combinan con tu estanque y tus cultivos para simular
            recargas automaticas, costos y riesgos de deficit.
          </li>
        </ul>
      </div>
    </section>
  );
}
