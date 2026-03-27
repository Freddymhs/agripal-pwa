"use client";

import { useState } from "react";
import type { TareaGantt, TareaGanttColor } from "@/types";

const COLOR_OPTIONS: Array<{
  id: TareaGanttColor;
  label: string;
  bg: string;
  ring: string;
  text: string;
  border: string;
}> = [
  {
    id: "emerald",
    label: "Verde",
    bg: "bg-emerald-100",
    ring: "ring-emerald-500",
    text: "text-emerald-700",
    border: "border-emerald-400",
  },
  {
    id: "sky",
    label: "Azul",
    bg: "bg-sky-100",
    ring: "ring-sky-500",
    text: "text-sky-700",
    border: "border-sky-400",
  },
  {
    id: "amber",
    label: "Ambar",
    bg: "bg-amber-100",
    ring: "ring-amber-500",
    text: "text-amber-700",
    border: "border-amber-400",
  },
  {
    id: "violet",
    label: "Violeta",
    bg: "bg-violet-100",
    ring: "ring-violet-500",
    text: "text-violet-700",
    border: "border-violet-400",
  },
  {
    id: "rose",
    label: "Rosado",
    bg: "bg-rose-100",
    ring: "ring-rose-500",
    text: "text-rose-700",
    border: "border-rose-400",
  },
];

function toDateInputValue(timestamp?: string): string {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function normalizeDateInput(value: string): string {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
}

export interface GanttTareaModalProps {
  open: boolean;
  tarea?: TareaGantt | null;
  onClose: () => void;
  onSave: (payload: {
    titulo: string;
    fecha_inicio: string;
    fecha_fin: string;
    color: TareaGanttColor;
  }) => Promise<{ error?: string } | void>;
}

export function GanttTareaModal({
  open,
  tarea,
  onClose,
  onSave,
}: GanttTareaModalProps) {
  const [titulo, setTitulo] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [color, setColor] = useState<TareaGanttColor>("emerald");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Adjusting state during render: detecta apertura o cambio de tarea
  const [prevOpen, setPrevOpen] = useState(open);
  const [prevTareaId, setPrevTareaId] = useState(tarea?.id);

  if (open !== prevOpen || tarea?.id !== prevTareaId) {
    setPrevOpen(open);
    setPrevTareaId(tarea?.id);
    if (open) {
      if (tarea) {
        setTitulo(tarea.titulo ?? "");
        setFechaInicio(toDateInputValue(tarea.fecha_inicio));
        setFechaFin(toDateInputValue(tarea.fecha_fin));
        setColor(tarea.color ?? "emerald");
      } else {
        const hoy = new Date();
        const fin = new Date(hoy);
        fin.setDate(hoy.getDate() + 7);
        setTitulo("");
        setFechaInicio(hoy.toISOString().slice(0, 10));
        setFechaFin(fin.toISOString().slice(0, 10));
        setColor("emerald");
      }
      setError("");
      setSaving(false);
    }
  }

  if (!open) return null;

  const handleSave = async () => {
    setError("");

    if (!titulo.trim()) {
      setError("Ingresa un nombre de tarea.");
      return;
    }

    if (!fechaInicio || !fechaFin) {
      setError("Selecciona fecha de inicio y fin.");
      return;
    }

    if (fechaFin < fechaInicio) {
      setError("La fecha de fin no puede ser anterior al inicio.");
      return;
    }

    setSaving(true);
    const payload = {
      titulo: titulo.trim(),
      fecha_inicio: normalizeDateInput(fechaInicio),
      fecha_fin: normalizeDateInput(fechaFin),
      color,
    };
    const result = await onSave(payload);
    if (result && "error" in result && result.error) {
      setError(result.error);
      setSaving(false);
      return;
    }
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="text-sm font-semibold text-gray-800">
              {tarea ? "Editar tarea" : "Nueva tarea"}
            </p>
            <p className="text-[11px] text-gray-400">
              Define el rango de fechas del calendario.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-gray-600 text-sm"
          >
            x
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-2 rounded text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Titulo
            </label>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="input-base"
              placeholder="Ej: Preparar suelo"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Fecha inicio
              </label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="input-base"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Fecha fin
              </label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="input-base"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setColor(option.id)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-[11px] ${option.bg} ${option.border} ${option.text} ${
                    color === option.id
                      ? `ring-2 ring-offset-2 ${option.ring}`
                      : ""
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${option.border}`} />
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-2 text-xs font-medium text-gray-500 hover:text-gray-700"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-4 py-2 rounded-lg text-xs font-semibold text-white ${
              saving ? "bg-gray-300" : "bg-green-500 hover:bg-green-600"
            }`}
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
