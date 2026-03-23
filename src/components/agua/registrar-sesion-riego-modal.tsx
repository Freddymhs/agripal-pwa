"use client";

import { useState } from "react";
import type { SesionRiego, Zona, UUID } from "@/types";
import { LITROS_POR_M3, LITROS_POR_BALDE } from "@/lib/constants/conversiones";
import { TIPO_RIEGO } from "@/lib/constants/entities";
import { getCurrentTimestamp } from "@/lib/utils";

interface RegistrarSesionRiegoModalProps {
  zona: Zona;
  estanque: Zona;
  terrenoId: UUID;
  consumoRecomendadoLDia?: number;
  numPlantas?: number;
  onGuardar: (
    sesion: Omit<
      SesionRiego,
      "id" | "created_at" | "updated_at" | "lastModified"
    >,
  ) => Promise<void>;
  onCerrar: () => void;
}

const DURACIONES_HORAS_DEFAULT = [1, 2, 3, 4];

function calcularDuracionSugerida(
  consumoLDia: number | undefined,
  frecuenciaDias: number,
  caudalLh: number,
): { minutos: number; usarMinutos: boolean } {
  if (!consumoLDia || consumoLDia <= 0 || caudalLh <= 0) {
    return { minutos: 120, usarMinutos: false };
  }
  const necesidadSesionL = consumoLDia * frecuenciaDias;
  const min = Math.ceil((necesidadSesionL / caudalLh) * 60);
  return { minutos: Math.max(1, min), usarMinutos: min < 30 };
}

export function RegistrarSesionRiegoModal({
  zona,
  estanque,
  terrenoId,
  consumoRecomendadoLDia,
  numPlantas = 0,
  onGuardar,
  onCerrar,
}: RegistrarSesionRiegoModalProps) {
  const config = zona.configuracion_riego;
  const esBalde = config?.tipo === TIPO_RIEGO.BALDE;
  const caudalLh = config?.caudal_total_lh ?? 0;
  const frecuenciaDias = config?.frecuencia_dias ?? 1;

  // Modo balde: litros por planta desde config o calculado
  const litrosPorPlantaConfig = config?.litros_por_planta ?? 0;
  const litrosPorPlantaCalculado =
    consumoRecomendadoLDia && numPlantas > 0
      ? (consumoRecomendadoLDia * frecuenciaDias) / numPlantas
      : 0;
  const litrosPorPlantaInicial =
    litrosPorPlantaConfig > 0
      ? litrosPorPlantaConfig
      : Math.max(0.5, Math.round(litrosPorPlantaCalculado * 10) / 10);

  const [litrosPorPlanta, setLitrosPorPlanta] = useState(
    litrosPorPlantaInicial,
  );
  const [fecha, setFecha] = useState(getCurrentTimestamp().split("T")[0]);
  const [notas, setNotas] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Modo goteo manual
  const sugerido = calcularDuracionSugerida(
    consumoRecomendadoLDia,
    frecuenciaDias,
    caudalLh,
  );
  const [duracionMinutos, setDuracionMinutos] = useState(sugerido.minutos);

  // Cálculos compartidos
  const duracionHoras = duracionMinutos / 60;
  const consumoLitros = esBalde
    ? litrosPorPlanta * numPlantas
    : caudalLh * duracionHoras;
  const consumoM3 = consumoLitros / LITROS_POR_M3;
  const baldesNecesarios = Math.ceil(consumoLitros / LITROS_POR_BALDE);

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
        duracion_horas: esBalde ? 0 : duracionHoras,
        caudal_lh: esBalde ? 0 : caudalLh,
        consumo_litros: consumoLitros,
        notas: esBalde
          ? `${litrosPorPlanta} L/planta × ${numPlantas} plantas = ${consumoLitros.toFixed(0)} L (${baldesNecesarios} baldes)${notas ? ` — ${notas}` : ""}`
          : notas,
      });
      onCerrar();
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full">
        <h2 className="text-lg font-bold mb-1">
          {esBalde ? "Registrar Riego por Balde" : "Registrar Riego"}
        </h2>
        <p className="text-xs text-gray-500 mb-4">{zona.nombre}</p>

        {/* Sugerencia de consumo por frecuencia */}
        {!esBalde &&
          (() => {
            const frecuencia = config?.frecuencia_dias ?? 1;
            if (
              frecuencia <= 1 ||
              !consumoRecomendadoLDia ||
              consumoRecomendadoLDia <= 0
            )
              return null;
            const necesidadSesion = consumoRecomendadoLDia * frecuencia;
            const minutosSugeridos =
              caudalLh > 0 ? Math.ceil((necesidadSesion / caudalLh) * 60) : 0;
            return (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <p className="text-xs font-semibold text-green-800 mb-1">
                  Riego cada {frecuencia} dias
                </p>
                <p className="text-sm text-green-700">
                  Necesitas dar <strong>{Math.round(necesidadSesion)} L</strong>{" "}
                  en esta sesion
                  {minutosSugeridos > 0 && (
                    <>
                      {" "}
                      (~<strong>{minutosSugeridos} min</strong> con tu caudal)
                    </>
                  )}
                </p>
              </div>
            );
          })()}

        <div className="space-y-4">
          {esBalde ? (
            /* ── Modo Balde ── */
            <>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Litros por planta
                </label>
                <div className="flex gap-2 items-center">
                  <div className="relative w-28">
                    <input
                      type="number"
                      value={litrosPorPlanta}
                      onChange={(e) =>
                        setLitrosPorPlanta(
                          Math.max(0.1, Number(e.target.value)),
                        )
                      }
                      step={0.5}
                      min={0.1}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                      L
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {[0.5, 1, 2, 5].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setLitrosPorPlanta(v)}
                        className={`px-2 py-1.5 text-xs rounded border ${litrosPorPlanta === v ? "bg-blue-500 text-white border-blue-500" : "border-gray-300 hover:bg-gray-50"}`}
                      >
                        {v}L
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  {numPlantas} plantas x {litrosPorPlanta} L ={" "}
                  <strong>{consumoLitros.toFixed(0)} L</strong> total
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm font-bold text-amber-800 mb-1">
                  Necesitas {baldesNecesarios}{" "}
                  {baldesNecesarios === 1 ? "balde" : "baldes"} de{" "}
                  {LITROS_POR_BALDE}L
                </p>
                <p className="text-xs text-amber-700">
                  Total: {consumoLitros.toFixed(0)} L ({consumoM3.toFixed(3)}{" "}
                  m3)
                </p>
              </div>
            </>
          ) : (
            /* ── Modo Goteo Manual ── */
            <div>
              <label className="block text-sm font-medium mb-1">
                {sugerido.usarMinutos
                  ? "Cuantos minutos regaste?"
                  : "Cuanto tiempo regaste?"}
              </label>
              {sugerido.usarMinutos ? (
                <div className="flex gap-2 items-center">
                  <div className="relative w-28">
                    <input
                      type="number"
                      value={duracionMinutos}
                      onChange={(e) =>
                        setDuracionMinutos(
                          Math.max(1, Math.round(Number(e.target.value))),
                        )
                      }
                      step={1}
                      min={1}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                      min
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {[sugerido.minutos, sugerido.minutos * 2, 15, 30]
                      .filter((v, i, arr) => arr.indexOf(v) === i && v > 0)
                      .slice(0, 4)
                      .sort((a, b) => a - b)
                      .map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setDuracionMinutos(m)}
                          className={`px-2 py-1.5 text-xs rounded border ${duracionMinutos === m ? "bg-blue-500 text-white border-blue-500" : "border-gray-300 hover:bg-gray-50"}`}
                        >
                          {m}m
                        </button>
                      ))}
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 items-center">
                  <div className="relative w-28">
                    <input
                      type="number"
                      value={Math.round((duracionMinutos / 60) * 100) / 100}
                      onChange={(e) =>
                        setDuracionMinutos(
                          Math.max(1, Math.round(Number(e.target.value) * 60)),
                        )
                      }
                      step={0.25}
                      min={0.25}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                      h
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {DURACIONES_HORAS_DEFAULT.map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setDuracionMinutos(h * 60)}
                        className={`px-2 py-1.5 text-xs rounded border ${duracionMinutos === h * 60 ? "bg-blue-500 text-white border-blue-500" : "border-gray-300 hover:bg-gray-50"}`}
                      >
                        {h}h
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {sugerido.usarMinutos && (
                <p className="text-[11px] text-gray-400 mt-1">
                  = {duracionHoras.toFixed(2)}h ({consumoLitros.toFixed(0)} L)
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Preview estanque */}
          <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3">
            {!esBalde && (
              <p className="text-xs text-cyan-700 mb-2">
                Caudal configurado: <strong>{caudalLh} L/h</strong>
              </p>
            )}
            <p className="text-sm font-bold text-cyan-800 mb-1">
              Se descontaran: {consumoLitros.toFixed(0)} L (
              {consumoM3.toFixed(3)} m3)
            </p>
            <p className="text-xs text-cyan-700 mb-2">
              Nivel despues: {nivelDespues.toFixed(2)} de {capacidadM3} m3
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-cyan-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, pctActual)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
              <span>Ahora: {pctActual.toFixed(0)}%</span>
              <span>Despues: {pctDespues.toFixed(0)}%</span>
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
              placeholder={
                esBalde
                  ? "ej. Riego completo con balde"
                  : "ej. Riego completo zona norte"
              }
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleGuardar}
              disabled={
                guardando || (esBalde ? numPlantas === 0 : caudalLh === 0)
              }
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
