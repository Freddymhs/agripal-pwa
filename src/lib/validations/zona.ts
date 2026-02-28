import type { Zona, Terreno, Planta } from "@/types";
import type { ValidationResult } from "./types";

export type { ValidationResult };

export function zonasSeSuperponen(
  zona1: { x: number; y: number; ancho: number; alto: number },
  zona2: { x: number; y: number; ancho: number; alto: number },
): boolean {
  return !(
    zona1.x + zona1.ancho <= zona2.x ||
    zona2.x + zona2.ancho <= zona1.x ||
    zona1.y + zona1.alto <= zona2.y ||
    zona2.y + zona2.alto <= zona1.y
  );
}

export function validarNuevaZona(
  nuevaZona: { x: number; y: number; ancho: number; alto: number },
  zonasExistentes: Zona[],
  terreno: Terreno,
): ValidationResult {
  if (nuevaZona.ancho < 1 || nuevaZona.alto < 1) {
    return { valida: false, error: "La zona debe tener al menos 1m × 1m" };
  }

  if (nuevaZona.x < 0 || nuevaZona.y < 0) {
    return {
      valida: false,
      error: "La zona no puede tener coordenadas negativas",
    };
  }
  if (nuevaZona.x + nuevaZona.ancho > terreno.ancho_m) {
    return { valida: false, error: "La zona excede el ancho del terreno" };
  }
  if (nuevaZona.y + nuevaZona.alto > terreno.alto_m) {
    return { valida: false, error: "La zona excede el alto del terreno" };
  }

  for (const zona of zonasExistentes) {
    if (zonasSeSuperponen(nuevaZona, zona)) {
      return {
        valida: false,
        error: `La zona se superpone con "${zona.nombre}"`,
      };
    }
  }

  return { valida: true };
}

export function validarRedimensionarZona(
  zona: Zona,
  nuevoTamaño: { ancho: number; alto: number },
  plantas: Planta[],
  zonasExistentes: Zona[],
  terreno: Terreno,
): ValidationResult {
  if (nuevoTamaño.ancho < 1 || nuevoTamaño.alto < 1) {
    return { valida: false, error: "La zona debe tener al menos 1m × 1m" };
  }

  if (zona.x + nuevoTamaño.ancho > terreno.ancho_m) {
    return { valida: false, error: "La zona excedería el ancho del terreno" };
  }
  if (zona.y + nuevoTamaño.alto > terreno.alto_m) {
    return { valida: false, error: "La zona excedería el alto del terreno" };
  }

  const plantasFuera = plantas.filter(
    (planta) => planta.x >= nuevoTamaño.ancho || planta.y >= nuevoTamaño.alto,
  );
  if (plantasFuera.length > 0) {
    return {
      valida: false,
      error: `No puedes achicar la zona: ${plantasFuera.length} planta(s) quedarían fuera`,
    };
  }

  const zonaModificada = {
    ...zona,
    ancho: nuevoTamaño.ancho,
    alto: nuevoTamaño.alto,
  };
  for (const otraZona of zonasExistentes) {
    if (otraZona.id === zona.id) continue;
    if (zonasSeSuperponen(zonaModificada, otraZona)) {
      return {
        valida: false,
        error: `La zona se superpondría con "${otraZona.nombre}"`,
      };
    }
  }

  return { valida: true };
}

export function validarMoverZona(
  zona: Zona,
  nuevaPosicion: { x: number; y: number },
  zonasExistentes: Zona[],
  terreno: Terreno,
): ValidationResult {
  if (nuevaPosicion.x < 0 || nuevaPosicion.y < 0) {
    return {
      valida: false,
      error: "La posición no puede tener coordenadas negativas",
    };
  }

  if (nuevaPosicion.x + zona.ancho > terreno.ancho_m) {
    return { valida: false, error: "La zona excedería el ancho del terreno" };
  }
  if (nuevaPosicion.y + zona.alto > terreno.alto_m) {
    return { valida: false, error: "La zona excedería el alto del terreno" };
  }

  const zonaMovida = { ...zona, x: nuevaPosicion.x, y: nuevaPosicion.y };
  for (const otraZona of zonasExistentes) {
    if (otraZona.id === zona.id) continue;
    if (zonasSeSuperponen(zonaMovida, otraZona)) {
      return {
        valida: false,
        error: `La zona se superpondría con "${otraZona.nombre}"`,
      };
    }
  }

  return { valida: true };
}

export function advertenciaEliminarZona(
  zona: Zona,
  plantas: Planta[],
): string | null {
  const plantasEnZona = plantas.filter((p) => p.zona_id === zona.id);
  if (plantasEnZona.length > 0) {
    return `Esta zona tiene ${plantasEnZona.length} planta(s). Al eliminarla, también se eliminarán las plantas.`;
  }
  return null;
}
