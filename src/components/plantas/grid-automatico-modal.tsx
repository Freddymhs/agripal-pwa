"use client";

import { useState, useMemo } from "react";
import {
  generarGridPlantas,
  validarGridPlantas,
} from "@/lib/validations/planta";
import type { Zona, CatalogoCultivo, Planta } from "@/types";

interface GridAutomaticoModalProps {
  zona: Zona;
  cultivo: CatalogoCultivo;
  plantasExistentes: Planta[];
  onConfirm: (espaciado: number) => void;
  onCancel: () => void;
}

export function GridAutomaticoModal({
  zona,
  cultivo,
  plantasExistentes,
  onConfirm,
  onCancel,
}: GridAutomaticoModalProps) {
  const [espaciado, setEspaciado] = useState(cultivo.espaciado_recomendado_m);

  const preview = useMemo(() => {
    const posiciones = generarGridPlantas(zona, espaciado, cultivo);
    const { validas, invalidas } = validarGridPlantas(
      posiciones,
      zona,
      plantasExistentes,
      cultivo,
    );
    return {
      total: posiciones.length,
      validas: validas.length,
      invalidas: invalidas.length,
    };
  }, [zona, espaciado, plantasExistentes, cultivo]);

  const espaciadoValido = espaciado >= cultivo.espaciado_recomendado_m;
  const cantidadExcesiva = preview.validas > 5000;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Plantar en Grilla
        </h3>

        <div className="bg-gray-50 p-3 rounded mb-4 text-sm text-gray-900">
          <div>
            <strong className="text-gray-900">Cultivo:</strong> {cultivo.nombre}
          </div>
          <div>
            <strong className="text-gray-900">Zona:</strong> {zona.nombre} (
            {zona.area_m2} m²)
          </div>
          <div>
            <strong className="text-gray-900">Espaciado recomendado:</strong>{" "}
            {cultivo.espaciado_recomendado_m}m
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Espaciado entre plantas (metros)
          </label>
          <input
            type="number"
            value={espaciado}
            onChange={(e) => setEspaciado(Number(e.target.value))}
            min={cultivo.espaciado_recomendado_m}
            step={0.01}
            className={`w-full px-3 py-2 border rounded text-gray-900 ${
              !espaciadoValido ? "border-red-500" : ""
            }`}
          />
          {!espaciadoValido && (
            <p className="text-red-600 text-sm mt-1 font-medium">
              {cultivo.nombre} necesita {cultivo.espaciado_recomendado_m}m de
              espacio
            </p>
          )}
        </div>

        <div className="bg-green-50 p-4 rounded mb-4 border border-green-200">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-700">
              {preview.validas}
            </div>
            <div className="text-sm text-green-800 font-medium">
              plantas se crearán
            </div>
          </div>

          {preview.invalidas > 0 && (
            <div className="text-center mt-2 text-orange-700 text-sm font-medium">
              {preview.invalidas} posiciones omitidas (conflicto con plantas
              existentes)
            </div>
          )}

          <div className="mt-3 text-xs text-gray-700 text-center">
            Grid de {espaciado}m × {espaciado}m (centrado en la zona)
          </div>

          {cantidadExcesiva && (
            <div className="mt-2 text-xs text-red-600 text-center font-medium">
              ⚠️ Cantidad muy alta. Puede ralentizar la aplicación.
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onConfirm(espaciado)}
            disabled={!espaciadoValido || preview.validas === 0}
            className={`flex-1 py-2 rounded font-medium ${
              espaciadoValido && preview.validas > 0
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
          >
            Plantar {preview.validas} plantas
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300 font-medium"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
