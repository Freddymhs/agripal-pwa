"use client";

import type { FilaGantt } from "@/lib/utils/calendario-gantt";
import { MESES_CORTO, PROPAGACION_LABEL } from "@/lib/utils/calendario-gantt";
import { GanttBarra } from "./gantt-barra";
import { formatCLP } from "@/lib/utils";

interface GanttFilaProps {
  fila: FilaGantt;
  tipoPrecio: "feria" | "mayorista";
}

// ─── Franja combinada: temporada mercado + demanda de agua ───────────────────

function FranjaContexto({
  mesesCatalogo,
  mesesPersonales,
  consumoAgua,
}: {
  mesesCatalogo: number[];
  mesesPersonales: number[];
  consumoAgua: number[];
}) {
  const setCatalogo = new Set(mesesCatalogo);
  const setPersonales = new Set(mesesPersonales);
  const hayMercado = mesesCatalogo.length > 0;
  const hayAgua = consumoAgua.some((v) => v > 0);
  if (!hayMercado && !hayAgua) return null;

  return (
    <div className="grid grid-cols-12 gap-px pb-1.5">
      {Array.from({ length: 12 }, (_, i) => {
        const mes = i + 1;
        const esMercado = setCatalogo.has(mes);
        const esPersonal = setPersonales.has(mes);
        const coincide = esMercado && esPersonal;
        const fueraTemporada = esPersonal && !esMercado;
        const agua = consumoAgua[i] ?? 0;

        return (
          <div
            key={mes}
            className="flex flex-col items-center justify-end"
            style={{ height: 16 }}
          >
            {hayAgua && agua > 0 && (
              <div
                className="w-full rounded-t-sm"
                style={{
                  height: `${Math.max(2, Math.round(agua * 10))}px`,
                  backgroundColor: `rgba(59,130,246,${0.2 + agua * 0.6})`,
                }}
                title={`${MESES_CORTO[i]}: ${Math.round(agua * 100)}% demanda agua`}
              />
            )}
            {hayMercado && (esMercado || fueraTemporada) && (
              <div
                className="rounded-full shrink-0 mb-px"
                style={{
                  width: coincide ? 7 : fueraTemporada ? 4 : 5,
                  height: coincide ? 7 : fueraTemporada ? 4 : 5,
                  backgroundColor: coincide
                    ? "#16a34a"
                    : fueraTemporada
                      ? "#fbbf24"
                      : "#6ee7b7",
                }}
                title={
                  coincide
                    ? "Tu cosecha coincide con la temporada ideal del mercado"
                    : fueraTemporada
                      ? "Tu cosecha cae fuera de la temporada ideal"
                      : "Mes ideal del mercado para este cultivo"
                }
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Badge de fase actual ─────────────────────────────────────────────────────

const FASE_CFG: Record<string, { label: string; dot: string }> = {
  plántula: { label: "Plántula", dot: "bg-gray-300" },
  joven: { label: "Joven", dot: "bg-amber-400" },
  adulta: { label: "Adulta", dot: "bg-green-500" },
  madura: { label: "Madura", dot: "bg-emerald-600" },
};

// ─── Badge de viabilidad ──────────────────────────────────────────────────────

const VIABILIDAD_CFG: Record<string, { text: string; cls: string }> = {
  mejor_opcion: {
    text: "top",
    cls: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  recomendado: { text: "rec", cls: "bg-blue-50 text-blue-600 border-blue-200" },
  buena_opcion: {
    text: "ok+",
    cls: "bg-teal-50 text-teal-600 border-teal-200",
  },
  viable: { text: "ok", cls: "bg-gray-50 text-gray-500 border-gray-200" },
  limitado: { text: "lim", cls: "bg-amber-50 text-amber-600 border-amber-200" },
  no_recomendado: { text: "✗", cls: "bg-red-50 text-red-500 border-red-200" },
};

// ─── Fila completa ────────────────────────────────────────────────────────────

export function GanttFila({ fila, tipoPrecio }: GanttFilaProps) {
  const ingresosTotal =
    tipoPrecio === "feria"
      ? fila.ingreso_total_feria
      : fila.ingreso_total_mayorista;

  const faseCfg = FASE_CFG[fila.etapa_actual];

  const viabilidadCfg = fila.viabilidad_proyecto
    ? VIABILIDAD_CFG[fila.viabilidad_proyecto]
    : null;

  const alertaSiembra =
    fila.siembra_fuera_temporada && fila.mes_plantacion !== null
      ? (() => {
          const en = MESES_CORTO[fila.mes_plantacion - 1] ?? "";
          const ideal = fila.meses_siembra_catalogo
            .map((m) => MESES_CORTO[m - 1])
            .join("·");
          return `Plantada ${en}${ideal ? ` · ideal: ${ideal}` : ""}`;
        })()
      : null;

  return (
    <div className="contents">
      {/* ── Col 1: identidad ── */}
      <div className="flex flex-col justify-center gap-1 py-2 pr-2 border-b border-gray-100 min-w-0">
        {/* Línea 1: nombre + stars + viabilidad */}
        <div className="flex items-center gap-1 min-w-0">
          <div
            className="shrink-0 w-2 h-2 rounded-full"
            style={{ backgroundColor: fila.color }}
          />
          <span className="text-xs font-semibold text-gray-800 truncate">
            {fila.cultivo_nombre}
          </span>
          {fila.recomendacion && (
            <span
              className="shrink-0 text-[8px] text-amber-400 leading-none"
              title={`${fila.recomendacion}/3`}
            >
              {"★".repeat(fila.recomendacion)}
            </span>
          )}
          {viabilidadCfg && (
            <span
              className={`shrink-0 text-[7px] font-bold border px-0.5 rounded ${viabilidadCfg.cls}`}
              title={`Viabilidad: ${(fila.viabilidad_proyecto ?? "").replace(/_/g, " ")}`}
            >
              {viabilidadCfg.text}
            </span>
          )}
        </div>

        {/* Línea 2: fase actual (la más importante para un agricultor) */}
        {!fila.sin_fecha && faseCfg && (
          <div className="flex items-center gap-1 pl-3">
            <span
              className={`shrink-0 w-1.5 h-1.5 rounded-full ${faseCfg.dot}`}
            />
            <span className="text-[9px] text-gray-600 font-medium">
              {faseCfg.label}
            </span>
            {fila.dias_restantes_etapa > 0 && (
              <span className="text-[8px] text-gray-300">
                {fila.dias_restantes_etapa}d
              </span>
            )}
          </div>
        )}

        {/* Línea 3: zona + ciclo de vida */}
        <div className="flex items-center gap-1 pl-3">
          <span className="text-[9px] text-gray-400 truncate">
            {fila.zona_nombre}
          </span>
          {!fila.sin_fecha && (
            <>
              <span className="text-[8px] text-gray-200">·</span>
              <span className="text-[8px] text-gray-300">
                {fila.año_plantacion}–{fila.año_muerte}
              </span>
            </>
          )}
          {fila.sin_fecha && (
            <span className="text-[8px] text-gray-300 italic">sin fecha</span>
          )}
        </div>

        {/* Línea 4 (condicional): num plantas + tipo ciclo */}
        <div className="flex items-center gap-1.5 pl-3">
          <span className="text-[8px] text-gray-400">
            {fila.num_plantas} pl.
          </span>
          <span className="text-[8px] text-gray-300">·</span>
          <span
            className="text-[8px] text-gray-400"
            title={PROPAGACION_LABEL[fila.propagacion]}
          >
            ◆×{fila.total_cosechas_vida}
          </span>
        </div>

        {/* Notas agronómicas (si existen) — truncadas a 1 línea */}
        {fila.notas_arica && (
          <p
            className="pl-3 text-[8px] text-gray-400 leading-tight truncate"
            title={fila.notas_arica}
          >
            {fila.notas_arica}
          </p>
        )}

        {/* Alerta de siembra en lenguaje humano */}
        {alertaSiembra && (
          <p className="pl-3 text-[8px] text-orange-400 font-medium leading-tight">
            {alertaSiembra}
          </p>
        )}
      </div>

      {/* ── Col 2: barra visual ── */}
      <div className="flex flex-col border-b border-gray-100">
        <div
          className="grid grid-cols-12 gap-px py-1.5"
          style={{ minHeight: 44 }}
        >
          <GanttBarra fila={fila} tipoPrecio={tipoPrecio} />
        </div>
        <FranjaContexto
          mesesCatalogo={fila.meses_cosecha_catalogo}
          mesesPersonales={fila.meses_cosecha_personales}
          consumoAgua={fila.consumo_agua_mensual}
        />
      </div>

      {/* ── Col 3: ingreso anual ── */}
      <div className="flex flex-col items-end justify-center py-2 pl-1 border-b border-gray-100">
        <span
          className={`text-xs font-bold leading-tight ${
            fila.sin_fecha
              ? "text-gray-300"
              : ingresosTotal > 0
                ? "text-green-700"
                : "text-gray-300"
          }`}
        >
          {fila.sin_fecha
            ? "$?"
            : ingresosTotal > 0
              ? formatCLP(ingresosTotal)
              : "—"}
        </span>
        {ingresosTotal > 0 && (
          <span className="text-[9px] text-gray-400">
            {tipoPrecio === "feria" ? "feria" : "ODEPA"}
          </span>
        )}
      </div>
    </div>
  );
}
