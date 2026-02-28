import tecnicasData from "../../../data/static/tecnicas/mejora-crecimiento.json";

export interface TecnicaMejora {
  id: string;
  nombre: string;
  categoria: string;
  efecto: string;
  dosis: string;
  frecuencia: string;
  costo_aplicacion_clp: number;
  evidencia: string;
  disponible_arica: boolean;
}

export const TECNICAS_MEJORA: TecnicaMejora[] = tecnicasData as TecnicaMejora[];
