import Link from 'next/link'

export function GuiaPasoMapa() {
  return (
    <section id="paso-7" className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Paso 6: Disenar el terreno en el mapa y plantar</h2>
          <p className="text-base text-gray-600">
            El mapa interactivo es el corazon de AgriPlan. Aqui dibujas zonas (estanque, riego, cultivos) y distribuyes plantas:
            es tu &quot;laboratorio visual&quot; donde pruebas disenos antes de mirar numeros mas profundos.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-green-600 text-white text-sm font-medium hover:bg-green-700"
        >
          Ir al Mapa
        </Link>
      </div>

      <div className="space-y-2 text-base text-gray-700">
        <h3 className="font-semibold text-gray-900">7.1 Barra superior y seleccion de terreno</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>En la barra superior puedes cambiar de proyecto/terreno con el selector.</li>
          <li>Desde ahi tambien accedes rapido a Catalogo, Clima, Agua, Suelo y Alertas.</li>
          <li>Si no tienes terreno seleccionado, la app te invita a crearlo o gestionarlo.</li>
        </ul>

        <h3 className="font-semibold text-gray-900">7.2 Zonas: estanque, cultivos y otras areas</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>Usa las herramientas del mapa para dibujar zonas dentro de tu terreno.</li>
          <li>Marca al menos una zona como <strong>estanque</strong> para que los modulos de agua puedan funcionar.</li>
          <li>Crea zonas de <strong>cultivo</strong> donde luego plantaras tus especies.</li>
        </ul>

        <h3 className="font-semibold text-gray-900">7.3 Plantas y grid automatico</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>Selecciona una zona de cultivo y usa el &quot;Grid automatico&quot; para llenar con plantas segun espaciamiento del cultivo.</li>
          <li>Puedes seleccionar multiples plantas, moverlas y reorganizar el diseno.</li>
        </ul>

        <h3 className="font-semibold text-gray-900">7.4 Indicadores rapidos en el mapa</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>
            En el panel lateral veras indicadores de <strong>agua</strong>, <strong>calidad/compatibilidad</strong> y
            una vista rapida de <strong>rentabilidad</strong> para la zona seleccionada.
          </li>
          <li>
            El analisis economico completo (por cultivo, zona y proyecto) vive en{' '}
            <Link href="/economia" className="font-mono text-emerald-700 underline hover:text-emerald-800">
              /economia
            </Link>
            ; piensa en el mapa como un lugar para probar disenos y en Economia como el lugar para mirar los numeros a fondo.
          </li>
        </ul>
      </div>

      <div className="bg-green-50 border border-green-200 rounded p-3 text-base text-green-800">
        Todo lo que dibujas aqui alimenta los modulos de Agua, Economia, Clima y Alertas.
        Mientras mas cercano a la realidad sea tu diseno, mejores seran las recomendaciones.
      </div>
    </section>
  )
}

export function GuiaPasoPlanificador() {
  return (
    <section id="paso-8" className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Paso 7: Planificador de Agua (12 meses)</h2>
          <p className="text-base text-gray-600">
            El planificador te da una vista tipo &quot;CEO&quot; de todo un ano: nivel de agua en el tiempo, eventos clave y economia basica.
          </p>
        </div>
        <Link
          href="/agua/planificador"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
        >
          Abrir Planificador
        </Link>
      </div>

      <div className="space-y-2 text-base text-gray-700">
        <h3 className="font-semibold text-gray-900">8.1 Viabilidad de cultivos</h3>
        <p>
          En la pestana <strong>&quot;Viabilidad Cultivos&quot;</strong> se usa el modulo de recomendacion para decirte que cultivos
          son viables con tu agua disponible, diseno de zonas y catalogo.
        </p>

        <h3 className="font-semibold text-gray-900">8.2 Proyeccion de nivel de agua</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>En <strong>&quot;Proyeccion Agua&quot;</strong> ves un grafico de 12 meses con el nivel esperado del estanque.</li>
          <li>Se consideran consumos, recargas configuradas y eventos especiales.</li>
          <li>La app marca meses con deficit (falta de agua) para que ajustes tu plan.</li>
        </ul>

        <h3 className="font-semibold text-gray-900">8.3 Calendario de eventos</h3>
        <p>
          El calendario lista recargas, replantes, lavados y cosechas esperadas, para que tengas una hoja de ruta
          de todo el ano.
        </p>
      </div>
    </section>
  )
}

export function GuiaPasoEconomia() {
  return (
    <section id="paso-9" className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Paso 8: Economia y ROI de los cultivos</h2>
          <p className="text-base text-gray-600">
            Con el diseno del terreno y el catalogo lleno, la pantalla de economia te muestra inversion, ingresos y ROI por cultivo y en total.
          </p>
        </div>
        <Link
          href="/economia"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
        >
          Abrir Economia
        </Link>
      </div>

      <div className="grid gap-3 text-base text-gray-700 md:grid-cols-2">
        <div className="space-y-1">
          <h3 className="font-semibold text-gray-900">9.1 Resumen global</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Inversion total (plantas + agua ano 1).</li>
            <li>Ingreso acumulado proyectado a 4 anos.</li>
            <li>Costo anual de agua.</li>
            <li>ROI global y mensaje (&quot;Excelente&quot;, &quot;Ajustado&quot;, &quot;En perdida&quot;).</li>
          </ul>
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold text-gray-900">9.2 Detalle por cultivo y zona</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Tabla por cultivo/zona con numero de plantas, inversion, ingreso, ROI y punto de equilibrio.</li>
            <li>Te ayuda a ver que cultivos sostienen el negocio y cuales lo hunden.</li>
          </ul>
        </div>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded p-3 text-base text-emerald-800">
        Usa esta pantalla para responder preguntas tipo: &quot;Si planto X m2 de tomate y Y m2 de maiz,
        cuando recupero mi inversion?&quot;
      </div>

      <div className="space-y-2 text-base text-gray-700 mt-4">
        <h3 className="font-semibold text-gray-900">9.3 Funciones avanzadas relacionadas</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>
            En{' '}
            <Link href="/economia/avanzado" className="font-mono text-emerald-700 underline hover:text-emerald-800">
              /economia/avanzado
            </Link>{' '}
            tienes un analisis economico mas detallado (costos variables, sensibilidad, etc.) para usuarios que quieran
            profundidad financiera.
          </li>
          <li>
            En{' '}
            <Link href="/escenarios" className="font-mono text-emerald-700 underline hover:text-emerald-800">
              /escenarios
            </Link>{' '}
            puedes comparar escenarios &quot;que pasa si&quot; (cultivo A vs cultivo B, diferentes disenos de zona, etc.).
          </li>
          <li>
            En{' '}
            <Link href="/plagas" className="font-mono text-emerald-700 underline hover:text-emerald-800">
              /plagas
            </Link>{' '}
            veras un panel de riesgo de plagas que cruza clima, fenologia (Grados Dia) y cultivo para anticipar problemas
            sanitarios antes de que aparezcan.
          </li>
        </ul>
        <p className="text-sm text-gray-600">
          Estas secciones son opcionales y avanzadas: la idea es que primero domines el flujo basico (mapa + agua + economia)
          y luego uses estas pantallas para afinar decisiones finas de inversion y manejo.
        </p>
      </div>
    </section>
  )
}
