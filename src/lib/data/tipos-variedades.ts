import type { UUID } from "@/types";

export interface VariedadCultivo {
  id: string;
  cultivo_id: UUID;
  nombre: string;
  origen: string;
  rendimiento_relativo: number;
  ventajas: string[];
  desventajas: string[];
  precio_planta_clp: number;
}
