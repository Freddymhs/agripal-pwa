"use client";

import { useState, useMemo } from "react";
import { useProjectContext } from "@/contexts/project-context";
import { PageLayout } from "@/components/layout/page-layout";
import { useInsumos } from "@/hooks/use-insumos";
import { getCurrentTimestamp } from "@/lib/utils";
import {
  getInsumos,
  verificarCompatibilidad,
  getNivelMayorIncompatibilidad,
} from "@/lib/data/compatibilidad-insumos";
import type { IncompatibilidadQuimica } from "@/types";

const NIVEL_COLORES: Record<"alto" | "medio" | "ninguno", string> = {
  alto: "bg-red-50 border-red-300 text-red-800",
  medio: "bg-yellow-50 border-yellow-300 text-yellow-800",
  ninguno: "bg-green-50 border-green-300 text-green-800",
};

const NIVEL_BADGE: Record<"alto" | "medio" | "ninguno", string> = {
  alto: "bg-red-200 text-red-900",
  medio: "bg-yellow-200 text-yellow-900",
  ninguno: "bg-green-200 text-green-900",
};

const NIVEL_LABEL: Record<"alto" | "medio" | "ninguno", string> = {
  alto: "INCOMPATIBLE",
  medio: "Precaución",
  ninguno: "Compatible",
};

export default function InsumosPage() {
  const { terrenoActual, loading } = useProjectContext();
  const { insumos, agregarInsumo, eliminarInsumo } = useInsumos(
    terrenoActual?.id ?? null,
  );

  const catalogoInsumos = getInsumos();

  const [insumoSeleccionadoId, setInsumoSeleccionadoId] = useState<string>("");
  const [insumosParaChequear, setInsumosParaChequear] = useState<string[]>([]);
  const [resultadoChequeo, setResultadoChequeo] = useState<
    IncompatibilidadQuimica[] | null
  >(null);
  const [modoChequeo, setModoChequeo] = useState(false);

  const incompatibilidades = useMemo<IncompatibilidadQuimica[]>(() => {
    if (resultadoChequeo === null) return [];
    return resultadoChequeo;
  }, [resultadoChequeo]);

  const nivelMayor = useMemo(
    () => getNivelMayorIncompatibilidad(incompatibilidades),
    [incompatibilidades],
  );

  const handleAgregarInsumo = async () => {
    if (!insumoSeleccionadoId || !terrenoActual) return;
    const insumoRef = catalogoInsumos.find(
      (i) => i.id === insumoSeleccionadoId,
    );
    if (!insumoRef) return;

    const yaExiste = insumos.some((i) => i.nombre === insumoRef.nombre);
    if (yaExiste) return;

    await agregarInsumo({
      terreno_id: terrenoActual.id,
      nombre: insumoRef.nombre,
      tipo: insumoRef.tipo,
      fecha_registro: getCurrentTimestamp(),
    });
    setInsumoSeleccionadoId("");
  };

  const handleToggleChequeo = (insumoNombre: string) => {
    setInsumosParaChequear((prev) =>
      prev.includes(insumoNombre)
        ? prev.filter((n) => n !== insumoNombre)
        : [...prev, insumoNombre],
    );
    setResultadoChequeo(null);
  };

  const handleChequear = () => {
    const idsChequeo = insumos
      .filter((i) => insumosParaChequear.includes(i.nombre))
      .map((i) => {
        const ref = catalogoInsumos.find((c) => c.nombre === i.nombre);
        return ref?.id ?? "";
      })
      .filter(Boolean);

    setResultadoChequeo(verificarCompatibilidad(idsChequeo));
  };

  const handleCancelarChequeo = () => {
    setModoChequeo(false);
    setInsumosParaChequear([]);
    setResultadoChequeo(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  return (
    <PageLayout headerColor="emerald" title="Insumos y Compatibilidad">
      <main className="p-4 space-y-4 max-w-4xl mx-auto">
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-lg">
          <p className="text-sm text-emerald-800">
            Registra los insumos que usas (fertilizantes, pesticidas,
            correctores) y verifica si puedes mezclarlos antes de aplicarlos.
          </p>
        </div>

        {/* Agregar insumo */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-base font-semibold text-gray-800 mb-3">
            Agregar insumo al terreno
          </h2>
          <div className="flex gap-2">
            <select
              value={insumoSeleccionadoId}
              onChange={(e) => setInsumoSeleccionadoId(e.target.value)}
              className="flex-1 px-3 py-2 border rounded text-gray-900 text-sm"
            >
              <option value="">Seleccionar insumo...</option>
              {catalogoInsumos.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nombre} — {i.tipo}
                </option>
              ))}
            </select>
            <button
              onClick={handleAgregarInsumo}
              disabled={!insumoSeleccionadoId}
              className="px-4 py-2 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Agregar
            </button>
          </div>
        </div>

        {/* Lista de insumos registrados */}
        {insumos.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500 text-sm">
            No tienes insumos registrados para este terreno. Agrega los
            productos que usas para verificar compatibilidad.
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-800">
                Mis insumos ({insumos.length})
              </h2>
              {!modoChequeo ? (
                <button
                  onClick={() => setModoChequeo(true)}
                  className="px-3 py-1.5 bg-orange-500 text-white text-sm rounded hover:bg-orange-600"
                >
                  ¿Puedo mezclar?
                </button>
              ) : (
                <button
                  onClick={handleCancelarChequeo}
                  className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                >
                  Cancelar
                </button>
              )}
            </div>

            {modoChequeo && (
              <div className="bg-orange-50 border border-orange-200 rounded p-3 mb-3 text-sm text-orange-800">
                Selecciona 2 o más insumos que quieras mezclar y presiona
                &quot;Verificar&quot;.
              </div>
            )}

            <div className="space-y-2">
              {insumos.map((insumo) => {
                const seleccionado = insumosParaChequear.includes(
                  insumo.nombre,
                );
                return (
                  <div
                    key={insumo.id}
                    className={`flex items-center justify-between p-3 rounded border ${
                      modoChequeo && seleccionado
                        ? "border-orange-400 bg-orange-50"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {modoChequeo && (
                        <input
                          type="checkbox"
                          checked={seleccionado}
                          onChange={() => handleToggleChequeo(insumo.nombre)}
                          className="w-4 h-4 accent-orange-500"
                        />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {insumo.nombre}
                        </p>
                        <p className="text-xs text-gray-500">{insumo.tipo}</p>
                      </div>
                    </div>
                    {!modoChequeo && (
                      <button
                        onClick={() => eliminarInsumo(insumo.id)}
                        className="text-xs text-red-400 hover:text-red-600 px-2 py-1"
                        aria-label={`Eliminar ${insumo.nombre}`}
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {modoChequeo && insumosParaChequear.length >= 2 && (
              <button
                onClick={handleChequear}
                className="mt-3 w-full py-2 bg-orange-500 text-white text-sm rounded hover:bg-orange-600 font-medium"
              >
                Verificar {insumosParaChequear.length} insumos
              </button>
            )}
          </div>
        )}

        {/* Resultado del chequeo */}
        {resultadoChequeo !== null && (
          <div className={`rounded-lg border p-4 ${NIVEL_COLORES[nivelMayor]}`}>
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${NIVEL_BADGE[nivelMayor]}`}
              >
                {NIVEL_LABEL[nivelMayor]}
              </span>
              <span className="text-sm font-semibold">
                {incompatibilidades.length === 0
                  ? "No se encontraron incompatibilidades entre los insumos seleccionados."
                  : `${incompatibilidades.length} incompatibilidad(es) detectada(s)`}
              </span>
            </div>

            {incompatibilidades.map((inc, idx) => {
              const nombreA =
                catalogoInsumos.find((i) => i.id === inc.insumo_a)?.nombre ??
                inc.insumo_a;
              const nombreB =
                catalogoInsumos.find((i) => i.id === inc.insumo_b)?.nombre ??
                inc.insumo_b;
              return (
                <div
                  key={idx}
                  className="mt-3 pt-3 border-t border-current border-opacity-20"
                >
                  <p className="text-sm font-semibold">
                    {nombreA} + {nombreB}
                  </p>
                  <p className="text-sm mt-1">{inc.razon}</p>
                  <p className="text-sm mt-1 font-medium">
                    Recomendación: {inc.recomendacion}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </PageLayout>
  );
}
