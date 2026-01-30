import type {
  Zona,
  Planta,
  CatalogoCultivo,
  Temporada,
  EstadoAgua,
  Timestamp,
  UUID,
} from "@/types";
import { FACTORES_TEMPORADA } from "@/types";
import { getTemporadaActual } from "@/lib/utils";
import { getKc } from "@/lib/data/kc-cultivos";

function calcularConsumoPlanta(
  planta: Planta,
  cultivo: CatalogoCultivo,
  temporada: Temporada = getTemporadaActual(),
): number {
  if (planta.estado === "muerta") return 0;

  const factorTemporada = FACTORES_TEMPORADA[temporada];
  const kc = getKc(cultivo.nombre, planta.etapa_actual || "adulta");

  if (!cultivo.agua_m3_ha_año_min || !cultivo.agua_m3_ha_año_max) return 0;
  const aguaPromedio =
    (cultivo.agua_m3_ha_año_min + cultivo.agua_m3_ha_año_max) / 2;
  const espaciadoM2 = cultivo.espaciado_recomendado_m ** 2;
  if (espaciadoM2 === 0) return 0;
  const plantasPorHa = 10000 / espaciadoM2;
  const aguaPorPlantaAño = aguaPromedio / plantasPorHa;
  const aguaPorPlantaSemana = aguaPorPlantaAño / 52;

  return aguaPorPlantaSemana * factorTemporada * kc;
}

export function calcularConsumoZona(
  zona: Zona,
  plantas: Planta[],
  catalogoCultivos: CatalogoCultivo[],
  temporada: Temporada = getTemporadaActual(),
): number {
  if (zona.tipo !== "cultivo" || plantas.length === 0) {
    return 0;
  }

  let consumoTotal = 0;

  for (const planta of plantas) {
    if (planta.estado === "muerta") continue;

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

  if (config.tipo === "continuo_24_7") {
    horasDia = 24;
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

  return ((config.caudal_total_lh * horasDia) / 1000) * 7;
}

export function calcularConsumoRealTerreno(
  zonas: Zona[],
  plantas: Planta[],
  catalogoCultivos: CatalogoCultivo[],
  temporada: Temporada = getTemporadaActual(),
): number {
  let consumoTotal = 0;

  for (const zona of zonas) {
    if (zona.tipo !== "cultivo") continue;
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
  const consumoDiario = consumoSemanalM3 / 7;
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

const MS_POR_DIA = 86400000;

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
  if (diasTranscurridos < 0.04) return null;

  const consumoSemanal =
    consumoSemanalOverride ??
    calcularConsumoTerreno(zonas, plantas, catalogoCultivos);
  const consumoDiario = consumoSemanal / 7;
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
    return "ok";
  } else if (margen >= 0) {
    return "ajustado";
  } else {
    return "deficit";
  }
}
