import type { CatalogoCultivo, Zona, SueloTerreno } from "@/types";
import { calcularROI, type ProyeccionROI } from "./roi";
import {
  calcularMetricasEconomicas,
  type MetricasEconomicas,
} from "./economia-avanzada";
import { calcularFactorSuelo } from "./calidad";
import { M2_POR_HECTAREA } from "@/lib/constants/conversiones";
import {
  calcularDensidadPlantas,
  calcularAguaPromedioHaAño,
} from "@/lib/utils/helpers-cultivo";

export interface EscenarioCultivo {
  cultivo: CatalogoCultivo;
  roi: ProyeccionROI;
  metricas: MetricasEconomicas;
  consumoAguaAnualM3: number;
  factorSuelo: number;
}

export function compararCultivos(
  cultivos: CatalogoCultivo[],
  zona: Zona,
  suelo: SueloTerreno | null,
  costoAguaM3: number,
): EscenarioCultivo[] {
  return cultivos.map((cultivo) => {
    const { numPlantas } = calcularDensidadPlantas(
      cultivo.espaciado_recomendado_m,
      zona.area_m2,
    );
    const areaHa = zona.area_m2 / M2_POR_HECTAREA;

    const roi = calcularROI(
      cultivo,
      zona,
      numPlantas,
      costoAguaM3,
      undefined,
      suelo,
    );
    const kgAño = roi.kg_año3;
    const metricas = calcularMetricasEconomicas(roi, cultivo, kgAño);

    const consumoAguaAnualM3 = calcularAguaPromedioHaAño(cultivo) * areaHa;

    const factorSueloVal = suelo ? calcularFactorSuelo(suelo, cultivo) : 1.0;

    return {
      cultivo,
      roi,
      metricas,
      consumoAguaAnualM3,
      factorSuelo: factorSueloVal,
    };
  });
}
