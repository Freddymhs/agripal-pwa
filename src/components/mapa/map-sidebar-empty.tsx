"use client";

import type { Terreno, Zona } from "@/types";

interface MapSidebarEmptyProps {
  terrenoActual: Terreno;
  zonas: Zona[];
  onConfigAvanzada: () => void;
  children?: React.ReactNode;
}

export function MapSidebarEmpty({
  terrenoActual,
  zonas,
  onConfigAvanzada,
  children,
}: MapSidebarEmptyProps) {
  return (
    <div className="p-4 space-y-3">
      <div className="bg-white rounded-lg border shadow-sm">
        <div
          className={`p-4 flex justify-between items-center ${!children ? "border-b" : ""}`}
        >
          <h3 className="font-medium text-gray-900">{terrenoActual.nombre}</h3>
          <button
            onClick={onConfigAvanzada}
            className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
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
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Configurar
          </button>
        </div>

        {!children && (
          <div className="p-4">
            <p className="text-sm text-gray-600 mb-3">
              Selecciona una zona o planta para ver detalles y opciones de
              edición.
            </p>

            {zonas.length === 0 ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Comienza aquí:</strong> Haz clic en &quot;+ Nueva
                  Zona&quot; arriba y dibuja un rectángulo en el mapa.
                </p>
              </div>
            ) : (
              <div className="text-xs text-gray-500 space-y-1">
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono">
                    Click
                  </kbd>
                  <span>en zona/planta para seleccionar</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono">
                    Shift + arrastrar
                  </kbd>
                  <span>para selección múltiple</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono">
                    ESC
                  </kbd>
                  <span>para deseleccionar</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {children}
    </div>
  );
}
