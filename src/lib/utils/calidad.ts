import type { CatalogoCultivo, FuenteAgua, SueloTerreno } from "@/types";
import type { DatosClimaticos } from "@/lib/data/calculos-clima";
import { clamp, isValidNum } from "@/lib/utils/math";
import { DIAS_POR_SEMANA } from "@/lib/constants/conversiones";
import {
  DIAS_AGUA_UMBRAL_SEGURO,
  DIAS_AGUA_UMBRAL_ALTO,
  DIAS_AGUA_UMBRAL_CRITICO,
  SCORE_EXCELENTE,
  SCORE_BUENA,
  SCORE_ACEPTABLE,
  SCORE_RIESGOSA,
  PESO_SCORE_AGUA,
  PESO_SCORE_SUELO,
  PESO_SCORE_CLIMA,
  PESO_SCORE_RIEGO,
} from "@/lib/constants/umbrales";

// ── Penalizaciones de score agua ────────────────────────────────────────────
const PENALIZACION_BORO_CRITICO = 60;
const PENALIZACION_BORO_MEDIO = 30;
const RATIO_BORO_CRITICO = 2;
const PENALIZACION_SALINIDAD_CRITICA = 40;
const PENALIZACION_SALINIDAD_MEDIA = 20;
const RATIO_SALINIDAD_CRITICO = 1.5;
const PENALIZACION_PH_AGUA = 15;

// ── Penalizaciones de score suelo ───────────────────────────────────────────
const PENALIZACION_PH_SUELO = 25;
const PENALIZACION_SALINIDAD_SUELO = 30;
// ── Penalizaciones de factor suelo ──────────────────────────────────────────
const FACTOR_PH_MAX_PENALIZACION = 0.5;
const FACTOR_PH_MULTIPLICADOR = 0.2;
const FACTOR_SALINIDAD_MAX_PENALIZACION = 0.6;
const FACTOR_SALINIDAD_MULTIPLICADOR = 0.3;
const FACTOR_BORO_MAX_PENALIZACION = 0.7;
const FACTOR_BORO_MULTIPLICADOR = 0.4;
// MO escalonada: <1% critico (-50%), 1-2% limitante (-20%), 2-4% leve (-5%)
const FACTOR_MO_CRITICA = 0.5;
const FACTOR_MO_LIMITANTE = 0.8;
const FACTOR_MO_LEVE = 0.95;
const MO_UMBRAL_CRITICO_PCT = 1;
const MO_UMBRAL_LIMITANTE_PCT = 2;
const MO_UMBRAL_ADECUADO_PCT = 4;
const FACTOR_SUELO_MINIMO = 0.1;

// ── Umbrales de deficiencia N/P/K (cuando el suelo tiene análisis) ──────────
// Valores en ppm por debajo de los cuales hay deficiencia
const NPK_UMBRAL_CRITICO = { n: 10, p: 5, k: 50 };
const NPK_UMBRAL_BAJO = { n: 25, p: 15, k: 120 };
const FACTOR_NPK_CRITICO = 0.7;
const FACTOR_NPK_BAJO = 0.9;

// ── Score riego ─────────────────────────────────────────────────────────────
const SCORE_RIEGO_CRITICO = 10;
const SCORE_RIEGO_AJUSTADO = 50;
const SCORE_RIEGO_BUENO = 75;

// ── Score clima ─────────────────────────────────────────────────────────────
const PENALIZACION_TEMP = 20;
const PENALIZACION_FRIO_MAX = 30;
const PENALIZACION_FRIO_DIVISOR = 10;

// ── Score base cuando no hay datos ──────────────────────────────────────────
const SCORE_SIN_DATOS = 50;

export type CategoriaCalidad =
  | "excelente"
  | "buena"
  | "aceptable"
  | "riesgosa"
  | "no_viable";

export interface ScoreCalidad {
  cultivo_id: string;
  cultivo_nombre: string;
  score_agua: number;
  score_suelo: number;
  score_clima: number;
  score_riego: number;
  score_total: number;
  categoria: CategoriaCalidad;
  factores_limitantes: string[];
  mejoras_sugeridas: string[];
}

function calcScoreAgua(
  fuente: FuenteAgua | null,
  cultivo: CatalogoCultivo,
): { score: number; problemas: string[]; mejoras: string[] } {
  if (!fuente)
    return {
      score: SCORE_SIN_DATOS,
      problemas: ["Sin fuente de agua asignada"],
      mejoras: ["Asignar fuente de agua al estanque"],
    };

  const problemas: string[] = [];
  const mejoras: string[] = [];
  const penalizaciones: number[] = [];

  if (
    isValidNum(fuente.boro_ppm) &&
    fuente.boro_ppm >= 0 &&
    cultivo.boro_tolerancia_ppm > 0
  ) {
    const ratio = fuente.boro_ppm / cultivo.boro_tolerancia_ppm;
    if (ratio > RATIO_BORO_CRITICO) {
      penalizaciones.push(PENALIZACION_BORO_CRITICO);
      problemas.push(
        `Boro ${fuente.boro_ppm} ppm muy alto (tol: ${cultivo.boro_tolerancia_ppm})`,
      );
      mejoras.push("Cambiar a fuente de agua con menor boro");
    } else if (ratio > 1) {
      penalizaciones.push(PENALIZACION_BORO_MEDIO);
      problemas.push(`Boro ${fuente.boro_ppm} ppm excede tolerancia`);
      mejoras.push(
        "Considerar filtrado de agua o mezcla con agua de mejor calidad",
      );
    }
  }

  if (
    isValidNum(fuente.salinidad_dS_m) &&
    fuente.salinidad_dS_m >= 0 &&
    cultivo.salinidad_tolerancia_dS_m > 0
  ) {
    const ratio = fuente.salinidad_dS_m / cultivo.salinidad_tolerancia_dS_m;
    if (ratio > RATIO_SALINIDAD_CRITICO) {
      penalizaciones.push(PENALIZACION_SALINIDAD_CRITICA);
      problemas.push(`Salinidad ${fuente.salinidad_dS_m} dS/m alta`);
    } else if (ratio > 1) {
      penalizaciones.push(PENALIZACION_SALINIDAD_MEDIA);
      problemas.push(`Salinidad ${fuente.salinidad_dS_m} dS/m en límite`);
    }
  }

  if (fuente.ph != null) {
    if (fuente.ph < cultivo.ph_min || fuente.ph > cultivo.ph_max) {
      penalizaciones.push(PENALIZACION_PH_AGUA);
      problemas.push(
        `pH agua ${fuente.ph} fuera de rango ${cultivo.ph_min}-${cultivo.ph_max}`,
      );
    }
  }

  const score = penalizaciones.reduce((acc, p) => acc - p, 100);
  return { score: clamp(score, 0, 100), problemas, mejoras };
}

function calcScoreSuelo(
  suelo: SueloTerreno | null,
  cultivo: CatalogoCultivo,
): { score: number; problemas: string[]; mejoras: string[] } {
  if (!suelo)
    return {
      score: SCORE_SIN_DATOS,
      problemas: ["Sin análisis de suelo"],
      mejoras: ["Realizar análisis de suelo (INIA ~$75,000)"],
    };

  let score = 100;
  const problemas: string[] = [];
  const mejoras: string[] = [];

  if (
    isValidNum(suelo.fisico?.ph) &&
    suelo.fisico!.ph >= 0 &&
    suelo.fisico!.ph <= 14
  ) {
    if (suelo.fisico!.ph < cultivo.ph_min) {
      score -= PENALIZACION_PH_SUELO;
      problemas.push(
        `pH suelo ${suelo.fisico!.ph} bajo (mín ${cultivo.ph_min})`,
      );
      mejoras.push("Aplicar cal agrícola para subir pH");
    } else if (suelo.fisico!.ph > cultivo.ph_max) {
      score -= PENALIZACION_PH_SUELO;
      problemas.push(
        `pH suelo ${suelo.fisico!.ph} alto (máx ${cultivo.ph_max})`,
      );
      mejoras.push("Aplicar azufre agrícola para bajar pH");
    }
  }

  if (
    isValidNum(suelo.quimico?.salinidad_dS_m) &&
    suelo.quimico!.salinidad_dS_m >= 0 &&
    suelo.quimico!.salinidad_dS_m > cultivo.salinidad_tolerancia_dS_m
  ) {
    score -= PENALIZACION_SALINIDAD_SUELO;
    problemas.push(`Salinidad suelo ${suelo.quimico.salinidad_dS_m} dS/m`);
    mejoras.push("Aplicar yeso agrícola y lavado de sales");
  }

  if (
    isValidNum(suelo.fisico?.materia_organica_pct) &&
    suelo.fisico!.materia_organica_pct >= 0
  ) {
    const mo = suelo.fisico!.materia_organica_pct;
    if (mo < MO_UMBRAL_CRITICO_PCT) {
      score -= 30;
      problemas.push(`Materia orgánica ${mo}% críticamente baja`);
      mejoras.push("Urgente: incorporar compost o humus (>2 kg/m²)");
    } else if (mo < MO_UMBRAL_LIMITANTE_PCT) {
      score -= 15;
      problemas.push(`Materia orgánica ${mo}% baja`);
      mejoras.push("Aumentar materia orgánica con compost o humus");
    } else if (mo < MO_UMBRAL_ADECUADO_PCT) {
      score -= 5;
      mejoras.push("Mantener aporte de materia orgánica");
    }
  }

  return { score: clamp(score, 0, 100), problemas, mejoras };
}

export function calcularFactorSuelo(
  suelo: SueloTerreno | null,
  cultivo: CatalogoCultivo,
): number {
  if (!suelo) return 1.0;

  let factor = 1.0;

  if (
    isValidNum(suelo.fisico?.ph) &&
    suelo.fisico!.ph >= 0 &&
    suelo.fisico!.ph <= 14
  ) {
    const ph = suelo.fisico!.ph;
    if (ph < cultivo.ph_min || ph > cultivo.ph_max) {
      const desviacion = Math.max(cultivo.ph_min - ph, ph - cultivo.ph_max);
      const penalizacion = Math.min(
        FACTOR_PH_MAX_PENALIZACION,
        desviacion * FACTOR_PH_MULTIPLICADOR,
      );
      factor *= 1 - penalizacion;
    }
  }

  if (
    isValidNum(suelo.quimico?.salinidad_dS_m) &&
    suelo.quimico!.salinidad_dS_m >= 0 &&
    cultivo.salinidad_tolerancia_dS_m > 0
  ) {
    const ratio =
      suelo.quimico!.salinidad_dS_m / cultivo.salinidad_tolerancia_dS_m;
    if (ratio > 1.0) {
      const penalizacion = Math.min(
        FACTOR_SALINIDAD_MAX_PENALIZACION,
        (ratio - 1) * FACTOR_SALINIDAD_MULTIPLICADOR,
      );
      factor *= 1 - penalizacion;
    }
  }

  if (
    isValidNum(suelo.quimico?.boro_mg_l) &&
    suelo.quimico!.boro_mg_l >= 0 &&
    cultivo.boro_tolerancia_ppm > 0
  ) {
    const ratio = suelo.quimico!.boro_mg_l / cultivo.boro_tolerancia_ppm;
    if (ratio > 1.0) {
      const penalizacion = Math.min(
        FACTOR_BORO_MAX_PENALIZACION,
        (ratio - 1) * FACTOR_BORO_MULTIPLICADOR,
      );
      factor *= 1 - penalizacion;
    }
  }

  if (
    isValidNum(suelo.fisico?.materia_organica_pct) &&
    suelo.fisico!.materia_organica_pct >= 0
  ) {
    const mo = suelo.fisico!.materia_organica_pct;
    if (mo < MO_UMBRAL_CRITICO_PCT) {
      factor *= FACTOR_MO_CRITICA;
    } else if (mo < MO_UMBRAL_LIMITANTE_PCT) {
      factor *= FACTOR_MO_LIMITANTE;
    } else if (mo < MO_UMBRAL_ADECUADO_PCT) {
      factor *= FACTOR_MO_LEVE;
    }
  }

  // N/P/K: cuando el usuario tiene análisis con valores, penalizar si hay deficiencia
  const nutrientes = [
    {
      valor: suelo.quimico?.nitrogeno_ppm,
      critico: NPK_UMBRAL_CRITICO.n,
      bajo: NPK_UMBRAL_BAJO.n,
    },
    {
      valor: suelo.quimico?.fosforo_ppm,
      critico: NPK_UMBRAL_CRITICO.p,
      bajo: NPK_UMBRAL_BAJO.p,
    },
    {
      valor: suelo.quimico?.potasio_ppm,
      critico: NPK_UMBRAL_CRITICO.k,
      bajo: NPK_UMBRAL_BAJO.k,
    },
  ];
  for (const { valor, critico, bajo } of nutrientes) {
    if (!isValidNum(valor) || valor < 0) continue;
    if (valor < critico) {
      factor *= FACTOR_NPK_CRITICO;
    } else if (valor < bajo) {
      factor *= FACTOR_NPK_BAJO;
    }
  }

  return Math.max(FACTOR_SUELO_MINIMO, factor);
}

function calcScoreClima(
  cultivo: CatalogoCultivo,
  climaDatos: DatosClimaticos,
): {
  score: number;
  problemas: string[];
  mejoras: string[];
} {
  let score = 100;
  const problemas: string[] = [];
  const mejoras: string[] = [];

  if (cultivo.clima && climaDatos) {
    const tempMax = climaDatos.temperatura.maxima_verano_c;
    const tempMin = climaDatos.temperatura.minima_historica_c;

    if (
      cultivo.clima.temp_max_c != null &&
      tempMax > cultivo.clima.temp_max_c
    ) {
      score -= PENALIZACION_TEMP;
      problemas.push(
        `Temp máx región ${tempMax}°C excede tolerancia ${cultivo.clima.temp_max_c}°C`,
      );
      mejoras.push("Instalar malla sombra en verano");
    }

    if (
      cultivo.clima.temp_min_c != null &&
      tempMin < cultivo.clima.temp_min_c
    ) {
      score -= PENALIZACION_TEMP;
      problemas.push(
        `Temp mín región ${tempMin}°C bajo tolerancia ${cultivo.clima.temp_min_c}°C`,
      );
    }

    if (
      cultivo.clima.horas_frio_requeridas != null &&
      cultivo.clima.horas_frio_requeridas >
        climaDatos.temperatura.horas_frio_aprox
    ) {
      const deficit =
        cultivo.clima.horas_frio_requeridas -
        climaDatos.temperatura.horas_frio_aprox;
      const penalidad = Math.min(
        PENALIZACION_FRIO_MAX,
        Math.round(deficit / PENALIZACION_FRIO_DIVISOR),
      );
      score -= penalidad;
      problemas.push(
        `Requiere ${cultivo.clima.horas_frio_requeridas}h frío, la región tiene ~${climaDatos.temperatura.horas_frio_aprox}h`,
      );
    }
  }

  return { score: clamp(score, 0, 100), problemas, mejoras };
}

function calcScoreRiego(
  aguaDisponibleM3: number,
  consumoSemanalM3: number,
): { score: number; problemas: string[]; mejoras: string[] } {
  if (consumoSemanalM3 <= 0) return { score: 100, problemas: [], mejoras: [] };

  const diasAgua = aguaDisponibleM3 / (consumoSemanalM3 / DIAS_POR_SEMANA);
  const problemas: string[] = [];
  const mejoras: string[] = [];

  if (diasAgua < DIAS_AGUA_UMBRAL_CRITICO) {
    problemas.push(`Solo ${Math.floor(diasAgua)} días de agua`);
    mejoras.push("Aumentar capacidad de estanques o frecuencia de llenado");
    return { score: SCORE_RIEGO_CRITICO, problemas, mejoras };
  }
  if (diasAgua < DIAS_AGUA_UMBRAL_ALTO) {
    problemas.push(`${Math.floor(diasAgua)} días de agua (ajustado)`);
    return { score: SCORE_RIEGO_AJUSTADO, problemas, mejoras };
  }
  if (diasAgua < DIAS_AGUA_UMBRAL_SEGURO) {
    return { score: SCORE_RIEGO_BUENO, problemas, mejoras };
  }
  return { score: 100, problemas, mejoras };
}

function getCategoria(score: number): CategoriaCalidad {
  if (score >= SCORE_EXCELENTE) return "excelente";
  if (score >= SCORE_BUENA) return "buena";
  if (score >= SCORE_ACEPTABLE) return "aceptable";
  if (score >= SCORE_RIESGOSA) return "riesgosa";
  return "no_viable";
}

export function calcularScoreCalidad(
  cultivo: CatalogoCultivo,
  fuente: FuenteAgua | null,
  suelo: SueloTerreno | null,
  aguaDisponibleM3: number,
  consumoSemanalM3: number,
  climaDatos: DatosClimaticos,
): ScoreCalidad {
  const agua = calcScoreAgua(fuente, cultivo);
  const sueloScore = calcScoreSuelo(suelo, cultivo);
  const clima = calcScoreClima(cultivo, climaDatos);
  const riego = calcScoreRiego(aguaDisponibleM3, consumoSemanalM3);

  const total = Math.round(
    agua.score * PESO_SCORE_AGUA +
      sueloScore.score * PESO_SCORE_SUELO +
      clima.score * PESO_SCORE_CLIMA +
      riego.score * PESO_SCORE_RIEGO,
  );

  return {
    cultivo_id: cultivo.id,
    cultivo_nombre: cultivo.nombre,
    score_agua: agua.score,
    score_suelo: sueloScore.score,
    score_clima: clima.score,
    score_riego: riego.score,
    score_total: total,
    categoria: getCategoria(total),
    factores_limitantes: [
      ...agua.problemas,
      ...sueloScore.problemas,
      ...clima.problemas,
      ...riego.problemas,
    ],
    mejoras_sugeridas: [
      ...agua.mejoras,
      ...sueloScore.mejoras,
      ...clima.mejoras,
      ...riego.mejoras,
    ],
  };
}
