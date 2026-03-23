import type {
  CatalogoCultivo,
  Zona,
  SueloTerreno,
  PerfilCalidad,
} from "@/types";
import { calcularROI, type ProyeccionROI } from "./roi";
import {
  calcularMetricasEconomicas,
  type MetricasEconomicas,
} from "./economia-avanzada";
import { calcularFactorSuelo } from "./calidad";
import {
  calcularDensidadPlantas,
  resolverAreaZona,
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
  perfilCalidad?: PerfilCalidad | null,
): EscenarioCultivo[] {
  return cultivos.map((cultivo) => {
    const areaM2 = resolverAreaZona(zona);
    const { numPlantas } = calcularDensidadPlantas(
      cultivo.espaciado_recomendado_m,
      areaM2,
    );

    const roi = calcularROI(
      cultivo,
      zona,
      numPlantas,
      costoAguaM3,
      undefined,
      suelo,
      undefined,
      perfilCalidad,
    );
    const kgAño = roi.kg_año3;
    const metricas = calcularMetricasEconomicas(roi, cultivo, kgAño);

    const consumoAguaAnualM3 = roi.agua_anual_m3;

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
