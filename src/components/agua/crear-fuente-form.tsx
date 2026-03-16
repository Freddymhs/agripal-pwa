"use client";

import { useState } from "react";
import type { FuenteAgua, TipoFuenteAgua } from "@/types";
import { UMBRALES_AGUA } from "@/lib/data/umbrales-agua";

const TIPOS_FUENTE: { value: TipoFuenteAgua; label: string }[] = [
  { value: "pozo", label: "Pozo" },
  { value: "aljibe", label: "Aljibe / Camión" },
  { value: "rio", label: "Río / Canal" },
  { value: "canal", label: "Canal de riego" },
  { value: "reciclada", label: "Agua reciclada" },
  { value: "otro", label: "Otro" },
];

const ESTADO_INICIAL = {
  nombre: "",
  tipo: "pozo" as TipoFuenteAgua,
  salinidad_dS_m: undefined as number | undefined,
  boro_ppm: undefined as number | undefined,
  arsenico_mg_l: undefined as number | undefined,
  ph: undefined as number | undefined,
  costo_m3_clp: undefined as number | undefined,
  notas: "",
};

interface CrearFuenteFormProps {
  onCrear: (fuente: Omit<FuenteAgua, "id">) => Promise<void>;
  onCancelar: () => void;
}

export function CrearFuenteForm({ onCrear, onCancelar }: CrearFuenteFormProps) {
  const [fuente, setFuente] = useState(ESTADO_INICIAL);
  const [guardando, setGuardando] = useState(false);

  const handleGuardar = async () => {
    if (!fuente.nombre.trim()) return;
    setGuardando(true);
    try {
      await onCrear({
        nombre: fuente.nombre.trim(),
        tipo: fuente.tipo,
        salinidad_dS_m: fuente.salinidad_dS_m,
        boro_ppm: fuente.boro_ppm,
        arsenico_mg_l: fuente.arsenico_mg_l,
        ph: fuente.ph,
        costo_m3_clp: fuente.costo_m3_clp,
        notas: fuente.notas.trim() || undefined,
      });
    } finally {
      setGuardando(false);
    }
  };

  const updateField = (patch: Partial<typeof fuente>) =>
    setFuente({ ...fuente, ...patch });

  const parseNum = (val: string) => (val === "" ? undefined : parseFloat(val));

  const parseInt_ = (val: string) => (val === "" ? undefined : parseInt(val));

  return (
    <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-green-800">Nueva fuente de agua</p>
        <button
          type="button"
          onClick={onCancelar}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Cancelar
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Nombre *
          </label>
          <input
            type="text"
            value={fuente.nombre}
            onChange={(e) => updateField({ nombre: e.target.value })}
            placeholder="Ej: Pozo propio 50m"
            className="w-full px-2 py-1.5 border rounded text-sm text-gray-900"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Tipo
          </label>
          <select
            value={fuente.tipo}
            onChange={(e) =>
              updateField({ tipo: e.target.value as TipoFuenteAgua })
            }
            className="w-full px-2 py-1.5 border rounded text-sm text-gray-900"
          >
            {TIPOS_FUENTE.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="border-t border-green-200 pt-2">
        <p className="text-xs font-medium text-gray-600 mb-2">
          Datos del análisis de agua
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-500 mb-0.5">
              Salinidad (dS/m)
            </label>
            <input
              type="number"
              step="0.1"
              value={fuente.salinidad_dS_m ?? ""}
              onChange={(e) =>
                updateField({ salinidad_dS_m: parseNum(e.target.value) })
              }
              placeholder={`Máx ${UMBRALES_AGUA.salinidad.max}`}
              className="w-full px-2 py-1.5 border rounded text-sm text-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-0.5">
              Boro (ppm)
            </label>
            <input
              type="number"
              step="0.1"
              value={fuente.boro_ppm ?? ""}
              onChange={(e) =>
                updateField({ boro_ppm: parseNum(e.target.value) })
              }
              placeholder={`Máx ${UMBRALES_AGUA.boro.max}`}
              className="w-full px-2 py-1.5 border rounded text-sm text-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-0.5">
              Arsénico (mg/L)
            </label>
            <input
              type="number"
              step="0.01"
              value={fuente.arsenico_mg_l ?? ""}
              onChange={(e) =>
                updateField({ arsenico_mg_l: parseNum(e.target.value) })
              }
              placeholder={`Máx ${UMBRALES_AGUA.arsenico.max}`}
              className="w-full px-2 py-1.5 border rounded text-sm text-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-0.5">pH</label>
            <input
              type="number"
              step="0.1"
              value={fuente.ph ?? ""}
              onChange={(e) => updateField({ ph: parseNum(e.target.value) })}
              placeholder="6.0 - 8.5"
              className="w-full px-2 py-1.5 border rounded text-sm text-gray-900"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">
            Costo (CLP/m³)
          </label>
          <input
            type="number"
            value={fuente.costo_m3_clp ?? ""}
            onChange={(e) =>
              updateField({ costo_m3_clp: parseInt_(e.target.value) })
            }
            placeholder="0 si es gratis"
            className="w-full px-2 py-1.5 border rounded text-sm text-gray-900"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">Notas</label>
          <input
            type="text"
            value={fuente.notas}
            onChange={(e) => updateField({ notas: e.target.value })}
            placeholder="Observaciones..."
            className="w-full px-2 py-1.5 border rounded text-sm text-gray-900"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleGuardar}
        disabled={guardando || !fuente.nombre.trim()}
        className="w-full bg-green-600 text-white py-1.5 rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50"
      >
        {guardando ? "Guardando..." : "Guardar fuente"}
      </button>
    </div>
  );
}
