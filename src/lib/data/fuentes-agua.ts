import fuentesData from "../../../data/static/fuentes-agua/arica.json";
import type { FuenteAgua } from "@/types";

export const FUENTES_AGUA_ARICA: FuenteAgua[] = fuentesData as FuenteAgua[];

export function obtenerFuente(id: string): FuenteAgua | undefined {
  return FUENTES_AGUA_ARICA.find((f) => f.id === id);
}
