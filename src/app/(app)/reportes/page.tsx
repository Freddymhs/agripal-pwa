"use client";

import { useMemo } from "react";
import { PageLayout } from "@/components/layout";
import { useProjectContext } from "@/contexts/project-context";
import { useCosechas } from "@/hooks/use-cosechas";
import { useReportes } from "@/hooks/use-reportes";

const REPORTES = [
  {
    id: "financiero" as const,
    titulo: "Reporte Financiero",
    descripcion:
      "Inversion inicial, costos operacionales, proyeccion de ingresos a 4 años, ROI y punto de equilibrio.",
    icono: "💰",
    requisito: "Al menos 1 planta viva",
  },
  {
    id: "agua" as const,
    titulo: "Reporte Hidrico",
    descripcion:
      "Consumo por zona, estado de estanques, proyeccion 12 meses, costos anuales y eventos programados.",
    icono: "💧",
    requisito: "Al menos 1 estanque configurado",
  },
  {
    id: "produccion" as const,
    titulo: "Reporte de Produccion",
    descripcion:
      "Cosechas reales vs proyectadas, rendimiento por m2, ingresos y distribucion por calidad.",
    icono: "🌾",
    requisito: "Al menos 1 cosecha registrada",
  },
] as const;

export default function ReportesPage() {
  const {
    terrenoActual: terreno,
    proyectoActual,
    zonas,
    plantas,
    catalogoCultivos,
    loading,
    datosBaseHook,
    cargarDatosTerreno,
    opcionesConsumoAgua,
  } = useProjectContext();

  const fuentesAgua = datosBaseHook.datosBase.fuentesAgua;
  const { cosechas, loading: loadingCosechas } = useCosechas(
    zonas,
    cargarDatosTerreno,
  );

  const {
    generando,
    generarFinanciero,
    generarAgua,
    generarProduccion,
    tieneData,
  } = useReportes({
    terreno,
    zonas,
    plantas,
    catalogoCultivos,
    cosechas,
    fuentesAgua,
    suelo: proyectoActual?.suelo,
    opcionesConsumoAgua,
  });

  const acciones = useMemo(
    () => ({
      financiero: generarFinanciero,
      agua: generarAgua,
      produccion: generarProduccion,
    }),
    [generarFinanciero, generarAgua, generarProduccion],
  );

  if (loading || loadingCosechas) {
    return (
      <PageLayout title="Reportes" headerColor="emerald">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
        </div>
      </PageLayout>
    );
  }

  if (!terreno) {
    return (
      <PageLayout title="Reportes" headerColor="emerald">
        <div className="max-w-2xl mx-auto py-16 px-4 text-center">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Selecciona un terreno
          </h2>
          <p className="text-gray-600">
            Para generar reportes PDF necesitas tener un terreno activo con
            datos cargados.
          </p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Reportes" headerColor="emerald">
      <div className="max-w-4xl mx-auto py-6 px-4">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900">
            Informes PDF descargables
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Genera documentos listos para imprimir o compartir con bancos, INDAP
            o asesores.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {REPORTES.map((reporte) => {
            const habilitado = tieneData[reporte.id];
            const estaGenerando = generando === reporte.id;

            return (
              <div
                key={reporte.id}
                className={`bg-white rounded-xl border p-5 flex flex-col ${
                  habilitado
                    ? "border-gray-200 shadow-sm"
                    : "border-gray-100 opacity-60"
                }`}
              >
                <div className="text-3xl mb-3">{reporte.icono}</div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  {reporte.titulo}
                </h3>
                <p className="text-xs text-gray-500 flex-1 mb-4">
                  {reporte.descripcion}
                </p>

                {!habilitado && (
                  <p className="text-xs text-amber-600 mb-3">
                    Requiere: {reporte.requisito}
                  </p>
                )}

                <button
                  onClick={acciones[reporte.id]}
                  disabled={!habilitado || generando !== null}
                  className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    habilitado && !generando
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {estaGenerando ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Descargar PDF
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </PageLayout>
  );
}
