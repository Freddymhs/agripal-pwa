import mercadoData from "../../../data/static/mercado/precios-arica.json";

export type Tendencia = "alza" | "estable" | "baja";
export type NivelDemanda = "alta" | "media" | "baja";

export interface DatosMercado {
  cultivo_id: string;
  nombre: string;
  precio_kg_actual_clp: number;
  tendencia: Tendencia;
  demanda_local: NivelDemanda;
  competencia_local: NivelDemanda;
  mercado_exportacion: boolean;
  notas: string;
}

export const MERCADO_ARICA: DatosMercado[] = mercadoData as DatosMercado[];

export function obtenerMercado(cultivoId: string): DatosMercado | undefined {
  return MERCADO_ARICA.find((m) => m.cultivo_id === cultivoId);
}
