import type { SueloTerreno } from "@/types";

interface UmbralSimple {
  max: number;
  unidad: string;
  alerta: string;
}

interface UmbralRango {
  min: number;
  max: number;
  unidad: string;
  alerta: string;
}

interface UmbralMinimo {
  min: number;
  unidad: string;
  alerta: string;
}

interface UmbralesSuelo {
  salinidad: UmbralSimple;
  boro: UmbralSimple;
  arsenico: UmbralSimple;
  ph: UmbralRango;
  profundidad_frutales: UmbralMinimo;
}

/** Umbrales agronómicos universales para evaluación de suelo (FAO / norma sanitaria) */
export const UMBRALES_SUELO: UmbralesSuelo = {
  salinidad: { max: 4, unidad: "dS/m", alerta: "Suelo muy salino" },
  boro: { max: 2, unidad: "mg/L", alerta: "Tóxico para frutales" },
  arsenico: { max: 0.05, unidad: "mg/L", alerta: "Riesgo para salud" },
  ph: { min: 5.5, max: 8.5, unidad: "", alerta: "pH fuera de rango" },
  profundidad_frutales: {
    min: 60,
    unidad: "cm",
    alerta: "Profundidad insuficiente para frutales",
  },
} as const;

const FACTOR_ADVERTENCIA = 0.75;

export type NivelAlerta = "ok" | "advertencia" | "critico";

export const NIVEL_ALERTA = {
  OK: "ok",
  ADVERTENCIA: "advertencia",
  CRITICO: "critico",
} as const satisfies Record<string, NivelAlerta>;

export interface EvaluacionSuelo {
  viable: boolean;
  nivel: NivelAlerta;
  problemas: string[];
  advertencias: string[];
}

export function evaluarSuelo(suelo?: SueloTerreno): EvaluacionSuelo {
  const problemas: string[] = [];
  const advertencias: string[] = [];

  if (!suelo?.quimico?.analisis_realizado) {
    advertencias.push("Sin análisis de laboratorio - datos no verificados");
  }

  if (suelo?.quimico?.salinidad_dS_m !== undefined) {
    if (suelo.quimico.salinidad_dS_m > UMBRALES_SUELO.salinidad.max) {
      problemas.push(
        `Salinidad ${suelo.quimico.salinidad_dS_m} dS/m > ${UMBRALES_SUELO.salinidad.max} (MUY ALTO)`,
      );
    } else if (
      suelo.quimico.salinidad_dS_m >
      UMBRALES_SUELO.salinidad.max * FACTOR_ADVERTENCIA
    ) {
      advertencias.push(
        `Salinidad ${suelo.quimico.salinidad_dS_m} dS/m - cerca del límite`,
      );
    }
  }

  if (suelo?.quimico?.boro_mg_l !== undefined) {
    if (suelo.quimico.boro_mg_l > UMBRALES_SUELO.boro.max) {
      problemas.push(
        `Boro ${suelo.quimico.boro_mg_l} mg/L > ${UMBRALES_SUELO.boro.max} (TÓXICO para frutales)`,
      );
    } else if (
      suelo.quimico.boro_mg_l >
      UMBRALES_SUELO.boro.max * FACTOR_ADVERTENCIA
    ) {
      advertencias.push(
        `Boro ${suelo.quimico.boro_mg_l} mg/L - cerca del límite`,
      );
    }
  }

  if (suelo?.quimico?.arsenico_mg_l !== undefined) {
    if (suelo.quimico.arsenico_mg_l > UMBRALES_SUELO.arsenico.max) {
      problemas.push(
        `Arsénico ${suelo.quimico.arsenico_mg_l} mg/L > ${UMBRALES_SUELO.arsenico.max} (RIESGO SALUD)`,
      );
    }
  }

  if (suelo?.fisico?.ph !== undefined) {
    if (
      suelo.fisico.ph < UMBRALES_SUELO.ph.min ||
      suelo.fisico.ph > UMBRALES_SUELO.ph.max
    ) {
      advertencias.push(
        `pH ${suelo.fisico.ph} fuera del rango óptimo (${UMBRALES_SUELO.ph.min}-${UMBRALES_SUELO.ph.max})`,
      );
    }
  }

  if (suelo?.fisico?.profundidad_efectiva_cm !== undefined) {
    if (
      suelo.fisico.profundidad_efectiva_cm <
      UMBRALES_SUELO.profundidad_frutales.min
    ) {
      advertencias.push(
        `Profundidad ${suelo.fisico.profundidad_efectiva_cm}cm < ${UMBRALES_SUELO.profundidad_frutales.min}cm (limitado para frutales)`,
      );
    }
  }

  const nivel: NivelAlerta =
    problemas.length > 0
      ? NIVEL_ALERTA.CRITICO
      : advertencias.length > 0
        ? NIVEL_ALERTA.ADVERTENCIA
        : NIVEL_ALERTA.OK;

  return {
    viable: problemas.length === 0,
    nivel,
    problemas,
    advertencias,
  };
}
