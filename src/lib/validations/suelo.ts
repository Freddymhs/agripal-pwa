import type {
  CatalogoCultivo,
  SueloTerreno,
  CompatibilidadNivel,
} from "@/types";

export interface CompatibilidadSueloCultivo {
  cultivo_id: string;
  cultivo_nombre: string;
  nivel: CompatibilidadNivel;
  problemas: string[];
}

export function evaluarCompatibilidadSuelo(
  suelo: SueloTerreno,
  cultivo: CatalogoCultivo,
): CompatibilidadSueloCultivo {
  const problemas: string[] = [];

  if (suelo.fisico?.ph != null) {
    if (suelo.fisico.ph < cultivo.ph_min) {
      problemas.push(`pH ${suelo.fisico.ph} menor al mínimo ${cultivo.ph_min}`);
    } else if (suelo.fisico.ph > cultivo.ph_max) {
      problemas.push(`pH ${suelo.fisico.ph} mayor al máximo ${cultivo.ph_max}`);
    }
  }

  if (suelo.quimico?.salinidad_dS_m != null) {
    if (suelo.quimico.salinidad_dS_m > cultivo.salinidad_tolerancia_dS_m) {
      const exceso = (
        suelo.quimico.salinidad_dS_m / cultivo.salinidad_tolerancia_dS_m
      ).toFixed(1);
      problemas.push(
        `Salinidad suelo ${suelo.quimico.salinidad_dS_m} dS/m excede tolerancia ${cultivo.salinidad_tolerancia_dS_m} dS/m (${exceso}x)`,
      );
    }
  }

  if (suelo.quimico?.boro_mg_l != null) {
    if (suelo.quimico.boro_mg_l > cultivo.boro_tolerancia_ppm) {
      problemas.push(
        `Boro suelo ${suelo.quimico.boro_mg_l} mg/L excede tolerancia ${cultivo.boro_tolerancia_ppm} ppm`,
      );
    }
  }

  const nivel: CompatibilidadNivel =
    problemas.length >= 2
      ? "no_compatible"
      : problemas.length === 1
        ? (suelo.fisico?.ph != null &&
            (suelo.fisico.ph < cultivo.ph_min - 1 ||
              suelo.fisico.ph > cultivo.ph_max + 1)) ||
          (suelo.quimico?.salinidad_dS_m != null &&
            suelo.quimico.salinidad_dS_m >
              cultivo.salinidad_tolerancia_dS_m * 1.5)
          ? "no_compatible"
          : "limitado"
        : "compatible";

  return {
    cultivo_id: cultivo.id,
    cultivo_nombre: cultivo.nombre,
    nivel,
    problemas,
  };
}

export function evaluarCompatibilidadSueloMultiple(
  suelo: SueloTerreno,
  cultivos: CatalogoCultivo[],
): CompatibilidadSueloCultivo[] {
  return cultivos.map((c) => evaluarCompatibilidadSuelo(suelo, c));
}

export type { ValidationResult } from "./types";
import type { ValidationResult } from "./types";

export function validarSueloTerreno(suelo: SueloTerreno): ValidationResult {
  if (suelo.fisico?.ph != null) {
    if (suelo.fisico.ph < 0 || suelo.fisico.ph > 14) {
      return { valida: false, error: "El pH debe estar entre 0 y 14" };
    }
  }

  if (suelo.fisico?.materia_organica_pct != null) {
    if (
      suelo.fisico.materia_organica_pct < 0 ||
      suelo.fisico.materia_organica_pct > 100
    ) {
      return {
        valida: false,
        error: "La materia orgánica debe estar entre 0% y 100%",
      };
    }
  }

  if (suelo.fisico?.profundidad_efectiva_cm != null) {
    if (suelo.fisico.profundidad_efectiva_cm < 0) {
      return {
        valida: false,
        error: "La profundidad efectiva no puede ser negativa",
      };
    }
  }

  if (suelo.quimico?.salinidad_dS_m != null) {
    if (suelo.quimico.salinidad_dS_m < 0) {
      return { valida: false, error: "La salinidad no puede ser negativa" };
    }
  }

  if (suelo.quimico?.boro_mg_l != null) {
    if (suelo.quimico.boro_mg_l < 0) {
      return { valida: false, error: "El boro no puede ser negativo" };
    }
  }

  if (suelo.quimico?.arsenico_mg_l != null) {
    if (suelo.quimico.arsenico_mg_l < 0) {
      return { valida: false, error: "El arsénico no puede ser negativo" };
    }
  }

  if (suelo.quimico?.nitrogeno_ppm != null) {
    if (suelo.quimico.nitrogeno_ppm < 0) {
      return { valida: false, error: "El nitrógeno no puede ser negativo" };
    }
  }

  if (suelo.quimico?.fosforo_ppm != null) {
    if (suelo.quimico.fosforo_ppm < 0) {
      return { valida: false, error: "El fósforo no puede ser negativo" };
    }
  }

  if (suelo.quimico?.potasio_ppm != null) {
    if (suelo.quimico.potasio_ppm < 0) {
      return { valida: false, error: "El potasio no puede ser negativo" };
    }
  }

  return { valida: true };
}
