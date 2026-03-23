"use client";

import { useState } from "react";
import type { Proyecto, Terreno } from "@/types";

interface SelectorTerrenoProps {
  proyectos: Proyecto[];
  terrenos: Terreno[];
  proyectoActual: Proyecto | null;
  terrenoActual: Terreno | null;
  onSelectProyecto: (proyecto: Proyecto) => void;
  onSelectTerreno: (terreno: Terreno) => void;
  onCrearProyecto: () => void;
  onCrearTerreno: () => void;
  onGestionarTerrenos: () => void;
  readonly?: boolean;
  readonlyProyecto?: boolean;
}

export function SelectorTerreno({
  proyectos,
  terrenos,
  proyectoActual,
  terrenoActual,
  onSelectProyecto,
  onSelectTerreno,
  onCrearProyecto,
  onCrearTerreno,
  onGestionarTerrenos,
  readonly = false,
  readonlyProyecto = false,
}: SelectorTerrenoProps) {
  const [showProyectos, setShowProyectos] = useState(false);
  const [showTerrenos, setShowTerrenos] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <button
          onClick={
            readonly || readonlyProyecto
              ? undefined
              : () => {
                  setShowProyectos(!showProyectos);
                  setShowTerrenos(false);
                }
          }
          disabled={readonly || readonlyProyecto}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${
            readonly || readonlyProyecto
              ? "bg-green-700 cursor-default"
              : "bg-green-700 hover:bg-green-800"
          }`}
        >
          <span className="opacity-70">Proyecto:</span>
          <span className="font-medium">
            {proyectoActual?.nombre || "Seleccionar"}
          </span>
          {!readonly && !readonlyProyecto && (
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
                d="M19 9l-7 7-7-7"
              />
            </svg>
          )}
        </button>

        {showProyectos && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border z-50">
            <div className="p-2 border-b">
              <span className="text-xs text-gray-500 font-medium">
                Mis Proyectos
              </span>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {proyectos.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No tienes proyectos
                </div>
              ) : (
                proyectos.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelectProyecto(p);
                      setShowProyectos(false);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors ${
                      proyectoActual?.id === p.id ? "bg-green-50" : ""
                    }`}
                  >
                    <div className="font-medium text-gray-900">{p.nombre}</div>
                    <div className="text-xs text-gray-500">
                      {p.ubicacion_referencia}
                    </div>
                  </button>
                ))
              )}
            </div>
            <div className="p-2 border-t">
              <button
                onClick={() => {
                  onCrearProyecto();
                  setShowProyectos(false);
                }}
                className="w-full px-3 py-2 text-sm text-green-700 hover:bg-green-50 rounded font-medium text-left"
              >
                + Nuevo Proyecto
              </button>
            </div>
          </div>
        )}
      </div>

      {proyectoActual && (
        <div className="relative">
          <button
            onClick={
              readonly
                ? undefined
                : () => {
                    setShowTerrenos(!showTerrenos);
                    setShowProyectos(false);
                  }
            }
            disabled={readonly}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${
              readonly
                ? "bg-green-700 cursor-default"
                : "bg-green-700 hover:bg-green-800"
            }`}
          >
            <span className="opacity-70">Terreno:</span>
            <span className="font-medium">
              {terrenoActual?.nombre || "Seleccionar"}
            </span>
            {terrenoActual && (
              <span className="text-xs opacity-70">
                ({terrenoActual.ancho_m}×{terrenoActual.alto_m}m)
              </span>
            )}
            {!readonly && (
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
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            )}
          </button>

          {showTerrenos && (
            <div className="absolute top-full left-0 mt-1 w-72 bg-white rounded-lg shadow-lg border z-50">
              <div className="p-2 border-b">
                <span className="text-xs text-gray-500 font-medium">
                  Terrenos de {proyectoActual.nombre}
                </span>
              </div>
              <div className="max-h-[70vh] overflow-y-auto">
                {terrenos.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No hay terrenos en este proyecto
                  </div>
                ) : (
                  [...terrenos]
                    .sort(
                      (a, b) =>
                        new Date(b.created_at).getTime() -
                        new Date(a.created_at).getTime(),
                    )
                    .map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          onSelectTerreno(t);
                          setShowTerrenos(false);
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors ${
                          terrenoActual?.id === t.id ? "bg-green-50" : ""
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="font-medium text-gray-900">
                            {t.nombre}
                          </div>
                          <div className="text-xs text-gray-500">
                            {t.area_m2} m²
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {t.ancho_m}m × {t.alto_m}m
                        </div>
                      </button>
                    ))
                )}
              </div>
              <div className="p-2 border-t space-y-1">
                <button
                  onClick={() => {
                    onCrearTerreno();
                    setShowTerrenos(false);
                  }}
                  className="w-full px-3 py-2 text-sm text-green-700 hover:bg-green-50 rounded font-medium text-left"
                >
                  + Nuevo Terreno
                </button>
                <button
                  onClick={() => {
                    onGestionarTerrenos();
                    setShowTerrenos(false);
                  }}
                  className="w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded text-left"
                >
                  Gestionar terrenos...
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showProyectos && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowProyectos(false)}
        />
      )}
      {showTerrenos && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowTerrenos(false)}
        />
      )}
    </div>
  );
}
