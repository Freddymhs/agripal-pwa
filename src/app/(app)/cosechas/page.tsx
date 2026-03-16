"use client";

import { useState, useMemo, useCallback } from "react";
import { PageLayout } from "@/components/layout";
import { useProjectContext } from "@/contexts/project-context";
import { useCosechas } from "@/hooks/use-cosechas";
import { FormCosecha, HistorialCosechas } from "@/components/cosechas";
import { TIPO_ZONA } from "@/lib/constants/entities";
import { formatCLP } from "@/lib/utils";

export default function CosechasPage() {
  const {
    terrenoActual: terreno,
    zonas,
    plantas,
    catalogoCultivos,
    loading: projectLoading,
    cargarDatosTerreno,
  } = useProjectContext();

  const [mostrarForm, setMostrarForm] = useState(false);

  const onRefetch = useCallback(() => {
    cargarDatosTerreno();
  }, [cargarDatosTerreno]);

  const {
    cosechas,
    loading,
    resumenMesActual,
    registrarCosecha,
    eliminarCosecha,
  } = useCosechas(zonas, onRefetch);

  const zonasCultivo = useMemo(
    () => zonas.filter((z) => z.tipo === TIPO_ZONA.CULTIVO),
    [zonas],
  );

  if (projectLoading) {
    return (
      <PageLayout headerColor="amber">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Cargando...</div>
        </div>
      </PageLayout>
    );
  }

  if (!terreno) {
    return (
      <PageLayout headerColor="amber">
        <main className="p-4">
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
            <p className="text-yellow-800">No hay terrenos creados.</p>
          </div>
        </main>
      </PageLayout>
    );
  }

  return (
    <PageLayout headerColor="amber">
      <main className="p-4 space-y-4 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Cosechas</h1>
          {!mostrarForm && (
            <button
              onClick={() => setMostrarForm(true)}
              disabled={zonasCultivo.length === 0}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + Registrar cosecha
            </button>
          )}
        </div>

        {zonasCultivo.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <p className="text-yellow-800 text-sm">
              No hay zonas de cultivo. Crea zonas y planta cultivos desde el
              mapa para poder registrar cosechas.
            </p>
          </div>
        )}

        {resumenMesActual.cantidadRegistros > 0 && !mostrarForm && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-amber-900 mb-2">
              Este mes
            </h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-lg font-bold text-gray-900">
                  {resumenMesActual.totalKg.toLocaleString("es-CL", {
                    maximumFractionDigits: 1,
                  })}{" "}
                  kg
                </div>
                <div className="text-xs text-gray-500">Cosechado</div>
              </div>
              <div>
                <div className="text-lg font-bold text-emerald-700">
                  {resumenMesActual.totalIngreso > 0
                    ? formatCLP(resumenMesActual.totalIngreso)
                    : "—"}
                </div>
                <div className="text-xs text-gray-500">Ingreso</div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-700">
                  {resumenMesActual.cantidadRegistros}
                </div>
                <div className="text-xs text-gray-500">Registros</div>
              </div>
            </div>
          </div>
        )}

        {mostrarForm && (
          <FormCosecha
            zonas={zonas}
            plantas={plantas}
            catalogoCultivos={catalogoCultivos}
            onSubmit={registrarCosecha}
            onCancel={() => setMostrarForm(false)}
          />
        )}

        {!loading && !mostrarForm && (
          <HistorialCosechas
            cosechas={cosechas}
            zonas={zonas}
            catalogoCultivos={catalogoCultivos}
            onEliminar={eliminarCosecha}
          />
        )}

        {loading && (
          <div className="text-center text-gray-400 text-sm py-8">
            Cargando cosechas...
          </div>
        )}
      </main>
    </PageLayout>
  );
}
