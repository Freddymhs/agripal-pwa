import type {
  FuenteAgua,
  CatalogoCultivo,
  CompatibilidadAguaCultivo,
  CompatibilidadNivel,
} from "@/types";

function evaluarCompatibilidadAgua(
  fuente: FuenteAgua,
  cultivo: CatalogoCultivo,
): CompatibilidadAguaCultivo {
  const problemas: string[] = [];

  if (
    fuente.boro_ppm != null &&
    fuente.boro_ppm > cultivo.boro_tolerancia_ppm
  ) {
    const exceso = (fuente.boro_ppm / cultivo.boro_tolerancia_ppm).toFixed(1);
    problemas.push(
      `Boro ${fuente.boro_ppm} ppm excede tolerancia ${cultivo.boro_tolerancia_ppm} ppm (${exceso}x)`,
    );
  }

  if (
    fuente.salinidad_dS_m != null &&
    fuente.salinidad_dS_m > cultivo.salinidad_tolerancia_dS_m
  ) {
    const exceso = (
      fuente.salinidad_dS_m / cultivo.salinidad_tolerancia_dS_m
    ).toFixed(1);
    problemas.push(
      `Salinidad ${fuente.salinidad_dS_m} dS/m excede tolerancia ${cultivo.salinidad_tolerancia_dS_m} dS/m (${exceso}x)`,
    );
  }

  if (fuente.ph != null) {
    if (fuente.ph < cultivo.ph_min) {
      problemas.push(`pH ${fuente.ph} menor al mínimo ${cultivo.ph_min}`);
    } else if (fuente.ph > cultivo.ph_max) {
      problemas.push(`pH ${fuente.ph} mayor al máximo ${cultivo.ph_max}`);
    }
  }

  let nivel: CompatibilidadNivel = "compatible";
  if (problemas.length > 0) {
    const hayBoro =
      fuente.boro_ppm != null && fuente.boro_ppm > cultivo.boro_tolerancia_ppm;
    const hayExcesoGrave =
      hayBoro && fuente.boro_ppm! > cultivo.boro_tolerancia_ppm * 2;
    const haySalinidadGrave =
      fuente.salinidad_dS_m != null &&
      fuente.salinidad_dS_m > cultivo.salinidad_tolerancia_dS_m * 1.5;

    if (hayExcesoGrave || haySalinidadGrave || problemas.length >= 2) {
      nivel = "no_compatible";
    } else {
      nivel = "limitado";
    }
  }

  return {
    cultivo_id: cultivo.id,
    cultivo_nombre: cultivo.nombre,
    nivel,
    problemas,
  };
}

export function evaluarCompatibilidadMultiple(
  fuente: FuenteAgua,
  cultivos: CatalogoCultivo[],
): CompatibilidadAguaCultivo[] {
  return cultivos.map((c) => evaluarCompatibilidadAgua(fuente, c));
}
