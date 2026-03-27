"use client";

import { useState, useMemo, useEffect } from "react";
import { useInsumos } from "@/hooks/use-insumos";
import { baseDataDAL } from "@/lib/dal";
import type { InsumoCatalogo } from "@/lib/dal/base-data";
import {
  verificarCompatibilidadPorIds,
  mapearNombresAIds,
  getNivelMayorIncompatibilidad,
} from "@/lib/data/compatibilidad-insumos";
import type { IncompatibilidadQuimica } from "@/types";
import { getCurrentTimestamp } from "@/lib/utils";

const NIVEL_COLORES: Record<string, string> = {
  alto: "bg-red-50 border-red-300 text-red-800",
  medio: "bg-yellow-50 border-yellow-300 text-yellow-800",
  ninguno: "bg-green-50 border-green-300 text-green-800",
};

const NIVEL_LABEL: Record<string, string> = {
  alto: "INCOMPATIBLE",
  medio: "Precaución",
  ninguno: "Compatible",
};

interface Props {
  terrenoId: string;
}

export function InsumosZonaSection({ terrenoId }: Props) {
  const { insumos, agregarInsumo } = useInsumos(terrenoId);
  const [showModal, setShowModal] = useState(false);
  const [catalogoInsumos, setCatalogoInsumos] = useState<InsumoCatalogo[]>([]);
  const [insumoSeleccionadoId, setInsumoSeleccionadoId] = useState("");

  useEffect(() => {
    if (!terrenoId) return;
    baseDataDAL.getInsumosByTerrenoId(terrenoId).then(setCatalogoInsumos);
  }, [terrenoId]);

  const handleAgregar = async () => {
    if (!insumoSeleccionadoId) return;
    const ref = catalogoInsumos.find((i) => i.id === insumoSeleccionadoId);
    if (!ref || insumos.some((i) => i.nombre === ref.nombre)) return;
    await agregarInsumo({
      terreno_id: terrenoId,
      nombre: ref.nombre,
      tipo: ref.tipo,
      fecha_registro: getCurrentTimestamp(),
    });
    setInsumoSeleccionadoId("");
  };

  return (
    <>
      <div className="space-y-2">
        {insumos.length === 0 ? (
          <p className="text-xs text-gray-400">
            No hay insumos registrados en este terreno.
          </p>
        ) : (
          <div className="space-y-1">
            {insumos.slice(0, 5).map((ins) => (
              <div
                key={ins.id}
                className="flex items-center justify-between p-1.5 rounded bg-emerald-50 text-xs"
              >
                <span className="font-medium text-emerald-800">
                  {ins.nombre}
                </span>
                <span className="text-emerald-600 text-[10px]">{ins.tipo}</span>
              </div>
            ))}
            {insumos.length > 5 && (
              <p className="text-[10px] text-gray-400">
                +{insumos.length - 5} más
              </p>
            )}
          </div>
        )}

        {/* Agregar insumo inline */}
        <div className="flex gap-1.5">
          <select
            value={insumoSeleccionadoId}
            onChange={(e) => setInsumoSeleccionadoId(e.target.value)}
            className="flex-1 px-2 py-1.5 border rounded text-xs text-gray-900"
          >
            <option value="">Agregar insumo...</option>
            {catalogoInsumos.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nombre}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAgregar}
            disabled={!insumoSeleccionadoId}
            className="px-3 py-1.5 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            +
          </button>
        </div>

        {insumos.length >= 2 && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 text-xs font-medium transition-colors"
          >
            Verificar compatibilidad
          </button>
        )}
      </div>

      {showModal && (
        <CompatibilidadModal
          insumos={insumos}
          catalogoInsumos={catalogoInsumos}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

function CompatibilidadModal({
  insumos,
  catalogoInsumos,
  onClose,
}: {
  insumos: { id: string; nombre: string; tipo: string }[];
  catalogoInsumos: InsumoCatalogo[];
  onClose: () => void;
}) {
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [resultado, setResultado] = useState<IncompatibilidadQuimica[] | null>(
    null,
  );

  const toggleInsumo = (nombre: string) => {
    setSeleccionados((prev) =>
      prev.includes(nombre)
        ? prev.filter((n) => n !== nombre)
        : [...prev, nombre],
    );
    setResultado(null);
  };

  const handleVerificar = () => {
    const ids = mapearNombresAIds(seleccionados, catalogoInsumos);
    setResultado(verificarCompatibilidadPorIds(ids));
  };

  const nivelMayor = useMemo(
    () => (resultado ? getNivelMayorIncompatibilidad(resultado) : "ninguno"),
    [resultado],
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="border-b px-4 py-3 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-gray-900">Verificar compatibilidad</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-3">
          <p className="text-xs text-gray-600">
            Selecciona 2+ insumos para verificar si puedes mezclarlos.
          </p>

          <div className="space-y-1.5">
            {insumos.map((ins) => (
              <label
                key={ins.id}
                className={`flex items-center gap-2 p-2 rounded border cursor-pointer text-sm ${
                  seleccionados.includes(ins.nombre)
                    ? "border-orange-400 bg-orange-50"
                    : "border-gray-200"
                }`}
              >
                <input
                  type="checkbox"
                  checked={seleccionados.includes(ins.nombre)}
                  onChange={() => toggleInsumo(ins.nombre)}
                  className="w-4 h-4 accent-orange-500"
                />
                <span className="font-medium text-gray-800">{ins.nombre}</span>
                <span className="text-xs text-gray-400 ml-auto">
                  {ins.tipo}
                </span>
              </label>
            ))}
          </div>

          {seleccionados.length >= 2 && resultado === null && (
            <button
              onClick={handleVerificar}
              className="w-full py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 font-medium"
            >
              Verificar {seleccionados.length} insumos
            </button>
          )}

          {resultado !== null && (
            <div
              className={`rounded-lg border p-3 ${NIVEL_COLORES[nivelMayor]}`}
            >
              <span className="text-xs font-bold">
                {NIVEL_LABEL[nivelMayor]}
              </span>
              {resultado.length === 0 ? (
                <p className="text-sm mt-1">
                  No se encontraron incompatibilidades.
                </p>
              ) : (
                resultado.map((inc, idx) => {
                  const nombreA =
                    catalogoInsumos.find((i) => i.id === inc.insumo_a)
                      ?.nombre ?? inc.insumo_a;
                  const nombreB =
                    catalogoInsumos.find((i) => i.id === inc.insumo_b)
                      ?.nombre ?? inc.insumo_b;
                  return (
                    <div
                      key={idx}
                      className="mt-2 pt-2 border-t border-current/20"
                    >
                      <p className="text-sm font-semibold">
                        {nombreA} + {nombreB}
                      </p>
                      <p className="text-sm mt-0.5">{inc.razon}</p>
                      <p className="text-sm mt-0.5 font-medium">
                        {inc.recomendacion}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
