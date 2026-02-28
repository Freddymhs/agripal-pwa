import type {
  TipoZona,
  EstadoPlanta,
  EtapaCrecimiento,
  EstadoAgua,
  TipoSistemaRiego,
  EstadoAlerta,
  SeveridadAlerta,
  Temporada,
  ConfiguracionGoteros,
} from "@/types";

export const TIPO_ZONA = {
  CULTIVO: "cultivo",
  ESTANQUE: "estanque",
  BODEGA: "bodega",
  CASA: "casa",
  CAMINO: "camino",
  DECORACION: "decoracion",
  OTRO: "otro",
} as const satisfies Record<string, TipoZona>;

export const ESTADO_PLANTA = {
  PLANTADA: "plantada",
  CRECIENDO: "creciendo",
  PRODUCIENDO: "produciendo",
  MUERTA: "muerta",
} as const satisfies Record<string, EstadoPlanta>;

export const ESTADOS_PLANTA_LIST: EstadoPlanta[] = [
  ESTADO_PLANTA.PLANTADA,
  ESTADO_PLANTA.CRECIENDO,
  ESTADO_PLANTA.PRODUCIENDO,
  ESTADO_PLANTA.MUERTA,
];

export const ETAPA = {
  PLANTULA: "plántula",
  JOVEN: "joven",
  ADULTA: "adulta",
  MADURA: "madura",
} as const satisfies Record<string, EtapaCrecimiento>;

export const ETAPAS_LIST: EtapaCrecimiento[] = [
  ETAPA.PLANTULA,
  ETAPA.JOVEN,
  ETAPA.ADULTA,
  ETAPA.MADURA,
];

export const ESTADO_AGUA = {
  OK: "ok",
  AJUSTADO: "ajustado",
  DEFICIT: "deficit",
} as const satisfies Record<string, EstadoAgua>;

export const TIPO_RIEGO = {
  PROGRAMADO: "programado",
  CONTINUO: "continuo_24_7",
} as const satisfies Record<string, TipoSistemaRiego>;

export const ESTADO_ALERTA = {
  ACTIVA: "activa",
  RESUELTA: "resuelta",
  IGNORADA: "ignorada",
} as const satisfies Record<string, EstadoAlerta>;

export const SEVERIDAD_ALERTA = {
  CRITICAL: "critical",
  WARNING: "warning",
  INFO: "info",
} as const satisfies Record<string, SeveridadAlerta>;

export const TEMPORADA = {
  VERANO: "verano",
  OTOÑO: "otoño",
  INVIERNO: "invierno",
  PRIMAVERA: "primavera",
} as const satisfies Record<string, Temporada>;

export const COLORES_ZONA: Record<TipoZona, string> = {
  cultivo: "#22c55e",
  bodega: "#a16207",
  casa: "#3b82f6",
  camino: "#6b7280",
  decoracion: "#a855f7",
  estanque: "#06b6d4",
  otro: "#374151",
};

export const COLORES_ESTADO_PLANTA: Record<EstadoPlanta, string> = {
  plantada: "#84cc16",
  creciendo: "#22c55e",
  produciendo: "#f59e0b",
  muerta: "#6b7280",
};

export const ETAPA_INFO: Record<
  EtapaCrecimiento,
  { emoji: string; label: string; kcRango: string }
> = {
  plántula: { emoji: "🌱", label: "Plántula", kcRango: "0.4-0.5" },
  joven: { emoji: "🌿", label: "Joven", kcRango: "0.7-0.8" },
  adulta: { emoji: "🌳", label: "Adulta", kcRango: "1.0-1.2" },
  madura: { emoji: "🍎", label: "Madura", kcRango: "0.8-0.9" },
};

export const FACTORES_TEMPORADA: Record<Temporada, number> = {
  verano: 1.4,
  otoño: 1.0,
  invierno: 0.6,
  primavera: 1.2,
};

export const GOTEROS_DEFAULT: ConfiguracionGoteros = {
  cantidad: 2,
  caudal_lh_por_gotero: 4,
};
