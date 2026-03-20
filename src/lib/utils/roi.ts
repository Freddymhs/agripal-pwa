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
  LITROS_POR_M3,
} from "@/lib/constants/conversiones";
import {
  calcularPrecioKgPromedio,
  resolverAreaZona,
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

  kg_año1: number;
  kg_año2: number;
  kg_año3: number;
  kg_año4: number;
  kg_año5: number;

  precio_kg_estimado: number;
  ingreso_año1: number;
  ingreso_año2: number;
  ingreso_año3: number;
  ingreso_año4: number;
  ingreso_año5: number;

  ingreso_acumulado_5años: number;
  roi_5_años_pct: number;
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
      recargaConfig.costo_recarga_clp /
      (recargaConfig.cantidad_litros / LITROS_POR_M3)
    );
  }
  return 0;
}

export function obtenerCostoAguaPromedio(
  estanques: Zona[],
  terreno: Terreno,
  fuentesAgua: FuenteAgua[],
): number {
  const costos: number[] = [];
  for (const est of estanques) {
    const fuenteId = est.estanque_config?.fuente_id;
    const fuente = fuenteId
      ? (obtenerFuente(fuentesAgua, fuenteId) ?? null)
      : null;
    // Prioridad: fuente > terreno > recarga (por litros) > recarga (por capacidad_m3) > costo_por_m3 directo
    const costoRecargaM3 = (() => {
      const recarga = est.estanque_config?.recarga;
      const capacidad = est.estanque_config?.capacidad_m3;
      if (recarga?.costo_recarga_clp && capacidad && capacidad > 0) {
        return recarga.costo_recarga_clp / capacidad;
      }
      return 0;
    })();
    const costo =
      obtenerCostoAguaM3(fuente, terreno, est.estanque_config?.recarga) ||
      est.estanque_config?.costo_por_m3 ||
      costoRecargaM3;
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
  const areaHa = resolverAreaZona(zona) / M2_POR_HECTAREA;
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

  // Año 1: la mayoría de frutales no producen, hortalizas pueden producir parcial
  const tiempoProduccionMeses = cultivo.tiempo_produccion_meses ?? 12;
  const fraccionAño1 = Math.max(
    0,
    Math.min(1, (12 - tiempoProduccionMeses) / 12),
  );
  const produccion_kg_ha_año2 = cultivo.produccion?.produccion_kg_ha_año2 ?? 0;
  const produccion_kg_ha_año1 = produccion_kg_ha_año2 * fraccionAño1 * 0.5;
  const produccion_kg_ha_año3 = cultivo.produccion?.produccion_kg_ha_año3 ?? 0;
  const produccion_kg_ha_año4 = cultivo.produccion?.produccion_kg_ha_año4 ?? 0;
  // Año 5: se estabiliza al nivel del año 4
  const produccion_kg_ha_año5 = produccion_kg_ha_año4;

  const kg1 = produccion_kg_ha_año1 * factorArea * factorSuelo;
  const kg2 = produccion_kg_ha_año2 * factorArea * factorSuelo;
  const kg3 = produccion_kg_ha_año3 * factorArea * factorSuelo;
  const kg4 = produccion_kg_ha_año4 * factorArea * factorSuelo;
  const kg5 = produccion_kg_ha_año5 * factorArea * factorSuelo;

  const precioKg = precioKgPromedio;

  const ingreso1 = kg1 * precioKg;
  const ingreso2 = kg2 * precioKg;
  const ingreso3 = kg3 * precioKg;
  const ingreso4 = kg4 * precioKg;
  const ingreso5 = kg5 * precioKg;

  const costoAnualOperacion = costoAguaAnual;
  const ingresoNeto1 = ingreso1 - costoAnualOperacion;
  const ingresoNeto2 = ingreso2 - costoAnualOperacion;
  const ingresoNeto3 = ingreso3 - costoAnualOperacion;
  const ingresoNeto4 = ingreso4 - costoAnualOperacion;
  const ingresoNeto5 = ingreso5 - costoAnualOperacion;

  const ingresoAcumulado =
    ingresoNeto1 + ingresoNeto2 + ingresoNeto3 + ingresoNeto4 + ingresoNeto5;

  const roi5 =
    inversion > 0 ? ((ingresoAcumulado - inversion) / inversion) * 100 : 0;

  let puntoEquilibrio: number | null = null;
  if (ingresoAcumulado > 0) {
    let acum = -costoPlantasTotal;
    const mesesPorAño = [
      { ingresoMensual: (ingreso1 - costoAnualOperacion) / 12 },
      { ingresoMensual: (ingreso2 - costoAnualOperacion) / 12 },
      { ingresoMensual: (ingreso3 - costoAnualOperacion) / 12 },
      { ingresoMensual: (ingreso4 - costoAnualOperacion) / 12 },
      { ingresoMensual: (ingreso5 - costoAnualOperacion) / 12 },
    ];
    for (let mes = 1; mes <= 60; mes++) {
      const añoIdx = Math.min(Math.floor((mes - 1) / 12), 4);
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
    kg_año1: kg1,
    kg_año2: kg2,
    kg_año3: kg3,
    kg_año4: kg4,
    kg_año5: kg5,
    precio_kg_estimado: precioKg,
    ingreso_año1: ingreso1,
    ingreso_año2: ingreso2,
    ingreso_año3: ingreso3,
    ingreso_año4: ingreso4,
    ingreso_año5: ingreso5,
    ingreso_acumulado_5años: ingresoAcumulado,
    roi_5_años_pct: Math.round(roi5),
    punto_equilibrio_meses: puntoEquilibrio,
    viable: roi5 > 0,
  };
}
