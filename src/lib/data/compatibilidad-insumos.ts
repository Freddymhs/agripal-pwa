import type {
  MatrizCompatibilidad,
  InsumoCompatibilidad,
  IncompatibilidadQuimica,
} from "@/types";
import rawData from "../../../data/static/insumos/compatibilidad.json";

const matrizCompatibilidad = rawData as MatrizCompatibilidad;

export function getMatrizCompatibilidad(): MatrizCompatibilidad {
  return matrizCompatibilidad;
}

export function getInsumos(): InsumoCompatibilidad[] {
  return matrizCompatibilidad.insumos;
}

export function getInsumoById(id: string): InsumoCompatibilidad | undefined {
  return matrizCompatibilidad.insumos.find((i) => i.id === id);
}

export function verificarCompatibilidad(
  insumosSeleccionados: string[],
): IncompatibilidadQuimica[] {
  if (insumosSeleccionados.length < 2) return [];

  return matrizCompatibilidad.incompatibilidades.filter(
    (inc) =>
      insumosSeleccionados.includes(inc.insumo_a) &&
      insumosSeleccionados.includes(inc.insumo_b),
  );
}

export function getNivelMayorIncompatibilidad(
  incompatibilidades: IncompatibilidadQuimica[],
): "alto" | "medio" | "ninguno" {
  if (incompatibilidades.some((i) => i.nivel === "alto")) return "alto";
  if (incompatibilidades.some((i) => i.nivel === "medio")) return "medio";
  return "ninguno";
}
