"use client";

import Link from "next/link";
import { formatArea } from "@/lib/utils";
import type { Terreno } from "@/types";
import { ROUTES } from "@/lib/constants/routes";

interface TerrenoConConteo extends Terreno {
  zonasCount: number;
  plantasCount: number;
}

interface TarjetaTerrenoProps {
  terreno: TerrenoConConteo;
  editando: boolean;
  editandoTerreno: Terreno | null;
  onEdit: () => void;
  onDelete: () => void;
  onChangeEditando: (t: Terreno) => void;
  onGuardar: () => void;
  onCancelar: () => void;
  onSelectTerreno: () => void;
}

export function TarjetaTerreno({
  terreno,
  editando,
  editandoTerreno,
  onEdit,
  onDelete,
  onChangeEditando,
  onGuardar,
  onCancelar,
  onSelectTerreno,
}: TarjetaTerrenoProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="h-24 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center relative">
        <div
          className="bg-green-500/30 border-2 border-green-600 rounded"
          style={{
            width: `${Math.min(80, terreno.ancho_m * 2)}px`,
            height: `${Math.min(60, terreno.alto_m * 2)}px`,
          }}
        />
        <div className="absolute bottom-2 right-2 text-xs text-green-700 bg-white/80 px-2 py-0.5 rounded">
          {terreno.ancho_m}m x {terreno.alto_m}m
        </div>
      </div>

      <div className="p-4">
        {editando && editandoTerreno ? (
          <div className="space-y-3">
            <input
              type="text"
              value={editandoTerreno.nombre}
              onChange={(e) =>
                onChangeEditando({ ...editandoTerreno, nombre: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              placeholder="Nombre"
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500">Ancho (m)</label>
                <input
                  type="number"
                  value={editandoTerreno.ancho_m}
                  onChange={(e) =>
                    onChangeEditando({
                      ...editandoTerreno,
                      ancho_m: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  min={1}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Alto (m)</label>
                <input
                  type="number"
                  value={editandoTerreno.alto_m}
                  onChange={(e) =>
                    onChangeEditando({
                      ...editandoTerreno,
                      alto_m: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  min={1}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onGuardar}
                className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded text-sm"
              >
                Guardar
              </button>
              <button
                onClick={onCancelar}
                className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-900">{terreno.nombre}</h3>
              <div className="flex gap-1">
                <button
                  onClick={onEdit}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                  title="Editar"
                >
                  ✏️
                </button>
                <button
                  onClick={onDelete}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                  title="Eliminar"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div className="text-sm text-gray-600 space-y-1 mb-3">
              <p>Area: {formatArea(terreno.area_m2)}</p>
              <p>
                Zonas: {terreno.zonasCount} - Plantas: {terreno.plantasCount}
              </p>
            </div>

            <Link
              href={ROUTES.HOME}
              onClick={onSelectTerreno}
              className="block w-full text-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
            >
              Ver en Mapa
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
