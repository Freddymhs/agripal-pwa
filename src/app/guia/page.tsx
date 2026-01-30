import Link from 'next/link'
import { PageLayout } from '@/components/layout'

export default function GuiaPage() {
  return (
    <PageLayout headerColor="green">
      <main className="max-w-4xl mx-auto p-4 space-y-8 text-base">
        {/* Índice rápido */}
        <section className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Índice rápido</h2>
          <p className="text-base text-gray-600 mb-3">
            Si es tu primera vez, sigue estos pasos en orden. Cada paso tiene un resumen y un botón que te lleva directo a la pantalla correspondiente.
          </p>
          <ol className="text-base text-gray-800 space-y-1 list-decimal list-inside">
            <li><a href="#paso-2" className="text-green-700 hover:underline">Paso 1: Crear proyecto y terreno</a></li>
            <li><a href="#paso-3" className="text-green-700 hover:underline">Paso 2: Revisar/editar catálogo de cultivos</a></li>
            <li><a href="#paso-4" className="text-green-700 hover:underline">Paso 3: Configurar agua (calidad, fuentes, contingencias, ahorro)</a></li>
            <li><a href="#paso-5" className="text-green-700 hover:underline">Paso 4: Configurar suelo</a></li>
            <li><a href="#paso-6" className="text-green-700 hover:underline">Paso 5: Revisar clima y demanda hídrica</a></li>
            <li><a href="#paso-7" className="text-green-700 hover:underline">Paso 6: Diseñar el terreno en el mapa y plantar</a></li>
            <li><a href="#paso-8" className="text-green-700 hover:underline">Paso 7: Planificador de agua (12 meses)</a></li>
            <li><a href="#paso-9" className="text-green-700 hover:underline">Paso 8: Economía y ROI de los cultivos</a></li>
            <li><a href="#paso-10" className="text-green-700 hover:underline">Paso 9: Alertas y monitoreo diario</a></li>
            <li><a href="#paso-11" className="text-green-700 hover:underline">Paso 10: Trabajo sin internet y sincronización</a></li>
          </ol>
        </section>

        {/* Paso 2 */}
        <section id="paso-2" className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Paso 1: Crear proyecto y terreno</h2>
              <p className="text-base text-gray-600">
                Antes de tocar agua, suelo o clima, necesitas un contexto donde guardar todo:
                proyectos (tu negocio o ensayo) y terrenos (la superficie que vas a diseñar).
              </p>
            </div>
            <Link
              href="/terrenos"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-green-600 text-white text-sm font-medium hover:bg-green-700"
            >
              Gestionar Terrenos →
            </Link>
          </div>

          <div className="space-y-2 text-base text-gray-700">
            <ul className="list-disc list-inside space-y-1">
              <li>
                Al entrar por primera vez, la app te ofrece <strong>&quot;Crear mi primer proyecto&quot;</strong>
                (ej: &quot;Huerto Lluta 0.5 ha&quot;).
              </li>
              <li>
                Cada proyecto puede tener uno o varios <strong>terrenos</strong> con ancho y alto en metros.
              </li>
              <li>
                En{' '}
                <Link href="/terrenos" className="font-mono text-green-700 underline hover:text-green-800">
                  /terrenos
                </Link>{' '}
                puedes crear/editar/eliminar proyectos y terrenos, y ver un resumen rápido (área, zonas, plantas).
              </li>
              <li>
                Desde la tarjeta de un terreno, usa <strong>&quot;Ver en Mapa&quot;</strong> para trabajar sobre él
                en la pantalla principal.
              </li>
            </ul>

            <div className="bg-green-50 border border-green-200 rounded p-3 text-sm text-green-800">
              Consejo: usa nombres claros para proyectos y terrenos
              (ej: &quot;Ensayo tomates 2025&quot;, &quot;Parcela 1 norte&quot;). Te ayuda mucho cuando tienes varios escenarios.
            </div>
          </div>
        </section>

        {/* Paso 3 */}
        <section id="paso-3" className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Paso 2: Revisar/editar el Catálogo de Cultivos</h2>
              <p className="text-base text-gray-600">
                El catálogo define los cultivos disponibles y sus parámetros técnicos (demanda de agua, rendimiento, precios, etc.).
                Todo lo demás (agua, economía, recomendaciones) se basa en estos datos.
              </p>
            </div>
            <Link
              href="/catalogo"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-green-600 text-white text-sm font-medium hover:bg-green-700"
            >
              Abrir Catálogo →
            </Link>
          </div>

          <div className="grid gap-3 text-base text-gray-700 md:grid-cols-2">
            <div className="space-y-1">
              <h3 className="font-semibold text-gray-900">3.1 Seleccionar proyecto</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  En{' '}
                  <Link href="/catalogo" className="font-mono text-green-700 underline hover:text-green-800">
                    /catalogo
                  </Link>
                  , arriba a la derecha selecciona el proyecto sobre el que quieres trabajar.
                </li>
                <li>La selección se guarda en el navegador para la próxima vez.</li>
              </ul>
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-gray-900">3.2 Catálogo predeterminado</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Todos los proyectos incluyen automáticamente una base de datos de cultivos adaptados para la región de Arica.</li>
                <li>Puedes editar cualquier cultivo para ajustarlo a tu realidad específica.</li>
                <li>También puedes agregar nuevos cultivos o eliminar los que no uses.</li>
              </ul>
            </div>
          </div>

          <div className="space-y-1 text-base text-gray-700">
            <h3 className="font-semibold text-gray-900">3.3 Técnicas de mejora</h3>
            <p>
              En la parte inferior verás tarjetas de <strong>Técnicas de Mejora</strong> (fertilización, manejo, etc.),
              con efecto, dosis, frecuencia y costo. No se aplican automáticamente, pero sirven como referencia técnica
              para tus decisiones.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-base text-blue-800">
            Consejo: primero adapta el catálogo a las especies y variedades que realmente vas a usar.
            Esto hace que el planificador de agua y la economía sean mucho más realistas.
          </div>
        </section>

        {/* Paso 4 */}
        <section id="paso-4" className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Paso 3: Configurar Agua (calidad, fuentes, contingencias, ahorro)</h2>
              <p className="text-base text-gray-600">
                Aquí solo defines reglas de agua: calidad, fuentes, contingencias y ahorro.
                El registro de litros y recargas vendrá después, cuando ya tengas un estanque creado en el mapa.
              </p>
            </div>
            <Link
              href="/agua/configuracion"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-700"
            >
              Configurar Agua →
            </Link>
          </div>

          <div className="grid gap-3 text-base text-gray-700 md:grid-cols-2">
            <div className="space-y-1">
              <h3 className="font-semibold text-gray-900">4.1 Calidad del agua</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  En <strong>&quot;Calidad del Agua&quot;</strong> ingresa resultados de laboratorio (pH, salinidad, boro, etc.).
                  Sin análisis real, los cálculos serán solo aproximados.
                </li>
              </ul>
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-gray-900">4.2 Proveedores de agua</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  En <strong>&quot;Proveedores&quot;</strong> define de dónde viene tu agua (canal, pozo, camión, etc.)
                  y su costo aproximado; se usa luego en los cálculos económicos.
                </li>
              </ul>
            </div>
          </div>

          <div className="grid gap-3 text-base text-gray-700 md:grid-cols-2">
            <div className="space-y-1">
              <h3 className="font-semibold text-gray-900">4.3 Contingencias (plan B si no llega agua)</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  Define buffer mínimo del estanque y qué harás si no llega agua
                  (proveedor alternativo, cantidad a comprar, etc.).
                </li>
              </ul>
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-gray-900">4.4 Técnicas de ahorro de agua</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  En <strong>&quot;Técnicas Ahorro&quot;</strong> registra prácticas como mulch, riego nocturno, etc.
                  Es tu checklist de manejo para usar menos agua.
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-cyan-50 border border-cyan-200 rounded p-3 text-base text-cyan-800">
            Importante:
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>
                Para poder registrar agua real o configurar recargas en{' '}
                <Link href="/agua" className="font-mono underline text-cyan-800 hover:text-cyan-900">
                  /agua
                </Link>
                , primero necesitas crear al menos un <strong>estanque</strong> en el mapa (ver Paso 6).
              </li>
              <li>
                Luego, en{' '}
                <Link href="/agua/planificador" className="font-mono underline text-cyan-800 hover:text-cyan-900">
                  /agua/planificador
                </Link>
                , estas configuraciones (calidad, proveedores, contingencias, ahorro) se combinan con tu estanque y tus cultivos
                para simular recargas automáticas, costos y riesgos de déficit.
              </li>
            </ul>
          </div>
        </section>

        {/* Paso 5 */}
        <section id="paso-5" className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Paso 4: Configurar Suelo</h2>
              <p className="text-base text-gray-600">
                El suelo define qué cultivos son realmente compatibles. Aquí ingresas tu análisis y la app te sugiere enmiendas y compatibilidades.
              </p>
            </div>
            <Link
              href="/suelo"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-amber-600 text-white text-sm font-medium hover:bg-amber-700"
            >
              Abrir módulo Suelo →
            </Link>
          </div>

          <div className="grid gap-3 text-base text-gray-700 md:grid-cols-2">
            <div className="space-y-1">
              <h3 className="font-semibold text-gray-900">5.1 Ingresar datos del análisis</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>En la pestaña <strong>&quot;Ingresar Datos&quot;</strong> completa parámetros físicos y químicos (pH, salinidad, boro, etc.).</li>
                <li>Cada cambio se guarda automáticamente en tu terreno.</li>
              </ul>
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-gray-900">5.2 Ver resultados y plan B</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Cambia a la pestaña <strong>&quot;Ver Resultados&quot;</strong> para ver:</li>
                <li className="ml-4">
                  Panel de suelo con resumen de riesgos.
                </li>
                <li className="ml-4">
                  Un &quot;Plan B&quot; con alternativas si el suelo es muy problemático.
                </li>
              </ul>
            </div>
          </div>

          <div className="grid gap-3 text-base text-gray-700 md:grid-cols-2">
            <div className="space-y-1">
              <h3 className="font-semibold text-gray-900">5.3 Compatibilidad suelo–cultivos</h3>
              <p>
                En el panel de la derecha verás una lista de cultivos activos en tu terreno con un semáforo:
                <strong> Compatible</strong>, <strong>Limitado</strong>, <strong>No compatible</strong>.
              </p>
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-gray-900">5.4 Enmiendas y costos</h3>
              <p>
                El módulo también muestra enmiendas sugeridas (tipo, dosis, frecuencia, costo/kg) para ayudarte a pensar en
                un plan de corrección del suelo.
              </p>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded p-3 text-base text-emerald-800">
            Además: el análisis de suelo ahora alimenta directamente la <strong>proyección económica</strong> (ROI).
            En la página de Suelo verás una tarjeta de &quot;impacto en ROI&quot; y, al ajustar tu suelo, cambiarán las proyecciones
            de rendimiento e ingreso en Economía y en el panel de zonas del mapa.
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-base text-yellow-800">
            Recuerda: la app siempre te recuerda que sin análisis real (INIA u otro laboratorio) todo es especulativo.
            Usa estos cálculos como referencia, no como diagnóstico definitivo.
          </div>
        </section>

        {/* Paso 6 */}
        <section id="paso-6" className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Paso 5: Revisar Clima y demanda hídrica</h2>
              <p className="text-base text-gray-600">
                Aquí ves la ETo de Arica, el efecto de la camanchaca y cómo eso ajusta el consumo de agua de tus cultivos.
              </p>
            </div>
            <Link
              href="/clima"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
            >
              Abrir módulo Clima →
            </Link>
          </div>

          <div className="grid gap-3 text-base text-gray-700 md:grid-cols-2">
            <div className="space-y-1">
              <h3 className="font-semibold text-gray-900">6.1 Datos climáticos base</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>ETo mensual para Arica (mm/día) con indicación de meses con camanchaca.</li>
                <li>Temporada actual y factor de consumo estacional.</li>
              </ul>
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-gray-900">6.2 Impacto en tu terreno</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>La app calcula consumo base de agua de tus cultivos y lo ajusta por clima (factor climático).</li>
                <li>Ves consumo base vs. consumo ajustado y la diferencia en m³/semana.</li>
              </ul>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
            Esta información se conecta con el módulo de Agua y el Planificador para predecir déficits a futuro.
          </div>
        </section>

        {/* Paso 7 */}
        <section id="paso-7" className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Paso 6: Diseñar el terreno en el mapa y plantar</h2>
              <p className="text-base text-gray-600">
                El mapa interactivo es el corazón de AgriPlan. Aquí dibujas zonas (estanque, riego, cultivos) y distribuyes plantas:
                es tu &quot;laboratorio visual&quot; donde pruebas diseños antes de mirar números más profundos.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-green-600 text-white text-sm font-medium hover:bg-green-700"
            >
              Ir al Mapa →
            </Link>
          </div>

          <div className="space-y-2 text-base text-gray-700">
            <h3 className="font-semibold text-gray-900">7.1 Barra superior y selección de terreno</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>En la barra superior puedes cambiar de proyecto/terreno con el selector.</li>
              <li>Desde ahí también accedes rápido a Catálogo, Clima, Agua, Suelo y Alertas.</li>
              <li>Si no tienes terreno seleccionado, la app te invita a crearlo o gestionarlo.</li>
            </ul>

            <h3 className="font-semibold text-gray-900">7.2 Zonas: estanque, cultivos y otras áreas</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Usa las herramientas del mapa para dibujar zonas dentro de tu terreno.</li>
              <li>Marca al menos una zona como <strong>estanque</strong> para que los módulos de agua puedan funcionar.</li>
              <li>Crea zonas de <strong>cultivo</strong> donde luego plantarás tus especies.</li>
            </ul>

            <h3 className="font-semibold text-gray-900">7.3 Plantas y grid automático</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Selecciona una zona de cultivo y usa el &quot;Grid automático&quot; para llenar con plantas según espaciamiento del cultivo.</li>
              <li>Puedes seleccionar múltiples plantas, moverlas y reorganizar el diseño.</li>
            </ul>

            <h3 className="font-semibold text-gray-900">7.4 Indicadores rápidos en el mapa</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>
                En el panel lateral verás indicadores de <strong>agua</strong>, <strong>calidad/compatibilidad</strong> y
                una vista rápida de <strong>rentabilidad</strong> para la zona seleccionada.
              </li>
              <li>
                El análisis económico completo (por cultivo, zona y proyecto) vive en{' '}
                <Link href="/economia" className="font-mono text-emerald-700 underline hover:text-emerald-800">
                  /economia
                </Link>
                ; piensa en el mapa como un lugar para probar diseños y en Economía como el lugar para mirar los números a fondo.
              </li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded p-3 text-base text-green-800">
            Todo lo que dibujas aquí alimenta los módulos de Agua, Economía, Clima y Alertas.
            Mientras más cercano a la realidad sea tu diseño, mejores serán las recomendaciones.
          </div>
        </section>

        {/* Paso 8 */}
        <section id="paso-8" className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Paso 7: Planificador de Agua (12 meses)</h2>
              <p className="text-base text-gray-600">
                El planificador te da una vista tipo &quot;CEO&quot; de todo un año: nivel de agua en el tiempo, eventos clave y economía básica.
              </p>
            </div>
            <Link
              href="/agua/planificador"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
            >
              Abrir Planificador →
            </Link>
          </div>

          <div className="space-y-2 text-base text-gray-700">
            <h3 className="font-semibold text-gray-900">8.1 Viabilidad de cultivos</h3>
            <p>
              En la pestaña <strong>&quot;Viabilidad Cultivos&quot;</strong> se usa el módulo de recomendación para decirte qué cultivos
              son viables con tu agua disponible, diseño de zonas y catálogo.
            </p>

            <h3 className="font-semibold text-gray-900">8.2 Proyección de nivel de agua</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>En <strong>&quot;Proyección Agua&quot;</strong> ves un gráfico de 12 meses con el nivel esperado del estanque.</li>
              <li>Se consideran consumos, recargas configuradas y eventos especiales.</li>
              <li>La app marca meses con déficit (falta de agua) para que ajustes tu plan.</li>
            </ul>

            <h3 className="font-semibold text-gray-900">8.3 Calendario de eventos</h3>
            <p>
              El calendario lista recargas, replantes, lavados y cosechas esperadas, para que tengas una hoja de ruta
              de todo el año.
            </p>
          </div>
        </section>

        {/* Paso 9 */}
        <section id="paso-9" className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Paso 8: Economía y ROI de los cultivos</h2>
              <p className="text-base text-gray-600">
                Con el diseño del terreno y el catálogo lleno, la pantalla de economía te muestra inversión, ingresos y ROI por cultivo y en total.
              </p>
            </div>
            <Link
              href="/economia"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
            >
              Abrir Economía →
            </Link>
          </div>

          <div className="grid gap-3 text-base text-gray-700 md:grid-cols-2">
            <div className="space-y-1">
              <h3 className="font-semibold text-gray-900">9.1 Resumen global</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Inversión total (plantas + agua año 1).</li>
                <li>Ingreso acumulado proyectado a 4 años.</li>
                <li>Costo anual de agua.</li>
                <li>ROI global y mensaje (&quot;Excelente&quot;, &quot;Ajustado&quot;, &quot;En pérdida&quot;).</li>
              </ul>
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-gray-900">9.2 Detalle por cultivo y zona</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Tabla por cultivo/zona con número de plantas, inversión, ingreso, ROI y punto de equilibrio.</li>
                <li>Te ayuda a ver qué cultivos sostienen el negocio y cuáles lo hunden.</li>
              </ul>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded p-3 text-base text-emerald-800">
            Usa esta pantalla para responder preguntas tipo: &quot;Si planto X m² de tomate y Y m² de maíz,
            ¿cuándo recupero mi inversión?&quot;
          </div>

          <div className="space-y-2 text-base text-gray-700 mt-4">
            <h3 className="font-semibold text-gray-900">9.3 Funciones avanzadas relacionadas</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>
                En{' '}
                <Link href="/economia/avanzado" className="font-mono text-emerald-700 underline hover:text-emerald-800">
                  /economia/avanzado
                </Link>{' '}
                tienes un análisis económico más detallado (costos variables, sensibilidad, etc.) para usuarios que quieran
                profundidad financiera.
              </li>
              <li>
                En{' '}
                <Link href="/escenarios" className="font-mono text-emerald-700 underline hover:text-emerald-800">
                  /escenarios
                </Link>{' '}
                puedes comparar escenarios &quot;qué pasa si&quot; (cultivo A vs cultivo B, diferentes diseños de zona, etc.).
              </li>
              <li>
                En{' '}
                <Link href="/plagas" className="font-mono text-emerald-700 underline hover:text-emerald-800">
                  /plagas
                </Link>{' '}
                verás un panel de riesgo de plagas que cruza clima, fenología (Grados Día) y cultivo para anticipar problemas
                sanitarios antes de que aparezcan.
              </li>
            </ul>
            <p className="text-sm text-gray-600">
              Estas secciones son opcionales y avanzadas: la idea es que primero domines el flujo básico (mapa + agua + economía)
              y luego uses estas pantallas para afinar decisiones finas de inversión y manejo.
            </p>
          </div>
        </section>

        {/* Paso 10 */}
        <section id="paso-10" className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Paso 9: Alertas y monitoreo diario</h2>
              <p className="text-base text-gray-600">
                Las alertas resumen problemas críticos detectados automáticamente (agua, densidad de plantas, riesgos, etc.).
              </p>
            </div>
            <Link
              href="/alertas"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-red-600 text-white text-sm font-medium hover:bg-red-700"
            >
              Ver Alertas →
            </Link>
          </div>

          <div className="space-y-2 text-base text-gray-700">
            <h3 className="font-semibold text-gray-900">10.1 Acceso rápido desde el mapa</h3>
            <p>
              En la barra superior del mapa tienes un indicador de alertas que muestra cuántas tienes, y cuántas son críticas.
              Desde ahí puedes abrir el listado completo.
            </p>

            <h3 className="font-semibold text-gray-900">10.2 Página de alertas</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Resumen de alertas activas y críticas.</li>
              <li>Posibilidad de marcar alertas como resueltas o ignoradas.</li>
              <li>Desde aquí puedes volver rápido al mapa para tomar acción.</li>
            </ul>
          </div>
        </section>

        {/* Paso 11 */}
        <section id="paso-11" className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Paso 10: Trabajo sin internet y sincronización</h2>
              <p className="text-base text-gray-600">
                AgriPlan está pensada como PWA offline-first: puedes trabajar en terreno sin conexión
                y sincronizar más tarde.
              </p>
            </div>
          </div>

          <div className="space-y-2 text-base text-gray-700">
            <h3 className="font-semibold text-gray-900">11.1 Indicador de sincronización</h3>
            <p>
              En la barra superior del mapa verás un indicador de sincronización que muestra si hay cambios pendientes
              y el estado de la conexión.
            </p>

            <h3 className="font-semibold text-gray-900">11.2 Conflictos</h3>
            <p>
              Si trabajas en más de un dispositivo, pueden aparecer conflictos de datos. La app muestra un modal de
              resolución de conflictos para que decidas qué versión conservar.
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded p-3 text-sm text-gray-700">
            Nota: aunque la app funciona sin conexión, es buena práctica abrirla con internet de vez en cuando
            para sincronizar y hacer respaldo de tus cambios.
          </div>
        </section>

        {/* Resumen final */}
        <section className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm space-y-2">
          <h2 className="text-lg font-bold text-gray-900">Resumen: orden recomendado de uso</h2>
          <ol className="list-decimal list-inside text-base text-gray-800 space-y-1">
            <li>Crear proyecto y terreno.</li>
            <li>Ajustar catálogo de cultivos a tu realidad.</li>
            <li>Configurar agua (calidad, fuentes, contingencias, ahorro).</li>
            <li>Ingresar análisis de suelo y revisar compatibilidad.</li>
            <li>Revisar clima y demanda hídrica esperada.</li>
            <li>Diseñar el terreno en el mapa y plantar.</li>
            <li>Usar el planificador de agua a 12 meses.</li>
            <li>Revisar economía y ROI.</li>
            <li>Monitorear alertas y ajustar día a día.</li>
            <li>Trabajar sin internet y sincronizar periódicamente.</li>
          </ol>

          <div className="flex flex-wrap gap-2 pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-green-600 text-white text-sm font-medium hover:bg-green-700"
            >
              Ir al Mapa →
            </Link>
            <Link
              href="/agua/planificador"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
            >
              Probar Planificador →
            </Link>
            <Link
              href="/economia"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
            >
              Ver Economía →
            </Link>
          </div>
        </section>
      </main>
    </PageLayout>
  )
}
