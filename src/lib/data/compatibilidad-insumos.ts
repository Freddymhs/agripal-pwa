import type {
  IncompatibilidadQuimica,
  NivelIncompatibilidadResultado,
} from "@/types";
import { NIVEL_INCOMPATIBILIDAD } from "@/lib/constants/entities";
import rawIncompatibilidades from "../../../data/static/incompatibilidades-insumos.json";

const incompatibilidades = rawIncompatibilidades as IncompatibilidadQuimica[];

/**
 * Verifica incompatibilidades entre insumos por ID slug.
 * El JSON usa IDs slug (ej: "sulfato-calcio"), no nombres display.
 */
export function verificarCompatibilidadPorIds(
  ids: string[],
): IncompatibilidadQuimica[] {
  if (ids.length < 2) return [];

  return incompatibilidades.filter(
    (inc) => ids.includes(inc.insumo_a) && ids.includes(inc.insumo_b),
  );
}

/**
 * Mapea nombres display del usuario a IDs slug del catálogo.
 */
export function mapearNombresAIds(
  nombres: string[],
  catalogo: ReadonlyArray<{ id: string; nombre: string }>,
): string[] {
  return nombres
    .map((nombre) => catalogo.find((c) => c.nombre === nombre)?.id)
    .filter((id): id is string => id !== undefined);
}

export function getNivelMayorIncompatibilidad(
  incompatibilidadesList: IncompatibilidadQuimica[],
): NivelIncompatibilidadResultado {
  if (
    incompatibilidadesList.some((i) => i.nivel === NIVEL_INCOMPATIBILIDAD.ALTO)
  )
    return NIVEL_INCOMPATIBILIDAD.ALTO;
  if (
    incompatibilidadesList.some((i) => i.nivel === NIVEL_INCOMPATIBILIDAD.MEDIO)
  )
    return NIVEL_INCOMPATIBILIDAD.MEDIO;
  return NIVEL_INCOMPATIBILIDAD.NINGUNO;
}
