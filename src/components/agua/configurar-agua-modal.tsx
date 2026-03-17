"use client";

import { useState, useMemo } from "react";
import type { Zona } from "@/types";
import { calcularPreviewRecarga } from "@/lib/utils/agua";

interface ConfigurarAguaModalProps {
  estanque: Zona;
  consumoSemanal: number;
  onGuardar: (config: {
    frecuencia_dias: number;
    cantidad_litros: number;
    costo_recarga_clp?: number;
  }) => Promise<void>;
  onQuitar?: () => Promise<void>;
  onCerrar: () => void;
}

export function ConfigurarAguaModal({
  estanque,
  consumoSemanal,
  onGuardar,
  onQuitar,
  onCerrar,
}: ConfigurarAguaModalProps) {
  const config = estanque.estanque_config;
  const capacidadM3 = config?.capacidad_m3 || 0;
  const nivelActualM3 = config?.nivel_actual_m3 ?? 0;

  const [frecuenciaDias, setFrecuenciaDias] = useState(
    config?.recarga?.frecuencia_dias || 14,
  );
  const [cantidadM3, setCantidadM3] = useState(
    config?.recarga?.cantidad_litros
      ? config.recarga.cantidad_litros / 1000
      : Math.min(15, capacidadM3),
  );
  const [costoRecarga, setCostoRecarga] = useState<number | "">(
    config?.recarga?.costo_recarga_clp || "",
  );
  const [guardando, setGuardando] = useState(false);
  const tieneRecargaExistente = !!config?.recarga;

  const preview = useMemo(
    () =>
      calcularPreviewRecarga(
        nivelActualM3,
        capacidadM3,
        consumoSemanal,
        frecuenciaDias,
        cantidadM3,
      ),
    [nivelActualM3, capacidadM3, consumoSemanal, frecuenciaDias, cantidadM3],
  );

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      await onGuardar({
        frecuencia_dias: frecuenciaDias,
        cantidad_litros: cantidadM3 * 1000,
        costo_recarga_clp: costoRecarga || undefined,
      });
      onCerrar();
    } finally {
      setGuardando(false);
    }
  };

  const handleQuitar = async () => {
    if (!onQuitar) return;
    setGuardando(true);
    try {
      await onQuitar();
      onCerrar();
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-gray-900">
            Configurar recarga
          </h2>
          <span className="text-sm font-medium text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded">
            {estanque.nombre}
          </span>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Capacidad: {capacidadM3} m³ · El sistema te avisará si el agua no
          alcanza hasta la próxima entrega.
        </p>

        <div className="space-y-5">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700">
                Frecuencia de recarga
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={frecuenciaDias}
                  onChange={(e) => setFrecuenciaDias(Number(e.target.value))}
                  onBlur={() =>
                    setFrecuenciaDias((v) => Math.max(1, Math.min(90, v || 1)))
                  }
                  min={1}
                  max={90}
                  className="flex-1 px-3 py-2 border rounded focus:ring-2 focus:ring-cyan-500 text-gray-900"
                />
                <span className="px-3 py-2 bg-gray-100 rounded text-gray-600">
                  días
                </span>
              </div>
              <div className="flex gap-2 mt-2">
                {[7, 14, 21, 30].map((dias) => (
                  <button
                    key={dias}
                    type="button"
                    onClick={() => setFrecuenciaDias(dias)}
                    className={`px-3 py-1 text-sm rounded ${
                      frecuenciaDias === dias
                        ? "bg-cyan-500 text-white"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    {dias}d
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700">
                Cantidad por recarga
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={cantidadM3}
                  onChange={(e) => setCantidadM3(Number(e.target.value))}
                  onBlur={() => setCantidadM3((v) => Math.max(0.1, v || 0.1))}
                  min={0.1}
                  step={0.5}
                  className="flex-1 px-3 py-2 border rounded focus:ring-2 focus:ring-cyan-500 text-gray-900"
                />
                <span className="px-3 py-2 bg-gray-100 rounded text-gray-600">
                  m³
                </span>
              </div>
              {cantidadM3 > capacidadM3 && capacidadM3 > 0 && (
                <p className="text-xs text-orange-600 mt-1">
                  Supera la capacidad del estanque ({capacidadM3} m³)
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700">
                Costo por recarga (opcional)
              </label>
              <div className="flex gap-2">
                <span className="px-3 py-2 bg-gray-100 rounded text-gray-600">
                  $
                </span>
                <input
                  type="number"
                  value={costoRecarga}
                  onChange={(e) =>
                    setCostoRecarga(
                      e.target.value ? Number(e.target.value) : "",
                    )
                  }
                  min={0}
                  step={1000}
                  placeholder="Ej: 7500"
                  className="flex-1 px-3 py-2 border rounded focus:ring-2 focus:ring-cyan-500 text-gray-900"
                />
                <span className="px-3 py-2 bg-gray-100 rounded text-gray-600">
                  CLP
                </span>
              </div>
            </div>
          </div>

          {/* Preview en vivo */}
          <div className="border-t border-gray-200 pt-4 space-y-3">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Resultado estimado
            </div>

            <div className="space-y-2 bg-gray-50 rounded-lg p-3">
              {/* Barra: Hoy */}
              <div>
                <div className="flex justify-between text-[11px] mb-0.5">
                  <span className="text-gray-600 font-medium">Hoy</span>
                  <span className="text-gray-800 font-medium">
                    {nivelActualM3.toFixed(1)} de {capacidadM3} m³
                  </span>
                </div>
                <div className="h-2.5 bg-gray-200/60 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 transition-all"
                    style={{ width: `${Math.min(100, preview.pctHoy)}%` }}
                  />
                </div>
              </div>

              {/* Barra: Cuando llegue — solo si hay consumo */}
              {consumoSemanal > 0 && (
                <div>
                  <div className="flex justify-between text-[11px] mb-0.5">
                    <span className="text-gray-600 font-medium">
                      Cuando llegue ({frecuenciaDias} días)
                    </span>
                    <span className="text-gray-800 font-medium">
                      {preview.nivelLlegada.toFixed(1)} de {capacidadM3} m³
                    </span>
                  </div>
                  <div className="h-2.5 bg-gray-200/60 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${preview.pctLlegada > 20 ? "bg-yellow-500" : "bg-orange-500"}`}
                      style={{ width: `${Math.min(100, preview.pctLlegada)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Barra: Después de cargar */}
              <div>
                <div className="flex justify-between text-[11px] mb-0.5">
                  <span className="text-gray-600 font-medium">
                    Después de cargar
                  </span>
                  <span className="text-gray-800 font-medium">
                    {preview.nivelDespues.toFixed(1)} de {capacidadM3} m³
                  </span>
                </div>
                <div className="h-2.5 bg-gray-200/60 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${preview.cabeCompleta ? "bg-green-500" : "bg-orange-500"}`}
                    style={{ width: `${Math.min(100, preview.pctDespues)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Veredicto */}
            <div
              className={`text-xs px-3 py-2 rounded-lg border-l-4 ${
                !preview.alcanza
                  ? "bg-red-50 border-red-500 text-red-800"
                  : !preview.cabeCompleta
                    ? "bg-orange-50 border-orange-500 text-orange-800"
                    : "bg-green-50 border-green-500 text-green-800"
              }`}
            >
              {!preview.alcanza ? (
                <div className="font-medium">
                  El agua no alcanza — se acaba en ~
                  {Math.floor(preview.diasRestantes)} días, antes de la recarga
                </div>
              ) : !preview.cabeCompleta ? (
                <div className="font-medium">
                  El agua alcanza, pero sobran {preview.excedenteM3.toFixed(1)}{" "}
                  m³ sin espacio
                </div>
              ) : (
                <div className="font-medium">
                  El agua alcanza y la recarga cabe completa
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex gap-3">
              <button
                onClick={handleGuardar}
                disabled={guardando}
                className="flex-1 bg-cyan-600 text-white py-3 rounded-lg hover:bg-cyan-700 disabled:opacity-50 font-medium"
              >
                {guardando ? "Guardando..." : "Guardar"}
              </button>
              <button
                onClick={onCerrar}
                disabled={guardando}
                className="flex-1 bg-gray-100 py-3 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
            {tieneRecargaExistente && onQuitar && (
              <button
                onClick={handleQuitar}
                disabled={guardando}
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
              >
                Quitar recarga configurada
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
