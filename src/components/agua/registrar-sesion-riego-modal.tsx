"use client";

import { useState } from "react";
import type { SesionRiego, Zona, UUID } from "@/types";
import { LITROS_POR_M3 } from "@/lib/constants/conversiones";
import { getCurrentTimestamp } from "@/lib/utils";

interface RegistrarSesionRiegoModalProps {
  zona: Zona;
  estanque: Zona;
  terrenoId: UUID;
  onGuardar: (
    sesion: Omit<
      SesionRiego,
      "id" | "created_at" | "updated_at" | "lastModified"
    >,
  ) => Promise<void>;
  onCerrar: () => void;
}

const DURACIONES_RAPIDAS = [1, 2, 3, 4];

export function RegistrarSesionRiegoModal({
  zona,
  estanque,
  terrenoId,
  onGuardar,
  onCerrar,
}: RegistrarSesionRiegoModalProps) {
  const [duracionHoras, setDuracionHoras] = useState(2);
  const [fecha, setFecha] = useState(getCurrentTimestamp().split("T")[0]);
  const [notas, setNotas] = useState("");
  const [guardando, setGuardando] = useState(false);

  const caudalLh = zona.configuracion_riego?.caudal_total_lh ?? 0;
  const consumoLitros = caudalLh * duracionHoras;
  const consumoM3 = consumoLitros / LITROS_POR_M3;
  const nivelActual = estanque.estanque_config?.nivel_actual_m3 ?? 0;
  const capacidadM3 = estanque.estanque_config?.capacidad_m3 ?? 0;
  const nivelDespues = Math.max(0, nivelActual - consumoM3);
  const pctActual = capacidadM3 > 0 ? (nivelActual / capacidadM3) * 100 : 0;
  const pctDespues = capacidadM3 > 0 ? (nivelDespues / capacidadM3) * 100 : 0;

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      await onGuardar({
        zona_id: zona.id,
        terreno_id: terrenoId,
        fecha,
        duracion_horas: duracionHoras,
        caudal_lh: caudalLh,
        consumo_litros: consumoLitros,
        notas,
      });
      onCerrar();
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full">
        <h2 className="text-lg font-bold mb-1">Registrar Riego</h2>
        <p className="text-xs text-gray-500 mb-4">{zona.nombre}</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              ¿Cuántas horas regaste?
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                value={duracionHoras}
                onChange={(e) =>
                  setDuracionHoras(Math.max(0.25, Number(e.target.value)))
                }
                step={0.25}
                min={0.25}
                className="w-24 px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-1">
                {DURACIONES_RAPIDAS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setDuracionHoras(h)}
                    className={`px-2 py-1.5 text-xs rounded border ${duracionHoras === h ? "bg-blue-500 text-white border-blue-500" : "border-gray-300 hover:bg-gray-50"}`}
                  >
                    {h}h
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3">
            <p className="text-xs text-cyan-700 mb-2">
              Caudal configurado: <strong>{caudalLh} L/h</strong>
            </p>
            <p className="text-sm font-bold text-cyan-800 mb-1">
              Se descontarán: {consumoLitros.toFixed(0)} L (
              {consumoM3.toFixed(3)} m³)
            </p>
            <p className="text-xs text-cyan-700 mb-2">
              Nivel después: {nivelDespues.toFixed(2)} de {capacidadM3} m³
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-cyan-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, pctActual)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
              <span>Ahora: {pctActual.toFixed(0)}%</span>
              <span>Después: {pctDespues.toFixed(0)}%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Notas (opcional)
            </label>
            <input
              type="text"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="ej. Riego completo zona norte"
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleGuardar}
              disabled={guardando || caudalLh === 0}
              className="flex-1 bg-blue-500 text-white py-2.5 rounded-lg hover:bg-blue-600 disabled:opacity-50 font-medium text-sm"
            >
              {guardando ? "Guardando..." : "Confirmar y descontar"}
            </button>
            <button
              onClick={onCerrar}
              disabled={guardando}
              className="flex-1 bg-gray-100 py-2.5 rounded-lg hover:bg-gray-200 disabled:opacity-50 text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
