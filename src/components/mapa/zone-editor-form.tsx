"use client";

import { useState } from "react";
import type { Zona, TipoZona } from "@/types";
import { TIPO_ZONA } from "@/lib/constants/entities";
import { getCurrentTimestamp } from "@/lib/utils";

interface ZoneEditorFormProps {
  zona: Zona;
  nombre: string;
  tipo: TipoZona;
  notas: string | undefined;
  x: number;
  y: number;
  ancho: number;
  alto: number;
  cantidadPlantas: number;
  hayCambiosGeometricos: boolean;
  validacion: { valida: boolean; error?: string };
  error: string | null;
  saving: boolean;
  advertenciaEliminacion?: string | null;
  onNombreChange: (v: string) => void;
  onTipoChange: (v: TipoZona) => void;
  onNotasChange: (v: string | undefined) => void;
  onXChange: (v: number) => void;
  onYChange: (v: number) => void;
  onAnchoChange: (v: number) => void;
  onAltoChange: (v: number) => void;
  onSave: () => void;
  onClose: () => void;
  onDelete: () => void;
}

function ConfirmDeleteZona({
  zona,
  advertencia,
  onConfirm,
  onCancel,
}: {
  zona: Zona;
  advertencia?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [inputNombre, setInputNombre] = useState("");
  const [inputFecha, setInputFecha] = useState("");
  const today = getCurrentTimestamp().split("T")[0];
  const canDelete = inputNombre === zona.nombre && inputFecha === today;

  return (
    <div className="bg-red-50 p-3 rounded space-y-2">
      <p className="text-red-800 font-medium text-sm">Confirmar eliminación</p>
      {advertencia && (
        <p className="text-red-700 text-xs bg-red-100 p-2 rounded">
          {advertencia}
        </p>
      )}
      <div>
        <label className="block text-xs mb-0.5 text-gray-700">
          Escribe:{" "}
          <code className="bg-white px-1 text-gray-900">{zona.nombre}</code>
        </label>
        <input
          type="text"
          value={inputNombre}
          onChange={(e) => setInputNombre(e.target.value)}
          className="w-full px-2 py-1 border rounded text-sm text-gray-900"
          placeholder={zona.nombre}
        />
      </div>
      <div>
        <label className="block text-xs mb-0.5 text-gray-700">
          Fecha de hoy:{" "}
          <code className="bg-white px-1 text-gray-900">{today}</code>
        </label>
        <input
          type="text"
          value={inputFecha}
          onChange={(e) => setInputFecha(e.target.value)}
          className="w-full px-2 py-1 border rounded text-sm text-gray-900"
          placeholder="YYYY-MM-DD"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          disabled={!canDelete}
          className={`flex-1 py-1.5 rounded text-sm font-medium ${canDelete ? "bg-red-500 text-white hover:bg-red-600" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
        >
          Eliminar
        </button>
        <button
          onClick={onCancel}
          className="flex-1 bg-gray-200 text-gray-700 py-1.5 rounded text-sm"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

export function ZoneEditorForm({
  zona,
  nombre,
  tipo,
  notas,
  x,
  y,
  ancho,
  alto,
  cantidadPlantas,
  hayCambiosGeometricos,
  validacion,
  error,
  saving,
  advertenciaEliminacion,
  onNombreChange,
  onTipoChange,
  onNotasChange,
  onXChange,
  onYChange,
  onAnchoChange,
  onAltoChange,
  onSave,
  onClose,
  onDelete,
}: ZoneEditorFormProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const borderClass =
    hayCambiosGeometricos && !validacion.valida ? "border-red-300" : "";

  return (
    <div className="p-4 space-y-2.5">
      {error && (
        <div className="bg-red-50 text-red-700 p-2 rounded text-xs">
          {error}
        </div>
      )}
      {hayCambiosGeometricos && !validacion.valida && (
        <div className="bg-red-50 text-red-700 p-2 rounded text-xs">
          {validacion.error}
        </div>
      )}
      {hayCambiosGeometricos && validacion.valida && (
        <div className="bg-green-50 text-green-700 p-2 rounded text-xs">
          Preview válido - puedes guardar
        </div>
      )}

      <div className="grid grid-cols-[1fr_auto] gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-0.5">
            Nombre
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => onNombreChange(e.target.value)}
            className="w-full px-2 py-1.5 border rounded text-sm focus:ring-2 focus:ring-green-500 text-gray-900"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-0.5">
            Tipo
          </label>
          <select
            value={tipo}
            onChange={(e) => onTipoChange(e.target.value as TipoZona)}
            disabled={cantidadPlantas > 0}
            className={`w-full px-2 py-1.5 border rounded text-sm text-gray-900 ${cantidadPlantas > 0 ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}`}
          >
            <option value={TIPO_ZONA.CULTIVO}>Cultivo</option>
            <option value={TIPO_ZONA.ESTANQUE}>Estanque</option>
            <option value={TIPO_ZONA.BODEGA}>Bodega</option>
            <option value={TIPO_ZONA.CASA}>Casa</option>
            <option value={TIPO_ZONA.GARAGE}>Garage</option>
            <option value={TIPO_ZONA.COMPOSTERA}>Compostera</option>
            <option value={TIPO_ZONA.APRON}>Apron</option>
            <option value={TIPO_ZONA.EMPAQUE}>Empaque</option>
            <option value={TIPO_ZONA.SANITARIO}>Sanitario</option>
            <option value={TIPO_ZONA.CAMINO}>Camino</option>
            <option value={TIPO_ZONA.DECORACION}>Decoración</option>
            <option value={TIPO_ZONA.OTRO}>Otro</option>
          </select>
        </div>
      </div>
      {cantidadPlantas > 0 && (
        <p className="text-[10px] text-amber-600 -mt-1">
          No se puede cambiar tipo: {cantidadPlantas} planta(s). Elimínalas
          primero.
        </p>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-0.5">
          Notas
        </label>
        <textarea
          value={notas}
          onChange={(e) => onNotasChange(e.target.value)}
          className="w-full px-2 py-1.5 border rounded resize-none text-sm text-gray-900"
          rows={1}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-0.5">
          Posición (m)
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          <input
            type="number"
            value={x}
            onChange={(e) => onXChange(Number(e.target.value))}
            min={0}
            step={0.5}
            className={`w-full px-2 py-1 border rounded text-sm text-gray-900 ${borderClass}`}
            aria-label="X"
            placeholder="X"
          />
          <input
            type="number"
            value={y}
            onChange={(e) => onYChange(Number(e.target.value))}
            min={0}
            step={0.5}
            className={`w-full px-2 py-1 border rounded text-sm text-gray-900 ${borderClass}`}
            aria-label="Y"
            placeholder="Y"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-0.5">
          Dimensiones (m)
        </label>
        <div className="grid grid-cols-[1fr_1fr_auto] gap-1.5 items-center">
          <input
            type="number"
            value={ancho}
            onChange={(e) => onAnchoChange(Number(e.target.value))}
            min={1}
            step={0.5}
            className={`w-full px-2 py-1 border rounded text-sm text-gray-900 ${borderClass}`}
            aria-label="Ancho"
            placeholder="Ancho"
          />
          <input
            type="number"
            value={alto}
            onChange={(e) => onAltoChange(Number(e.target.value))}
            min={1}
            step={0.5}
            className={`w-full px-2 py-1 border rounded text-sm text-gray-900 ${borderClass}`}
            aria-label="Alto"
            placeholder="Alto"
          />
          <span className="text-xs text-gray-500 whitespace-nowrap">
            = {ancho * alto} m²
          </span>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={onSave}
          disabled={saving || (hayCambiosGeometricos && !validacion.valida)}
          className="flex-1 bg-green-500 text-white py-1.5 rounded text-sm hover:bg-green-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
        <button
          onClick={onClose}
          className="flex-1 bg-gray-200 text-gray-700 py-1.5 rounded text-sm hover:bg-gray-300"
        >
          Cancelar
        </button>
      </div>

      <div className="border-t pt-2">
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full text-red-600 hover:text-red-800 text-xs"
          >
            Eliminar zona
          </button>
        ) : (
          <ConfirmDeleteZona
            zona={zona}
            advertencia={advertenciaEliminacion}
            onConfirm={onDelete}
            onCancel={() => setShowDeleteConfirm(false)}
          />
        )}
      </div>
    </div>
  );
}
