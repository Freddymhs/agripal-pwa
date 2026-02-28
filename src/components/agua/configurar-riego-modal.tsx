"use client";

import { useState } from "react";
import type { ConfiguracionRiego, TipoSistemaRiego } from "@/types";
import { GOTEROS_DEFAULT, TIPO_RIEGO } from "@/lib/constants/entities";
import { DIAS_POR_SEMANA } from "@/lib/constants/conversiones";
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
    config?.tipo || TIPO_RIEGO.PROGRAMADO,
  );
  const [caudalTotal, setCaudalTotal] = useState(
    config?.caudal_total_lh || 100,
  );
  const [horasDia, setHorasDia] = useState(config?.horas_dia || 6);
  const [horarioInicio, setHorarioInicio] = useState(
    config?.horario_inicio || "06:00",
  );
  const [horarioFin, setHorarioFin] = useState(config?.horario_fin || "12:00");
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
  const gastoDiarioL = caudalTotal * horasEfectivas;
  const gastoDiarioM3 = gastoDiarioL / 1000;

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      await onGuardar({
        tipo,
        caudal_total_lh: caudalTotal,
        horas_dia: tipo === TIPO_RIEGO.PROGRAMADO ? horasDia : undefined,
        horario_inicio:
          tipo === TIPO_RIEGO.PROGRAMADO ? horarioInicio : undefined,
        horario_fin: tipo === TIPO_RIEGO.PROGRAMADO ? horarioFin : undefined,
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
        <div className="space-y-4">
          {consumoRecomendadoLDia != null && consumoRecomendadoLDia > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs font-medium text-green-800 mb-1">
                Necesidad diaria estimada (recomendada)
              </p>
              <p className="text-sm text-green-700">
                Esta zona necesita aprox.{" "}
                <strong>{Math.round(consumoRecomendadoLDia)} L/día</strong> en
                total
                {litrosPorPlantaDia != null && litrosPorPlantaDia > 0 && (
                  <> ({litrosPorPlantaDia.toFixed(1)} L/día por planta)</>
                )}{" "}
                según ficha de cultivo, clima y etapa.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">
              Tipo de Sistema
            </label>
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
                  <div className="font-medium">
                    {t === TIPO_RIEGO.PROGRAMADO
                      ? "⏰ Programado"
                      : "💧 Continuo 24/7"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {t === TIPO_RIEGO.PROGRAMADO
                      ? "Horario específico"
                      : "Válvula abierta"}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {tipo === TIPO_RIEGO.CONTINUO && sueloArcilloso && (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
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
                  className={`p-3 rounded-lg border ${over ? "bg-amber-50 border-amber-300" : porcentaje < 70 ? "bg-yellow-50 border-yellow-200" : "bg-blue-50 border-blue-200"}`}
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
                      ⚠️ Este modo gasta mucha más agua que la recomendada.
                    </p>
                  )}
                </div>
              );
            })()}

          <div>
            <label className="block text-sm font-medium mb-2">
              Caudal total del sistema (L/h)
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                value={caudalTotal}
                onChange={(e) =>
                  setCaudalTotal(Math.max(1, Number(e.target.value)))
                }
                min={1}
                className="flex-1 px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setMostrarCalculadora((v) => !v)}
                className="px-2 py-2 text-xs rounded border border-gray-300 bg-gray-50 hover:bg-gray-100"
              >
                {mostrarCalculadora ? "Cerrar" : "Calculadora"}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Ingresa el caudal real de tu sistema (suma de todos los goteros
              conectados).
            </p>
            {mostrarCalculadora && (
              <CaudalCalculadora
                numPlantasZona={numPlantasZona}
                caudalPorGoteroInicial={caudalPorGoteroInicial}
                onUsarCaudal={setCaudalTotal}
              />
            )}
            <p className="text-[11px] text-gray-500 mt-1">
              Si no conoces tu caudal exacto, la app usará el consumo
              recomendado como referencia.
            </p>
          </div>

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

          <div className="bg-cyan-50 border border-cyan-200 p-4 rounded-lg">
            <div className="text-sm text-cyan-800 mb-1">
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
                💡 vs Continuo 24/7: Ahorro de{" "}
                {Math.round((1 - horasDia / 24) * 100)}% de agua
              </div>
            )}
          </div>

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
