import type { PlantPlague, CatalogoCultivo, EtapaCrecimiento } from "@/types";
import type { DatosClimaticos } from "@/lib/data/calculos-clima";

// ── Constantes de riesgo de plagas ────────────────────────────────────────────
const TEMP_DEFAULT_C = 19;
const TEMP_FAVORABLE_MIN_C = 15;
const TEMP_FAVORABLE_MAX_C = 35;
const SCORE_TEMP_FAVORABLE = 50;
const SCORE_ETAPA_VULNERABLE = 30;
const SCORE_SEVERIDAD: Record<string, number> = {
  baja: 5,
  media: 10,
  alta: 15,
  critica: 20,
};

export const ALERTA_PLAGA = {
  BAJO: "bajo",
  MEDIO: "medio",
  ALTO: "alto",
  CRITICO: "critico",
} as const;
const SCORE_SEVERIDAD_DEFAULT = 10;
const UMBRAL_ALERTA_CRITICO = 80;
const UMBRAL_ALERTA_ALTO = 60;
const UMBRAL_ALERTA_MEDIO = 40;

export interface RiesgoPlaga {
  plaga: PlantPlague;
  scoreRiesgo: number;
  condicionesActuales: {
    temperaturaFavorable: boolean;
    etapaVulnerable: boolean;
    tempActual: number;
  };
  alertaNivel: (typeof ALERTA_PLAGA)[keyof typeof ALERTA_PLAGA];
}

function getTempActualMes(clima: DatosClimaticos): number {
  const mes = new Date().getMonth();
  const temps = clima?.temperatura;

  if (
    !temps ||
    temps.maxima_verano_c == null ||
    temps.minima_historica_c == null
  ) {
    return TEMP_DEFAULT_C;
  }

  const maxPorMes = [
    temps.maxima_verano_c,
    temps.maxima_verano_c,
    temps.maxima_verano_c - 2,
    temps.maxima_verano_c - 5,
    temps.maxima_verano_c - 8,
    temps.maxima_verano_c - 10,
    temps.maxima_verano_c - 10,
    temps.maxima_verano_c - 8,
    temps.maxima_verano_c - 5,
    temps.maxima_verano_c - 2,
    temps.maxima_verano_c,
    temps.maxima_verano_c,
  ];
  const minPorMes = [
    temps.minima_historica_c + 6,
    temps.minima_historica_c + 6,
    temps.minima_historica_c + 4,
    temps.minima_historica_c + 2,
    temps.minima_historica_c,
    temps.minima_historica_c,
    temps.minima_historica_c,
    temps.minima_historica_c,
    temps.minima_historica_c + 2,
    temps.minima_historica_c + 4,
    temps.minima_historica_c + 6,
    temps.minima_historica_c + 6,
  ];
  return (maxPorMes[mes] + minPorMes[mes]) / 2;
}

export function evaluarRiesgoPlagas(
  cultivo: CatalogoCultivo,
  etapaActual: EtapaCrecimiento,
  clima: DatosClimaticos,
): RiesgoPlaga[] {
  const tempActual = getTempActualMes(clima);
  const plagasCultivo = cultivo.plagas || [];

  return plagasCultivo
    .map((plaga) => {
      let score = 0;

      const temperaturaFavorable =
        plaga.temperatura_min != null && plaga.temperatura_max != null
          ? tempActual >= plaga.temperatura_min &&
            tempActual <= plaga.temperatura_max
          : tempActual >= TEMP_FAVORABLE_MIN_C &&
            tempActual <= TEMP_FAVORABLE_MAX_C;

      if (temperaturaFavorable) score += SCORE_TEMP_FAVORABLE;

      const etapaVulnerable =
        plaga.etapas_vulnerables?.includes(etapaActual) ?? false;
      if (etapaVulnerable) score += SCORE_ETAPA_VULNERABLE;

      score += plaga.severidad
        ? (SCORE_SEVERIDAD[plaga.severidad] ?? 0)
        : SCORE_SEVERIDAD_DEFAULT;

      const alertaNivel: RiesgoPlaga["alertaNivel"] =
        score >= UMBRAL_ALERTA_CRITICO
          ? ALERTA_PLAGA.CRITICO
          : score >= UMBRAL_ALERTA_ALTO
            ? ALERTA_PLAGA.ALTO
            : score >= UMBRAL_ALERTA_MEDIO
              ? ALERTA_PLAGA.MEDIO
              : ALERTA_PLAGA.BAJO;

      return {
        plaga,
        scoreRiesgo: score,
        condicionesActuales: {
          temperaturaFavorable,
          etapaVulnerable,
          tempActual: Math.round(tempActual),
        },
        alertaNivel,
      };
    })
    .sort((a, b) => b.scoreRiesgo - a.scoreRiesgo);
}
