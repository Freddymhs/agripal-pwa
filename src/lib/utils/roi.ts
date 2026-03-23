import type {
  CatalogoCultivo,
  Zona,
  ProveedorAgua,
  Terreno,
  ConfiguracionRecarga,
  SueloTerreno,
  PerfilCalidad,
} from "@/types";
import { calcularFactorSuelo } from "./calidad";
import {
  M2_POR_HECTAREA,
  SEMANAS_POR_AÑO,
  PRECIO_PLANTA_FACTOR,
  LITROS_POR_M3,
  AÑOS_AMORTIZACION_PLANTAS,
  FACTOR_EFICIENCIA_RIEGO,
  FACTOR_EFICIENCIA_RIEGO_DEFAULT,
  KR_POR_AÑO,
  FRACCION_LAVADO,
} from "@/lib/constants/conversiones";
import {
  calcularPrecioKgPromedio,
  resolverAreaZona,
  calcularAguaPromedioHaAño,
  calcularPlantasPorHa,
  calcularFactorCalidad,
} from "@/lib/utils/helpers-cultivo";

export interface ProyeccionROI {
  cultivo_id: string;
  cultivo_nombre: string;
  zona_id: string;
  zona_nombre: string;

  num_plantas: number;
  area_ha: number;
  factor_riego: number;

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

  agua_anual_m3: number;
  precio_agua_break_even: number | null;
}

export interface ProyeccionROI10 {
  roi_10_años_pct: number;
  ingreso_acumulado_10años: number;
  punto_equilibrio_meses_10: number | null;
}

export function obtenerCostoAguaM3(
  proveedor: ProveedorAgua | null | undefined,
  recargaConfig?: ConfiguracionRecarga | null,
): number {
  // 1. Precio del agua según el proveedor
  const precioAgua = proveedor?.precio_m3_clp ?? 0;
  // 2. Costo de transporte/delivery derivado del viaje
  const costoTransporte =
    recargaConfig?.costo_transporte_clp && recargaConfig.cantidad_litros > 0
      ? recargaConfig.costo_transporte_clp /
        (recargaConfig.cantidad_litros / LITROS_POR_M3)
      : 0;
  return precioAgua + costoTransporte;
}

export function obtenerCostoAguaPromedio(
  estanques: Zona[],
  terreno: Terreno,
): number {
  const proveedores = terreno.agua_avanzada?.proveedores ?? [];
  const costos: number[] = [];
  for (const est of estanques) {
    const proveedor = est.estanque_config?.proveedor_id
      ? (proveedores.find((p) => p.id === est.estanque_config!.proveedor_id) ??
        null)
      : null;
    const costo = obtenerCostoAguaM3(proveedor, est.estanque_config?.recarga);
    if (costo > 0) costos.push(costo);
  }
  if (costos.length > 0)
    return costos.reduce((a, b) => a + b, 0) / costos.length;
  return 0;
}

export function calcularROI(
  cultivo: CatalogoCultivo,
  zona: Zona,
  numPlantasVivas: number,
  costoAguaM3: number,
  consumoSemanalReal?: number,
  suelo?: SueloTerreno | null,
  precioKgOverride?: number,
  perfilCalidad?: PerfilCalidad | null,
): ProyeccionROI {
  const areaHa = resolverAreaZona(zona) / M2_POR_HECTAREA;
  const plantasPorHa = calcularPlantasPorHa(cultivo.espaciado_recomendado_m);

  const precioKgPromedio =
    precioKgOverride ?? calcularPrecioKgPromedio(cultivo);
  const precioPlantaEstimado = precioKgPromedio * PRECIO_PLANTA_FACTOR;
  const precioPlanta = cultivo.precio_planta_clp ?? precioPlantaEstimado;
  const costoPlantasTotal = numPlantasVivas * precioPlanta;

  const aguaPromedioHaAño = calcularAguaPromedioHaAño(cultivo);
  const aguaAnualNeta =
    consumoSemanalReal != null
      ? consumoSemanalReal * SEMANAS_POR_AÑO
      : aguaPromedioHaAño * areaHa;

  // FL — fracción de lavado según tolerancia a salinidad (FAO)
  const fl = FRACCION_LAVADO[cultivo.tolerancia_salinidad] ?? 0;
  const aguaAnualBase = fl > 0 ? aguaAnualNeta / (1 - fl) : aguaAnualNeta;

  // Kr reduce consumo de agua en plantas jóvenes (FAO/INIA)
  const costoAguaPorAño = KR_POR_AÑO.map(
    (kr) => aguaAnualBase * kr * costoAguaM3,
  );
  // Año adulto (año5+) para reportes y extensión 10 años
  const costoAguaAnual = costoAguaPorAño[4];
  const aguaAnualTotal = aguaAnualBase;

  const inversion = costoPlantasTotal + costoAguaPorAño[0];

  const factorArea = plantasPorHa > 0 ? numPlantasVivas / plantasPorHa : 0;
  const factorSuelo = suelo ? calcularFactorSuelo(suelo, cultivo) : 1.0;
  const tipoRiego = zona.configuracion_riego?.tipo;
  const factorRiego = tipoRiego
    ? (FACTOR_EFICIENCIA_RIEGO[tipoRiego] ?? FACTOR_EFICIENCIA_RIEGO_DEFAULT)
    : FACTOR_EFICIENCIA_RIEGO_DEFAULT;

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
  const produccion_kg_ha_año5 =
    cultivo.produccion?.produccion_kg_ha_año5 ?? produccion_kg_ha_año4;

  const kg1 = produccion_kg_ha_año1 * factorArea * factorSuelo * factorRiego;
  const kg2 = produccion_kg_ha_año2 * factorArea * factorSuelo * factorRiego;
  const kg3 = produccion_kg_ha_año3 * factorArea * factorSuelo * factorRiego;
  const kg4 = produccion_kg_ha_año4 * factorArea * factorSuelo * factorRiego;
  const kg5 = produccion_kg_ha_año5 * factorArea * factorSuelo * factorRiego;

  const factorCalidad = calcularFactorCalidad(cultivo, perfilCalidad ?? null);
  const precioKg = precioKgPromedio * factorCalidad;

  const ingreso1 = kg1 * precioKg;
  const ingreso2 = kg2 * precioKg;
  const ingreso3 = kg3 * precioKg;
  const ingreso4 = kg4 * precioKg;
  const ingreso5 = kg5 * precioKg;

  const costoPlantasAnual = costoPlantasTotal / AÑOS_AMORTIZACION_PLANTAS;
  const ingresoNeto1 = ingreso1 - costoAguaPorAño[0] - costoPlantasAnual;
  const ingresoNeto2 = ingreso2 - costoAguaPorAño[1] - costoPlantasAnual;
  const ingresoNeto3 = ingreso3 - costoAguaPorAño[2] - costoPlantasAnual;
  const ingresoNeto4 = ingreso4 - costoAguaPorAño[3] - costoPlantasAnual;
  const ingresoNeto5 = ingreso5 - costoAguaPorAño[4] - costoPlantasAnual;

  const ingresoAcumulado =
    ingresoNeto1 + ingresoNeto2 + ingresoNeto3 + ingresoNeto4 + ingresoNeto5;

  // Break-even: precio agua máximo donde ROI >= 0
  // 0 = totalRevenue - Σ(aguaAnual * Kr_i) * P - costoPlantasTotal
  const totalRevenue5 = ingreso1 + ingreso2 + ingreso3 + ingreso4 + ingreso5;
  const aguaTotalKr5 = KR_POR_AÑO.reduce((s, kr) => s + aguaAnualBase * kr, 0);
  const precioAguaBreakEven =
    aguaTotalKr5 > 0 && totalRevenue5 > costoPlantasTotal
      ? Math.round((totalRevenue5 - costoPlantasTotal) / aguaTotalKr5)
      : null;

  // ingresoAcumulado ya es beneficio neto (revenue - 5*agua - plantas amortizadas).
  // ROI = beneficio_neto / inversión_inicial.
  const roi5 = inversion > 0 ? (ingresoAcumulado / inversion) * 100 : 0;

  // Break-even: ¿en qué mes el flujo de caja acumulado cubre el costo de plantas?
  // Partimos de -costoPlantasTotal y sumamos (revenue - agua) mensual.
  // No incluimos amortización de plantas en el costo mensual porque ya está
  // en el saldo inicial.
  let puntoEquilibrio: number | null = null;
  if (ingresoAcumulado > 0) {
    let acum = -costoPlantasTotal;
    const mesesPorAño = [
      { ingresoMensual: (ingreso1 - costoAguaPorAño[0]) / 12 },
      { ingresoMensual: (ingreso2 - costoAguaPorAño[1]) / 12 },
      { ingresoMensual: (ingreso3 - costoAguaPorAño[2]) / 12 },
      { ingresoMensual: (ingreso4 - costoAguaPorAño[3]) / 12 },
      { ingresoMensual: (ingreso5 - costoAguaPorAño[4]) / 12 },
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
    factor_riego: factorRiego,
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

    agua_anual_m3: aguaAnualTotal,
    precio_agua_break_even: precioAguaBreakEven,
  };
}

/**
 * Extiende la proyección ROI de 5 a 10 años para cultivos perennes.
 * Años 6-10 usan producción año 5 (estabilizada) y solo costo agua
 * (plantas ya amortizadas).
 */
export function extenderROI10Años(roi: ProyeccionROI): ProyeccionROI10 {
  const netoAnual6_10 = roi.ingreso_año5 - roi.costo_agua_anual;
  const ingAcum10 = roi.ingreso_acumulado_5años + 5 * netoAnual6_10;
  const roi10 =
    roi.inversion_total > 0 ? (ingAcum10 / roi.inversion_total) * 100 : 0;

  let puntoEq10: number | null = roi.punto_equilibrio_meses;
  if (puntoEq10 === null && ingAcum10 > 0) {
    // Continuar walk mensual desde mes 61
    let acum = roi.ingreso_acumulado_5años;
    const mensual = netoAnual6_10 / 12;
    for (let mes = 61; mes <= 120; mes++) {
      acum += mensual;
      if (acum >= 0) {
        puntoEq10 = mes;
        break;
      }
    }
  }

  return {
    roi_10_años_pct: Math.round(roi10),
    ingreso_acumulado_10años: ingAcum10,
    punto_equilibrio_meses_10: puntoEq10,
  };
}
