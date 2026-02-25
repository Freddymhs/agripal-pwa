import type {
  Zona,
  Planta,
  CatalogoCultivo,
  Temporada,
  EstadoAgua,
  Timestamp,
  UUID,
} from "@/types";
import { FACTORES_TEMPORADA } from "@/lib/constants/entities";
import { getTemporadaActual } from "@/lib/data/clima-arica";
import { getKc } from "@/lib/data/kc-cultivos";
import { ESTADO_PLANTA, ETAPA, TIPO_ZONA, TIPO_RIEGO, ESTADO_AGUA } from "@/lib/constants/entities";
import {
  M2_POR_HECTAREA,
  SEMANAS_POR_AÑO,
  DIAS_POR_SEMANA,
  MS_POR_DIA,
  MIN_DIAS_DESCUENTO,
  HORAS_POR_DIA,
} from "@/lib/constants/conversiones";
import { calcularAguaPromedioHaAño, calcularPlantasPorHa } from "@/lib/utils/helpers-cultivo";

function calcularConsumoPlanta(
  planta: Planta,
  cultivo: CatalogoCultivo,
  temporada: Temporada = getTemporadaActual(),
): number {
  if (planta.estado === ESTADO_PLANTA.MUERTA) return 0;

  const factorTemporada = FACTORES_TEMPORADA[temporada];
  const kc = getKc(cultivo.nombre, planta.etapa_actual || ETAPA.ADULTA);

  if (!cultivo.agua_m3_ha_año_min || !cultivo.agua_m3_ha_año_max) return 0;
  const aguaPromedio = calcularAguaPromedioHaAño(cultivo);
  const plantasPorHa = calcularPlantasPorHa(cultivo.espaciado_recomendado_m);
  if (plantasPorHa === 0) return 0;
  const aguaPorPlantaAño = aguaPromedio / plantasPorHa;
  const aguaPorPlantaSemana = aguaPorPlantaAño / SEMANAS_POR_AÑO;

  return aguaPorPlantaSemana * factorTemporada * kc;
}

export function calcularConsumoZona(
  zona: Zona,
  plantas: Planta[],
  catalogoCultivos: CatalogoCultivo[],
  temporada: Temporada = getTemporadaActual(),
): number {
  if (zona.tipo !== TIPO_ZONA.CULTIVO || plantas.length === 0) {
    return 0;
  }

  let consumoTotal = 0;

  for (const planta of plantas) {
    if (planta.estado === ESTADO_PLANTA.MUERTA) continue;

    const cultivo = catalogoCultivos.find(
      (c) => c.id === planta.tipo_cultivo_id,
    );
    if (!cultivo) continue;

    consumoTotal += calcularConsumoPlanta(planta, cultivo, temporada);
  }

  return consumoTotal;
}

export function calcularConsumoTerreno(
  zonas: Zona[],
  plantas: Planta[],
  catalogoCultivos: CatalogoCultivo[],
  temporada: Temporada = getTemporadaActual(),
): number {
  let consumoTotal = 0;

  for (const zona of zonas) {
    const plantasZona = plantas.filter((p) => p.zona_id === zona.id);
    consumoTotal += calcularConsumoZona(
      zona,
      plantasZona,
      catalogoCultivos,
      temporada,
    );
  }

  return consumoTotal;
}

export function calcularConsumoRiegoZona(zona: Zona): number {
  const config = zona.configuracion_riego;
  if (!config || !config.caudal_total_lh) return 0;

  let horasDia: number;

  if (config.tipo === TIPO_RIEGO.CONTINUO) {
    horasDia = HORAS_POR_DIA;
  } else {
    if (config.horas_dia) {
      horasDia = config.horas_dia;
    } else if (config.horario_inicio && config.horario_fin) {
      const [hi, mi] = config.horario_inicio.split(":").map(Number);
      const [hf, mf] = config.horario_fin.split(":").map(Number);
      if (isNaN(hi) || isNaN(mi) || isNaN(hf) || isNaN(mf)) return 0;
      horasDia = hf + mf / 60 - (hi + mi / 60);
      if (horasDia <= 0) horasDia += 24;
    } else {
      return 0;
    }
  }

  return ((config.caudal_total_lh * horasDia) / 1000) * DIAS_POR_SEMANA;
}

export function calcularConsumoRealTerreno(
  zonas: Zona[],
  plantas: Planta[],
  catalogoCultivos: CatalogoCultivo[],
  temporada: Temporada = getTemporadaActual(),
): number {
  let consumoTotal = 0;

  for (const zona of zonas) {
    if (zona.tipo !== TIPO_ZONA.CULTIVO) continue;
    const plantasZona = plantas.filter((p) => p.zona_id === zona.id);
    if (plantasZona.length === 0) continue;

    const consumoRiego = calcularConsumoRiegoZona(zona);
    if (consumoRiego > 0) {
      consumoTotal += consumoRiego;
    } else {
      consumoTotal += calcularConsumoZona(
        zona,
        plantasZona,
        catalogoCultivos,
        temporada,
      );
    }
  }

  return consumoTotal;
}

export function calcularDiasRestantes(
  aguaActualM3: number,
  consumoSemanalM3: number,
): number {
  if (isNaN(aguaActualM3) || isNaN(consumoSemanalM3)) return 0;
  const consumoDiario = consumoSemanalM3 / DIAS_POR_SEMANA;
  if (consumoDiario <= 0) return 999;
  return aguaActualM3 / consumoDiario;
}

export function calcularStockEstanques(estanques: Zona[]): {
  aguaTotal: number;
  capacidadTotal: number;
} {
  let aguaTotal = 0;
  let capacidadTotal = 0;
  for (const e of estanques) {
    if (e.estanque_config) {
      aguaTotal += e.estanque_config.nivel_actual_m3 ?? 0;
      capacidadTotal += e.estanque_config.capacidad_m3 ?? 0;
    }
  }
  return { aguaTotal, capacidadTotal };
}

export interface ResultadoDescuento {
  estanqueId: UUID;
  nivelAnterior: number;
  nivelNuevo: number;
  consumido: number;
}


export function calcularDescuentoAutomatico(
  ultimaSimulacion: Timestamp | undefined,
  estanques: Zona[],
  zonas: Zona[],
  plantas: Planta[],
  catalogoCultivos: CatalogoCultivo[],
  consumoSemanalOverride?: number,
): {
  descuentos: ResultadoDescuento[];
  consumoTotal: number;
  diasTranscurridos: number;
} | null {
  if (!ultimaSimulacion) return null;

  const timestamp = Date.parse(ultimaSimulacion);
  if (isNaN(timestamp)) return null;
  const diasTranscurridos = (Date.now() - timestamp) / MS_POR_DIA;
  if (diasTranscurridos < MIN_DIAS_DESCUENTO) return null;

  const consumoSemanal =
    consumoSemanalOverride ??
    calcularConsumoTerreno(zonas, plantas, catalogoCultivos);
  const consumoDiario = consumoSemanal / DIAS_POR_SEMANA;
  const consumoAcumulado = consumoDiario * diasTranscurridos;

  if (consumoAcumulado <= 0) return null;

  const estanquesConAgua = estanques.filter(
    (e) => e.estanque_config && (e.estanque_config.nivel_actual_m3 ?? 0) > 0,
  );
  const aguaTotalActual = estanquesConAgua.reduce(
    (sum, e) => sum + (e.estanque_config?.nivel_actual_m3 ?? 0),
    0,
  );

  if (aguaTotalActual <= 0) return null;

  const descuentos: ResultadoDescuento[] = [];
  let consumoTotal = 0;

  for (const estanque of estanquesConAgua) {
    const nivelAnterior = estanque.estanque_config?.nivel_actual_m3 ?? 0;
    const proporcion = nivelAnterior / aguaTotalActual;
    const consumoProporcional = consumoAcumulado * proporcion;
    const consumido = Math.min(consumoProporcional, nivelAnterior);
    const nivelNuevo = Math.max(0, nivelAnterior - consumido);

    consumoTotal += consumido;
    descuentos.push({
      estanqueId: estanque.id,
      nivelAnterior,
      nivelNuevo,
      consumido,
    });
  }

  return { descuentos, consumoTotal, diasTranscurridos };
}

export function determinarEstadoAgua(
  aguaDisponible: number,
  aguaNecesaria: number,
): EstadoAgua {
  const margen = aguaDisponible - aguaNecesaria;

  if (margen > aguaNecesaria * 0.2) {
    return ESTADO_AGUA.OK;
  } else if (margen >= 0) {
    return ESTADO_AGUA.AJUSTADO;
  } else {
    return ESTADO_AGUA.DEFICIT;
  }
}
