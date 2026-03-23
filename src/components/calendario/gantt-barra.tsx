"use client";

import { useState } from "react";
import type { FilaGantt, EventoGantt } from "@/lib/utils/calendario-gantt";
import {
  estiloFase,
  KR_POR_AÑO,
  PROPAGACION_DESCRIPCION,
} from "@/lib/utils/calendario-gantt";
import { formatCLP } from "@/lib/utils";

interface GanttBarraProps {
  fila: FilaGantt;
  tipoPrecio: "feria" | "mayorista";
}

export function GanttBarra({ fila, tipoPrecio }: GanttBarraProps) {
  if (fila.sin_fecha) {
    return (
      <div
        className="flex items-center justify-center rounded"
        style={{
          gridColumn: "1 / span 12",
          gridRow: 1,
          minHeight: 36,
          background: "#f9fafb",
          border: "1.5px dashed #d1d5db",
        }}
      >
        <span className="text-[10px] text-gray-400">
          sin fecha — configura en el mapa
        </span>
      </div>
    );
  }

  const {
    color,
    continua_año_anterior,
    continua_año_siguiente,
    segmentos,
    eventos,
  } = fila;

  // Segmentos de fase (fondo de la barra)
  const barraSegmentos =
    segmentos.length > 0
      ? segmentos
      : [
          {
            mesInicio: fila.mes_inicio,
            mesFin: fila.mes_fin,
            fase: "normal" as const,
          },
        ];

  // Eventos agrupados por mes
  const eventosPorMes = new Map<number, EventoGantt[]>();
  for (const ev of eventos) {
    const lista = eventosPorMes.get(ev.mes) ?? [];
    lista.push(ev);
    eventosPorMes.set(ev.mes, lista);
  }

  return (
    <>
      {/* Segmentos de fase — fondo visual de la barra */}
      {barraSegmentos.map((seg, idx) => {
        const estilo = estiloFase(seg.fase, color);
        const esInicio = idx === 0;
        const esFin = idx === barraSegmentos.length - 1;
        // Color de borde: usa override (dormición=gris, formación=naranja) o el color de zona
        const borderColor = estilo.borderColorOverride ?? color;
        const borderStyle = estilo.borderDashed ? "dashed" : "solid";

        return (
          <div
            key={`seg-${idx}`}
            title={
              seg.etapa_nombre
                ? `${seg.etapa_nombre}${seg.etapa_descripcion ? ` — ${seg.etapa_descripcion}` : ""}`
                : labelFase(seg.fase)
            }
            style={{
              gridColumn: `${seg.mesInicio} / span ${seg.mesFin - seg.mesInicio + 1}`,
              gridRow: 1,
              zIndex: 1,
              backgroundColor: estilo.backgroundColor,
              borderTop: `2px ${borderStyle} ${borderColor}`,
              borderBottom: `2px ${borderStyle} ${borderColor}`,
              borderLeft: esInicio
                ? `${continua_año_anterior ? "1px dashed" : "3px solid"} ${borderColor}`
                : "none",
              borderRight: esFin
                ? `${continua_año_siguiente ? "1px dashed" : "3px solid"} ${borderColor}`
                : "none",
              borderTopLeftRadius: esInicio && !continua_año_anterior ? 6 : 0,
              borderBottomLeftRadius:
                esInicio && !continua_año_anterior ? 6 : 0,
              borderTopRightRadius: esFin && !continua_año_siguiente ? 6 : 0,
              borderBottomRightRadius: esFin && !continua_año_siguiente ? 6 : 0,
              minHeight: 36,
            }}
          />
        );
      })}

      {/* Labels de etapa fenológica — uno por segmento */}
      {barraSegmentos.map((seg, idx) => {
        const span = seg.mesFin - seg.mesInicio + 1;
        if (span < 2) return null; // sin espacio para texto
        const label =
          seg.etapa_nombre ?? (idx === 0 ? fila.etapa_actual : null);
        if (!label) return null;
        const esPrimero = idx === 0;
        return (
          <div
            key={`lbl-${idx}`}
            style={{
              gridColumn: `${seg.mesInicio} / span ${span}`,
              gridRow: 1,
              zIndex: 3,
              display: "flex",
              alignItems: "center",
              paddingLeft: 4,
              pointerEvents: "none",
              overflow: "hidden",
            }}
          >
            <span
              className="text-[8px] font-semibold truncate"
              style={{ color, opacity: 0.85 }}
            >
              {label}
              {esPrimero && fila.continua_año_anterior && " ←"}
              {idx === barraSegmentos.length - 1 &&
                fila.continua_año_siguiente &&
                " →"}
            </span>
          </div>
        );
      })}

      {/* Chips de eventos — encima de la barra */}
      {Array.from(eventosPorMes.entries()).map(([mes, evList]) => (
        <EventoChip
          key={`chip-${mes}`}
          mes={mes}
          eventos={evList}
          tipoPrecio={tipoPrecio}
          fila={fila}
        />
      ))}
    </>
  );
}

// ─── Chip de evento ───────────────────────────────────────────────────────────

function EventoChip({
  mes,
  eventos,
  tipoPrecio,
  fila,
}: {
  mes: number;
  eventos: EventoGantt[];
  tipoPrecio: "feria" | "mayorista";
  fila: FilaGantt;
}) {
  const [open, setOpen] = useState(false);
  const ev = eventos[0];

  const ingreso =
    tipoPrecio === "feria" ? ev.ingreso_feria_clp : ev.ingreso_mayorista_clp;

  const isDescarte = ev.es_descarte;
  const isReplanta = ev.tipo === "replanta";
  const isCosecha = ev.tipo === "cosecha" && !isDescarte;

  const chipConfig = getChipConfig(ev);

  const kr = KR_POR_AÑO[Math.min(ev.año_cultivo, KR_POR_AÑO.length - 1)];

  return (
    <div
      className="relative flex flex-col items-center justify-center cursor-pointer select-none"
      style={{
        gridColumn: mes,
        gridRow: 1,
        zIndex: 4,
        background: chipConfig.bg,
        border: `1.5px solid ${chipConfig.border}`,
        borderRadius: 4,
        minHeight: 36,
        padding: "2px 0px",
      }}
      onClick={() => setOpen((o) => !o)}
    >
      <span
        className="text-[10px] font-bold leading-none"
        style={{ color: chipConfig.border }}
      >
        {chipConfig.icon}
      </span>
      {ingreso !== null && isCosecha && (
        <span className="text-[7px] text-gray-500 leading-tight truncate w-full text-center px-0.5">
          {formatCLP(ingreso)}
        </span>
      )}
      {isCosecha && fila.tendencia_precio && (
        <TendenciaMini tendencia={fila.tendencia_precio} />
      )}

      {/* Tooltip */}
      {open && (
        <Tooltip
          ev={ev}
          tipoPrecio={tipoPrecio}
          fila={fila}
          kr={kr}
          isReplanta={isReplanta}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

function getChipConfig(ev: EventoGantt) {
  if (ev.tipo === "plantacion") {
    return { bg: "#dcfce7", border: "#16a34a", icon: "■" };
  }
  if (ev.tipo === "replanta") {
    return { bg: "#ede9fe", border: "#7c3aed", icon: "↺" };
  }
  if (ev.tipo === "poda_programada") {
    return { bg: "#fef3c7", border: "#d97706", icon: "✂" };
  }
  if (ev.tipo === "fertilizacion") {
    return { bg: "#ecfdf5", border: "#059669", icon: "N" };
  }
  if (ev.es_descarte) {
    return { bg: "#fff7ed", border: "#ea580c", icon: "✂" };
  }
  if (ev.tipo === "cosecha") {
    return ev.es_real
      ? { bg: "#dbeafe", border: "#2563eb", icon: "◆●" }
      : { bg: "#fef9c3", border: "#ca8a04", icon: "◆" };
  }
  return { bg: "#f3f4f6", border: "#9ca3af", icon: "•" };
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function Tooltip({
  ev,
  tipoPrecio,
  fila,
  kr,
  isReplanta,
  onClose,
}: {
  ev: EventoGantt;
  tipoPrecio: "feria" | "mayorista";
  fila: FilaGantt;
  kr: number;
  isReplanta: boolean;
  onClose: () => void;
}) {
  const roi = tipoPrecio === "feria" ? fila.roi_feria : fila.roi_mayorista;

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />
      <div
        className="absolute bottom-full left-1/2 z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-left"
        style={{
          minWidth: 210,
          maxWidth: 250,
          transform: "translateX(-50%)",
          marginBottom: 6,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-1 mb-2">
          <div>
            <p className="text-xs font-bold text-gray-800">{ev.label}</p>
            <p className="text-[10px] text-gray-400">
              {fila.cultivo_nombre} · {fila.zona_nombre}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-gray-600 text-xs"
          >
            ✕
          </button>
        </div>

        <hr className="border-gray-100 mb-2" />

        {ev.tipo === "poda_programada" ? (
          <div className="space-y-1">
            <Row label="Tipo poda" value={ev.label.replace("✂ ", "")} />
            {ev.descripcion_agronomica && (
              <p className="text-[10px] text-gray-600 leading-snug">
                {ev.descripcion_agronomica}
              </p>
            )}
          </div>
        ) : ev.tipo === "fertilizacion" ? (
          <div className="space-y-1">
            <Row label="Aplicación" value={`${fila.cultivo_nombre}`} />
            {ev.descripcion_agronomica && (
              <p className="text-[10px] text-gray-600 leading-snug">
                {ev.descripcion_agronomica}
              </p>
            )}
          </div>
        ) : isReplanta ? (
          /* Contenido replanta */
          <div className="space-y-1">
            <Row
              label="Tipo"
              value={PROPAGACION_DESCRIPCION[fila.propagacion]}
            />
            <Row
              label="Cosechas totales vida"
              value={`${fila.total_cosechas_vida}`}
            />
          </div>
        ) : (
          /* Contenido cosecha */
          <div className="space-y-1">
            <Row
              label="Etapa hoy"
              value={`${fila.etapa_actual}${fila.dias_restantes_etapa > 0 ? ` (${fila.dias_restantes_etapa}d)` : ""}`}
            />
            <Row
              label={`Año cultivo`}
              value={
                <span>
                  {ev.año_cultivo + 1}° ·{" "}
                  <span className="text-amber-600 font-medium">Kr ×{kr}</span>
                </span>
              }
            />
            <hr className="border-gray-100 my-1" />
            {ev.kg_estimado !== null && (
              <Row label="Kg estimado" value={`${ev.kg_estimado} kg`} />
            )}
            {roi.precio_kg_estimado > 0 && (
              <Row
                label="Precio/kg"
                value={formatCLP(roi.precio_kg_estimado)}
              />
            )}
            <hr className="border-gray-100 my-1" />
            {ev.ingreso_feria_clp !== null && (
              <Row
                label="Feria"
                value={
                  <span className="font-semibold text-green-700">
                    ~{formatCLP(ev.ingreso_feria_clp)}
                  </span>
                }
              />
            )}
            {ev.ingreso_mayorista_clp !== null && (
              <Row
                label="Mayorista"
                value={
                  <span className="font-semibold text-blue-700">
                    ~{formatCLP(ev.ingreso_mayorista_clp)}
                  </span>
                }
              />
            )}

            {/* Cosecha real */}
            {ev.es_real && ev.cosecha_real && (
              <>
                <hr className="border-blue-100 my-1" />
                <Row
                  label="Real registrada"
                  value={
                    <span className="text-blue-700 font-semibold">
                      {ev.cosecha_real.kg} kg
                    </span>
                  }
                />
                {ev.cosecha_real.precio_venta_clp !== null && (
                  <Row
                    label="Venta real"
                    value={
                      <span className="text-blue-700 font-semibold">
                        {formatCLP(ev.cosecha_real.precio_venta_clp)}
                      </span>
                    }
                  />
                )}
              </>
            )}

            {/* Tendencia de precio */}
            {fila.tendencia_precio && (
              <>
                <hr className="border-gray-100 my-1" />
                <Row
                  label="Tendencia precio"
                  value={<TendenciaDetalle tendencia={fila.tendencia_precio} />}
                />
              </>
            )}

            {/* Resumen vida de la planta */}
            <hr className="border-gray-100 my-1" />
            <Row
              label="Cosechas en vida"
              value={
                <span className="font-medium text-gray-700">
                  {fila.total_cosechas_vida}{" "}
                  {fila.total_cosechas_vida === 1 ? "cosecha" : "cosechas"}
                </span>
              }
            />
          </div>
        )}
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-2 text-[10px]">
      <span className="text-gray-400 shrink-0">{label}</span>
      <span className="text-gray-700 text-right">{value}</span>
    </div>
  );
}

// ─── Tendencia de precio ──────────────────────────────────────────────────────

import type { Tendencia } from "@/lib/data/tipos-mercado";

/** Badge compacto que va dentro del chip de cosecha */
function TendenciaMini({ tendencia }: { tendencia: Tendencia }) {
  if (tendencia === "alza")
    return (
      <span className="text-[7px] font-bold text-green-600 leading-none">
        ↑
      </span>
    );
  if (tendencia === "baja")
    return (
      <span className="text-[7px] font-bold text-red-500 leading-none">↓</span>
    );
  return null; // estable no necesita icono
}

/** Detalle expandido para el tooltip */
function TendenciaDetalle({ tendencia }: { tendencia: Tendencia }) {
  if (tendencia === "alza")
    return (
      <span className="font-semibold text-green-700">
        ↑ en alza — buen momento para vender
      </span>
    );
  if (tendencia === "baja")
    return (
      <span className="font-semibold text-red-600">
        ↓ a la baja — considera almacenar si puedes
      </span>
    );
  return <span className="text-gray-500">→ precio estable</span>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function labelFase(fase: string): string {
  const labels: Record<string, string> = {
    establecimiento: "Establecimiento — la planta crece, aún no produce",
    formacion: "Formación — primera cosecha de descarte/poda",
    produccion: "Producción activa",
    dormicion: "Dormición — la planta descansa",
    normal: "Crecimiento activo",
  };
  return labels[fase] ?? fase;
}
