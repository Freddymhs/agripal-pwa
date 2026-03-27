"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Zona, EntradaAgua } from "@/types";
import type { ResumenEstanque } from "@/lib/utils/agua";
import { MS_POR_DIA, LITROS_POR_M3 } from "@/lib/constants/conversiones";
import { getEstadoDiasAgua, calcularPreviewRecarga } from "@/lib/utils/agua";

interface EstanqueCardAguaProps {
  estanque: Zona;
  resumen: ResumenEstanque | undefined;
  onConfigurarRecarga: () => void;
  /** Cuando es el único estanque, mostrar botón de registrar agua aquí */
  onRegistrarAgua?: () => void;
  /** Últimas entradas de agua (para mostrar debajo del botón registrar) */
  entradasRecientes?: EntradaAgua[];
  onVerHistorial?: () => void;
}

export function EstanqueCardAgua({
  estanque,
  resumen,
  onConfigurarRecarga,
  onRegistrarAgua,
  entradasRecientes,
  onVerHistorial,
}: EstanqueCardAguaProps) {
  const cfg = estanque.estanque_config;
  if (!cfg) return null;

  const pct =
    cfg.capacidad_m3 > 0 ? (cfg.nivel_actual_m3 / cfg.capacidad_m3) * 100 : 0;
  const consumoPropio = resumen?.consumoSemanal ?? 0;
  const diasPropios = resumen?.diasRestantes ?? Infinity;
  const estadoDias = getEstadoDiasAgua(diasPropios);
  const colorBarra = consumoPropio > 0 ? estadoDias.colorBarra : "bg-cyan-500";
  const configEst = cfg.recarga;
  const diasHastaRecargaEst = configEst?.proxima_recarga
    ? Math.round(
        (new Date(configEst.proxima_recarga).getTime() - new Date().getTime()) /
          MS_POR_DIA,
      )
    : null;
  const cantidadRecargaM3Est = configEst
    ? configEst.cantidad_litros / LITROS_POR_M3
    : 0;

  return (
    <div
      className={`rounded-lg border-2 p-4 space-y-3 ${
        consumoPropio > 0 && diasPropios !== Infinity
          ? `${estadoDias.colorFondo} ${estadoDias.colorBorde}`
          : "bg-white border-gray-200"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">{estanque.nombre}</h3>
        <span className="text-sm text-gray-600">
          {Number(cfg.nivel_actual_m3).toFixed(1)} / {cfg.capacidad_m3} m³
        </span>
      </div>

      {/* Barra de nivel */}
      <div>
        <div className="h-3 bg-white/60 rounded-full overflow-hidden">
          <div
            className={`h-full ${colorBarra} transition-all`}
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 mt-0.5">
          {pct.toFixed(0)}% de capacidad
          {cfg.material ? ` · ${cfg.material}` : ""}
        </div>
      </div>

      {/* Días */}
      {consumoPropio > 0 && diasPropios !== Infinity ? (
        <div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${estadoDias.colorTexto}`}>
              ~{Math.floor(diasPropios)}
            </span>
            <span className={`text-base ${estadoDias.colorTexto}`}>
              días de agua
            </span>
          </div>
          <div className="text-xs text-gray-500">
            Consumo: {consumoPropio.toFixed(2)} m³/sem
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-400">Sin zonas de cultivo asignadas</p>
      )}

      {/* Botón registrar agua (solo cuando es el único estanque) */}
      {onRegistrarAgua && (
        <button
          onClick={onRegistrarAgua}
          className="w-full bg-cyan-600 text-white py-3 rounded-lg hover:bg-cyan-700 font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Registrar entrada de agua
        </button>
      )}

      {/* Historial compacto (debajo del botón registrar) */}
      {entradasRecientes && entradasRecientes.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-500 uppercase tracking-wide">
              Últimas entradas
            </span>
            {onVerHistorial && (
              <button
                onClick={onVerHistorial}
                className="text-[10px] text-cyan-600 hover:text-cyan-700 font-medium"
              >
                Ver todo
              </button>
            )}
          </div>
          {entradasRecientes.slice(0, 3).map((e) => (
            <div
              key={e.id}
              className="flex justify-between text-xs text-gray-600"
            >
              <span className="text-cyan-700 font-medium">
                +{(e.cantidad_m3 ?? 0).toFixed(1)} m³
              </span>
              <span>{new Date(e.fecha).toLocaleDateString("es-CL")}</span>
            </div>
          ))}
        </div>
      )}

      {/* Recarga */}
      <div
        className={`space-y-2 pt-2 border-t ${
          consumoPropio > 0 ? "border-white/40" : "border-gray-100"
        }`}
      >
        {configEst && diasHastaRecargaEst !== null ? (
          <RecargaPreview
            cfg={cfg}
            configEst={configEst}
            colorBarra={colorBarra}
            diasHastaRecargaEst={diasHastaRecargaEst}
            consumoSemanal={consumoPropio}
            cantidadRecargaM3={cantidadRecargaM3Est}
          />
        ) : (
          <p className="text-xs text-gray-400">Sin recarga configurada</p>
        )}
        <button
          onClick={onConfigurarRecarga}
          className="w-full bg-white/80 text-gray-700 py-2 rounded-lg hover:bg-white font-medium text-sm flex items-center justify-center gap-1.5 border border-gray-200"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          Configurar recarga
        </button>
      </div>
    </div>
  );
}

function RecargaPreview({
  cfg,
  configEst,
  colorBarra,
  diasHastaRecargaEst,
  consumoSemanal,
  cantidadRecargaM3,
}: {
  cfg: NonNullable<Zona["estanque_config"]>;
  configEst: NonNullable<NonNullable<Zona["estanque_config"]>["recarga"]>;
  colorBarra: string;
  diasHastaRecargaEst: number;
  consumoSemanal: number;
  cantidadRecargaM3: number;
}) {
  const preview = calcularPreviewRecarga(
    cfg.nivel_actual_m3,
    cfg.capacidad_m3,
    consumoSemanal,
    diasHastaRecargaEst,
    cantidadRecargaM3,
  );
  const colorBarraLlegada =
    preview.pctLlegada > 20 ? "bg-yellow-500" : "bg-orange-500";

  return (
    <div className="space-y-3">
      <div className="text-[10px] text-gray-500 uppercase tracking-wide">
        Recarga configurada
      </div>
      <div className="text-sm text-gray-700">
        Cada{" "}
        <strong className="text-gray-900">
          {configEst.frecuencia_dias} días
        </strong>{" "}
        llegan{" "}
        <strong className="text-gray-900">
          {cantidadRecargaM3.toFixed(1)} m³
        </strong>
        <span className="text-gray-400 ml-1">
          (próxima:{" "}
          {format(new Date(configEst.proxima_recarga), "d 'de' MMMM", {
            locale: es,
          })}
          )
        </span>
      </div>

      {/* 3 barras: Hoy → Llegada → Después */}
      <div className="space-y-1.5 bg-white/40 rounded-lg p-2.5">
        <BarraNivel
          label="Hoy"
          nivel={cfg.nivel_actual_m3}
          capacidad={cfg.capacidad_m3}
          pct={preview.pctHoy}
          color={colorBarra}
        />
        <BarraNivel
          label={`Cuando llegue el camión (${diasHastaRecargaEst} días)`}
          nivel={preview.nivelLlegada}
          capacidad={cfg.capacidad_m3}
          pct={preview.pctLlegada}
          color={colorBarraLlegada}
        />
        <BarraNivel
          label="Después de cargar"
          nivel={preview.nivelDespues}
          capacidad={cfg.capacidad_m3}
          pct={preview.pctDespues}
          color={preview.cabeCompleta ? "bg-green-500" : "bg-orange-500"}
        />
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
          <>
            <div className="font-medium">
              El agua se acaba en ~{Math.floor(preview.diasRestantes)} días,
              pero el camión llega en {diasHastaRecargaEst}.
            </div>
            <div className="mt-0.5">
              Pide el camión antes para no quedarte sin agua.
            </div>
          </>
        ) : !preview.cabeCompleta ? (
          <>
            <div className="font-medium">
              El agua alcanza, pero al camión le sobrarán{" "}
              {preview.excedenteM3.toFixed(1)} m³ sin donde ponerlos.
            </div>
            <div className="mt-0.5">
              Opciones: pedir menos agua, alargar la frecuencia, o agregar
              capacidad.
            </div>
          </>
        ) : (
          <div className="font-medium">
            Todo bien — el agua alcanza y la recarga cabe completa. Sobran ~
            {Math.floor(preview.diasRestantes - diasHastaRecargaEst)} días
            después de la entrega.
          </div>
        )}
      </div>
    </div>
  );
}

function BarraNivel({
  label,
  nivel,
  capacidad,
  pct,
  color,
}: {
  label: string;
  nivel: number;
  capacidad: number;
  pct: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-[11px] mb-0.5">
        <span className="text-gray-600">{label}</span>
        <span className="text-gray-800 font-medium">
          {nivel.toFixed(1)} de {capacidad} m³
        </span>
      </div>
      <div className="h-2.5 bg-gray-200/60 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
}
