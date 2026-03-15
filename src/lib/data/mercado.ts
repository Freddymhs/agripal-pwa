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
