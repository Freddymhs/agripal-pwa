"use client";

import { useState } from "react";

interface ContenidoEliminacion {
  terrenos?: number;
  zonas: number;
  plantas: number;
  cultivos?: number;
}

interface ConfirmarEliminacionModalProps {
  tipo: "terreno" | "proyecto";
  nombre: string;
  contenido: ContenidoEliminacion;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmarEliminacionModal({
  tipo,
  nombre,
  contenido,
  onConfirm,
  onCancel,
}: ConfirmarEliminacionModalProps) {
  const [confirmacion, setConfirmacion] = useState("");

  const coincide = confirmacion === nombre;
  const hayContenido =
    (contenido.terrenos || 0) > 0 ||
    contenido.zonas > 0 ||
    contenido.plantas > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Eliminar {tipo === "terreno" ? "Terreno" : "Proyecto"}
            </h3>
            <p className="text-sm text-gray-500">&ldquo;{nombre}&rdquo;</p>
          </div>
        </div>

        {hayContenido && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-sm font-medium text-red-800 mb-2">
              Se eliminarán permanentemente:
            </p>
            <ul className="text-sm text-red-700 space-y-1">
              {tipo === "proyecto" &&
                contenido.terrenos !== undefined &&
                contenido.terrenos > 0 && (
                  <li>• {contenido.terrenos} terreno(s)</li>
                )}
              {contenido.zonas > 0 && <li>• {contenido.zonas} zona(s)</li>}
              {contenido.plantas > 0 && (
                <li>• {contenido.plantas} planta(s)</li>
              )}
              {tipo === "proyecto" &&
                contenido.cultivos !== undefined &&
                contenido.cultivos > 0 && (
                  <li>• {contenido.cultivos} cultivo(s) del catálogo</li>
                )}
            </ul>
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-700 mb-3">
            Esta acción <strong>NO se puede deshacer</strong>. Para confirmar,
            escribe el nombre exacto:
          </p>
          <div className="bg-white px-3 py-2 rounded border text-center mb-3">
            <code className="text-sm font-mono text-gray-900">{nombre}</code>
          </div>
          <input
            type="text"
            value={confirmacion}
            onChange={(e) => setConfirmacion(e.target.value)}
            placeholder="Escribe el nombre aquí"
            className="w-full px-3 py-2 border rounded text-gray-900"
            autoFocus
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            disabled={!coincide}
            className={`flex-1 py-2 rounded font-medium ${
              coincide
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
          >
            Eliminar {tipo === "terreno" ? "Terreno" : "Proyecto"}
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
