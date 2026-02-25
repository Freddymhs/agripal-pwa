export function GuiaIndice() {
  return (
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
  )
}
