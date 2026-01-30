import aguaData from '../../../data/static/umbrales/agua.json'

const AGUA_STATIC = aguaData as typeof aguaData

export const UMBRALES_AGUA = AGUA_STATIC.UMBRALES_AGUA
export const RIOS_ARICA = AGUA_STATIC.RIOS_ARICA

export type FuenteAgua = 'lluta' | 'azapa' | 'aljibe' | 'pozo' | 'otro'

export interface CalidadAgua {
  analisis_realizado?: boolean
  fecha_analisis?: string
  laboratorio?: string
  fuente?: FuenteAgua
  salinidad_dS_m?: number
  boro_ppm?: number
  arsenico_mg_l?: number
  requiere_filtrado?: boolean
  costo_filtrado_mensual?: number
}

export interface ProveedorAgua {
  id: string
  nombre: string
  telefono?: string
  precio_m3_clp?: number
  confiabilidad?: 'alta' | 'media' | 'baja'
  es_principal?: boolean
  notas?: string
}

export interface DerechosAguaDGA {
  tiene_derechos_dga?: boolean
  litros_por_segundo?: number
  m3_mes_autorizado?: number
  fuente_oficial?: string
  inscripcion_dga?: string
}

export interface ContingenciasAgua {
  buffer_minimo_pct?: number
  alerta_critica_pct?: number
  plan_si_no_llega?: string[]
}

export interface TecnicasAhorro {
  riego_deficitario_controlado?: boolean
  hidrogel?: boolean
  mulch?: boolean
  sensores_humedad?: boolean
}

export interface AguaAvanzada {
  calidad?: CalidadAgua
  proveedores?: ProveedorAgua[]
  derechos?: DerechosAguaDGA
  contingencias?: ContingenciasAgua
  tecnicas_ahorro?: TecnicasAhorro
}

export const PROVEEDORES_HIDROGEL_CHILE = AGUA_STATIC.PROVEEDORES_HIDROGEL_CHILE

export const TECNICAS_AHORRO_INFO = AGUA_STATIC.TECNICAS_AHORRO_INFO
