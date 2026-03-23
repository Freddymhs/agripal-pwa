/**
 * Lógica del Calendario Gantt Agrícola (FASE 18B)
 *
 * Construye FilaGantt[] para una vista 12 meses de un año dado.
 * Reutiliza calcularROI, calcularEtapaActual, getDiasRestantesEtapa,
 * DURACION_ETAPAS y tipos de precios duales (igual que /economia).
 *
 * Sin migraciones: todo se deriva de campos existentes (vida_util_años, meses_descanso).
 */

import type {
  Zona,
  Planta,
  CatalogoCultivo,
  Cosecha,
  EtapaCrecimiento,
  SueloTerreno,
  PlantPlague,
} from "@/types";
import type { PrecioMayorista, Tendencia } from "@/lib/data/tipos-mercado";
import type { ProyeccionROI } from "@/lib/utils/roi";
import type { ClimaBase } from "@/lib/dal/base-data";
import { calcularROI, extenderROI10Años } from "@/lib/utils/roi";
import {
  calcularEtapaActual,
  getDiasRestantesEtapa,
} from "@/lib/data/calculos-etapas";
import { calcularConsumoZona } from "@/lib/utils/agua";
import { KR_POR_AÑO } from "@/lib/constants/conversiones";
import { TIPO_ZONA, ESTADO_PLANTA } from "@/lib/constants/entities";

// ─── Tipos de propagación (derivados de vida_util_años, sin campo nuevo en BD) ─

/**
 * Tipo de propagación derivado de vida_util_años.
 * - anual_semilla:        vida <= 1. Se resiembra desde semilla o bulbo cada año.
 * - perenne_nueva_planta: vida 2-8. Requiere comprar planta nueva al final del ciclo.
 * - perenne_pie:          vida >= 9. El pie rebrota o se recupera con poda renovación.
 */
export type PropagacionTipo =
  | "anual_semilla"
  | "perenne_nueva_planta"
  | "perenne_pie";

export const PROPAGACION_LABEL: Record<PropagacionTipo, string> = {
  anual_semilla: "↺ Resiembra anual",
  perenne_nueva_planta: "↺ Nueva planta al final",
  perenne_pie: "✂ Poda renovación",
};

export const PROPAGACION_DESCRIPCION: Record<PropagacionTipo, string> = {
  anual_semilla: "Compra semilla o bulbo cada año. Bajo costo.",
  perenne_nueva_planta: "Al terminar el ciclo, compra planta nueva.",
  perenne_pie: "El pie sobrevive. Solo poda de renovación necesaria.",
};

/**
 * Deriva PropagacionTipo desde vida_util_años (campo existente en BD).
 * No requiere ningún campo nuevo ni migración.
 */
export function derivarPropagacion(cultivo: CatalogoCultivo): PropagacionTipo {
  const vida = cultivo.vida_util_años ?? 1;
  if (vida <= 1) return "anual_semilla";
  if (vida <= 8) return "perenne_nueva_planta";
  return "perenne_pie";
}

/**
 * Calcula cuántas cosechas productivas (no descarte) tendrá la planta en toda su vida.
 */
export function calcularTotalCosechasVida(cultivo: CatalogoCultivo): number {
  const vidaAños = cultivo.vida_util_años ?? 1;
  const mesesCosecha = cultivo.calendario?.meses_cosecha ?? [];
  const cosechasPorAño = mesesCosecha.length > 0 ? mesesCosecha.length : 1;
  const tiempoProdMeses = cultivo.tiempo_produccion_meses ?? 12;
  const mesesProductivos = Math.max(0, vidaAños * 12 - tiempoProdMeses);
  const añosProductivos = mesesProductivos / 12;
  // Primer año de producción puede ser descarte si kg_año1 ≈ 0 en el seed
  const cosechasTotales = Math.floor(añosProductivos * cosechasPorAño);
  return Math.max(1, cosechasTotales);
}

// ─── Segmentos de fase visual de la barra ────────────────────────────────────

export type FaseBarra =
  | "establecimiento" // Plántula/joven — color × 0.15 opacidad
  | "formacion" // Primera cosecha descarte — naranja claro
  | "produccion" // Cosechas con ingreso — color × 1.0
  | "dormicion" // meses_descanso — gris
  | "normal"; // Resto — color × 0.35

export interface SegmentoBarra {
  mesInicio: number; // 1-12
  mesFin: number; // 1-12
  fase: FaseBarra;
  /** Nombre real de la etapa fenológica (del seed), si existe */
  etapa_nombre?: string;
  /** Descripción de la etapa fenológica para el tooltip */
  etapa_descripcion?: string;
}

/**
 * Calcula los segmentos de fase para la barra en el año dado.
 * Cada segmento es un rango de meses con su fase visual.
 */
export function calcularSegmentosEnAño(
  año: number,
  fechaPlantacion: Date,
  cultivo: CatalogoCultivo,
  eventos: EventoGantt[],
): SegmentoBarra[] {
  const mesInicioBarra =
    fechaPlantacion.getFullYear() < año ? 1 : fechaPlantacion.getMonth() + 1;
  const mesFinBarra = 12;

  const mesesDescanso = new Set(cultivo.calendario?.meses_descanso ?? []);

  // Meses con cosecha descarte
  const mesesDescarte = new Set(
    eventos.filter((e) => e.tipo === "poda" && e.es_descarte).map((e) => e.mes),
  );

  // Meses con cosecha productiva
  const mesesProduccion = new Set(
    eventos
      .filter((e) => e.tipo === "cosecha" && !e.es_descarte)
      .map((e) => e.mes),
  );

  // Determinar si este año es "año de establecimiento"
  const añoPlantacion = fechaPlantacion.getFullYear();
  const añosDesde = año - añoPlantacion;
  const tiempoProdAños = (cultivo.tiempo_produccion_meses ?? 12) / 12;
  const enEstablecimiento = añosDesde < tiempoProdAños;

  const segmentos: SegmentoBarra[] = [];
  let mesActual = mesInicioBarra;

  while (mesActual <= mesFinBarra) {
    const fase = determinarFase(
      mesActual,
      mesesDescanso,
      mesesDescarte,
      mesesProduccion,
      enEstablecimiento,
    );

    // Buscar hasta dónde se extiende el mismo segmento
    let mesFin = mesActual;
    while (
      mesFin < mesFinBarra &&
      determinarFase(
        mesFin + 1,
        mesesDescanso,
        mesesDescarte,
        mesesProduccion,
        enEstablecimiento,
      ) === fase
    ) {
      mesFin++;
    }

    segmentos.push({ mesInicio: mesActual, mesFin, fase });
    mesActual = mesFin + 1;
  }

  return segmentos;
}

function determinarFase(
  mes: number,
  mesesDescanso: Set<number>,
  mesesDescarte: Set<number>,
  mesesProduccion: Set<number>,
  enEstablecimiento: boolean,
): FaseBarra {
  if (mesesDescanso.has(mes)) return "dormicion";
  if (mesesProduccion.has(mes)) return "produccion";
  if (mesesDescarte.has(mes)) return "formacion";
  if (enEstablecimiento) return "establecimiento";
  return "normal";
}

/**
 * Convierte un color hex a rgba con alpha.
 * Permite aplicar transparencia SOLO al fondo sin afectar bordes ni texto.
 */
function colorConAlpha(color: string, alpha: number): string {
  const hex = color.replace("#", "");
  if (hex.length === 6) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  // Fallback para colores no-hex (named colors, rgb, etc.)
  return color;
}

/** Estilo visual por fase — usa rgba para que el borde no sea afectado por la transparencia */
export function estiloFase(
  fase: FaseBarra,
  color: string,
): {
  backgroundColor: string;
  borderColorOverride?: string;
  borderDashed?: boolean;
} {
  switch (fase) {
    case "establecimiento":
      return {
        backgroundColor: colorConAlpha(color, 0.15),
        borderDashed: true,
      };
    case "formacion":
      return {
        backgroundColor: colorConAlpha("#f97316", 0.3),
        borderColorOverride: "#f97316",
      };
    case "produccion":
      return { backgroundColor: colorConAlpha(color, 0.85) };
    case "dormicion":
      return {
        backgroundColor: colorConAlpha("#9ca3af", 0.2),
        borderColorOverride: "#9ca3af",
        borderDashed: true,
      };
    case "normal":
      return { backgroundColor: colorConAlpha(color, 0.3) };
  }
}

// ─── Tipos públicos ──────────────────────────────────────────────────────────

export type TipoEventoGantt =
  | "plantacion"
  | "cosecha"
  | "poda"
  | "poda_programada"
  | "fertilizacion"
  | "replanta"
  | "lavado"
  | "recarga";

export interface EventoGantt {
  mes: number;
  tipo: TipoEventoGantt;
  ingreso_feria_clp: number | null;
  ingreso_mayorista_clp: number | null;
  kg_estimado: number | null;
  label: string;
  es_descarte: boolean;
  es_real: boolean;
  cosecha_real?: { kg: number; precio_venta_clp: number | null };
  año_cultivo: number;
  /** Descripción agronómica para tooltip (poda, fertilización) */
  descripcion_agronomica?: string;
}

export interface FilaGantt {
  zona_id: string;
  zona_nombre: string;
  cultivo_nombre: string;
  cultivo_id: string;
  cultivo_base_id: string;
  color: string;
  num_plantas: number;
  etapa_actual: EtapaCrecimiento;
  dias_restantes_etapa: number;
  mes_inicio: number;
  mes_fin: number;
  continua_año_anterior: boolean;
  continua_año_siguiente: boolean;
  siembra_fuera_temporada: boolean;
  sin_fecha: boolean;
  eventos: EventoGantt[];
  segmentos: SegmentoBarra[];
  ingreso_total_feria: number;
  ingreso_total_mayorista: number;
  total_cosechas_vida: number;
  propagacion: PropagacionTipo;
  /** Tendencia de precio ODEPA: alza / estable / baja */
  tendencia_precio: Tendencia | null;
  /** Año en que se plantó (o null si sin fecha) */
  año_plantacion: number | null;
  /** Año en que termina la vida útil (o null si sin fecha) */
  año_muerte: number | null;
  /** Meses del catálogo donde este cultivo es comercialmente viable (temporada de mercado) */
  meses_cosecha_catalogo: number[];
  /** Meses del calendario donde YO específicamente tendré cosecha este año */
  meses_cosecha_personales: number[];
  /**
   * Demanda de agua relativa por mes (0-1), normalizada al mes de mayor consumo.
   * Basada en kc_mensual × ET0. Si el cultivo no tiene kc_mensual, array de ceros.
   */
  consumo_agua_mensual: number[];
  roi_feria: ProyeccionROI;
  roi_mayorista: ProyeccionROI;
  /** Estrellas de recomendación del cultivo (1-3), del seed */
  recomendacion: 1 | 2 | 3 | null;
  /** Viabilidad del cultivo para el proyecto */
  viabilidad_proyecto: string | null;
  /** Nota específica para Arica */
  notas_arica: string | null;
  /** Mes en que se plantó (1-12), o null si sin fecha */
  mes_plantacion: number | null;
  /** Meses recomendados de siembra según el catálogo */
  meses_siembra_catalogo: number[];
  /** Plagas del catálogo — para derivar tareas de vigilancia */
  plagas: PlantPlague[];
}

// ─── Función principal ────────────────────────────────────────────────────────

export interface BuildFilasGanttParams {
  año: number;
  zonas: Zona[];
  plantas: Planta[];
  catalogoCultivos: CatalogoCultivo[];
  cosechas: Cosecha[];
  preciosMap: Map<string, PrecioMayorista>;
  costoAguaM3: number;
  suelo: SueloTerreno | null;
  opcionesConsumoAgua?: import("@/lib/utils/agua").OpcionesConsumoAgua;
  climaBase?: ClimaBase | null;
}

export function buildFilasGantt({
  año,
  zonas,
  plantas,
  catalogoCultivos,
  cosechas,
  preciosMap,
  costoAguaM3,
  suelo,
  opcionesConsumoAgua,
  climaBase,
}: BuildFilasGanttParams): FilaGantt[] {
  const et0Mensual = getEt0Mensual(climaBase ?? null);
  const filas: FilaGantt[] = [];
  const zonasConCultivo = zonas.filter((z) => z.tipo === TIPO_ZONA.CULTIVO);

  for (const zona of zonasConCultivo) {
    const plantasZona = plantas.filter(
      (p) => p.zona_id === zona.id && p.estado !== ESTADO_PLANTA.MUERTA,
    );
    if (plantasZona.length === 0) continue;

    const cultivosPorTipo = plantasZona.reduce(
      (acc, p) => {
        acc[p.tipo_cultivo_id] = (acc[p.tipo_cultivo_id] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    for (const [cultivoId, count] of Object.entries(cultivosPorTipo)) {
      const cultivo = catalogoCultivos.find((c) => c.id === cultivoId);
      if (!cultivo) continue;

      const plantasCultivo = plantasZona.filter(
        (p) => p.tipo_cultivo_id === cultivoId,
      );

      const plantaConFecha = plantasCultivo.find((p) => p.fecha_plantacion);
      const fechaPlantacion = plantaConFecha?.fecha_plantacion
        ? new Date(plantaConFecha.fecha_plantacion)
        : null;
      const sin_fecha = fechaPlantacion === null;

      // ROI feria y mayorista
      const pm = preciosMap.get(cultivo.cultivo_base_id ?? "");
      const precioFeria =
        pm?.precio_actual_clp && pm.factor_precio_feria
          ? Math.round(pm.precio_actual_clp * pm.factor_precio_feria)
          : undefined;
      const precioMayorista = pm?.precio_actual_clp ?? undefined;

      const consumoCultivo = calcularConsumoZona(
        zona,
        plantasCultivo,
        catalogoCultivos,
        undefined,
        opcionesConsumoAgua,
      );

      const roi_feria = calcularROI(
        cultivo,
        zona,
        count,
        costoAguaM3,
        consumoCultivo,
        suelo,
        precioFeria,
        null,
      );
      const roi_mayorista = calcularROI(
        cultivo,
        zona,
        count,
        costoAguaM3,
        consumoCultivo,
        suelo,
        precioMayorista,
        null,
      );

      // Etapa actual
      const tipoCultivoKey = cultivo.nombre.toLowerCase().split(" ")[0];
      const etapa_actual: EtapaCrecimiento = !sin_fecha
        ? calcularEtapaActual(tipoCultivoKey, fechaPlantacion!)
        : "plántula";

      const dias_restantes_etapa = !sin_fecha
        ? getDiasRestantesEtapa(tipoCultivoKey, etapa_actual, fechaPlantacion!)
        : 0;

      // Posición barra
      const añoPlantacion = sin_fecha ? año : fechaPlantacion!.getFullYear();
      const mesPlantacion = sin_fecha ? 1 : fechaPlantacion!.getMonth() + 1;
      const continua_año_anterior = añoPlantacion < año;
      const mes_inicio = continua_año_anterior ? 1 : mesPlantacion;
      const vidaUtilAños = cultivo.vida_util_años ?? 1;
      const añoFin = añoPlantacion + vidaUtilAños;

      // Si la planta ya murió (superó su vida útil), no mostrar en este año
      if (!sin_fecha && año > añoFin) continue;

      const continua_año_siguiente = añoFin > año;
      const mes_fin = 12;

      // Siembra fuera de temporada
      const mesesSiembra = cultivo.calendario?.meses_siembra ?? [];
      const siembra_fuera_temporada =
        !sin_fecha &&
        mesesSiembra.length > 0 &&
        !mesesSiembra.includes(mesPlantacion);

      // Eventos de cosecha
      const eventos: EventoGantt[] = [];
      if (!sin_fecha) {
        const tiempoProdMeses = cultivo.tiempo_produccion_meses ?? 12;
        // Usar día 1 para evitar overflow de setMonth (ej: ene-31 + 1m = mar-3)
        const fechaPrimeraCosecha = new Date(
          fechaPlantacion!.getFullYear(),
          fechaPlantacion!.getMonth() + tiempoProdMeses,
          1,
        );

        const cosechasAño = calcularCosechasEnAño(
          año,
          fechaPlantacion!,
          fechaPrimeraCosecha,
          cultivo.calendario?.meses_cosecha ?? [],
          roi_feria,
          roi_mayorista,
          cosechas.filter(
            (c) => c.zona_id === zona.id && c.tipo_cultivo_id === cultivoId,
          ),
          vidaUtilAños,
        );
        eventos.push(...cosechasAño);

        if (añoPlantacion === año) {
          eventos.unshift({
            mes: mesPlantacion,
            tipo: "plantacion",
            ingreso_feria_clp: null,
            ingreso_mayorista_clp: null,
            kg_estimado: null,
            label: "plantado",
            es_descarte: false,
            es_real: true,
            año_cultivo: 0,
          });
        }

        if (añoFin === año) {
          eventos.push({
            mes: mesPlantacion,
            tipo: "replanta",
            ingreso_feria_clp: null,
            ingreso_mayorista_clp: null,
            kg_estimado: null,
            label: PROPAGACION_LABEL[derivarPropagacion(cultivo)],
            es_descarte: false,
            es_real: false,
            año_cultivo: vidaUtilAños,
          });
        }
      }

      // Eventos agronómicos del catálogo (poda programada, fertilización)
      if (!sin_fecha) {
        const eventosAgronomicos = generarEventosAgronomicosCatalogo(
          año,
          fechaPlantacion!,
          cultivo,
        );
        for (const ev of eventosAgronomicos) {
          eventos.push(ev);
        }
      }

      // Segmentos de fase para la barra
      const segmentosBase: SegmentoBarra[] = sin_fecha
        ? []
        : calcularSegmentosEnAño(año, fechaPlantacion!, cultivo, eventos);
      const segmentos = enriquecerSegmentosConEtapas(
        segmentosBase,
        cultivo.etapas_fenologicas,
      );

      const ingreso_total_feria = eventos
        .filter((e) => !e.es_descarte && e.ingreso_feria_clp !== null)
        .reduce((s, e) => s + (e.ingreso_feria_clp ?? 0), 0);

      const ingreso_total_mayorista = eventos
        .filter((e) => !e.es_descarte && e.ingreso_mayorista_clp !== null)
        .reduce((s, e) => s + (e.ingreso_mayorista_clp ?? 0), 0);

      filas.push({
        zona_id: zona.id,
        zona_nombre: zona.nombre,
        cultivo_nombre: cultivo.nombre,
        cultivo_id: cultivoId,
        cultivo_base_id: cultivo.cultivo_base_id ?? "",
        color: zona.color,
        num_plantas: count,
        etapa_actual,
        dias_restantes_etapa,
        mes_inicio,
        mes_fin,
        continua_año_anterior,
        continua_año_siguiente,
        siembra_fuera_temporada,
        sin_fecha,
        eventos,
        segmentos,
        ingreso_total_feria,
        ingreso_total_mayorista,
        total_cosechas_vida: calcularTotalCosechasVida(cultivo),
        propagacion: derivarPropagacion(cultivo),
        tendencia_precio: pm?.tendencia ?? null,
        año_plantacion: sin_fecha ? null : añoPlantacion,
        año_muerte: sin_fecha ? null : añoFin,
        meses_cosecha_catalogo: cultivo.calendario?.meses_cosecha ?? [],
        meses_cosecha_personales: eventos
          .filter((e) => e.tipo === "cosecha" && !e.es_descarte)
          .map((e) => e.mes),
        consumo_agua_mensual: calcularAguaMensualRelativa(cultivo, et0Mensual),
        roi_feria,
        roi_mayorista,
        recomendacion: (cultivo.recomendacion ?? null) as 1 | 2 | 3 | null,
        viabilidad_proyecto: cultivo.viabilidad_proyecto ?? null,
        notas_arica: cultivo.notas_arica ?? null,
        mes_plantacion: sin_fecha ? null : mesPlantacion,
        meses_siembra_catalogo: cultivo.calendario?.meses_siembra ?? [],
        plagas: cultivo.plagas ?? [],
      });
    }
  }

  return filas;
}

// ─── Helpers internos ─────────────────────────────────────────────────────────

function calcularCosechasEnAño(
  año: number,
  fechaPlantacion: Date,
  fechaPrimeraCosecha: Date,
  mesesCosecha: number[],
  roi_feria: ProyeccionROI,
  roi_mayorista: ProyeccionROI,
  cosechasReales: Cosecha[],
  vidaUtilAños: number,
): EventoGantt[] {
  const añoMuerte = fechaPlantacion.getFullYear() + vidaUtilAños;

  // Planta muerta: sin cosecha
  if (año > añoMuerte) return [];

  // Primera cosecha fuera del ciclo de vida
  if (fechaPrimeraCosecha.getFullYear() > añoMuerte) {
    return [];
  }

  const ingresosFeria = [
    roi_feria.ingreso_año1,
    roi_feria.ingreso_año2,
    roi_feria.ingreso_año3,
    roi_feria.ingreso_año4,
    roi_feria.ingreso_año5,
  ];
  const ingresosMayorista = [
    roi_mayorista.ingreso_año1,
    roi_mayorista.ingreso_año2,
    roi_mayorista.ingreso_año3,
    roi_mayorista.ingreso_año4,
    roi_mayorista.ingreso_año5,
  ];
  const kgPorAño = [
    roi_feria.kg_año1,
    roi_feria.kg_año2,
    roi_feria.kg_año3,
    roi_feria.kg_año4,
    roi_feria.kg_año5,
  ];

  const mesesEnAño: number[] = [];
  if (mesesCosecha.length > 0) {
    for (const mes of mesesCosecha) {
      const fecha = new Date(año, mes - 1, 15);
      if (fecha >= fechaPrimeraCosecha) {
        mesesEnAño.push(mes);
      }
    }
  } else {
    const añoPrimera = fechaPrimeraCosecha.getFullYear();
    const mesPrimera = fechaPrimeraCosecha.getMonth() + 1;
    if (añoPrimera === año) {
      mesesEnAño.push(mesPrimera);
    }
  }

  if (mesesEnAño.length === 0) return [];

  const cosechasPorAño = mesesEnAño.length;
  const eventos: EventoGantt[] = [];
  let cosechaIndex = 1;

  for (const mes of mesesEnAño) {
    const añoCultivo = año - fechaPlantacion.getFullYear();
    const idx = Math.max(0, Math.min(añoCultivo, ingresosFeria.length - 1));

    const ingresoFeriaAnual = ingresosFeria[idx] ?? 0;
    const ingresoMayoristaAnual = ingresosMayorista[idx] ?? 0;
    const kgAnual = kgPorAño[idx] ?? 0;

    const ingresoMes =
      cosechasPorAño > 0
        ? Math.round(ingresoFeriaAnual / cosechasPorAño)
        : ingresoFeriaAnual;
    const ingresoMayoristaMes =
      cosechasPorAño > 0
        ? Math.round(ingresoMayoristaAnual / cosechasPorAño)
        : ingresoMayoristaAnual;
    const kgMes =
      cosechasPorAño > 0 ? Math.round(kgAnual / cosechasPorAño) : kgAnual;

    const esDescarte = añoCultivo === 0 && (roi_feria.kg_año1 ?? 0) === 0;

    const cosechaReal = cosechasReales.find((c) => {
      const f = new Date(c.fecha);
      return f.getFullYear() === año && f.getMonth() + 1 === mes;
    });

    const label = esDescarte
      ? "✂ formación"
      : `cosecha${numberToCircled(cosechaIndex)}`;

    eventos.push({
      mes,
      tipo: esDescarte ? "poda" : "cosecha",
      ingreso_feria_clp: esDescarte ? null : ingresoMes,
      ingreso_mayorista_clp: esDescarte ? null : ingresoMayoristaMes,
      kg_estimado: esDescarte ? null : kgMes,
      label,
      es_descarte: esDescarte,
      es_real: cosechaReal !== undefined,
      cosecha_real: cosechaReal
        ? {
            kg: cosechaReal.cantidad_kg,
            precio_venta_clp: cosechaReal.precio_venta_clp ?? null,
          }
        : undefined,
      año_cultivo: añoCultivo,
    });

    cosechaIndex++;
  }

  return eventos;
}

function numberToCircled(n: number): string {
  const circles = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"];
  return circles[n - 1] ?? `(${n})`;
}

// ─── Helpers de visualización ─────────────────────────────────────────────────

export const MESES_CORTO = [
  "ENE",
  "FEB",
  "MAR",
  "ABR",
  "MAY",
  "JUN",
  "JUL",
  "AGO",
  "SEP",
  "OCT",
  "NOV",
  "DIC",
] as const;

export function calcularTotalesPorMes(
  filas: FilaGantt[],
  tipoPrecio: "feria" | "mayorista",
): number[] {
  const totales = Array(12).fill(0);
  for (const fila of filas) {
    for (const evento of fila.eventos) {
      if (evento.es_descarte) continue;
      const ingreso =
        tipoPrecio === "feria"
          ? evento.ingreso_feria_clp
          : evento.ingreso_mayorista_clp;
      if (ingreso !== null && evento.mes >= 1 && evento.mes <= 12) {
        totales[evento.mes - 1] += ingreso;
      }
    }
  }
  return totales;
}

export { extenderROI10Años, KR_POR_AÑO };

// ─── Parsing de meses desde texto (poda.epoca, nutricion.timing) ──────────────

const MES_ABBR: Record<string, number> = {
  ene: 1,
  feb: 2,
  mar: 3,
  abr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  ago: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dic: 12,
};

/**
 * Extrae meses (1-12) desde strings como "Mar-Abr (post-cosecha)" o
 * "Brotación (sep): 40% N; cuaje (oct-nov): 30% NK".
 * Devuelve [] para "Todo el año" (demasiados chips).
 */
export function parsearMesesDesdeTexto(texto: string): number[] {
  if (!texto) return [];
  const lower = texto.toLowerCase();
  if (lower.includes("todo el año")) return [];

  const meses = new Set<number>();

  // Detectar rangos "xxx-yyy"
  for (const match of lower.matchAll(/\b([a-z]{3})-([a-z]{3})\b/g)) {
    const ini = MES_ABBR[match[1]];
    const fin = MES_ABBR[match[2]];
    if (ini && fin) {
      if (fin >= ini) {
        for (let m = ini; m <= fin; m++) meses.add(m);
      } else {
        // cruce de año: dic-feb
        for (let m = ini; m <= 12; m++) meses.add(m);
        for (let m = 1; m <= fin; m++) meses.add(m);
      }
    }
  }

  // Detectar meses sueltos (no parte de rango)
  for (const match of lower.matchAll(/\b([a-z]{3})\b/g)) {
    const num = MES_ABBR[match[1]];
    if (num) meses.add(num);
  }

  return [...meses].sort((a, b) => a - b);
}

/**
 * Enriquece los segmentos de la barra con nombres de etapas fenológicas reales.
 * Cada segmento recibe el nombre de la etapa cuyo rango de meses lo contiene.
 */
export function enriquecerSegmentosConEtapas(
  segmentos: SegmentoBarra[],
  etapas: CatalogoCultivo["etapas_fenologicas"],
): SegmentoBarra[] {
  if (!etapas || etapas.length === 0) return segmentos;

  // Mapeo mes → etapa
  const etapaPorMes = new Map<
    number,
    { nombre: string; descripcion: string }
  >();
  for (const etapa of etapas) {
    for (const mes of etapa.meses) {
      etapaPorMes.set(mes, {
        nombre: etapa.nombre,
        descripcion: etapa.descripcion,
      });
    }
  }

  return segmentos.map((seg) => {
    const etapa = etapaPorMes.get(seg.mesInicio);
    if (!etapa) return seg;
    return {
      ...seg,
      etapa_nombre: etapa.nombre,
      etapa_descripcion: etapa.descripcion,
    };
  });
}

/**
 * Genera eventos de poda programada y fertilización desde los datos del catálogo.
 * Solo genera eventos para meses que caigan dentro del año dado.
 */
export function generarEventosAgronomicosCatalogo(
  año: number,
  fechaPlantacion: Date,
  cultivo: CatalogoCultivo,
): EventoGantt[] {
  const eventos: EventoGantt[] = [];
  const añoPlantacion = fechaPlantacion.getFullYear();
  const añosDesde = año - añoPlantacion;
  // No mostrar eventos agronómicos en el año de plantación (plántula recién instalada)
  if (añosDesde < 1) return eventos;

  // Eventos de poda
  for (const poda of cultivo.poda ?? []) {
    const meses = parsearMesesDesdeTexto(poda.epoca);
    for (const mes of meses) {
      // Evitar duplicar si ya hay un evento de cosecha o plantación en ese mes
      eventos.push({
        mes,
        tipo: "poda_programada",
        ingreso_feria_clp: null,
        ingreso_mayorista_clp: null,
        kg_estimado: null,
        label: `✂ ${poda.tipo}`,
        es_descarte: false,
        es_real: false,
        año_cultivo: añosDesde,
        descripcion_agronomica: poda.descripcion,
      });
    }
  }

  // Eventos de fertilización (solo primer mes de cada aplicación para no saturar)
  const timingFertil = cultivo.nutricion?.timing;
  if (timingFertil) {
    const meses = parsearMesesDesdeTexto(timingFertil);
    for (const mes of meses) {
      eventos.push({
        mes,
        tipo: "fertilizacion",
        ingreso_feria_clp: null,
        ingreso_mayorista_clp: null,
        kg_estimado: null,
        label: "N fertilizar",
        es_descarte: false,
        es_real: false,
        año_cultivo: añosDesde,
        descripcion_agronomica: timingFertil,
      });
    }
  }

  return eventos;
}

// ─── ET0 mensual ──────────────────────────────────────────────────────────────

/** ET0 de referencia mensual para Arica (mm/día), basado en Open-Meteo 2025 */
const ET0_ARICA_FALLBACK: number[] = [
  5.5, 5.2, 4.8, 4.0, 3.2, 2.8, 2.8, 3.0, 3.5, 4.2, 4.8, 5.3,
];

/**
 * Extrae ET0 mensual (mm/día) de los datos de clima disponibles.
 * Devuelve array 12 elementos [ENE..DIC].
 */
export function getEt0Mensual(clima: ClimaBase | null): number[] {
  const detalle = clima?.evapotranspiracion_detalle;
  if (!detalle) return ET0_ARICA_FALLBACK;

  return Array.from({ length: 12 }, (_, i) => {
    const mes = (i + 1).toString();
    return detalle.mensual[mes]?.eto_mm_dia ?? detalle.eto_referencia_mm_dia;
  });
}

/**
 * Calcula la demanda de agua relativa por mes (0-1) para visualización.
 * Usa kc_mensual × ET0 × días del mes. Normalizado al mes de mayor demanda.
 */
export function calcularAguaMensualRelativa(
  cultivo: CatalogoCultivo,
  et0Mensual: number[],
): number[] {
  const kc = cultivo.kc_mensual;
  if (!kc || kc.length < 12) return new Array(12).fill(0);

  const DIAS_MES = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const demanda = kc.map((k, i) => k * et0Mensual[i] * DIAS_MES[i]);
  const maxDemanda = Math.max(...demanda, 1);

  return demanda.map((d) => Math.round((d / maxDemanda) * 100) / 100);
}
