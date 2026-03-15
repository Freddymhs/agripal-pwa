import type { FuenteAgua } from "@/types";

export function obtenerFuente(
  fuentes: FuenteAgua[],
  id: string,
): FuenteAgua | undefined {
  return fuentes.find((f) => f.id === id);
}
