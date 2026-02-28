import Link from "next/link";
import { ROUTES } from "@/lib/constants/routes";

export function GuiaPasoAlertas() {
  return (
    <section
      id="paso-10"
      className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm space-y-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Paso 9: Alertas y monitoreo diario
          </h2>
          <p className="text-base text-gray-600">
            Las alertas resumen problemas criticos detectados automaticamente
            (agua, densidad de plantas, riesgos, etc.).
          </p>
        </div>
        <Link
          href={ROUTES.ALERTAS}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-red-600 text-white text-sm font-medium hover:bg-red-700"
        >
          Ver Alertas
        </Link>
      </div>

      <div className="space-y-2 text-base text-gray-700">
        <h3 className="font-semibold text-gray-900">
          10.1 Acceso rapido desde el mapa
        </h3>
        <p>
          En la barra superior del mapa tienes un indicador de alertas que
          muestra cuantas tienes, y cuantas son criticas. Desde ahi puedes abrir
          el listado completo.
        </p>

        <h3 className="font-semibold text-gray-900">10.2 Pagina de alertas</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>Resumen de alertas activas y criticas.</li>
          <li>Posibilidad de marcar alertas como resueltas o ignoradas.</li>
          <li>Desde aqui puedes volver rapido al mapa para tomar accion.</li>
        </ul>
      </div>
    </section>
  );
}

export function GuiaPasoOffline() {
  return (
    <section
      id="paso-11"
      className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm space-y-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Paso 10: Trabajo sin internet y sincronizacion
          </h2>
          <p className="text-base text-gray-600">
            AgriPlan esta pensada como PWA offline-first: puedes trabajar en
            terreno sin conexion y sincronizar mas tarde.
          </p>
        </div>
      </div>

      <div className="space-y-2 text-base text-gray-700">
        <h3 className="font-semibold text-gray-900">
          11.1 Indicador de sincronizacion
        </h3>
        <p>
          En la barra superior del mapa veras un indicador de sincronizacion que
          muestra si hay cambios pendientes y el estado de la conexion.
        </p>

        <h3 className="font-semibold text-gray-900">11.2 Conflictos</h3>
        <p>
          Si trabajas en mas de un dispositivo, pueden aparecer conflictos de
          datos. La app muestra un modal de resolucion de conflictos para que
          decidas que version conservar.
        </p>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded p-3 text-sm text-gray-700">
        Nota: aunque la app funciona sin conexion, es buena practica abrirla con
        internet de vez en cuando para sincronizar y hacer respaldo de tus
        cambios.
      </div>
    </section>
  );
}
