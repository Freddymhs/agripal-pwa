import type {
  Zona,
  Planta,
  CatalogoCultivo,
  Temporada,
  EstadoAgua,
  Timestamp,
  UUID,
  TexturaSuelo,
} from "@/types";
import { FACTORES_TEMPORADA } from "@/lib/constants/entities";
import type { DatosClimaticos } from "@/lib/data/calculos-clima";
import { getTemporadaActual } from "@/lib/data/calculos-clima";
import { getKc } from "@/lib/data/coeficientes-kc";
import {
  ESTADO_PLANTA,
  ETAPA,
  TIPO_ZONA,
  TIPO_RIEGO,
  ESTADO_AGUA,
} from "@/lib/constants/entities";
import {
  SEMANAS_POR_AÑO,
  DIAS_POR_SEMANA,
  MS_POR_DIA,
  MIN_DIAS_DESCUENTO,
  HORAS_POR_DIA,
  LITROS_POR_M3,
} from "@/lib/constants/conversiones";
import {
  calcularAguaPromedioHaAño,
  calcularPlantasPorHa,
  resolverAreaZona,
} from "@/lib/utils/helpers-cultivo";
import {
  DIAS_AGUA_UMBRAL_SEGURO,
  DIAS_AGUA_UMBRAL_CRITICO,
} from "@/lib/constants/umbrales";

/** Parámetros opcionales de contexto para cálculos de agua más precisos */
export interface OpcionesConsumoAgua {
  climaDatos?: DatosClimaticos;
  texturaSuelo?: TexturaSuelo;
}

/** Factor de retención de agua por textura de suelo (arena drena rápido → más riego) */
const FACTOR_TEXTURA_SUELO: Record<TexturaSuelo, number> = {
  arenosa: 1.3,
  "franco-arenosa": 1.15,
  franco: 1.0,
  "franco-arcillosa": 0.9,
  arcillosa: 0.8,
};

function getFactorTemporada(
  temporada: Temporada,
  climaDatos?: DatosClimaticos,
): number {
  return (
    climaDatos?.estacionalidad?.[temporada]?.factor_agua ??
    FACTORES_TEMPORADA[temporada]
  );
}

function getFactorTextura(textura?: TexturaSuelo): number {
  return textura ? (FACTOR_TEXTURA_SUELO[textura] ?? 1.0) : 1.0;
}

function calcularConsumoPlanta(
  planta: Planta,
  cultivo: CatalogoCultivo,
  temporada: Temporada = getTemporadaActual(),
  opciones?: OpcionesConsumoAgua,
): number {
  if (planta.estado === ESTADO_PLANTA.MUERTA) return 0;

  const factorTemporada = getFactorTemporada(temporada, opciones?.climaDatos);
  const factorTextura = getFactorTextura(opciones?.texturaSuelo);
  const kc = getKc(cultivo, planta.etapa_actual || ETAPA.ADULTA);

  if (!cultivo.agua_m3_ha_año_min || !cultivo.agua_m3_ha_año_max) return 0;
  const aguaPromedio = calcularAguaPromedioHaAño(cultivo);
  const plantasPorHa = calcularPlantasPorHa(cultivo.espaciado_recomendado_m);
  if (plantasPorHa === 0) return 0;
  const aguaPorPlantaAño = aguaPromedio / plantasPorHa;
  const aguaPorPlantaSemana = aguaPorPlantaAño / SEMANAS_POR_AÑO;

  return aguaPorPlantaSemana * factorTemporada * factorTextura * kc;
}

export function calcularConsumoZona(
  zona: Zona,
  plantas: Planta[],
  catalogoCultivos: CatalogoCultivo[],
  temporada: Temporada = getTemporadaActual(),
  opciones?: OpcionesConsumoAgua,
): number {
  if (zona.tipo !== TIPO_ZONA.CULTIVO || plantas.length === 0) {
    return 0;
  }

  const consumoBruto = plantas.reduce((total, planta) => {
    if (planta.estado === ESTADO_PLANTA.MUERTA) return total;

    const cultivo = catalogoCultivos.find(
      (c) => c.id === planta.tipo_cultivo_id,
    );
    if (!cultivo) return total;

    return total + calcularConsumoPlanta(planta, cultivo, temporada, opciones);
  }, 0);

  // Restar aporte de lluvia: mm sobre m² → m³, dividido en semanas
  const lluviaAnualMm = opciones?.climaDatos?.lluvia?.anual_mm;
  if (lluviaAnualMm && lluviaAnualMm > 0) {
    const areaM2 = resolverAreaZona(zona);
    const lluviaSemanalM3 = ((lluviaAnualMm / 1000) * areaM2) / SEMANAS_POR_AÑO;
    return Math.max(0, consumoBruto - lluviaSemanalM3);
  }

  return consumoBruto;
}

export function calcularConsumoTerreno(
  zonas: Zona[],
  plantas: Planta[],
  catalogoCultivos: CatalogoCultivo[],
  temporada: Temporada = getTemporadaActual(),
  opciones?: OpcionesConsumoAgua,
): number {
  return zonas.reduce((total, zona) => {
    const plantasZona = plantas.filter((p) => p.zona_id === zona.id);
    return (
      total +
      calcularConsumoZona(
        zona,
        plantasZona,
        catalogoCultivos,
        temporada,
        opciones,
      )
    );
  }, 0);
}

export function calcularConsumoRiegoZona(zona: Zona): number {
  const config = zona.configuracion_riego;
  if (!config || !config.caudal_total_lh) return 0;
  // Riego manual: el consumo se registra por sesión, no fluye continuamente
  if (config.tipo === TIPO_RIEGO.MANUAL) return 0;

  const horasDia = (() => {
    if (config.tipo === TIPO_RIEGO.CONTINUO) return HORAS_POR_DIA;
    if (config.horas_dia) return config.horas_dia;
    if (config.horario_inicio && config.horario_fin) {
      const [hi, mi] = config.horario_inicio.split(":").map(Number);
      const [hf, mf] = config.horario_fin.split(":").map(Number);
      if (isNaN(hi) || isNaN(mi) || isNaN(hf) || isNaN(mf)) return null;
      const diff = hf + mf / 60 - (hi + mi / 60);
      return diff <= 0 ? diff + 24 : diff;
    }
    return null;
  })();

  if (horasDia === null) return 0;

  return (
    ((config.caudal_total_lh * horasDia) / LITROS_POR_M3) * DIAS_POR_SEMANA
  );
}

export function calcularConsumoRealTerreno(
  zonas: Zona[],
  plantas: Planta[],
  catalogoCultivos: CatalogoCultivo[],
  temporada: Temporada = getTemporadaActual(),
  opciones?: OpcionesConsumoAgua,
): number {
  return zonas.reduce((total, zona) => {
    if (zona.tipo !== TIPO_ZONA.CULTIVO) return total;
    const plantasZona = plantas.filter((p) => p.zona_id === zona.id);
    if (plantasZona.length === 0) return total;

    const consumoRiego = calcularConsumoRiegoZona(zona);
    return (
      total +
      (consumoRiego > 0
        ? consumoRiego
        : calcularConsumoZona(
            zona,
            plantasZona,
            catalogoCultivos,
            temporada,
            opciones,
          ))
    );
  }, 0);
}

export function calcularDiasRestantes(
  aguaActualM3: number,
  consumoSemanalM3: number,
): number {
  if (isNaN(aguaActualM3) || isNaN(consumoSemanalM3)) return 0;
  const consumoDiario = consumoSemanalM3 / DIAS_POR_SEMANA;
  if (consumoDiario <= 0) return Infinity;
  return aguaActualM3 / consumoDiario;
}

/**
 * Calcula el consumo semanal de un estanque específico sumando solo las zonas asignadas a él.
 */
export function calcularConsumoEstanque(
  estanqueId: UUID,
  zonas: Zona[],
  plantas: Planta[],
  catalogoCultivos: CatalogoCultivo[],
  temporada: Temporada = getTemporadaActual(),
  opciones?: OpcionesConsumoAgua,
): number {
  return zonas
    .filter(
      (zona) =>
        zona.tipo === TIPO_ZONA.CULTIVO && zona.estanque_id === estanqueId,
    )
    .reduce((total, zona) => {
      const plantasZona = plantas.filter((p) => p.zona_id === zona.id);
      if (plantasZona.length === 0) return total;
      const consumoRiego = calcularConsumoRiegoZona(zona);
      return (
        total +
        (consumoRiego > 0
          ? consumoRiego
          : calcularConsumoZona(
              zona,
              plantasZona,
              catalogoCultivos,
              temporada,
              opciones,
            ))
      );
    }, 0);
}

export interface ResumenEstanque {
  estanqueId: UUID;
  consumoSemanal: number;
  diasRestantes: number;
}

/**
 * Calcula días restantes por estanque y retorna el más crítico.
 * Solo considera estanques que tienen zonas de cultivo asignadas.
 * Estanques sin zonas asignadas no forman parte del cuello de botella.
 */
export function calcularDiasRestantesCritico(
  estanques: Zona[],
  zonas: Zona[],
  plantas: Planta[],
  catalogoCultivos: CatalogoCultivo[],
  temporada: Temporada = getTemporadaActual(),
  opciones?: OpcionesConsumoAgua,
): { diasCritico: number; porEstanque: ResumenEstanque[] } {
  const porEstanque: ResumenEstanque[] = estanques
    .filter((e) => e.estanque_config)
    .map((e) => {
      const consumoSemanal = calcularConsumoEstanque(
        e.id,
        zonas,
        plantas,
        catalogoCultivos,
        temporada,
        opciones,
      );
      const nivel = e.estanque_config!.nivel_actual_m3 ?? 0;
      const diasRestantes =
        consumoSemanal > 0
          ? (nivel / consumoSemanal) * DIAS_POR_SEMANA
          : Infinity;
      return { estanqueId: e.id, consumoSemanal, diasRestantes };
    });

  const activos = porEstanque.filter((e) => e.consumoSemanal > 0);
  const diasCritico =
    activos.length > 0
      ? Math.min(...activos.map((e) => e.diasRestantes))
      : Infinity;

  return { diasCritico, porEstanque };
}

export function calcularStockEstanques(estanques: Zona[]): {
  aguaTotal: number;
  capacidadTotal: number;
} {
  return estanques.reduce(
    (acc, e) => {
      if (e.estanque_config) {
        return {
          aguaTotal: acc.aguaTotal + (e.estanque_config.nivel_actual_m3 ?? 0),
          capacidadTotal:
            acc.capacidadTotal + (e.estanque_config.capacidad_m3 ?? 0),
        };
      }
      return acc;
    },
    { aguaTotal: 0, capacidadTotal: 0 },
  );
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

  const zonasCultivo = zonas.filter(
    (z) =>
      z.tipo === TIPO_ZONA.CULTIVO &&
      plantas.some(
        (p) => p.zona_id === z.id && p.estado !== ESTADO_PLANTA.MUERTA,
      ),
  );

  if (zonasCultivo.length === 0) return null;

  const estanquesConAgua = estanques.filter(
    (e) => e.estanque_config && (e.estanque_config.nivel_actual_m3 ?? 0) > 0,
  );

  if (estanquesConAgua.length === 0) return null;

  // Agrupar zonas por estanque_id (solo las que tienen estanque asignado consumen agua)
  const zonasAsignadas = new Map<UUID, Zona[]>();

  for (const zona of zonasCultivo) {
    // Zonas con riego manual no descuentan automáticamente — solo al registrar sesión
    if (zona.configuracion_riego?.tipo === TIPO_RIEGO.MANUAL) continue;
    if (zona.estanque_id) {
      const grupo = zonasAsignadas.get(zona.estanque_id) ?? [];
      grupo.push(zona);
      zonasAsignadas.set(zona.estanque_id, grupo);
    }
  }

  const descuentosMap = new Map<UUID, ResultadoDescuento>();

  for (const estanque of estanquesConAgua) {
    const nivelAnterior = estanque.estanque_config?.nivel_actual_m3 ?? 0;
    descuentosMap.set(estanque.id, {
      estanqueId: estanque.id,
      nivelAnterior,
      nivelNuevo: nivelAnterior,
      consumido: 0,
    });
  }

  for (const [estanqueId, zonasDelEstanque] of zonasAsignadas) {
    const desc = descuentosMap.get(estanqueId);
    if (!desc) continue;

    const consumoSemanal = zonasDelEstanque.reduce((total, zona) => {
      const plantasZona = plantas.filter((p) => p.zona_id === zona.id);
      const consumoRiego = calcularConsumoRiegoZona(zona);
      return (
        total +
        (consumoRiego > 0
          ? consumoRiego
          : calcularConsumoZona(zona, plantasZona, catalogoCultivos))
      );
    }, 0);

    const consumoAcumulado =
      (consumoSemanal / DIAS_POR_SEMANA) * diasTranscurridos;
    const consumido = Math.min(consumoAcumulado, desc.nivelNuevo);
    desc.nivelNuevo = Math.max(0, desc.nivelNuevo - consumido);
    desc.consumido += consumido;
  }

  const descuentos = Array.from(descuentosMap.values()).filter(
    (d) => d.consumido > 0,
  );

  if (descuentos.length === 0) return null;

  const consumoTotal = descuentos.reduce((sum, d) => sum + d.consumido, 0);

  return { descuentos, consumoTotal, diasTranscurridos };
}

export interface PreviewRecarga {
  nivelLlegada: number;
  nivelDespues: number;
  pctHoy: number;
  pctLlegada: number;
  pctDespues: number;
  cabeCompleta: boolean;
  excedenteM3: number;
  alcanza: boolean;
  diasRestantes: number;
}

/**
 * Calcula la proyección de una recarga: nivel al llegar, nivel después de cargar,
 * si cabe completa, si el agua alcanza hasta la próxima entrega.
 * Shared: usado por configurar-agua-modal (preview en vivo) y estanque-card-agua (resumen).
 */
export function calcularPreviewRecarga(
  nivelActualM3: number,
  capacidadM3: number,
  consumoSemanal: number,
  frecuenciaDias: number,
  cantidadM3: number,
): PreviewRecarga {
  const consumoDiario = consumoSemanal / DIAS_POR_SEMANA;
  const nivelLlegada = Math.max(
    0,
    nivelActualM3 - consumoDiario * frecuenciaDias,
  );
  const espacioLibre = capacidadM3 - nivelLlegada;
  const nivelDespues = Math.min(capacidadM3, nivelLlegada + cantidadM3);
  const cabeCompleta = espacioLibre >= cantidadM3;
  const excedenteM3 = cabeCompleta ? 0 : cantidadM3 - espacioLibre;
  const alcanza =
    consumoSemanal > 0 ? nivelActualM3 / consumoDiario >= frecuenciaDias : true;
  const diasRestantes =
    consumoDiario > 0 ? nivelActualM3 / consumoDiario : Infinity;

  return {
    nivelLlegada,
    nivelDespues,
    pctHoy: capacidadM3 > 0 ? (nivelActualM3 / capacidadM3) * 100 : 0,
    pctLlegada: capacidadM3 > 0 ? (nivelLlegada / capacidadM3) * 100 : 0,
    pctDespues: capacidadM3 > 0 ? (nivelDespues / capacidadM3) * 100 : 0,
    cabeCompleta,
    excedenteM3,
    alcanza,
    diasRestantes,
  };
}

export interface EstadoDiasAgua {
  texto: string;
  colorBarra: string;
  colorTexto: string;
  colorFondo: string;
  colorBorde: string;
}

/**
 * Determina estado visual (color + texto) según los días de agua restantes.
 * Shared: usado por resumen-agua hero, estanque-panel del mapa, cards de /agua.
 */
export function getEstadoDiasAgua(diasRestantes: number): EstadoDiasAgua {
  if (diasRestantes > DIAS_AGUA_UMBRAL_SEGURO) {
    return {
      texto: "Agua suficiente",
      colorBarra: "bg-green-500",
      colorTexto: "text-green-800",
      colorFondo: "bg-green-50",
      colorBorde: "border-green-200",
    };
  }
  if (diasRestantes >= DIAS_AGUA_UMBRAL_CRITICO) {
    return {
      texto: "Stock bajo — planificar recarga",
      colorBarra: "bg-yellow-500",
      colorTexto: "text-yellow-800",
      colorFondo: "bg-yellow-50",
      colorBorde: "border-yellow-200",
    };
  }
  return {
    texto: "CRÍTICO — recargar pronto",
    colorBarra: "bg-red-500",
    colorTexto: "text-red-800",
    colorFondo: "bg-red-50",
    colorBorde: "border-red-200",
  };
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
