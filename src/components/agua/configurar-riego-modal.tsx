"use client";

import { useState } from "react";
import type { ConfiguracionRiego, TipoSistemaRiego } from "@/types";
import {
  GOTEROS_DEFAULT,
  TIPO_RIEGO,
  esRiegoManual,
  FRECUENCIA_RIEGO,
  HORARIO_RIEGO_INICIO_DEFAULT,
  HORARIO_RIEGO_FIN_DEFAULT,
} from "@/lib/constants/entities";
import {
  DIAS_POR_SEMANA,
  LITROS_POR_M3,
  LITROS_POR_BALDE,
} from "@/lib/constants/conversiones";
import { CaudalCalculadora } from "@/components/agua/caudal-calculadora";
import { RiegoProgramadoFields } from "@/components/agua/riego-programado-fields";

interface ConfigurarRiegoModalProps {
  config?: ConfiguracionRiego;
  sueloArcilloso?: boolean;
  consumoRecomendadoLDia?: number;
  litrosPorPlantaDia?: number;
  numPlantasZona?: number;
  onGuardar: (config: ConfiguracionRiego) => Promise<void>;
  onCerrar: () => void;
}

export function ConfigurarRiegoModal({
  config,
  sueloArcilloso = false,
  consumoRecomendadoLDia,
  litrosPorPlantaDia,
  numPlantasZona,
  onGuardar,
  onCerrar,
}: ConfigurarRiegoModalProps) {
  const [tipo, setTipo] = useState<TipoSistemaRiego>(
    config?.tipo || TIPO_RIEGO.MANUAL,
  );
  const [caudalTotal, setCaudalTotal] = useState(
    config?.caudal_total_lh || 100,
  );
  const [horasDia, setHorasDia] = useState(config?.horas_dia || 6);
  const [horarioInicio, setHorarioInicio] = useState(
    config?.horario_inicio || HORARIO_RIEGO_INICIO_DEFAULT,
  );
  const [horarioFin, setHorarioFin] = useState(
    config?.horario_fin || HORARIO_RIEGO_FIN_DEFAULT,
  );
  const [frecuenciaDias, setFrecuenciaDias] = useState(
    config?.frecuencia_dias || FRECUENCIA_RIEGO.DIARIO,
  );
  const [litrosPorPlanta, setLitrosPorPlanta] = useState(
    config?.litros_por_planta ??
      (litrosPorPlantaDia && frecuenciaDias
        ? Math.max(
            0.5,
            Math.round(litrosPorPlantaDia * frecuenciaDias * 10) / 10,
          )
        : 2),
  );
  const [guardando, setGuardando] = useState(false);
  const [mostrarCalculadora, setMostrarCalculadora] = useState(false);

  const caudalPorGoteroInicial =
    config?.caudal_total_lh && numPlantasZona && numPlantasZona > 0
      ? Math.round(
          (config.caudal_total_lh /
            (GOTEROS_DEFAULT.cantidad * numPlantasZona)) *
            10,
        ) / 10
      : GOTEROS_DEFAULT.caudal_lh_por_gotero;

  const calcularHoraFin = (inicio: string, horas: number) => {
    const [h, m] = inicio.split(":").map(Number);
    const totalMin = (h * 60 + m + horas * 60) % (24 * 60);
    return `${String(Math.floor(totalMin / 60)).padStart(2, "0")}:${String(totalMin % 60).padStart(2, "0")}`;
  };

  const horasEfectivas = tipo === TIPO_RIEGO.CONTINUO ? 24 : horasDia;
  const gastoDiarioL = esRiegoManual(tipo) ? 0 : caudalTotal * horasEfectivas;
  const gastoDiarioM3 = gastoDiarioL / LITROS_POR_M3;

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      await onGuardar({
        tipo,
        caudal_total_lh: tipo === TIPO_RIEGO.BALDE ? 0 : caudalTotal,
        horas_dia: tipo === TIPO_RIEGO.PROGRAMADO ? horasDia : undefined,
        horario_inicio:
          tipo === TIPO_RIEGO.PROGRAMADO ? horarioInicio : undefined,
        horario_fin: tipo === TIPO_RIEGO.PROGRAMADO ? horarioFin : undefined,
        frecuencia_dias: esRiegoManual(tipo) ? frecuenciaDias : undefined,
        litros_por_planta:
          tipo === TIPO_RIEGO.BALDE ? litrosPorPlanta : undefined,
      });
      onCerrar();
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Configurar Sistema de Riego</h2>
        <div className="space-y-5">
          {/* ── Sección 1: Lo que tus plantas necesitan ── */}
          {consumoRecomendadoLDia != null && consumoRecomendadoLDia > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-green-800 mb-2">
                Lo que tus plantas necesitan
              </p>
              {esRiegoManual(tipo) && frecuenciaDias > 1 ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-700">
                        {Math.round(consumoRecomendadoLDia * frecuenciaDias)} L
                      </div>
                      <div className="text-[11px] text-green-600">
                        por sesión (cada {frecuenciaDias} días)
                      </div>
                    </div>
                    {litrosPorPlantaDia != null && litrosPorPlantaDia > 0 && (
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-700">
                          {(litrosPorPlantaDia * frecuenciaDias).toFixed(1)} L
                        </div>
                        <div className="text-[11px] text-green-600">
                          por planta/sesión
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-green-600 mt-2">
                    {Math.round(consumoRecomendadoLDia)} L/día ×{" "}
                    {frecuenciaDias} días ={" "}
                    {Math.round(consumoRecomendadoLDia * frecuenciaDias)} L por
                    sesión ={" "}
                    <strong>
                      {Math.ceil(
                        (consumoRecomendadoLDia * frecuenciaDias) /
                          LITROS_POR_BALDE,
                      )}{" "}
                      {Math.ceil(
                        (consumoRecomendadoLDia * frecuenciaDias) /
                          LITROS_POR_BALDE,
                      ) === 1
                        ? "balde"
                        : "baldes"}{" "}
                      de {LITROS_POR_BALDE} L
                    </strong>
                  </p>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-700">
                        {Math.round(consumoRecomendadoLDia)} L/día
                      </div>
                      <div className="text-[11px] text-green-600">
                        toda la zona
                      </div>
                    </div>
                    {litrosPorPlantaDia != null && litrosPorPlantaDia > 0 && (
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-700">
                          {litrosPorPlantaDia.toFixed(1)} L/día
                        </div>
                        <div className="text-[11px] text-green-600">
                          por planta
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-green-600 mt-2">
                    Calculado según cultivo, clima actual y etapa de
                    crecimiento.
                  </p>
                </>
              )}
            </div>
          )}

          {/* ── Sección 2: Tipo de sistema ── */}
          <fieldset>
            <legend className="text-sm font-semibold text-gray-700 mb-2">
              Tipo de Sistema
            </legend>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setTipo(TIPO_RIEGO.BALDE)}
                className={`p-3 rounded-lg border-2 text-left ${tipo === TIPO_RIEGO.BALDE ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">Riego por balde</span>
                  <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">
                    Sin sistema de riego
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Riegas con balde. Defines litros por planta y frecuencia.
                </div>
              </button>
              <button
                type="button"
                onClick={() => setTipo(TIPO_RIEGO.MANUAL)}
                className={`p-3 rounded-lg border-2 text-left ${tipo === TIPO_RIEGO.MANUAL ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">Válvula manual (goteo)</span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Tienes gotero. Abres y cierras. Registras cada sesion.
                </div>
              </button>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    TIPO_RIEGO.PROGRAMADO,
                    TIPO_RIEGO.CONTINUO,
                  ] as TipoSistemaRiego[]
                ).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTipo(t)}
                    className={`p-3 rounded-lg border-2 text-left ${tipo === t ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <div className="font-medium text-sm">
                      {t === TIPO_RIEGO.PROGRAMADO
                        ? "Programado"
                        : "Continuo 24/7"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {t === TIPO_RIEGO.PROGRAMADO
                        ? "Horario automático"
                        : "Válvula siempre abierta"}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {tipo === TIPO_RIEGO.CONTINUO && sueloArcilloso && (
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg mt-2">
                <p className="text-sm text-yellow-800">
                  <strong>Atención:</strong> Tu suelo es arcilloso. El riego
                  continuo 24/7 puede causar encharcamiento.
                </p>
              </div>
            )}

            {tipo === TIPO_RIEGO.CONTINUO &&
              consumoRecomendadoLDia != null &&
              consumoRecomendadoLDia > 0 &&
              caudalTotal > 0 &&
              (() => {
                const gastoContL = caudalTotal * 24;
                const porcentaje = Math.round(
                  (gastoContL / consumoRecomendadoLDia) * 100,
                );
                const over = porcentaje > 130;
                return (
                  <div
                    className={`p-3 rounded-lg border mt-2 ${over ? "bg-amber-50 border-amber-300" : porcentaje < 70 ? "bg-yellow-50 border-yellow-200" : "bg-blue-50 border-blue-200"}`}
                  >
                    <p
                      className={`text-xs ${over ? "text-amber-800" : porcentaje < 70 ? "text-yellow-800" : "text-blue-800"}`}
                    >
                      Continuo 24/7 ={" "}
                      <strong>{gastoContL.toLocaleString()} L/día</strong>,{" "}
                      {porcentaje}% de lo recomendado.
                    </p>
                    {over && (
                      <p className="text-[11px] text-amber-700 mt-1">
                        Este modo gasta mucha más agua que la recomendada.
                      </p>
                    )}
                  </div>
                );
              })()}
          </fieldset>

          {/* ── Sección 2b: Frecuencia (solo manual) ── */}
          {esRiegoManual(tipo) && (
            <fieldset>
              <legend className="text-sm font-semibold text-gray-700 mb-2">
                Cada cuánto riegas?
              </legend>
              <div className="grid grid-cols-4 gap-1.5">
                {(
                  [
                    { dias: FRECUENCIA_RIEGO.DIARIO, label: "Diario" },
                    {
                      dias: FRECUENCIA_RIEGO.CADA_2_DIAS,
                      label: "Cada 2 días",
                    },
                    {
                      dias: FRECUENCIA_RIEGO.CADA_3_DIAS,
                      label: "Cada 3 días",
                    },
                    { dias: FRECUENCIA_RIEGO.SEMANAL, label: "Semanal" },
                  ] as const
                ).map(({ dias, label }) => (
                  <button
                    key={dias}
                    type="button"
                    onClick={() => setFrecuenciaDias(dias)}
                    className={`py-2 px-1 rounded-lg border-2 text-center transition-colors ${frecuenciaDias === dias ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 hover:border-gray-300 text-gray-600"}`}
                  >
                    <div className="text-xs font-medium">{label}</div>
                  </button>
                ))}
              </div>
              {frecuenciaDias > 1 &&
                consumoRecomendadoLDia != null &&
                consumoRecomendadoLDia > 0 &&
                tipo !== TIPO_RIEGO.BALDE &&
                caudalTotal > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                    <p className="text-xs text-blue-800">
                      Cada sesion deberias regar{" "}
                      <strong>
                        ~
                        {Math.ceil(
                          ((consumoRecomendadoLDia * frecuenciaDias) /
                            caudalTotal) *
                            60,
                        )}{" "}
                        min
                      </strong>{" "}
                      con tu caudal de {caudalTotal} L/h para cubrir los{" "}
                      {frecuenciaDias} dias.
                    </p>
                  </div>
                )}
            </fieldset>
          )}

          {/* ── Sección 3: Litros por planta (solo balde) ── */}
          {tipo === TIPO_RIEGO.BALDE && (
            <fieldset>
              <legend className="text-sm font-semibold text-gray-700 mb-1">
                Litros por planta
              </legend>
              <p className="text-xs text-gray-500 mb-2">
                Cuantos litros le echas a cada planta por sesion de riego.
              </p>
              <div className="flex gap-2 items-center">
                <div className="relative w-28">
                  <input
                    type="number"
                    value={litrosPorPlanta}
                    onChange={(e) =>
                      setLitrosPorPlanta(Math.max(0.1, Number(e.target.value)))
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
              {numPlantasZona != null && numPlantasZona > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-3">
                  <p className="text-xs text-amber-800">
                    <strong>{numPlantasZona} plantas</strong> x{" "}
                    {litrosPorPlanta} L ={" "}
                    <strong>
                      {(numPlantasZona * litrosPorPlanta).toFixed(0)} L por
                      sesion
                    </strong>{" "}
                    ={" "}
                    {Math.ceil(
                      (numPlantasZona * litrosPorPlanta) / LITROS_POR_BALDE,
                    )}{" "}
                    {Math.ceil(
                      (numPlantasZona * litrosPorPlanta) / LITROS_POR_BALDE,
                    ) === 1
                      ? "balde"
                      : "baldes"}{" "}
                    de {LITROS_POR_BALDE}L
                  </p>
                  {frecuenciaDias > 1 && (
                    <p className="text-[11px] text-amber-700 mt-1">
                      Cada {frecuenciaDias} dias ={" "}
                      {(
                        ((numPlantasZona * litrosPorPlanta * frecuenciaDias) /
                          LITROS_POR_M3 /
                          frecuenciaDias) *
                        DIAS_POR_SEMANA
                      ).toFixed(2)}{" "}
                      m3/semana
                    </p>
                  )}
                </div>
              )}
            </fieldset>
          )}

          {/* ── Sección 3b: Caudal (solo goteo) ── */}
          {tipo !== TIPO_RIEGO.BALDE && (
            <fieldset>
              <legend className="text-sm font-semibold text-gray-700 mb-1">
                Caudal de tu sistema
              </legend>
              <p className="text-xs text-gray-500 mb-2">
                Suma de todos los goteros conectados en esta zona.
              </p>
              <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                  <input
                    type="number"
                    value={caudalTotal}
                    onChange={(e) =>
                      setCaudalTotal(Math.max(1, Number(e.target.value)))
                    }
                    min={1}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    L/h
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMostrarCalculadora((v) => !v)}
                  className="px-3 py-2 text-xs rounded border border-gray-300 bg-gray-50 hover:bg-gray-100 whitespace-nowrap"
                >
                  {mostrarCalculadora ? "Cerrar" : "Calcular"}
                </button>
              </div>
              {mostrarCalculadora && (
                <CaudalCalculadora
                  numPlantasZona={numPlantasZona}
                  caudalPorGoteroInicial={caudalPorGoteroInicial}
                  onUsarCaudal={setCaudalTotal}
                />
              )}
              {!mostrarCalculadora && (
                <p className="text-[11px] text-gray-400 mt-1.5">
                  No lo sabes? Usa el boton &quot;Calcular&quot; con tus
                  goteros, o la app usara el consumo recomendado.
                </p>
              )}

              {tipo === TIPO_RIEGO.MANUAL && caudalTotal > 0 && (
                <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 mt-3">
                  {consumoRecomendadoLDia != null &&
                  consumoRecomendadoLDia > 0 ? (
                    <p className="text-xs text-sky-800">
                      <strong>Ejemplo:</strong>{" "}
                      {frecuenciaDias > 1
                        ? `cada sesion de ~${Math.ceil(((consumoRecomendadoLDia * frecuenciaDias) / caudalTotal) * 60)} min descontara ~${((consumoRecomendadoLDia * frecuenciaDias) / LITROS_POR_M3).toFixed(3)} m3 del estanque.`
                        : `cada sesion de 2 horas descontara ~${((caudalTotal * 2) / LITROS_POR_M3).toFixed(2)} m3 del estanque.`}
                    </p>
                  ) : (
                    <p className="text-xs text-sky-800">
                      <strong>Ejemplo:</strong> cada sesion de 2 horas
                      descontara ~
                      {((caudalTotal * 2) / LITROS_POR_M3).toFixed(2)} m3 del
                      estanque.
                    </p>
                  )}
                  <p className="text-[11px] text-sky-600 mt-1">
                    Tip: llena un balde de 20 L y mide los segundos. Caudal = 20
                    x 3600 / segundos.
                  </p>
                </div>
              )}
            </fieldset>
          )}

          {/* ── Sección 4: Configuración programado ── */}
          {tipo === TIPO_RIEGO.PROGRAMADO && (
            <RiegoProgramadoFields
              horasDia={horasDia}
              horarioInicio={horarioInicio}
              horarioFin={horarioFin}
              caudalTotal={caudalTotal}
              consumoRecomendadoLDia={consumoRecomendadoLDia}
              onHorasDiaChange={(h) => {
                setHorasDia(h);
                setHorarioFin(calcularHoraFin(horarioInicio, h));
              }}
              onHorarioInicioChange={(v) => {
                setHorarioInicio(v);
                setHorarioFin(calcularHoraFin(v, horasDia));
              }}
              onHorarioFinChange={setHorarioFin}
            />
          )}

          {/* ── Sección 5: Resumen de gasto ── */}
          {!esRiegoManual(tipo) && (
            <div className="bg-cyan-50 border border-cyan-200 p-4 rounded-lg">
              <div className="text-xs font-semibold text-cyan-800 mb-1">
                Gasto diario estimado
              </div>
              <div className="text-2xl font-bold text-cyan-700">
                {gastoDiarioL.toLocaleString()} L/día
              </div>
              <div className="text-sm text-cyan-600">
                {gastoDiarioM3.toFixed(2)} m³/día •{" "}
                {(gastoDiarioM3 * DIAS_POR_SEMANA).toFixed(2)} m³/semana
              </div>
              {tipo === TIPO_RIEGO.PROGRAMADO && (
                <div className="text-xs text-cyan-600 mt-2 pt-2 border-t border-cyan-200">
                  vs Continuo 24/7: Ahorro de{" "}
                  {Math.round((1 - horasDia / 24) * 100)}% de agua
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleGuardar}
              disabled={guardando}
              className="flex-1 bg-blue-500 text-white py-2.5 rounded-lg hover:bg-blue-600 disabled:opacity-50 font-medium"
            >
              {guardando ? "Guardando..." : "Guardar"}
            </button>
            <button
              onClick={onCerrar}
              disabled={guardando}
              className="flex-1 bg-gray-100 py-2.5 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
