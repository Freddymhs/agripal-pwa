import {
  filtrarCultivosViables,
  rankearCultivosViables,
  calcularAguaPorCultivo,
  simularConsumoEstacional,
} from "@/lib/validations/cultivo-restricciones";
import { calcularAguaAnualAutomatica } from "@/lib/utils/agua-calculo-anual";
import { CULTIVOS_ARICA } from "@/lib/data/cultivos-arica";
import { M2_POR_HECTAREA } from "@/lib/constants/conversiones";
import type {
  Terreno,
  CatalogoCultivo,
  Zona,
  EntradaAgua,
  Planta,
} from "@/types";

export interface CultivoRecomendado {
  cultivo: CatalogoCultivo;
  score: number;
  razon: string;
}

export interface Recomendacion {
  cultivos_viables: CultivoRecomendado[];
  cultivos_noViables: { cultivo: CatalogoCultivo; razones: string[] }[];
  agua_total_anual_m3: number;
  agua_semanal_m3: number;
  agua_diaria_m3: number;
  consumo_estacional: Array<{
    mes: number;
    mes_nombre: string;
    agua_m3: number;
    variacion_respecto_promedio: number;
  }>;
  agua_disponible_anual_m3: number;
  riesgos_criticos: string[];
  advertencias: string[];
  resumen: string;
}

function generarResumen(
  cultivosViablesCount: number,
  cultivosNoViablesCount: number,
  porcentajeMargen: number,
): string {
  if (cultivosViablesCount === 0) {
    return `\u26a0\ufe0f NO HAY CULTIVOS VIABLES. ${cultivosNoViablesCount} cultivos descartados por restricciones de agua/suelo.`;
  }
  if (porcentajeMargen < 10) {
    return `\u26a0\ufe0f AGUA AJUSTADA: ${cultivosViablesCount} cultivos viables pero agua muy justa (margen ${porcentajeMargen.toFixed(0)}%). Considerar RDC, hidrogel o mulch.`;
  }
  if (porcentajeMargen < 20) {
    return `\u2705 VIABLE pero ajustado: ${cultivosViablesCount} cultivos con margen moderado (${porcentajeMargen.toFixed(0)}%). Manejo agua cr\u00edtico.`;
  }
  return `\u2705 VIABLE: ${cultivosViablesCount} cultivos recomendados con buen margen de agua (${porcentajeMargen.toFixed(0)}%).`;
}

export function calcularRecomendacionCultivos(
  terreno: Terreno,
  estanques: Zona[],
  entradasAgua: EntradaAgua[],
  zonas: Zona[],
  plantas: Planta[],
  catalogoCultivos: CatalogoCultivo[],
  area_ha?: number,
): Recomendacion {
  const areaHaFinal = area_ha ?? terreno.area_m2 / M2_POR_HECTAREA;

  const calculoAgua = calcularAguaAnualAutomatica(
    estanques,
    entradasAgua,
    zonas,
    plantas,
    catalogoCultivos,
  );

  const { viables, noViables } = filtrarCultivosViables(
    CULTIVOS_ARICA,
    terreno,
    areaHaFinal,
    calculoAgua.aguaAnualM3,
  );

  const ranked = rankearCultivosViables(viables, "rentabilidad");

  const cultivos_viables: CultivoRecomendado[] = ranked.map(
    ({ cultivo, validacion, score }) => ({
      cultivo,
      score,
      razon: validacion.recomendacion || "Viable pero con restricciones",
    }),
  );

  const cultivos_noViables = noViables.map(({ cultivo, validacion }) => ({
    cultivo,
    razones: validacion.restricciones,
  }));

  const riesgos_criticos: string[] = [];
  const advertencias: string[] = [];

  if (!terreno.agua_calidad_salinidad_dS_m) {
    riesgos_criticos.push(
      "CR\u00cdTICO: Salinidad agua desconocida. R\u00edo Lluta hist\u00f3ricamente > 2 dS/m. An\u00e1lisis INIA obligatorio antes de invertir $3.12M",
    );
  }

  if (!terreno.agua_calidad_boro_ppm) {
    riesgos_criticos.push(
      "CR\u00cdTICO: Boro en agua desconocido. R\u00edo Lluta > 11 ppm documentado. Si > 2 ppm, cultivos no viables sin filtraci\u00f3n ($500k/a\u00f1o)",
    );
  }

  if (!terreno.suelo_ph) {
    advertencias.push(
      "pH suelo desconocido. An\u00e1lisis INIA recomendado para confirmar compatibilidad",
    );
  }

  advertencias.push(
    "Arica: 14 brotes mosca de fruta activos (Dic 2024). Monitoreo SAG obligatorio. Prohibici\u00f3n venta si brote (Feb 2025)",
  );

  const agua_total = calcularAguaPorCultivo(
    cultivos_viables.map(({ cultivo }) => ({ cultivo, area_ha: areaHaFinal })),
  );

  const consumo_estacional = simularConsumoEstacional(
    cultivos_viables.map(({ cultivo }) => ({ cultivo, area_ha: areaHaFinal })),
  );

  const margen_agua = calculoAgua.aguaAnualM3 - agua_total.agua_anual_m3;
  const porcentaje_margen =
    calculoAgua.aguaAnualM3 > 0
      ? (margen_agua / calculoAgua.aguaAnualM3) * 100
      : 0;

  const resumen = generarResumen(
    cultivos_viables.length,
    cultivos_noViables.length,
    porcentaje_margen,
  );

  return {
    cultivos_viables,
    cultivos_noViables,
    agua_total_anual_m3: agua_total.agua_anual_m3,
    agua_semanal_m3: agua_total.agua_semanal_m3,
    agua_diaria_m3: agua_total.agua_diaria_m3,
    agua_disponible_anual_m3: calculoAgua.aguaAnualM3,
    consumo_estacional,
    riesgos_criticos,
    advertencias,
    resumen,
  };
}
