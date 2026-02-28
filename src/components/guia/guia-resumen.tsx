import Link from "next/link";
import { ROUTES } from "@/lib/constants/routes";

export function GuiaResumen() {
  return (
    <section className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm space-y-2">
      <h2 className="text-lg font-bold text-gray-900">
        Resumen: orden recomendado de uso
      </h2>
      <ol className="list-decimal list-inside text-base text-gray-800 space-y-1">
        <li>Crear proyecto y terreno.</li>
        <li>Ajustar catalogo de cultivos a tu realidad.</li>
        <li>Configurar agua (calidad, fuentes, contingencias, ahorro).</li>
        <li>Ingresar analisis de suelo y revisar compatibilidad.</li>
        <li>Revisar clima y demanda hidrica esperada.</li>
        <li>Disenar el terreno en el mapa y plantar.</li>
        <li>Usar el planificador de agua a 12 meses.</li>
        <li>Revisar economia y ROI.</li>
        <li>Monitorear alertas y ajustar dia a dia.</li>
        <li>Trabajar sin internet y sincronizar periodicamente.</li>
      </ol>

      <div className="flex flex-wrap gap-2 pt-2">
        <Link
          href={ROUTES.HOME}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-green-600 text-white text-sm font-medium hover:bg-green-700"
        >
          Ir al Mapa
        </Link>
        <Link
          href={ROUTES.AGUA_PLANIFICADOR}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
        >
          Probar Planificador
        </Link>
        <Link
          href={ROUTES.ECONOMIA}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
        >
          Ver Economia
        </Link>
      </div>
    </section>
  );
}
