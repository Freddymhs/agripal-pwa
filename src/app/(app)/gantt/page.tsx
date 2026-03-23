"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { PageLayout } from "@/components/layout";
import { useProjectContext } from "@/contexts/project-context";
import {
  buildFilasGantt,
  calcularTotalesPorMes,
  MESES_CORTO,
} from "@/lib/utils/calendario-gantt";
import { filtrarEstanques } from "@/lib/utils/helpers-cultivo";
import { obtenerCostoAguaPromedio } from "@/lib/utils/roi";
import { cosechasDAL } from "@/lib/dal";
import { TIPO_ZONA } from "@/lib/constants/entities";
import { GanttFila } from "@/components/calendario/gantt-fila";
import { GanttTotales } from "@/components/calendario/gantt-totales";
import { GanttEsteMes } from "@/components/calendario/gantt-este-mes";
import { formatCLP } from "@/lib/utils";
import type { Cosecha } from "@/types";
import type { PrecioMayorista } from "@/lib/data/tipos-mercado";

const AÑO_ACTUAL = new Date().getFullYear();

export default function GanttPage() {
  const [año, setAño] = useState(AÑO_ACTUAL);
  const [tipoPrecio, setTipoPrecio] = useState<"feria" | "mayorista">("feria");
  const [cosechas, setCosechas] = useState<Cosecha[]>([]);

  const {
    terrenoActual: terreno,
    proyectoActual,
    zonas,
    plantas,
    catalogoCultivos,
    loading,
    opcionesConsumoAgua,
    datosBaseHook,
    alertasHook,
  } = useProjectContext();

  // Costo efectivo de agua
  const costoAguaM3 = useMemo(() => {
    if (!terreno || zonas.length === 0) return 0;
    const estanques = filtrarEstanques(zonas);
    return obtenerCostoAguaPromedio(estanques, terreno);
  }, [terreno, zonas]);

  // Lookup: cultivo_base_id → PrecioMayorista (igual que /economia)
  const preciosMap = useMemo(() => {
    const map = new Map<string, PrecioMayorista>();
    for (const p of datosBaseHook.datosBase.precios) {
      map.set(p.cultivo_id, p);
    }
    return map;
  }, [datosBaseHook.datosBase.precios]);

  // Cargar cosechas reales de todas las zonas
  const cargarCosechas = useCallback(async () => {
    const zonaIds = zonas
      .filter((z) => z.tipo === TIPO_ZONA.CULTIVO)
      .map((z) => z.id);
    if (zonaIds.length === 0) return;
    try {
      const data = await cosechasDAL.getByZonaIds(zonaIds);
      setCosechas(data);
    } catch {
      // cosechas reales son opcionales — el Gantt funciona sin ellas
    }
  }, [zonas]);

  useEffect(() => {
    if (!loading) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- cargarCosechas es estable vía useCallback
      void cargarCosechas();
    }
  }, [loading, cargarCosechas]);

  // Construir filas del Gantt
  const climaBase = datosBaseHook.datosBase.clima[0] ?? null;

  const filas = useMemo(() => {
    if (!terreno || zonas.length === 0) return [];
    return buildFilasGantt({
      año,
      zonas,
      plantas,
      catalogoCultivos,
      cosechas,
      preciosMap,
      costoAguaM3,
      suelo: proyectoActual?.suelo ?? null,
      opcionesConsumoAgua,
      climaBase,
    });
  }, [
    año,
    terreno,
    zonas,
    plantas,
    catalogoCultivos,
    cosechas,
    preciosMap,
    costoAguaM3,
    proyectoActual?.suelo,
    opcionesConsumoAgua,
    climaBase,
  ]);

  const totalesPorMes = useMemo(
    () => calcularTotalesPorMes(filas, tipoPrecio),
    [filas, tipoPrecio],
  );

  const totalAnual = totalesPorMes.reduce((s, v) => s + v, 0);

  // Resumen de alineación cosecha vs temporada de mercado
  const resumenTemporada = useMemo(() => {
    let enTemporada = 0;
    let fueraTemporada = 0;
    for (const f of filas) {
      if (
        !f.meses_cosecha_catalogo.length ||
        !f.meses_cosecha_personales.length
      )
        continue;
      const setCat = new Set(f.meses_cosecha_catalogo);
      if (f.meses_cosecha_personales.some((m) => setCat.has(m))) enTemporada++;
      else fueraTemporada++;
    }
    return { enTemporada, fueraTemporada };
  }, [filas]);

  if (loading) {
    return (
      <PageLayout title="Calendario de Cultivos">
        <div className="p-4 text-sm text-gray-400">Cargando...</div>
      </PageLayout>
    );
  }

  if (!terreno) {
    return (
      <PageLayout title="Calendario de Cultivos">
        <div className="p-4 text-sm text-gray-500">
          Selecciona un terreno para ver el calendario.
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Calendario de Cultivos">
      <div className="flex flex-col gap-3 px-3 pb-6">
        {/* Controles */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {/* Navegación año */}
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1">
            <button
              onClick={() => setAño((a) => a - 1)}
              className="text-gray-500 hover:text-gray-800 px-1 text-sm"
            >
              ◄
            </button>
            <span className="text-sm font-semibold text-gray-800 min-w-[36px] text-center">
              {año}
            </span>
            <button
              onClick={() => setAño((a) => a + 1)}
              className="text-gray-500 hover:text-gray-800 px-1 text-sm"
            >
              ►
            </button>
          </div>

          {/* Toggle precio */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setTipoPrecio("feria")}
              className={`px-2 py-1 text-xs rounded-md font-medium transition-colors ${
                tipoPrecio === "feria"
                  ? "bg-white text-green-700 shadow-sm"
                  : "text-gray-500"
              }`}
            >
              Feria
            </button>
            <button
              onClick={() => setTipoPrecio("mayorista")}
              className={`px-2 py-1 text-xs rounded-md font-medium transition-colors ${
                tipoPrecio === "mayorista"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-gray-500"
              }`}
            >
              Mayorista
            </button>
          </div>

          {/* Resumen alineación cosecha vs temporada */}
          {(resumenTemporada.enTemporada > 0 ||
            resumenTemporada.fueraTemporada > 0) && (
            <div className="flex items-center gap-1.5 text-[10px]">
              {resumenTemporada.enTemporada > 0 && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                  <span className="text-green-700 font-medium">
                    {resumenTemporada.enTemporada} en temporada
                  </span>
                </span>
              )}
              {resumenTemporada.enTemporada > 0 &&
                resumenTemporada.fueraTemporada > 0 && (
                  <span className="text-gray-300">·</span>
                )}
              {resumenTemporada.fueraTemporada > 0 && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                  <span className="text-amber-600 font-medium">
                    {resumenTemporada.fueraTemporada} fuera
                  </span>
                </span>
              )}
            </div>
          )}

          {/* Info cosechas reales */}
          {cosechas.length > 0 && (
            <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-1 rounded">
              ◆● {cosechas.length} cosechas reales
            </span>
          )}

          <span className="ml-auto text-xs text-gray-400">
            Agua:{" "}
            {costoAguaM3 > 0 ? formatCLP(costoAguaM3) + "/m³" : "sin proveedor"}
          </span>
        </div>

        {/* Resumen económico del año */}
        {totalAnual > 0 && (
          <div className="flex items-center gap-3 px-3 py-2 bg-green-50 border border-green-100 rounded-xl">
            <div>
              <p className="text-[9px] text-green-600 uppercase font-semibold tracking-wide">
                Ingreso proyectado {año}
              </p>
              <p className="text-lg font-bold text-green-800 leading-tight">
                {formatCLP(totalAnual)}
              </p>
            </div>
            <div className="h-8 w-px bg-green-200" />
            <div className="text-[10px] text-green-600 space-y-0.5">
              <p>
                {
                  filas.filter(
                    (f) =>
                      f.ingreso_total_feria > 0 ||
                      f.ingreso_total_mayorista > 0,
                  ).length
                }{" "}
                cultivos con ingresos
              </p>
              <p>
                {
                  filas
                    .flatMap((f) => f.eventos)
                    .filter((e) => e.tipo === "cosecha" && !e.es_descarte)
                    .length
                }{" "}
                cosechas esperadas
              </p>
            </div>
            <p className="ml-auto text-[9px] text-green-500">
              {tipoPrecio === "feria" ? "precio feria" : "precio ODEPA"}
            </p>
          </div>
        )}

        {/* Qué hacer este mes */}
        {filas.length > 0 && (
          <GanttEsteMes
            filas={filas}
            año={año}
            proyectoId={proyectoActual?.id ?? ""}
            alertas={alertasHook.alertas}
            zonas={zonas}
          />
        )}

        {/* Grid principal */}
        {filas.length === 0 ? (
          <div className="text-sm text-gray-400 py-6 text-center">
            No hay zonas con cultivos plantados en este terreno.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div
              className="min-w-[640px]"
              style={{ display: "grid", gridTemplateColumns: "160px 1fr 80px" }}
            >
              {/* Cabecera */}
              <div className="text-[10px] font-bold text-gray-400 uppercase py-1 border-b border-gray-200">
                Cultivo / Zona
              </div>
              <div className="grid grid-cols-12 gap-0.5 py-1 border-b border-gray-200">
                {MESES_CORTO.map((m) => (
                  <div
                    key={m}
                    className="text-center text-[10px] font-bold text-gray-400 uppercase"
                  >
                    {m}
                  </div>
                ))}
              </div>
              <div className="text-[10px] font-bold text-gray-400 uppercase py-1 border-b border-gray-200 text-right pr-1">
                Total
              </div>

              {/* Filas */}
              {filas.map((fila) => (
                <GanttFila
                  key={`${fila.zona_id}-${fila.cultivo_id}`}
                  fila={fila}
                  tipoPrecio={tipoPrecio}
                />
              ))}

              {/* Totales */}
              <GanttTotales
                totalesPorMes={totalesPorMes}
                totalAnual={totalAnual}
              />
            </div>
          </div>
        )}

        {/* Leyenda */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] text-gray-400 pt-2 border-t border-gray-100">
          <span>
            ■ plantado · ◆ cosecha · ◆● real · ✂ poda ·{" "}
            <span className="font-bold">N</span> fertilización · ↺ replanta
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-300" />
            temporada mercado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-600" />
            mi cosecha = temporada
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400" />
            fuera de temporada
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-2 rounded-sm bg-blue-200" />
            demanda agua
          </span>
        </div>
      </div>
    </PageLayout>
  );
}
