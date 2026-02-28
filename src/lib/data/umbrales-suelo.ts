import sueloData from "../../../data/static/umbrales/suelo.json";
import type { SueloTerreno } from "@/types";

const SUELO_STATIC = sueloData as typeof sueloData;

export const UMBRALES_SUELO = SUELO_STATIC.UMBRALES_SUELO;

export type NivelAlerta = "ok" | "advertencia" | "critico";

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
      UMBRALES_SUELO.salinidad.max * 0.75
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
    } else if (suelo.quimico.boro_mg_l > UMBRALES_SUELO.boro.max * 0.75) {
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
      ? "critico"
      : advertencias.length > 0
        ? "advertencia"
        : "ok";

  return {
    viable: problemas.length === 0,
    nivel,
    problemas,
    advertencias,
  };
}
