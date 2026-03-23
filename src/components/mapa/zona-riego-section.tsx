"use client";

import { useState } from "react";
import type { Zona, Planta, CatalogoCultivo, SesionRiego, UUID } from "@/types";
import { TIPO_RIEGO, esRiegoManual } from "@/lib/constants/entities";
import { DIAS_POR_SEMANA } from "@/lib/constants/conversiones";
import {
  calcularConsumoZona,
  calcularConsumoRiegoZona,
  type OpcionesConsumoAgua,
} from "@/lib/utils/agua";
import {
  ConfigurarRiegoModal,
  RegistrarSesionRiegoModal,
} from "@/components/agua";

interface InfoLabelProps {
  label: string;
  tooltip: string;
}

function InfoLabel({ label, tooltip }: InfoLabelProps) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex items-center gap-1">
      <span>{label}</span>
      <div
        className="relative"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        <button
          type="button"
          className="w-3.5 h-3.5 rounded-full bg-gray-200 text-gray-500 text-[10px] leading-none flex items-center justify-center hover:bg-gray-300"
          aria-label={tooltip}
        >
          i
        </button>
        {show && (
          <div className="absolute right-0 top-4 z-40 max-w-xs bg-white border border-gray-200 rounded-lg shadow-lg p-2 text-[11px] text-gray-700 whitespace-normal break-words">
            {tooltip}
          </div>
        )}
      </div>
    </div>
  );
}

interface ZonaRiegoSectionProps {
  zona: Zona;
  plantasVivas: Planta[];
  catalogoCultivos: CatalogoCultivo[];
  sueloArcilloso: boolean;
  onGuardarRiego: (
    zonaId: string,
    config: Zona["configuracion_riego"],
  ) => Promise<void>;
  // Para riego manual: registrar sesiones
  terrenoId?: UUID;
  estanqueZona?: Zona;
  sesionesRecientes?: SesionRiego[];
  onRegistrarSesion?: (
    sesion: Omit<
      SesionRiego,
      "id" | "created_at" | "updated_at" | "lastModified"
    >,
  ) => Promise<void>;
  opcionesConsumoAgua?: OpcionesConsumoAgua;
}

export function ZonaRiegoSection({
  zona,
  plantasVivas,
  catalogoCultivos,
  sueloArcilloso,
  onGuardarRiego,
  terrenoId,
  estanqueZona,
  sesionesRecientes,
  onRegistrarSesion,
  opcionesConsumoAgua,
}: ZonaRiegoSectionProps) {
  const [showConfigRiego, setShowConfigRiego] = useState(false);
  const [showSesionModal, setShowSesionModal] = useState(false);

  const consumoZonaM3Sem = calcularConsumoZona(
    zona,
    plantasVivas,
    catalogoCultivos,
    undefined,
    opcionesConsumoAgua,
  );
  const consumoRecLDia = (consumoZonaM3Sem * 1000) / DIAS_POR_SEMANA;
  const lPorPlantaDia =
    plantasVivas.length > 0 ? consumoRecLDia / plantasVivas.length : 0;

  const consumoRiegoM3Sem = calcularConsumoRiegoZona(zona);
  const consumoRiegoLDia = (consumoRiegoM3Sem * 1000) / DIAS_POR_SEMANA;

  return (
    <>
      <div
        className={`p-3 rounded-lg ${zona.configuracion_riego ? "bg-blue-50" : "bg-amber-50/70"}`}
      >
        {zona.configuracion_riego ? (
          <div className="space-y-2">
            <div className="flex items-center gap-1 mb-1">
              <h4 className="text-sm font-bold text-blue-800">
                💧 Sistema de Riego
              </h4>
              <InfoLabel
                label=""
                tooltip="Estos valores usan tu caudal total (L/h) y horas de riego por día."
              />
            </div>
            <div className="bg-blue-100/60 border border-blue-200 rounded-lg p-2 space-y-0.5">
              <p className="text-xs font-bold text-blue-800">
                Riego configurado
              </p>
              <p className="text-[11px] text-blue-700">
                Consumo y días de cobertura se calculan con tu caudal y horas de
                riego.
              </p>
            </div>
            <div className="text-xs text-blue-700 bg-white p-2 rounded">
              <div className="flex justify-between">
                <span>Tipo:</span>
                <span className="font-medium">
                  {zona.configuracion_riego.tipo === TIPO_RIEGO.MANUAL
                    ? "🚿 Válvula manual"
                    : zona.configuracion_riego.tipo === TIPO_RIEGO.BALDE
                      ? "🪣 Riego por balde"
                      : zona.configuracion_riego.tipo === TIPO_RIEGO.PROGRAMADO
                        ? "⏰ Programado"
                        : "💧 Continuo 24/7"}
                </span>
              </div>
              {zona.configuracion_riego.tipo === TIPO_RIEGO.BALDE ? (
                zona.configuracion_riego.litros_por_planta != null && (
                  <div className="flex justify-between">
                    <span>Litros/planta:</span>
                    <span className="font-medium">
                      {zona.configuracion_riego.litros_por_planta} L
                    </span>
                  </div>
                )
              ) : (
                <div className="flex justify-between">
                  <span>Caudal:</span>
                  <span className="font-medium">
                    {zona.configuracion_riego.caudal_total_lh} L/h
                  </span>
                </div>
              )}
              {esRiegoManual(zona.configuracion_riego.tipo) &&
                zona.configuracion_riego.frecuencia_dias != null &&
                zona.configuracion_riego.frecuencia_dias > 1 && (
                  <div className="flex justify-between">
                    <span>Frecuencia:</span>
                    <span className="font-medium">
                      Cada {zona.configuracion_riego.frecuencia_dias} días
                    </span>
                  </div>
                )}
              {zona.configuracion_riego.tipo === TIPO_RIEGO.PROGRAMADO && (
                <div className="flex justify-between">
                  <span>Horario:</span>
                  <span className="font-medium">
                    {zona.configuracion_riego.horario_inicio} -{" "}
                    {zona.configuracion_riego.horario_fin}
                  </span>
                </div>
              )}
              {consumoRiegoM3Sem > 0 && (
                <div className="flex justify-between pt-1 border-t border-blue-100 mt-1">
                  <span>Consumo estimado:</span>
                  <span className="font-medium">
                    ~{consumoRiegoLDia.toFixed(0)} L/día ·{" "}
                    {consumoRiegoM3Sem.toFixed(2)} m³/sem
                  </span>
                </div>
              )}
            </div>
            {esRiegoManual(zona.configuracion_riego.tipo) &&
              onRegistrarSesion &&
              estanqueZona &&
              terrenoId && (
                <>
                  <button
                    onClick={() => setShowSesionModal(true)}
                    className="w-full bg-cyan-500 text-white py-2 rounded hover:bg-cyan-600 text-sm font-medium"
                  >
                    💧 Registrar Riego
                  </button>
                  {sesionesRecientes && sesionesRecientes.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] text-gray-500 font-medium">
                        Últimas sesiones:
                      </p>
                      {sesionesRecientes.slice(0, 2).map((s) => (
                        <div
                          key={s.id}
                          className="flex justify-between text-[11px] text-gray-600 bg-white px-2 py-1 rounded"
                        >
                          <span>{s.fecha}</span>
                          <span>
                            {s.duracion_horas}h · {s.consumo_litros.toFixed(0)}{" "}
                            L
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            <button
              onClick={() => setShowConfigRiego(true)}
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 text-sm font-medium"
            >
              Reconfigurar Riego
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-1 mb-1">
              <h4 className="text-sm font-bold text-amber-800">
                💧 Sistema de Riego
              </h4>
              <InfoLabel
                label=""
                tooltip="Mientras no configures caudal (L/h) y horas/día, la app usa un modelo estándar."
              />
            </div>
            <div className="bg-amber-50 border border-amber-300 rounded-lg p-2.5 space-y-1">
              <p className="text-xs font-bold text-amber-800">
                ⚠️ Sistema de riego no configurado
              </p>
              <p className="text-[11px] text-amber-700">
                El consumo y los días de cobertura se calculan solo con el
                consumo recomendado por ficha.
              </p>
            </div>
            <button
              onClick={() => setShowConfigRiego(true)}
              className="w-full bg-amber-500 text-white py-2 rounded hover:bg-amber-600 text-sm font-medium"
            >
              Configurar Riego
            </button>
          </div>
        )}
      </div>

      {showSesionModal && onRegistrarSesion && estanqueZona && terrenoId && (
        <RegistrarSesionRiegoModal
          zona={zona}
          estanque={estanqueZona}
          terrenoId={terrenoId}
          consumoRecomendadoLDia={consumoRecLDia}
          numPlantas={plantasVivas.length}
          onGuardar={onRegistrarSesion}
          onCerrar={() => setShowSesionModal(false)}
        />
      )}

      {showConfigRiego && (
        <ConfigurarRiegoModal
          config={zona.configuracion_riego}
          sueloArcilloso={sueloArcilloso}
          consumoRecomendadoLDia={consumoRecLDia}
          litrosPorPlantaDia={lPorPlantaDia}
          numPlantasZona={plantasVivas.length}
          onGuardar={async (config) => {
            await onGuardarRiego(zona.id, config);
            setShowConfigRiego(false);
          }}
          onCerrar={() => setShowConfigRiego(false)}
        />
      )}
    </>
  );
}
