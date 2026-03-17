"use client";

import { useState } from "react";
import { useProjectContext } from "@/contexts/project-context";
import { useMapContext } from "@/contexts/map-context";
import { sesionesRiegoDAL, zonasDAL } from "@/lib/dal";
import { ejecutarMutacion } from "@/lib/helpers/dal-mutation";
import { useSesionesRiego } from "@/hooks/use-sesiones-riego";
import { TIPO_RIEGO } from "@/lib/constants/entities";
import { LITROS_POR_M3 } from "@/lib/constants/conversiones";
import {
  ScoreCalidadPanel,
  ROIPanel,
  Comparador,
} from "@/components/proyeccion";
import { calcularScoreCalidad } from "@/lib/utils/calidad";
import { calcularROI, obtenerCostoAguaPromedio } from "@/lib/utils/roi";
import { obtenerFuente } from "@/lib/data/fuentes-agua";
import type { DatosClimaticos } from "@/lib/data/clima";
import {
  calcularConsumoZona,
  calcularConsumoRiegoZona,
  calcularDiasRestantes,
  determinarEstadoAgua,
} from "@/lib/utils/agua";
import {
  ESTADO_PLANTA,
  ESTADO_AGUA,
  TEXTURA_SUELO,
} from "@/lib/constants/entities";
import { ZonaRiegoSection } from "./zona-riego-section";

function InfoLabel({ label, tooltip }: { label: string; tooltip: string }) {
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

export function ZonaCultivoPanel() {
  const {
    terrenoActual,
    proyectoActual,
    catalogoCultivos,
    estanquesHook,
    zonasHook,
    datosBaseHook,
  } = useProjectContext();
  const {
    zonaSeleccionada,
    plantasZonaSeleccionada,
    cultivoSeleccionado,
    setCultivoSeleccionado,
    setShowGridModal,
  } = useMapContext();

  const isManualRiego =
    zonaSeleccionada?.configuracion_riego?.tipo === TIPO_RIEGO.MANUAL;
  const { sesiones: sesionesZona, refetch: refetchSesiones } = useSesionesRiego(
    zonaSeleccionada?.id,
    isManualRiego,
  );

  if (!zonaSeleccionada || !terrenoActual) return null;

  const plantasVivas = plantasZonaSeleccionada.filter(
    (p) => p.estado !== ESTADO_PLANTA.MUERTA,
  );

  return (
    <div className="p-4 border-t space-y-4">
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-2">
          Plantas en esta zona
        </h4>
        <p className="text-sm text-gray-600 mb-3">
          {plantasZonaSeleccionada.length} planta(s) en total
        </p>
        {plantasZonaSeleccionada.length > 0 &&
          (() => {
            const plantasPorTipo = plantasZonaSeleccionada.reduce(
              (acc, planta) => {
                acc[planta.tipo_cultivo_id] =
                  (acc[planta.tipo_cultivo_id] || 0) + 1;
                return acc;
              },
              {} as Record<string, number>,
            );
            return (
              <div className="space-y-2">
                {Object.entries(plantasPorTipo).map(([cultivoId, cantidad]) => {
                  const cultivo = catalogoCultivos.find(
                    (c) => c.id === cultivoId,
                  );
                  return (
                    <div
                      key={cultivoId}
                      className="bg-green-50 border border-green-200 rounded-lg p-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🌱</span>
                          <div>
                            <p className="text-sm font-medium text-green-900">
                              {cultivo?.nombre || "Cultivo desconocido"}
                            </p>
                            <p className="text-xs text-green-700">
                              {cultivo?.nombre_cientifico}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-900">
                            {cantidad}
                          </p>
                          <p className="text-xs text-green-600">
                            {(
                              (cantidad / plantasZonaSeleccionada.length) *
                              100
                            ).toFixed(0)}
                            %
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
      </div>

      {plantasZonaSeleccionada.length > 0 &&
        (() => {
          const consumoRecomendado = calcularConsumoZona(
            zonaSeleccionada,
            plantasZonaSeleccionada,
            catalogoCultivos,
          );
          const consumoRiego = calcularConsumoRiegoZona(zonaSeleccionada);
          const consumoEfectivo =
            consumoRiego > 0 ? consumoRiego : consumoRecomendado;
          const aguaDisp = estanquesHook.aguaTotalActual;
          const estado =
            consumoEfectivo > 0
              ? determinarEstadoAgua(aguaDisp, consumoEfectivo)
              : ESTADO_AGUA.OK;
          const diasRestantes = calcularDiasRestantes(
            aguaDisp,
            consumoEfectivo,
          );
          return (
            <div
              className={`p-3 rounded-lg text-sm ${estado === ESTADO_AGUA.OK ? "bg-cyan-50 text-cyan-800" : estado === ESTADO_AGUA.AJUSTADO ? "bg-yellow-50 text-yellow-800" : "bg-red-50 text-red-800"}`}
            >
              <h4 className="text-xs font-bold mb-1">
                Consumo semanal estimado
              </h4>
              <div className="text-xs space-y-0.5">
                <div className="flex justify-between">
                  <InfoLabel
                    label="Recomendado"
                    tooltip="Consumo que el cultivo debería necesitar según ficha, clima y etapa de crecimiento."
                  />
                  <span
                    className={`font-medium ${consumoRiego > 0 ? "text-gray-500" : ""}`}
                  >
                    {consumoRecomendado.toFixed(2)} m³/sem
                  </span>
                </div>
                {consumoRiego > 0 && (
                  <div className="flex justify-between">
                    <InfoLabel
                      label="Con tu riego"
                      tooltip="Consumo real calculado con el caudal y horas de riego que configuraste en esta zona."
                    />
                    <span className="font-bold">
                      {consumoRiego.toFixed(2)} m³/sem
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <InfoLabel
                    label="Agua actual"
                    tooltip="Nivel estimado del estanque. Se descuenta automáticamente según el consumo calculado de tus plantas."
                  />
                  <span className="font-medium">{aguaDisp.toFixed(1)} m³</span>
                </div>
                {diasRestantes !== Infinity && (
                  <div className="flex justify-between font-medium">
                    <InfoLabel
                      label="Días de cobertura"
                      tooltip={
                        consumoRiego > 0
                          ? "Calculado con el consumo real de tu sistema de riego."
                          : "Calculado con el consumo recomendado. Configura tu riego para usar datos reales."
                      }
                    />
                    <span>~{Math.floor(diasRestantes)} días</span>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

      {plantasZonaSeleccionada.length > 0 &&
        (() => {
          const consumoRiegoZona = calcularConsumoRiegoZona(zonaSeleccionada);
          const consumoVivasRec = calcularConsumoZona(
            zonaSeleccionada,
            plantasVivas,
            catalogoCultivos,
          );
          const consumoParaRoi =
            consumoRiegoZona > 0 ? consumoRiegoZona : consumoVivasRec;
          const cultivoZona = catalogoCultivos.find((c) =>
            plantasZonaSeleccionada.some((p) => p.tipo_cultivo_id === c.id),
          );
          if (!cultivoZona) return null;
          const estanquePrincipal = estanquesHook.obtenerEstanquePrincipal();
          const fuentesAgua = datosBaseHook?.datosBase?.fuentesAgua || [];
          const fuente = estanquePrincipal?.estanque_config?.fuente_id
            ? (obtenerFuente(
                fuentesAgua,
                estanquePrincipal.estanque_config.fuente_id,
              ) ?? null)
            : null;
          const suelo = proyectoActual?.suelo ?? null;
          const consumoEfectivoZona =
            consumoRiegoZona > 0 ? consumoRiegoZona : consumoVivasRec;
          const climaDatos = datosBaseHook?.datosBase?.clima?.[0] as
            | DatosClimaticos
            | undefined;
          if (!climaDatos) return null;
          const score = calcularScoreCalidad(
            cultivoZona,
            fuente,
            suelo,
            estanquesHook.aguaTotalActual,
            consumoEfectivoZona,
            climaDatos,
          );
          const costoAguaM3 = obtenerCostoAguaPromedio(
            estanquesHook.estanques,
            terrenoActual,
            fuentesAgua,
          );
          const roi = calcularROI(
            cultivoZona,
            zonaSeleccionada,
            plantasVivas.length,
            costoAguaM3,
            consumoParaRoi,
            suelo,
          );
          return (
            <div className="space-y-3">
              <div className="bg-white border rounded-lg p-3">
                <ScoreCalidadPanel score={score} />
              </div>
              <div className="bg-white border rounded-lg p-3">
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-xs font-bold text-gray-700">
                    Retorno de Inversión
                  </span>
                  <InfoLabel
                    label=""
                    tooltip="ROI estimado: ingresos proyectados por cosecha × plantas vivas, menos costos de agua y producción. Varía según etapa y condiciones reales."
                  />
                </div>
                <ROIPanel roi={roi} />
              </div>
              <div className="bg-white border rounded-lg p-3">
                <Comparador
                  zona={zonaSeleccionada}
                  catalogoCultivos={catalogoCultivos}
                  costoAguaM3={costoAguaM3}
                  suelo={suelo}
                />
              </div>
            </div>
          );
        })()}

      {/* Selector de estanque fuente — visible con 1+ estanques */}
      {estanquesHook.estanques.length >= 1 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
          <h4 className="text-xs font-bold text-blue-800">Estanque de riego</h4>
          <select
            value={zonaSeleccionada.estanque_id ?? ""}
            onChange={async (e) => {
              if (!e.target.value) return;
              await zonasHook.actualizarZona(zonaSeleccionada.id, {
                estanque_id: e.target.value,
              });
            }}
            className={`w-full px-2 py-1.5 text-sm border rounded bg-white text-gray-900 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 ${!zonaSeleccionada.estanque_id ? "border-orange-400" : "border-blue-300"}`}
          >
            {!zonaSeleccionada.estanque_id && (
              <option value="">— Selecciona un estanque —</option>
            )}
            {estanquesHook.estanques.map((est) => (
              <option key={est.id} value={est.id}>
                {est.nombre} (
                {(est.estanque_config?.nivel_actual_m3 ?? 0).toFixed(1)} /{" "}
                {est.estanque_config?.capacidad_m3 ?? 0} m³)
              </option>
            ))}
          </select>
          {!zonaSeleccionada.estanque_id ? (
            <p className="text-xs text-orange-600 font-medium">
              Sin estanque asignado — esta zona no consume agua del sistema.
            </p>
          ) : (
            <p className="text-xs text-blue-600">
              Las alertas de escasez se evalúan por este estanque.
            </p>
          )}
        </div>
      )}

      <ZonaRiegoSection
        zona={zonaSeleccionada}
        plantasVivas={plantasVivas}
        catalogoCultivos={catalogoCultivos}
        sueloArcilloso={
          proyectoActual?.suelo?.fisico?.textura === TEXTURA_SUELO.ARCILLOSA
        }
        onGuardarRiego={async (zonaId, config) => {
          await zonasHook.actualizarZona(zonaId, {
            configuracion_riego: config,
          });
        }}
        terrenoId={terrenoActual.id}
        estanqueZona={
          zonaSeleccionada.estanque_id
            ? estanquesHook.estanques.find(
                (e) => e.id === zonaSeleccionada.estanque_id,
              )
            : undefined
        }
        sesionesRecientes={sesionesZona}
        onRegistrarSesion={async (sesion) => {
          await ejecutarMutacion(
            async () => {
              await sesionesRiegoDAL.crear(sesion);
              // Descontar consumo del estanque
              const estanque = estanquesHook.estanques.find(
                (e) => e.id === zonaSeleccionada.estanque_id,
              );
              if (estanque?.estanque_config) {
                const nivelAnterior =
                  estanque.estanque_config.nivel_actual_m3 ?? 0;
                const descuento = sesion.consumo_litros / LITROS_POR_M3;
                await zonasDAL.update(estanque.id, {
                  estanque_config: {
                    ...estanque.estanque_config,
                    nivel_actual_m3: Math.max(0, nivelAnterior - descuento),
                  },
                });
              }
            },
            "registrar sesión de riego",
            refetchSesiones,
          );
        }}
      />

      <div className="bg-lime-50 p-3 rounded-lg space-y-3">
        <h4 className="text-sm font-bold text-lime-800">
          Plantar en esta zona
        </h4>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            ¿Qué quieres plantar?
          </label>
          <select
            value={cultivoSeleccionado?.id ?? ""}
            onChange={(e) => {
              const cultivo = catalogoCultivos.find(
                (c) => c.id === e.target.value,
              );
              if (cultivo) setCultivoSeleccionado(cultivo);
            }}
            className="w-full px-3 py-2 rounded border border-gray-300 text-gray-900 text-sm"
          >
            {!cultivoSeleccionado && (
              <option value="" disabled>
                Seleccionar cultivo…
              </option>
            )}
            {catalogoCultivos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
        {cultivoSeleccionado && (
          <div className="text-xs text-gray-600 bg-white p-2 rounded">
            <div>
              Espaciado:{" "}
              <strong>{cultivoSeleccionado.espaciado_recomendado_m}m</strong>
            </div>
          </div>
        )}
        <button
          onClick={() => setShowGridModal(true)}
          disabled={!cultivoSeleccionado}
          className="w-full bg-lime-600 text-white py-2 rounded hover:bg-lime-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cultivoSeleccionado
            ? `Plantar ${cultivoSeleccionado.nombre} en Grilla`
            : "Selecciona un cultivo"}
        </button>
        <p className="text-xs text-gray-600 text-center">
          O usa modo &quot;Plantar&quot; para colocar individualmente
        </p>
      </div>
    </div>
  );
}
