import type {
  TipoZona,
  EstadoZona,
  EstadoPlanta,
  EtapaCrecimiento,
  EstadoAgua,
  TipoSistemaRiego,
  EstadoAlerta,
  SeveridadAlerta,
  Temporada,
  Riesgo,
  ConfiguracionGoteros,
  TexturaSuelo,
  Modo,
  Tolerancia,
  ToleranciaSimple,
  NivelIncompatibilidad,
  NivelIncompatibilidadResultado,
  CalidadCosecha,
} from "@/types";

export const MODO = {
  TERRENO: "terreno",
  ZONAS: "zonas",
  PLANTAS: "plantas",
  CREAR_ZONA: "crear_zona",
  PLANTAR: "plantar",
  ESPACIADO: "espaciado",
} as const satisfies Record<string, Modo>;

export const TEXTURA_SUELO = {
  ARENOSA: "arenosa",
  FRANCO_ARENOSA: "franco-arenosa",
  FRANCO: "franco",
  FRANCO_ARCILLOSA: "franco-arcillosa",
  ARCILLOSA: "arcillosa",
} as const satisfies Record<string, TexturaSuelo>;

export const TIPO_ZONA = {
  CULTIVO: "cultivo",
  ESTANQUE: "estanque",
  BODEGA: "bodega",
  CASA: "casa",
  GARAGE: "garage",
  COMPOSTERA: "compostera",
  APRON: "apron",
  EMPAQUE: "empaque",
  SANITARIO: "sanitario",
  CAMINO: "camino",
  DECORACION: "decoracion",
  OTRO: "otro",
} as const satisfies Record<string, TipoZona>;

export const ESTADO_ZONA = {
  ACTIVA: "activa",
  VACIA: "vacia",
  EN_PREPARACION: "en_preparacion",
} as const satisfies Record<string, EstadoZona>;

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
  MANUAL: "manual_sesiones",
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

export const RIESGO = {
  BAJO: "bajo",
  MEDIO: "medio",
  ALTO: "alto",
} as const satisfies Record<string, Riesgo>;

export const TEMPORADA = {
  VERANO: "verano",
  OTOÑO: "otoño",
  INVIERNO: "invierno",
  PRIMAVERA: "primavera",
} as const satisfies Record<string, Temporada>;

export const COLORES_ZONA: Record<TipoZona, string> = {
  cultivo: "#16a34a",
  bodega: "#92400e",
  casa: "#f97316",
  garage: "#1d4ed8",
  compostera: "#78350f",
  apron: "#d97706",
  empaque: "#f59e0b",
  sanitario: "#475569",
  camino: "#9ca3af",
  decoracion: "#a855f7",
  estanque: "#0ea5e9",
  otro: "#64748b",
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

export const TOLERANCIA_BORO_DEFAULT: Tolerancia = "media";
export const TOLERANCIA_SALINIDAD_DEFAULT: ToleranciaSimple = "media";

export const HORARIO_RIEGO_INICIO_DEFAULT = "06:00";
export const HORARIO_RIEGO_FIN_DEFAULT = "12:00";

export const CALIDAD_COSECHA = {
  A: "A",
  B: "B",
  C: "C",
} as const satisfies Record<string, CalidadCosecha>;

export const CALIDAD_COSECHA_LIST: CalidadCosecha[] = [
  CALIDAD_COSECHA.A,
  CALIDAD_COSECHA.B,
  CALIDAD_COSECHA.C,
];

export const FACTOR_PRECIO_CALIDAD: Record<CalidadCosecha, number> = {
  A: 1.0,
  B: 0.8,
  C: 0.6,
};

export const CALIDAD_COSECHA_INFO: Record<
  CalidadCosecha,
  { label: string; color: string }
> = {
  A: { label: "Premium", color: "text-green-700 bg-green-50" },
  B: { label: "Estándar", color: "text-yellow-700 bg-yellow-50" },
  C: { label: "Inferior", color: "text-red-700 bg-red-50" },
};

export const DESTINO_COSECHA = {
  CONSUMO: "consumo_propio",
  VENTA_LOCAL: "venta_local",
  EXPORTACION: "exportacion",
} as const;

export const DESTINO_COSECHA_LABELS: Record<string, string> = {
  [DESTINO_COSECHA.CONSUMO]: "Consumo propio",
  [DESTINO_COSECHA.VENTA_LOCAL]: "Venta local",
  [DESTINO_COSECHA.EXPORTACION]: "Exportación",
};

export const UMBRAL_VIDA_UTIL_URGENTE_DIAS = 7;

export const NIVEL_INCOMPATIBILIDAD = {
  ALTO: "alto",
  MEDIO: "medio",
  NINGUNO: "ninguno",
} as const satisfies Record<
  string,
  NivelIncompatibilidad | NivelIncompatibilidadResultado
>;
