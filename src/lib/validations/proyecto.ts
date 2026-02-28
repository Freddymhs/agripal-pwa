import type { Proyecto } from "@/types";
import type { ValidationResult } from "./types";

export type { ValidationResult };

export function validarProyecto(
  data: Pick<Proyecto, "nombre">,
): ValidationResult {
  if (!data.nombre || data.nombre.trim().length === 0) {
    return { valida: false, error: "El nombre del proyecto es obligatorio" };
  }

  return { valida: true };
}
