import type { Temporada } from "@/types";
import { TEMPORADA } from "@/lib/constants/entities";
import climaData from "../../../data/static/clima/arica.json";
import etoData from "../../../data/static/clima/evapotranspiracion-arica.json";

export interface DatosClimaticos {
  region: string;
  zona: string;

  lluvia: {
    anual_mm: number;
    max_24h_mm: number;
    meses_lluviosos: string[];
    meses_secos: string[];
  };

  temperatura: {
    minima_historica_c: number;
    maxima_verano_c: number;
    promedio_anual_c: number;
    horas_frio_aprox: number;
  };

  heladas: {
    anuales: number;
    meses_riesgo: string[];
    plantas_sensibles: string[];
  };

  viento: {
    max_kmh: number;
    direccion_predominante: string;
    meses_fuerte: string[];
  };

  humedad_radiacion: {
    humedad_relativa_pct: number;
    radiacion_mj_m2_dia: number;
  };

  evapotranspiracion: {
    et0_mm_dia: number;
    nota: string;
  };

  estacionalidad: Record<
    Temporada,
    {
      meses: string[];
      caracteristica: string;
      factor_agua: number;
    }
  >;

  fuentes: string[];
}

export const CLIMA_ARICA: DatosClimaticos = climaData as DatosClimaticos;

export function getTemporadaActual(): Temporada {
  const mes = new Date().getMonth();
  if (mes === 11 || mes === 0 || mes === 1) return TEMPORADA.VERANO;
  if (mes >= 2 && mes <= 4) return TEMPORADA.OTOÑO;
  if (mes >= 5 && mes <= 7) return TEMPORADA.INVIERNO;
  return TEMPORADA.PRIMAVERA;
}

export interface EtoMensual {
  eto_mm_dia: number;
  label: string;
}

export interface DatosCamanchaca {
  nota: string;
  meses_presencia: number[];
  aporte_estimado_mm_dia: number;
  reduccion_eto_pct: number;
  info: string;
}

export interface DatosETo {
  eto_referencia_mm_dia: number;
  mensual: Record<string, EtoMensual>;
  camanchaca: DatosCamanchaca;
}

export const ETO_ARICA: DatosETo = etoData as unknown as DatosETo;

export function getEtoMesActual(): number {
  const mes = (new Date().getMonth() + 1).toString();
  return ETO_ARICA.mensual[mes]?.eto_mm_dia ?? ETO_ARICA.eto_referencia_mm_dia;
}

export function hayCamanchaca(): boolean {
  const mes = new Date().getMonth() + 1;
  return ETO_ARICA.camanchaca.meses_presencia.includes(mes);
}

export function getFactorClimatico(): number {
  const etoActual = getEtoMesActual();
  const etoRef = ETO_ARICA.eto_referencia_mm_dia;
  const baseFactor = etoActual / etoRef;
  const factor = hayCamanchaca()
    ? baseFactor * (1 - ETO_ARICA.camanchaca.reduccion_eto_pct / 100)
    : baseFactor;

  return Math.round(factor * 100) / 100;
}
