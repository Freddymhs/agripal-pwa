"use client";

import { useState, useCallback } from "react";
import type { FilaGantt } from "@/lib/utils/calendario-gantt";
import { MESES_CORTO } from "@/lib/utils/calendario-gantt";
import type { Alerta, Zona } from "@/types";

interface GanttEsteMesProps {
  filas: FilaGantt[];
  año: number;
  proyectoId: string;
  alertas?: Alerta[];
  zonas?: Zona[];
}

// ─── Tipos de tareas operativas ───────────────────────────────────────────────

type TipoTarea =
  | "cosecha"
  | "fertilizacion"
  | "poda_programada"
  | "replanta"
  | "riego_alto"
  | "riego_reducir"
  | "dormancia_inicio"
  | "dormancia_fin"
  | "establecimiento"
  | "plaga_vigilar"
  | "alerta_sistema"
  | "recarga_estanque";

interface TareaOperativa {
  key: string;
  tipo: TipoTarea;
  mes: number;
  cultivoNombre: string;
  zonaNombre: string;
  color: string;
  instruccion: string;
  detalle: string | null;
}

const TIPO_CFG: Record<
  TipoTarea,
  {
    icono: string;
    cls: string;
    clsBorde: string;
    prioridad: number;
  }
> = {
  alerta_sistema: {
    icono: "⚠",
    cls: "text-red-600",
    clsBorde: "border-red-200",
    prioridad: 0,
  },
  cosecha: {
    icono: "◆",
    cls: "text-amber-600",
    clsBorde: "border-amber-100",
    prioridad: 1,
  },
  riego_alto: {
    icono: "💧",
    cls: "text-blue-600",
    clsBorde: "border-blue-100",
    prioridad: 2,
  },
  fertilizacion: {
    icono: "N",
    cls: "text-emerald-600",
    clsBorde: "border-emerald-100",
    prioridad: 3,
  },
  poda_programada: {
    icono: "✂",
    cls: "text-orange-500",
    clsBorde: "border-orange-100",
    prioridad: 4,
  },
  plaga_vigilar: {
    icono: "🔍",
    cls: "text-rose-500",
    clsBorde: "border-rose-100",
    prioridad: 4,
  },
  establecimiento: {
    icono: "■",
    cls: "text-green-600",
    clsBorde: "border-green-100",
    prioridad: 5,
  },
  recarga_estanque: {
    icono: "⛽",
    cls: "text-cyan-600",
    clsBorde: "border-cyan-100",
    prioridad: 5,
  },
  dormancia_inicio: {
    icono: "◑",
    cls: "text-gray-500",
    clsBorde: "border-gray-200",
    prioridad: 6,
  },
  dormancia_fin: {
    icono: "◐",
    cls: "text-sky-500",
    clsBorde: "border-sky-100",
    prioridad: 6,
  },
  riego_reducir: {
    icono: "🚿",
    cls: "text-gray-400",
    clsBorde: "border-gray-100",
    prioridad: 7,
  },
  replanta: {
    icono: "↺",
    cls: "text-purple-500",
    clsBorde: "border-purple-100",
    prioridad: 8,
  },
};

// ─── Derivar tareas operativas de los datos de una fila ──────────────────────

function derivarTareasDeriva(fila: FilaGantt): TareaOperativa[] {
  const tareas: TareaOperativa[] = [];

  // 1. Eventos directos del catálogo (cosecha, fertilizacion, poda, replanta)
  for (const ev of fila.eventos) {
    if (ev.es_descarte) continue;
    if (
      ev.tipo === "plantacion" ||
      ev.tipo === "poda" ||
      ev.tipo === "lavado" ||
      ev.tipo === "recarga"
    )
      continue;

    const tipoMap: Partial<Record<string, TipoTarea>> = {
      cosecha: "cosecha",
      fertilizacion: "fertilizacion",
      poda_programada: "poda_programada",
      replanta: "replanta",
    };
    const tipo = tipoMap[ev.tipo];
    if (!tipo) continue;

    const instrucciones: Record<TipoTarea, string> = {
      cosecha: `Cosechar ${fila.cultivo_nombre}`,
      fertilizacion: `Fertilizar ${fila.cultivo_nombre}`,
      poda_programada: `Podar ${fila.cultivo_nombre}`,
      replanta: `Preparar replante de ${fila.cultivo_nombre}`,
      riego_alto: "",
      riego_reducir: "",
      dormancia_inicio: "",
      dormancia_fin: "",
      establecimiento: "",
      plaga_vigilar: "",
      alerta_sistema: "",
      recarga_estanque: "",
    };

    const detalles: Partial<Record<TipoTarea, string | null>> = {
      cosecha:
        ev.kg_estimado !== null ? `~${ev.kg_estimado} kg estimados` : null,
      fertilizacion: ev.descripcion_agronomica ?? null,
      poda_programada: ev.descripcion_agronomica ?? null,
      replanta: "Al final del ciclo de vida de la planta",
    };

    tareas.push({
      key: `${fila.zona_id}-${fila.cultivo_id}-${tipo}-${ev.mes}`,
      tipo,
      mes: ev.mes,
      cultivoNombre: fila.cultivo_nombre,
      zonaNombre: fila.zona_nombre,
      color: fila.color,
      instruccion: instrucciones[tipo],
      detalle: detalles[tipo] ?? null,
    });
  }

  // 2. Riego por demanda de agua (Kc × ET0) — solo meses donde la planta existe
  for (let i = 0; i < 12; i++) {
    const mes = i + 1;
    if (mes < fila.mes_inicio) continue; // planta aún no plantada este año
    const demanda = fila.consumo_agua_mensual[i] ?? 0;

    if (demanda >= 0.65) {
      tareas.push({
        key: `${fila.zona_id}-${fila.cultivo_id}-riego_alto-${mes}`,
        tipo: "riego_alto",
        mes,
        cultivoNombre: fila.cultivo_nombre,
        zonaNombre: fila.zona_nombre,
        color: fila.color,
        instruccion: `Riego intensivo — ${fila.cultivo_nombre}`,
        detalle: `Demanda alta (${Math.round(demanda * 100)}% del máximo). Aumentar frecuencia o tiempo de riego.`,
      });
    } else if (demanda > 0 && demanda < 0.2) {
      // Skip: if this month is within a dormancy segment, dormancia_inicio already covers it
      const enDormancia = fila.segmentos.some(
        (s) => s.fase === "dormicion" && mes >= s.mesInicio && mes <= s.mesFin,
      );
      if (!enDormancia) {
        tareas.push({
          key: `${fila.zona_id}-${fila.cultivo_id}-riego_reducir-${mes}`,
          tipo: "riego_reducir",
          mes,
          cultivoNombre: fila.cultivo_nombre,
          zonaNombre: fila.zona_nombre,
          color: fila.color,
          instruccion: `Reducir riego — ${fila.cultivo_nombre}`,
          detalle: `Demanda baja (${Math.round(demanda * 100)}%). Reducir frecuencia o duración del riego.`,
        });
      }
    }
  }

  // 3. Transiciones de fase (dormancia y establecimiento) desde los segmentos
  for (let i = 0; i < fila.segmentos.length; i++) {
    const seg = fila.segmentos[i];
    const segAnterior = fila.segmentos[i - 1];

    // Inicio de dormancia
    if (seg.fase === "dormicion" && segAnterior?.fase !== "dormicion") {
      tareas.push({
        key: `${fila.zona_id}-${fila.cultivo_id}-dormancia_inicio-${seg.mesInicio}`,
        tipo: "dormancia_inicio",
        mes: seg.mesInicio,
        cultivoNombre: fila.cultivo_nombre,
        zonaNombre: fila.zona_nombre,
        color: fila.color,
        instruccion: `${fila.cultivo_nombre} entra en dormancia`,
        detalle:
          "Suspender o minimizar el riego. La planta descansa — no requiere nutrición activa.",
      });
    }

    // Fin de dormancia
    if (segAnterior?.fase === "dormicion" && seg.fase !== "dormicion") {
      tareas.push({
        key: `${fila.zona_id}-${fila.cultivo_id}-dormancia_fin-${seg.mesInicio}`,
        tipo: "dormancia_fin",
        mes: seg.mesInicio,
        cultivoNombre: fila.cultivo_nombre,
        zonaNombre: fila.zona_nombre,
        color: fila.color,
        instruccion: `${fila.cultivo_nombre} sale de dormancia`,
        detalle:
          "Retomar riego gradualmente. Preparar fertilización de arranque si corresponde.",
      });
    }

    // Inicio de establecimiento (primer mes de vida)
    if (
      seg.fase === "establecimiento" &&
      i === 0 &&
      !fila.continua_año_anterior
    ) {
      tareas.push({
        key: `${fila.zona_id}-${fila.cultivo_id}-establecimiento-${seg.mesInicio}`,
        tipo: "establecimiento",
        mes: seg.mesInicio,
        cultivoNombre: fila.cultivo_nombre,
        zonaNombre: fila.zona_nombre,
        color: fila.color,
        instruccion: `Cuidados de arraigo — ${fila.cultivo_nombre}`,
        detalle:
          "Planta recién establecida. Riegos frecuentes y cortos para favorecer el arraigo. No fertilizar aún.",
      });
    }
  }

  // 4. Plagas — vigilar en meses donde la etapa actual es vulnerable
  for (const plaga of fila.plagas) {
    if (!plaga.etapas_vulnerables?.length) continue;
    if (!plaga.etapas_vulnerables.includes(fila.etapa_actual)) continue;
    const mesPlaga = fila.mes_inicio;
    const key = `${fila.zona_id}-${fila.cultivo_id}-plaga_vigilar-${plaga.nombre}`;
    // Evitar duplicados
    if (tareas.some((t) => t.key === key)) continue;
    tareas.push({
      key,
      tipo: "plaga_vigilar",
      mes: Math.min(12, Math.max(1, mesPlaga)),
      cultivoNombre: fila.cultivo_nombre,
      zonaNombre: fila.zona_nombre,
      color: fila.color,
      instruccion: `Vigilar ${plaga.nombre} en ${fila.cultivo_nombre}`,
      detalle:
        plaga.control_recomendado ?? plaga.medidas_preventivas?.[0] ?? null,
    });
  }

  return tareas;
}

// ─── Helpers localStorage ─────────────────────────────────────────────────────

function lsKey(proyectoId: string, año: number) {
  return `agriplan_agenda_${proyectoId}_${año}`;
}

// ─── Componente franja de un mes ──────────────────────────────────────────────

function MesTareas({
  mes,
  tareas,
  hechas,
  onMarcar,
  onDeshacer,
  esActual,
  defaultOpen,
}: {
  mes: number;
  tareas: TareaOperativa[];
  hechas: Set<string>;
  onMarcar: (key: string) => void;
  onDeshacer: (key: string) => void;
  esActual: boolean;
  defaultOpen: boolean;
}) {
  const [abierto, setAbierto] = useState(defaultOpen);
  const pendientes = tareas.filter((t) => !hechas.has(t.key));
  const completadas = tareas.filter((t) => hechas.has(t.key));

  return (
    <div
      className={`rounded-lg overflow-hidden ${esActual ? "ring-1 ring-amber-300" : ""}`}
    >
      <button
        onClick={() => setAbierto((v) => !v)}
        className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
          esActual
            ? "bg-amber-50 hover:bg-amber-100/60"
            : "bg-gray-50/60 hover:bg-gray-100/60"
        }`}
      >
        <span
          className={`text-[10px] font-bold uppercase tracking-wide ${esActual ? "text-amber-700" : "text-gray-500"}`}
        >
          {MESES_CORTO[mes - 1]}
          {esActual && (
            <span className="ml-1 text-[8px] normal-case font-normal opacity-70">
              ← ahora
            </span>
          )}
        </span>
        {pendientes.length > 0 && (
          <span
            className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
              esActual ? "bg-amber-400 text-white" : "bg-gray-200 text-gray-600"
            }`}
          >
            {pendientes.length}
          </span>
        )}
        {pendientes.length === 0 && completadas.length > 0 && (
          <span className="text-[9px] text-green-500 font-medium">
            ✓ todo hecho
          </span>
        )}
        <span className="ml-auto text-gray-300 text-[9px]">
          {abierto ? "▲" : "▼"}
        </span>
      </button>

      {abierto && (
        <div className="px-2 pb-2 pt-1 space-y-1 bg-white border-t border-gray-100">
          {pendientes.map((tarea) => {
            const cfg = TIPO_CFG[tarea.tipo];
            return (
              <div
                key={tarea.key}
                className={`flex items-start gap-2.5 rounded-lg px-3 py-2.5 border ${cfg.clsBorde} bg-white`}
              >
                <div
                  className="shrink-0 w-1.5 h-1.5 rounded-full mt-1.5"
                  style={{ backgroundColor: tarea.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold ${cfg.cls}`}>
                      {cfg.icono}
                    </span>
                    <span className="text-[11px] font-semibold text-gray-800 leading-tight">
                      {tarea.instruccion}
                    </span>
                  </div>
                  {tarea.detalle && (
                    <p className="text-[9px] text-gray-400 mt-0.5 leading-snug">
                      {tarea.detalle}
                    </p>
                  )}
                  <p className="text-[8px] text-gray-300 mt-0.5">
                    {tarea.zonaNombre}
                  </p>
                </div>
                <button
                  onClick={() => onMarcar(tarea.key)}
                  className="shrink-0 mt-0.5 text-[9px] font-semibold px-2 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors whitespace-nowrap"
                >
                  ✓ Hecho
                </button>
              </div>
            );
          })}

          {completadas.map((tarea) => (
            <div
              key={tarea.key}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-100 bg-gray-50/60 opacity-60"
            >
              <span className="text-[9px] text-green-500 shrink-0">✓</span>
              <span className="text-[9px] text-gray-400 line-through flex-1 truncate">
                {tarea.instruccion}
              </span>
              <button
                onClick={() => onDeshacer(tarea.key)}
                className="shrink-0 text-[8px] text-gray-300 hover:text-gray-500 transition-colors"
              >
                deshacer
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

const AÑO_ACTUAL = new Date().getFullYear();
const MES_ACTUAL = new Date().getMonth() + 1;

// Tipos de alerta que son tareas operativas reales
const ALERTAS_OPERATIVAS = new Set([
  "cosecha_pendiente",
  "replanta_pendiente",
  "lavado_salino",
  "fertilizacion_etapa",
  "deficit_agua",
  "agua_critica",
  "sin_sesiones_recientes",
  "riesgo_encharcamiento",
]);

function cargarDesdeLS(proyectoId: string, año: number): Set<string> {
  if (!proyectoId) return new Set();
  try {
    const raw = localStorage.getItem(lsKey(proyectoId, año));
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

export function GanttEsteMes({
  filas,
  año,
  proyectoId,
  alertas,
  zonas,
}: GanttEsteMesProps) {
  const [abierto, setAbierto] = useState(true);
  const [prevKey, setPrevKey] = useState(`${proyectoId}__${año}`);
  const [hechas, setHechas] = useState<Set<string>>(() =>
    cargarDesdeLS(proyectoId, año),
  );

  // Adjusting state during render: si cambia proyecto o año, recargar desde localStorage
  const currentKey = `${proyectoId}__${año}`;
  if (prevKey !== currentKey) {
    setPrevKey(currentKey);
    setHechas(cargarDesdeLS(proyectoId, año));
  }

  const persistir = useCallback(
    (s: Set<string>) => {
      if (!proyectoId) return;
      try {
        localStorage.setItem(lsKey(proyectoId, año), JSON.stringify([...s]));
      } catch {
        /* noop */
      }
    },
    [proyectoId, año],
  );

  const marcar = useCallback(
    (key: string) => {
      setHechas((prev) => {
        const n = new Set(prev).add(key);
        persistir(n);
        return n;
      });
    },
    [persistir],
  );

  const deshacer = useCallback(
    (key: string) => {
      setHechas((prev) => {
        const n = new Set(prev);
        n.delete(key);
        persistir(n);
        return n;
      });
    },
    [persistir],
  );

  // Agrupar todas las tareas del año por mes
  const tareasPorMes = new Map<number, TareaOperativa[]>();

  // Tareas derivadas de las filas (cultivos)
  for (const fila of filas) {
    if (fila.sin_fecha) continue;
    const tareas = derivarTareasDeriva(fila);
    for (const t of tareas) {
      const lista = tareasPorMes.get(t.mes) ?? [];
      lista.push(t);
      tareasPorMes.set(t.mes, lista);
    }
  }

  // Alertas activas del sistema → mes actual
  const alertasActivas = (alertas ?? []).filter(
    (a) => a.estado === "activa" && ALERTAS_OPERATIVAS.has(a.tipo),
  );
  for (const alerta of alertasActivas) {
    const mes = MES_ACTUAL;
    const key = `alerta-${alerta.id}`;
    const lista = tareasPorMes.get(mes) ?? [];
    lista.push({
      key,
      tipo: "alerta_sistema",
      mes,
      cultivoNombre: "",
      zonaNombre: "",
      color: "#ef4444",
      instruccion: alerta.titulo,
      detalle: alerta.sugerencia ?? alerta.descripcion,
    });
    tareasPorMes.set(mes, lista);
  }

  // Recargas de estanques programadas → mes de la próxima recarga
  for (const zona of zonas ?? []) {
    const recarga = zona.estanque_config?.recarga;
    if (!recarga?.proxima_recarga) continue;
    const fecha = new Date(recarga.proxima_recarga);
    if (fecha.getFullYear() !== año) continue;
    const mes = fecha.getMonth() + 1;
    const key = `recarga-${zona.id}-${mes}`;
    const lista = tareasPorMes.get(mes) ?? [];
    lista.push({
      key,
      tipo: "recarga_estanque",
      mes,
      cultivoNombre: "",
      zonaNombre: zona.nombre,
      color: "#06b6d4",
      instruccion: `Recargar estanque — ${zona.nombre}`,
      detalle: recarga.cantidad_litros
        ? `${(recarga.cantidad_litros / 1000).toFixed(1)} m³ programados`
        : null,
    });
    tareasPorMes.set(mes, lista);
  }

  // Ordenar tareas dentro de cada mes por prioridad
  for (const [mes, lista] of tareasPorMes) {
    tareasPorMes.set(
      mes,
      lista.sort(
        (a, b) => TIPO_CFG[a.tipo].prioridad - TIPO_CFG[b.tipo].prioridad,
      ),
    );
  }

  const mesesConTareas = Array.from(tareasPorMes.keys()).sort((a, b) => a - b);
  if (mesesConTareas.length === 0) return null;

  const totalPendientes = mesesConTareas.reduce(
    (sum, mes) =>
      sum +
      (tareasPorMes.get(mes) ?? []).filter((t) => !hechas.has(t.key)).length,
    0,
  );
  const totalTareas = mesesConTareas.reduce(
    (sum, mes) => sum + (tareasPorMes.get(mes) ?? []).length,
    0,
  );

  return (
    <div className="border border-amber-100 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setAbierto((v) => !v)}
        className="w-full flex items-center gap-2.5 px-4 py-3 text-left bg-amber-50/60 hover:bg-amber-50/90 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-amber-900">
            Guía operativa del campo — {año}
          </p>
          <p className="text-[9px] text-amber-600 mt-0.5">
            {totalTareas} tareas derivadas del plan · {totalPendientes}{" "}
            pendientes
          </p>
        </div>
        {totalPendientes > 0 && (
          <span className="shrink-0 text-[10px] bg-amber-400 text-white px-2 py-0.5 rounded-full font-bold">
            {totalPendientes}
          </span>
        )}
        {totalPendientes === 0 && (
          <span className="shrink-0 text-[9px] text-green-500 font-semibold">
            ✓ Al día
          </span>
        )}
        <span className="shrink-0 text-amber-300 text-[10px]">
          {abierto ? "▲" : "▼"}
        </span>
      </button>

      {abierto && (
        <div className="p-3 space-y-1.5 bg-white">
          {mesesConTareas.map((mes) => (
            <MesTareas
              key={mes}
              mes={mes}
              tareas={tareasPorMes.get(mes) ?? []}
              hechas={hechas}
              onMarcar={marcar}
              onDeshacer={deshacer}
              esActual={año === AÑO_ACTUAL && mes === MES_ACTUAL}
              defaultOpen={año === AÑO_ACTUAL && mes === MES_ACTUAL}
            />
          ))}
        </div>
      )}
    </div>
  );
}
