export interface TecnicaMejora {
  id: string;
  nombre: string;
  categoria: string;
  efecto: string;
  ahorro_agua?: string | null;
  dosis: string | null;
  frecuencia: string;
  costo_aplicacion_clp: number;
  evidencia: string;
  disponible_arica: boolean;
}
