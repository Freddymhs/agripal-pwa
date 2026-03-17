import type { CatalogoCultivo, Terreno } from "@/types";
import {
  SEMANAS_POR_AÑO,
  DIAS_POR_AÑO,
  DIAS_POR_MES_PROMEDIO,
  MESES_POR_AÑO,
} from "@/lib/constants/conversiones";
import { RIESGO } from "@/lib/constants/entities";

/** Semanas de recarga estimadas al año cuando no hay dato calculado */
const SEMANAS_RECARGA_ESTIMADAS = 26;
/** Factor de tolerancia sobre agua disponible (10% de margen) */
const FACTOR_TOLERANCIA_AGUA = 1.1;

/** ET0 mensual de referencia para Arica pampa interior (mm/día) — Open-Meteo Archive 2025 */
const ET0_MENSUAL_DEFAULT = [
  5.1, 4.8, 4.5, 3.9, 3.2, 2.7, 3.1, 3.4, 4.2, 4.8, 5.1, 5.5,
] as const;
const ET0_PROMEDIO_DEFAULT = 4.2;

const SCORE_RIESGO = {
  [RIESGO.BAJO]: 100,
  [RIESGO.MEDIO]: 50,
  [RIESGO.ALTO]: 0,
} as const;
const SCORE_TIER_MULTIPLICADOR = 30;
/** Tier máximo (3) + 1: invierte el scoring para que tier 1 obtenga el mayor puntaje */
const TIER_SCORE_BASE = 4;

const NOMBRES_MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;

export interface ValidacionCultivo {
  viable: boolean;
  restricciones: string[];
  advertencias: string[];
  recomendacion?: string;
}

export function validarCultivoEnTerreno(
  cultivo: CatalogoCultivo,
  terreno: Terreno,
  area_ha: number,
  aguaAnualCalculada?: number,
): ValidacionCultivo {
  const restricciones: string[] = [];
  const advertencias: string[] = [];
  const agua_necesaria_anual = cultivo.agua_m3_ha_año_min * area_ha;

  if (!cultivo.agua_m3_ha_año_min || !cultivo.agua_m3_ha_año_max) {
    restricciones.push(
      `Cultivo "${cultivo.nombre}" no tiene requerimientos de agua configurados`,
    );
    return { viable: false, restricciones, advertencias };
  }

  const aguaAnualDisponible =
    aguaAnualCalculada ??
    terreno.agua_disponible_m3 * SEMANAS_RECARGA_ESTIMADAS;
  const faltante = agua_necesaria_anual - aguaAnualDisponible;

  if (agua_necesaria_anual > aguaAnualDisponible * FACTOR_TOLERANCIA_AGUA) {
    const pctFaltante = ((faltante / agua_necesaria_anual) * 100).toFixed(0);

    restricciones.push(
      `⚠️ Agua insuficiente para cultivo viable\n\n` +
        `📊 Necesidad del cultivo:\n` +
        `  • ${cultivo.nombre} necesita: ${cultivo.agua_m3_ha_año_min.toFixed(0)} m³/ha/año\n` +
        `  • Para ${area_ha} ha: ${agua_necesaria_anual.toFixed(0)} m³/año\n\n` +
        `💧 Tu agua disponible:\n` +
        `  • Estimación: ${aguaAnualDisponible.toFixed(0)} m³/año\n` +
        `  • Faltante: ${faltante.toFixed(0)} m³/año (${pctFaltante}%)\n\n` +
        `💡 ¿Cómo mejorar tu capacidad de agua?\n` +
        `1. Agrega más estanques o aumenta su capacidad\n` +
        `2. Registra tus llenadas regularmente para mejorar la estimación\n` +
        `3. Configura la tasa de consumo de tus estanques para cálculos precisos`,
    );
  }

  if (terreno.suelo_ph) {
    if (
      terreno.suelo_ph < cultivo.ph_min ||
      terreno.suelo_ph > cultivo.ph_max
    ) {
      restricciones.push(
        `pH incompatible: suelo pH ${terreno.suelo_ph} pero ${cultivo.nombre} requiere pH ${cultivo.ph_min}-${cultivo.ph_max}`,
      );
    }
  } else {
    advertencias.push(
      `pH del suelo desconocido. Análisis INIA recomendado antes de invertir`,
    );
  }

  if (terreno.agua_calidad_salinidad_dS_m) {
    const salinidad = terreno.agua_calidad_salinidad_dS_m;
    if (salinidad > cultivo.salinidad_tolerancia_dS_m) {
      restricciones.push(
        `Salinidad agua demasiado alta: ${salinidad} dS/m pero ${cultivo.nombre} tolera máx ${cultivo.salinidad_tolerancia_dS_m} dS/m`,
      );
    }
  } else {
    advertencias.push(
      `Salinidad agua desconocida. Análisis INIA obligatorio antes de invertir`,
    );
  }

  if (terreno.agua_calidad_boro_ppm) {
    const boro = terreno.agua_calidad_boro_ppm;
    if (boro > cultivo.boro_tolerancia_ppm) {
      restricciones.push(
        `Boro en agua tóxico para ${cultivo.nombre}: ${boro} ppm > ${cultivo.boro_tolerancia_ppm} ppm tolerable`,
      );
    }
  } else {
    advertencias.push(
      `Boro en agua desconocido. Río Lluta > 11 ppm es común. Análisis obligatorio`,
    );
  }

  if (cultivo.riesgo === RIESGO.ALTO) {
    advertencias.push(
      `Cultivo de alto riesgo en tu zona. Consultar con INDAP/INIA recomendado`,
    );
  }

  const recomendacion =
    restricciones.length === 0
      ? `✅ ${cultivo.nombre} es viable. Agua anual: ${agua_necesaria_anual.toFixed(0)} m³`
      : undefined;

  return {
    viable: restricciones.length === 0,
    restricciones,
    advertencias,
    recomendacion,
  };
}

export function filtrarCultivosViables(
  cultivos: CatalogoCultivo[],
  terreno: Terreno,
  area_ha: number,
  aguaAnualCalculada?: number,
): {
  viables: { cultivo: CatalogoCultivo; validacion: ValidacionCultivo }[];
  noViables: { cultivo: CatalogoCultivo; validacion: ValidacionCultivo }[];
} {
  const viables: { cultivo: CatalogoCultivo; validacion: ValidacionCultivo }[] =
    [];
  const noViables: {
    cultivo: CatalogoCultivo;
    validacion: ValidacionCultivo;
  }[] = [];

  for (const cultivo of cultivos) {
    const validacion = validarCultivoEnTerreno(
      cultivo,
      terreno,
      area_ha,
      aguaAnualCalculada,
    );

    if (validacion.viable) {
      viables.push({ cultivo, validacion });
    } else {
      noViables.push({ cultivo, validacion });
    }
  }

  return { viables, noViables };
}

export function rankearCultivosViables(
  cultivos: { cultivo: CatalogoCultivo; validacion: ValidacionCultivo }[],
  priorizarPor: "agua" | "rentabilidad" | "seguridad" = "rentabilidad",
): {
  cultivo: CatalogoCultivo;
  validacion: ValidacionCultivo;
  score: number;
}[] {
  const ranked = cultivos.map(({ cultivo, validacion }) => {
    const score =
      priorizarPor === "agua"
        ? 100 - cultivo.agua_m3_ha_año_max
        : priorizarPor === "rentabilidad"
          ? (cultivo.precio_kg_max_clp *
              (cultivo.produccion?.produccion_kg_ha_año4 ?? 0)) /
            (cultivo.agua_m3_ha_año_min || 1)
          : priorizarPor === "seguridad"
            ? (SCORE_RIESGO[cultivo.riesgo] ?? 0) +
              (TIER_SCORE_BASE - cultivo.tier) * SCORE_TIER_MULTIPLICADOR
            : 0;

    return { cultivo, validacion, score };
  });

  return ranked.sort((a, b) => b.score - a.score);
}

export function calcularAguaPorCultivo(
  cultivos: { cultivo: CatalogoCultivo; area_ha: number }[],
): {
  agua_anual_m3: number;
  agua_semanal_m3: number;
  agua_diaria_m3: number;
  detalle: { nombre: string; area_ha: number; agua_m3: number }[];
} {
  const detalle = cultivos.map(({ cultivo, area_ha }) => ({
    nombre: cultivo.nombre,
    area_ha,
    agua_m3: cultivo.agua_m3_ha_año_min * area_ha,
  }));

  const agua_anual_m3 = detalle.reduce((sum, d) => sum + d.agua_m3, 0);
  const agua_semanal_m3 = agua_anual_m3 / SEMANAS_POR_AÑO;
  const agua_diaria_m3 = agua_anual_m3 / DIAS_POR_AÑO;

  return { agua_anual_m3, agua_semanal_m3, agua_diaria_m3, detalle };
}

export function simularConsumoEstacional(
  cultivos: { cultivo: CatalogoCultivo; area_ha: number }[],
  et0Mensual: readonly number[] = ET0_MENSUAL_DEFAULT,
  et0Promedio: number = ET0_PROMEDIO_DEFAULT,
): {
  mes: number;
  mes_nombre: string;
  agua_m3: number;
  variacion_respecto_promedio: number;
}[] {
  const resultado = [];

  const agua_promedio_mensual =
    calcularAguaPorCultivo(cultivos).agua_anual_m3 / MESES_POR_AÑO;

  for (let mes = 1; mes <= MESES_POR_AÑO; mes++) {
    let agua_mes = 0;

    for (const { cultivo, area_ha } of cultivos) {
      const agua_anual = cultivo.agua_m3_ha_año_min * area_ha;
      const agua_promedio_dia = agua_anual / DIAS_POR_AÑO;

      const et0Mes = et0Mensual[mes - 1];
      const factor = et0Mes / et0Promedio;
      agua_mes += agua_promedio_dia * factor * DIAS_POR_MES_PROMEDIO;
    }

    const variacion =
      ((agua_mes - agua_promedio_mensual) / agua_promedio_mensual) * 100;

    resultado.push({
      mes,
      mes_nombre: NOMBRES_MESES[mes - 1],
      agua_m3: agua_mes,
      variacion_respecto_promedio: variacion,
    });
  }

  return resultado;
}
