"use client";

import { useState, useMemo, useCallback } from "react";
import { useProjectContext } from "@/contexts/project-context";
import { useCosechas } from "@/hooks/use-cosechas";
import { FormCosecha } from "@/components/cosechas";
import { formatCLP } from "@/lib/utils";

interface Props {
  zonaId: string;
}

export function CosechasZonaSection({ zonaId }: Props) {
  const { zonas, plantas, catalogoCultivos, cargarDatosTerreno } =
    useProjectContext();
  const [showForm, setShowForm] = useState(false);

  const onRefetch = useCallback(() => {
    cargarDatosTerreno();
  }, [cargarDatosTerreno]);

  const { cosechas, loading, resumenMesActual, registrarCosecha } = useCosechas(
    zonas,
    onRefetch,
  );

  const cosechasZona = useMemo(
    () => cosechas.filter((c) => c.zona_id === zonaId),
    [cosechas, zonaId],
  );

  if (loading) {
    return <p className="text-xs text-gray-400">Cargando cosechas...</p>;
  }

  return (
    <>
      <div className="space-y-2">
        {resumenMesActual.cantidadRegistros > 0 && (
          <div className="grid grid-cols-3 gap-2 text-center bg-amber-50 rounded-lg p-2">
            <div>
              <div className="text-sm font-bold text-gray-900">
                {resumenMesActual.totalKg.toLocaleString("es-CL", {
                  maximumFractionDigits: 1,
                })}{" "}
                kg
              </div>
              <div className="text-[10px] text-gray-500">Cosechado</div>
            </div>
            <div>
              <div className="text-sm font-bold text-emerald-700">
                {resumenMesActual.totalIngreso > 0
                  ? formatCLP(resumenMesActual.totalIngreso)
                  : "—"}
              </div>
              <div className="text-[10px] text-gray-500">Ingreso</div>
            </div>
            <div>
              <div className="text-sm font-bold text-gray-700">
                {resumenMesActual.cantidadRegistros}
              </div>
              <div className="text-[10px] text-gray-500">Registros</div>
            </div>
          </div>
        )}

        {cosechasZona.length === 0 ? (
          <p className="text-xs text-gray-400">
            Sin cosechas registradas en esta zona.
          </p>
        ) : (
          <div className="space-y-1">
            {cosechasZona.slice(0, 3).map((c) => (
              <div
                key={c.id}
                className="flex justify-between text-xs text-gray-600"
              >
                <span className="font-medium text-amber-700">
                  {(c.cantidad_kg ?? 0).toLocaleString("es-CL", {
                    maximumFractionDigits: 1,
                  })}{" "}
                  kg
                  {c.calidad ? ` (${c.calidad})` : ""}
                </span>
                <span>{new Date(c.fecha).toLocaleDateString("es-CL")}</span>
              </div>
            ))}
            {cosechasZona.length > 3 && (
              <p className="text-[10px] text-gray-400">
                +{cosechasZona.length - 3} más
              </p>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="w-full bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700 text-xs font-medium transition-colors"
        >
          + Registrar cosecha
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[85vh] overflow-y-auto p-4">
            <FormCosecha
              zonas={zonas}
              plantas={plantas}
              catalogoCultivos={catalogoCultivos}
              onSubmit={async (data) => {
                const cosecha = await registrarCosecha(data);
                setShowForm(false);
                return cosecha;
              }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
