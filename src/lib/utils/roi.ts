import type {
  CatalogoCultivo,
  Zona,
  FuenteAgua,
  Terreno,
  ConfiguracionRecarga,
  SueloTerreno,
} from "@/types";
import { calcularFactorSuelo } from "./calidad";
import { obtenerFuente } from "@/lib/data/fuentes-agua";
import {
  M2_POR_HECTAREA,
  SEMANAS_POR_AÑO,
  PRECIO_PLANTA_FACTOR,
} from "@/lib/constants/conversiones";
import {
  calcularPrecioKgPromedio,
  calcularAguaPromedioHaAño,
  calcularPlantasPorHa,
} from "@/lib/utils/helpers-cultivo";

export interface ProyeccionROI {
  cultivo_id: string;
  cultivo_nombre: string;
  zona_id: string;
  zona_nombre: string;

  num_plantas: number;
  area_ha: number;

  costo_plantas: number;
  costo_agua_anual: number;
  inversion_total: number;

  kg_año2: number;
  kg_año3: number;
  kg_año4: number;

  precio_kg_estimado: number;
  ingreso_año2: number;
  ingreso_año3: number;
  ingreso_año4: number;

  ingreso_acumulado_4años: number;
  roi_4_años_pct: number;
  punto_equilibrio_meses: number | null;
  viable: boolean;
}

export function obtenerCostoAguaM3(
  fuente: FuenteAgua | null | undefined,
  terreno: Terreno,
  recargaConfig?: ConfiguracionRecarga | null,
): number {
  if (fuente?.costo_m3_clp) return fuente.costo_m3_clp;
  if (terreno.agua_costo_clp_por_m3) return terreno.agua_costo_clp_por_m3;
  if (
    recargaConfig?.costo_recarga_clp &&
    recargaConfig?.cantidad_litros &&
    recargaConfig.cantidad_litros > 0
  ) {
    return (
      recargaConfig.costo_recarga_clp / (recargaConfig.cantidad_litros / 1000)
    );
  }
  return 0;
}

export function obtenerCostoAguaPromedio(
  estanques: Zona[],
  terreno: Terreno,
): number {
  const costos: number[] = [];
  for (const est of estanques) {
    const fuenteId = est.estanque_config?.fuente_id;
    const fuente = fuenteId ? (obtenerFuente(fuenteId) ?? null) : null;
    const costo = obtenerCostoAguaM3(
      fuente,
      terreno,
      est.estanque_config?.recarga,
    );
    if (costo > 0) costos.push(costo);
  }
  if (costos.length > 0)
    return costos.reduce((a, b) => a + b, 0) / costos.length;
  return terreno.agua_costo_clp_por_m3 || 0;
}

export function calcularROI(
  cultivo: CatalogoCultivo,
  zona: Zona,
  numPlantasVivas: number,
  costoAguaM3: number,
  consumoSemanalReal?: number,
  suelo?: SueloTerreno | null,
): ProyeccionROI {
  const areaHa = zona.area_m2 / M2_POR_HECTAREA;
  const plantasPorHa = calcularPlantasPorHa(cultivo.espaciado_recomendado_m);

  const precioKgPromedio = calcularPrecioKgPromedio(cultivo);
  const precioPlantaEstimado = precioKgPromedio * PRECIO_PLANTA_FACTOR;
  const precioPlanta = cultivo.precio_planta_clp ?? precioPlantaEstimado;
  const costoPlantasTotal = numPlantasVivas * precioPlanta;

  const aguaPromedioHaAño = calcularAguaPromedioHaAño(cultivo);
  const aguaAnualTotal =
    consumoSemanalReal != null
      ? consumoSemanalReal * SEMANAS_POR_AÑO
      : aguaPromedioHaAño * areaHa;
  const costoAguaAnual = aguaAnualTotal * costoAguaM3;

  const inversion = costoPlantasTotal + costoAguaAnual;

  const factorArea = plantasPorHa > 0 ? numPlantasVivas / plantasPorHa : 0;
  const factorSuelo = suelo ? calcularFactorSuelo(suelo, cultivo) : 1.0;

  const {
    produccion_kg_ha_año2,
    produccion_kg_ha_año3,
    produccion_kg_ha_año4,
  } = cultivo.produccion;

  const kg2 = produccion_kg_ha_año2 * factorArea * factorSuelo;
  const kg3 = produccion_kg_ha_año3 * factorArea * factorSuelo;
  const kg4 = produccion_kg_ha_año4 * factorArea * factorSuelo;

  const precioKg = precioKgPromedio;

  const ingreso2 = kg2 * precioKg;
  const ingreso3 = kg3 * precioKg;
  const ingreso4 = kg4 * precioKg;

  const costoAnualOperacion = costoAguaAnual;
  const ingresoNeto2 = ingreso2 - costoAnualOperacion;
  const ingresoNeto3 = ingreso3 - costoAnualOperacion;
  const ingresoNeto4 = ingreso4 - costoAnualOperacion;

  const ingresoAcumulado = ingresoNeto2 + ingresoNeto3 + ingresoNeto4;

  const roi4 =
    inversion > 0 ? ((ingresoAcumulado - inversion) / inversion) * 100 : 0;

  let puntoEquilibrio: number | null = null;
  if (ingresoAcumulado > 0) {
    let acum = -costoPlantasTotal;
    const mesesPorAño = [
      { año: 1, ingresoMensual: 0 - costoAnualOperacion / 12 },
      { año: 2, ingresoMensual: (ingreso2 - costoAnualOperacion) / 12 },
      { año: 3, ingresoMensual: (ingreso3 - costoAnualOperacion) / 12 },
      { año: 4, ingresoMensual: (ingreso4 - costoAnualOperacion) / 12 },
    ];
    for (let mes = 1; mes <= 48; mes++) {
      const añoIdx = Math.min(Math.floor((mes - 1) / 12), 3);
      acum += mesesPorAño[añoIdx].ingresoMensual;
      if (acum >= 0) {
        puntoEquilibrio = mes;
        break;
      }
    }
  }

  return {
    cultivo_id: cultivo.id,
    cultivo_nombre: cultivo.nombre,
    zona_id: zona.id,
    zona_nombre: zona.nombre,
    num_plantas: numPlantasVivas,
    area_ha: areaHa,
    costo_plantas: costoPlantasTotal,
    costo_agua_anual: costoAguaAnual,
    inversion_total: inversion,
    kg_año2: kg2,
    kg_año3: kg3,
    kg_año4: kg4,
    precio_kg_estimado: precioKg,
    ingreso_año2: ingreso2,
    ingreso_año3: ingreso3,
    ingreso_año4: ingreso4,
    ingreso_acumulado_4años: ingresoAcumulado,
    roi_4_años_pct: Math.round(roi4),
    punto_equilibrio_meses: puntoEquilibrio,
    viable: roi4 > 0,
  };
}
