export type Tendencia = "alza" | "estable" | "baja";
export type NivelDemanda = "alta" | "media" | "baja" | "muy_baja";

/** Precio mayorista ODEPA — actualizado por API cada 6h */
export interface PrecioMayorista {
  id: string;
  cultivo_id: string;
  region: string;
  nombre: string;
  nombre_odepa: string | null;
  precio_min_clp: number | null;
  precio_max_clp: number | null;
  precio_actual_clp: number | null;
  tendencia: Tendencia | null;
  actualizado_en: string | null;
  fuente: string | null;
}

/** Contexto de mercado por (cultivo x region) — llenado por investigacion */
export interface MercadoDetalle {
  id: string;
  precio_mayorista_id: string;
  demanda_local: NivelDemanda | null;
  competencia_local: NivelDemanda | null;
  mercado_exportacion: boolean;
  notas: string | null;
}

/** Trazabilidad de precios: quién y cómo se obtuvo */
export type UpdatedBy = "api" | "skill" | "admin" | "seed";
export type OrigenRegistro = "seed" | "usuario";

export interface PrecioMayoristaConfig {
  id: string;
  precio_id: string;
  updated_by: UpdatedBy;
  origen: OrigenRegistro;
}

/** Clasificación y proveniencia de cultivos */
export type TipoCultivo = "fruta" | "verdura" | "aromatica" | "grano";

export interface CatalogoCultivoConfig {
  id: string;
  cultivo_id: string;
  tipo: TipoCultivo;
  origen: OrigenRegistro;
}

/** @deprecated Usar PrecioMayorista */
export type DatosMercado = PrecioMayorista;
