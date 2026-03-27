import type { PlantPlague, CatalogoCultivo, EtapaCrecimiento } from "@/types";
import type { DatosClimaticos } from "@/lib/data/calculos-clima";

// ── Constantes de riesgo de plagas ────────────────────────────────────────────
const TEMP_DEFAULT_C = 19;
const TEMP_FAVORABLE_MIN_C = 15;
const TEMP_FAVORABLE_MAX_C = 35;
const HUMEDAD_DEFAULT_PCT = 40;

const SCORE_TEMP_FAVORABLE = 40;
const SCORE_ETAPA_VULNERABLE = 25;
const SCORE_HUMEDAD_ALTA = 20;
const SCORE_LLUVIA_RECIENTE = 10;
const SCORE_SEVERIDAD: Record<string, number> = {
  baja: 5,
  media: 10,
  alta: 15,
  critica: 20,
};

/** Umbral de humedad relativa para riesgo fungal (FAO/INIA) */
const HUMEDAD_RIESGO_FUNGAL_PCT = 70;
/** Umbral lluvia anual mm para incremento riesgo enfermedades */
const LLUVIA_RIESGO_MM_AÑO = 100;

export const ALERTA_PLAGA = {
  BAJO: "bajo",
  MEDIO: "medio",
  ALTO: "alto",
  CRITICO: "critico",
} as const;
const SCORE_SEVERIDAD_DEFAULT = 10;
/** Score máximo teórico: temp(40) + etapa(25) + humedad(20) + lluvia(10) + severidad critica(20) */
export const SCORE_RIESGO_MAX =
  SCORE_TEMP_FAVORABLE +
  SCORE_ETAPA_VULNERABLE +
  SCORE_HUMEDAD_ALTA +
  SCORE_LLUVIA_RECIENTE +
  SCORE_SEVERIDAD.critica;
const UMBRAL_ALERTA_CRITICO = 80;
const UMBRAL_ALERTA_ALTO = 60;
const UMBRAL_ALERTA_MEDIO = 40;

export interface RiesgoPlaga {
  plaga: PlantPlague;
  scoreRiesgo: number;
  condicionesActuales: {
    temperaturaFavorable: boolean;
    etapaVulnerable: boolean;
    humedadAlta: boolean;
    tempActual: number;
    humedadPct: number;
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

/**
 * Evalúa riesgo de plagas cruzando 4 factores (FAO/INIA):
 * 1. Temperatura favorable para la plaga (40 pts)
 * 2. Etapa fenológica vulnerable (25 pts)
 * 3. Humedad relativa alta → riesgo fungal (20 pts)
 * 4. Precipitación anual significativa → enfermedades (10 pts)
 * + Severidad base de la plaga (5-20 pts)
 *
 * Score máximo teórico: 115
 */
export function evaluarRiesgoPlagas(
  cultivo: CatalogoCultivo,
  etapaActual: EtapaCrecimiento,
  clima: DatosClimaticos,
): RiesgoPlaga[] {
  const tempActual = getTempActualMes(clima);
  const humedadPct =
    clima?.humedad_radiacion?.humedad_relativa_pct ?? HUMEDAD_DEFAULT_PCT;
  const lluviaAnualMm = clima?.lluvia?.anual_mm ?? 0;
  const plagasCultivo = cultivo.plagas || [];

  return plagasCultivo
    .map((plaga) => {
      const temperaturaFavorable =
        plaga.temperatura_min != null && plaga.temperatura_max != null
          ? tempActual >= plaga.temperatura_min &&
            tempActual <= plaga.temperatura_max
          : tempActual >= TEMP_FAVORABLE_MIN_C &&
            tempActual <= TEMP_FAVORABLE_MAX_C;

      const etapaVulnerable =
        plaga.etapas_vulnerables?.includes(etapaActual) ?? false;

      const humedadAlta = humedadPct >= HUMEDAD_RIESGO_FUNGAL_PCT;
      const lluviaSignificativa = lluviaAnualMm >= LLUVIA_RIESGO_MM_AÑO;

      const score =
        (temperaturaFavorable ? SCORE_TEMP_FAVORABLE : 0) +
        (etapaVulnerable ? SCORE_ETAPA_VULNERABLE : 0) +
        (humedadAlta ? SCORE_HUMEDAD_ALTA : 0) +
        (lluviaSignificativa ? SCORE_LLUVIA_RECIENTE : 0) +
        (plaga.severidad
          ? (SCORE_SEVERIDAD[plaga.severidad] ?? 0)
          : SCORE_SEVERIDAD_DEFAULT);

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
          humedadAlta,
          tempActual: Math.round(tempActual),
          humedadPct: Math.round(humedadPct),
        },
        alertaNivel,
      };
    })
    .sort((a, b) => b.scoreRiesgo - a.scoreRiesgo);
}
