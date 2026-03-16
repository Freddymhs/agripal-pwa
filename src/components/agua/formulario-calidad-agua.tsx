"use client";

import { useState, useEffect } from "react";
import type { CalidadAguaTerreno, FuenteAgua } from "@/types";
import { CrearFuenteForm } from "./crear-fuente-form";
import { DetalleFuente } from "./detalle-fuente";

interface FormularioCalidadAguaProps {
  calidad?: CalidadAguaTerreno;
  onChange: (calidad: CalidadAguaTerreno) => void;
  fuentesAgua?: FuenteAgua[];
  onCrearFuente?: (fuente: Omit<FuenteAgua, "id">) => Promise<void>;
  onEliminarFuente?: (fuenteId: string) => Promise<void>;
}

export function FormularioCalidadAgua({
  calidad,
  onChange,
  fuentesAgua = [],
  onCrearFuente,
  onEliminarFuente,
}: FormularioCalidadAguaProps) {
  const [data, setData] = useState<CalidadAguaTerreno>(calidad || {});
  const [mostrarFormNueva, setMostrarFormNueva] = useState(false);

  useEffect(() => {
    onChange(data);
  }, [data, onChange]);

  const handleFuenteChange = (fuenteId: string) => {
    const fuente = fuentesAgua.find((f) => f.id === fuenteId);

    if (fuente) {
      setData({
        ...data,
        fuente: fuenteId,
        salinidad_dS_m: fuente.salinidad_dS_m,
        boro_ppm: fuente.boro_ppm,
        arsenico_mg_l: fuente.arsenico_mg_l,
      });
    } else {
      setData({
        ...data,
        fuente: fuenteId || undefined,
        salinidad_dS_m: undefined,
        boro_ppm: undefined,
        arsenico_mg_l: undefined,
      });
    }
  };

  const handleCrearFuente = async (fuente: Omit<FuenteAgua, "id">) => {
    if (!onCrearFuente) return;
    await onCrearFuente(fuente);
    setMostrarFormNueva(false);
  };

  const handleEliminarFuente = async (fuenteId: string) => {
    if (!onEliminarFuente) return;
    if (data.fuente === fuenteId) {
      setData({
        ...data,
        fuente: undefined,
        salinidad_dS_m: undefined,
        boro_ppm: undefined,
        arsenico_mg_l: undefined,
      });
    }
    await onEliminarFuente(fuenteId);
  };

  const fuenteSeleccionada = fuentesAgua.find((f) => f.id === data.fuente);

  return (
    <div className="space-y-4">
      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={data.analisis_realizado || false}
            onChange={(e) =>
              setData({ ...data, analisis_realizado: e.target.checked })
            }
            className="rounded"
          />
          <span className="text-sm text-yellow-800 font-medium">
            Análisis de laboratorio realizado
          </span>
        </label>
        <p className="text-xs text-yellow-700 mt-1 ml-6">INIA ~$75,000 CLP</p>
      </div>

      {data.analisis_realizado && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha análisis
            </label>
            <input
              type="date"
              value={data.fecha_analisis || ""}
              onChange={(e) =>
                setData({ ...data, fecha_analisis: e.target.value })
              }
              className="w-full px-3 py-2 border rounded text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Laboratorio
            </label>
            <input
              type="text"
              value={data.laboratorio || ""}
              onChange={(e) =>
                setData({ ...data, laboratorio: e.target.value })
              }
              placeholder="INIA"
              className="w-full px-3 py-2 border rounded text-gray-900"
            />
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">
            Fuente de agua
          </label>
          {onCrearFuente && !mostrarFormNueva && (
            <button
              type="button"
              onClick={() => setMostrarFormNueva(true)}
              className="text-xs text-green-600 hover:text-green-700 font-medium"
            >
              + Agregar fuente
            </button>
          )}
        </div>

        {mostrarFormNueva && onCrearFuente && (
          <CrearFuenteForm
            onCrear={handleCrearFuente}
            onCancelar={() => setMostrarFormNueva(false)}
          />
        )}

        <div className="flex gap-2">
          <select
            value={data.fuente || ""}
            onChange={(e) => handleFuenteChange(e.target.value)}
            className="flex-1 px-3 py-2 border rounded text-gray-900"
          >
            <option value="">Seleccionar...</option>
            {fuentesAgua.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nombre}
              </option>
            ))}
          </select>
          {onEliminarFuente && data.fuente && (
            <button
              type="button"
              onClick={() => handleEliminarFuente(data.fuente!)}
              className="px-3 py-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded border border-red-200"
              title="Eliminar esta fuente"
            >
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {fuenteSeleccionada && <DetalleFuente fuente={fuenteSeleccionada} />}

      {!fuenteSeleccionada && (
        <p className="text-xs text-gray-400 italic">
          Selecciona una fuente de agua para ver sus propiedades.
        </p>
      )}

      <div className="pt-4 border-t">
        <label className="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            checked={data.requiere_filtrado || false}
            onChange={(e) =>
              setData({ ...data, requiere_filtrado: e.target.checked })
            }
            className="rounded"
          />
          <span className="text-sm text-gray-700">
            Requiere filtrado/tratamiento
          </span>
        </label>

        {data.requiere_filtrado && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Costo filtrado mensual (CLP)
            </label>
            <input
              type="number"
              value={data.costo_filtrado_mensual ?? ""}
              onChange={(e) =>
                setData({
                  ...data,
                  costo_filtrado_mensual:
                    e.target.value === ""
                      ? undefined
                      : parseInt(e.target.value),
                })
              }
              className="w-full px-3 py-2 border rounded text-gray-900"
            />
          </div>
        )}
      </div>
    </div>
  );
}
