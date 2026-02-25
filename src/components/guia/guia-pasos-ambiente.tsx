import Link from 'next/link'

export function GuiaPasoSuelo() {
  return (
    <section id="paso-5" className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Paso 4: Configurar Suelo</h2>
          <p className="text-base text-gray-600">
            El suelo define que cultivos son realmente compatibles. Aqui ingresas tu analisis y la app te sugiere enmiendas y compatibilidades.
          </p>
        </div>
        <Link
          href="/suelo"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-amber-600 text-white text-sm font-medium hover:bg-amber-700"
        >
          Abrir modulo Suelo
        </Link>
      </div>

      <div className="grid gap-3 text-base text-gray-700 md:grid-cols-2">
        <div className="space-y-1">
          <h3 className="font-semibold text-gray-900">5.1 Ingresar datos del analisis</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>En la pestana <strong>&quot;Ingresar Datos&quot;</strong> completa parametros fisicos y quimicos (pH, salinidad, boro, etc.).</li>
            <li>Cada cambio se guarda automaticamente en tu terreno.</li>
          </ul>
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold text-gray-900">5.2 Ver resultados y plan B</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Cambia a la pestana <strong>&quot;Ver Resultados&quot;</strong> para ver:</li>
            <li className="ml-4">
              Panel de suelo con resumen de riesgos.
            </li>
            <li className="ml-4">
              Un &quot;Plan B&quot; con alternativas si el suelo es muy problematico.
            </li>
          </ul>
        </div>
      </div>

      <div className="grid gap-3 text-base text-gray-700 md:grid-cols-2">
        <div className="space-y-1">
          <h3 className="font-semibold text-gray-900">5.3 Compatibilidad suelo-cultivos</h3>
          <p>
            En el panel de la derecha veras una lista de cultivos activos en tu terreno con un semaforo:
            <strong> Compatible</strong>, <strong>Limitado</strong>, <strong>No compatible</strong>.
          </p>
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold text-gray-900">5.4 Enmiendas y costos</h3>
          <p>
            El modulo tambien muestra enmiendas sugeridas (tipo, dosis, frecuencia, costo/kg) para ayudarte a pensar en
            un plan de correccion del suelo.
          </p>
        </div>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded p-3 text-base text-emerald-800">
        Ademas: el analisis de suelo ahora alimenta directamente la <strong>proyeccion economica</strong> (ROI).
        En la pagina de Suelo veras una tarjeta de &quot;impacto en ROI&quot; y, al ajustar tu suelo, cambiaran las proyecciones
        de rendimiento e ingreso en Economia y en el panel de zonas del mapa.
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-base text-yellow-800">
        Recuerda: la app siempre te recuerda que sin analisis real (INIA u otro laboratorio) todo es especulativo.
        Usa estos calculos como referencia, no como diagnostico definitivo.
      </div>
    </section>
  )
}

export function GuiaPasoClima() {
  return (
    <section id="paso-6" className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Paso 5: Revisar Clima y demanda hidrica</h2>
          <p className="text-base text-gray-600">
            Aqui ves la ETo de Arica, el efecto de la camanchaca y como eso ajusta el consumo de agua de tus cultivos.
          </p>
        </div>
        <Link
          href="/clima"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
        >
          Abrir modulo Clima
        </Link>
      </div>

      <div className="grid gap-3 text-base text-gray-700 md:grid-cols-2">
        <div className="space-y-1">
          <h3 className="font-semibold text-gray-900">6.1 Datos climaticos base</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>ETo mensual para Arica (mm/dia) con indicacion de meses con camanchaca.</li>
            <li>Temporada actual y factor de consumo estacional.</li>
          </ul>
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold text-gray-900">6.2 Impacto en tu terreno</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>La app calcula consumo base de agua de tus cultivos y lo ajusta por clima (factor climatico).</li>
            <li>Ves consumo base vs. consumo ajustado y la diferencia en m3/semana.</li>
          </ul>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
        Esta informacion se conecta con el modulo de Agua y el Planificador para predecir deficits a futuro.
      </div>
    </section>
  )
}
