import type { PlantPlague, CatalogoCultivo, EtapaCrecimiento } from "@/types";
import { CLIMA_ARICA } from "@/lib/data";

export interface RiesgoPlaga {
  plaga: PlantPlague;
  scoreRiesgo: number;
  condicionesActuales: {
    temperaturaFavorable: boolean;
    etapaVulnerable: boolean;
    tempActual: number;
  };
  alertaNivel: "bajo" | "medio" | "alto" | "critico";
}

function getTempActualMes(): number {
  const mes = new Date().getMonth();
  const temps = CLIMA_ARICA.temperatura;

  if (temps.maxima_verano_c == null || temps.minima_historica_c == null) {
    return 19;
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
): RiesgoPlaga[] {
  const tempActual = getTempActualMes();
  const plagasCultivo = cultivo.plagas || [];

  return plagasCultivo
    .map((plaga) => {
      let score = 0;

      const temperaturaFavorable =
        plaga.temperatura_min != null && plaga.temperatura_max != null
          ? tempActual >= plaga.temperatura_min &&
            tempActual <= plaga.temperatura_max
          : tempActual >= 15 && tempActual <= 35;

      if (temperaturaFavorable) score += 50;

      const etapaVulnerable =
        plaga.etapas_vulnerables?.includes(etapaActual) ?? false;
      if (etapaVulnerable) score += 30;

      const severidadScore: Record<string, number> = {
        baja: 5,
        media: 10,
        alta: 15,
        critica: 20,
      };
      score += plaga.severidad ? (severidadScore[plaga.severidad] ?? 0) : 10;

      const alertaNivel: RiesgoPlaga["alertaNivel"] =
        score >= 80
          ? "critico"
          : score >= 60
            ? "alto"
            : score >= 40
              ? "medio"
              : "bajo";

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
