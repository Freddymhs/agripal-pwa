import type { CatalogoCultivo } from "@/types";
import { KC_POR_CULTIVO } from "@/lib/data/kc-cultivos";
import { DURACION_ETAPAS } from "@/lib/data/duracion-etapas";

export interface DataConsistencyReport {
  cultivos_catalogoArica: string[];
  cultivos_conKc: string[];
  cultivos_conDuracion: string[];
  campos_faltantes: Array<{
    cultivo: string;
    campos: string[];
  }>;
  cultivos_sin_cobertura_kc: string[];
  cultivos_sin_cobertura_duracion: string[];
  duplicados_en_kc: string[];
  duplicados_en_duracion: string[];
}

export function verificarConsistenciaData(
  cultivos: CatalogoCultivo[],
): DataConsistencyReport {
  const cultivosArica = cultivos.map((c) => c.id);
  const cultivosKc = Object.keys(KC_POR_CULTIVO);
  const cultivosDuracion = Object.keys(DURACION_ETAPAS);

  // Verificar campos requeridos
  const camposFaltantes: Array<{ cultivo: string; campos: string[] }> = [];

  for (const cultivo of cultivos) {
    const faltantes: string[] = [];

    if (!cultivo.agua_m3_ha_año_min || cultivo.agua_m3_ha_año_min === null)
      faltantes.push("agua_m3_ha_año_min");
    if (!cultivo.agua_m3_ha_año_max || cultivo.agua_m3_ha_año_max === null)
      faltantes.push("agua_m3_ha_año_max");
    if (
      !cultivo.espaciado_recomendado_m ||
      cultivo.espaciado_recomendado_m === null
    )
      faltantes.push("espaciado_recomendado_m");
    if (
      !cultivo.tiempo_produccion_meses ||
      cultivo.tiempo_produccion_meses === null
    )
      faltantes.push("tiempo_produccion_meses");

    if (faltantes.length > 0) {
      camposFaltantes.push({
        cultivo: cultivo.id,
        campos: faltantes,
      });
    }
  }

  const sinCoberturaKc = cultivosArica.filter((id) => {
    const cultivo = cultivos.find((c) => c.id === id);
    if (!cultivo) return true;

    const nombreLower = cultivo.nombre.toLowerCase();
    const nameParts = nombreLower.split(" ");

    // Buscar match en KC
    return !cultivosKc.some((kcCultivo) => {
      const kcLower = kcCultivo.toLowerCase();
      return (
        nombreLower.includes(kcLower) ||
        kcLower.includes(nombreLower) ||
        nameParts.some((part: string) => part === kcLower || kcLower === part)
      );
    });
  });

  const sinCoberturaD = cultivosArica.filter((id) => {
    const cultivo = cultivos.find((c) => c.id === id);
    if (!cultivo) return true;

    const nombreLower = cultivo.nombre.toLowerCase();
    const nameParts = nombreLower.split(" ");

    // Buscar match en Duración
    return !cultivosDuracion.some((dCultivo) => {
      const dLower = dCultivo.toLowerCase();
      return (
        nombreLower.includes(dLower) ||
        dLower.includes(nombreLower) ||
        nameParts.some((part: string) => part === dLower || dLower === part)
      );
    });
  });

  // Detectar duplicados (mismos valores en estructura)
  const kcDuplicados: string[] = [];
  const seenKc = new Map<string, string>();

  for (const [cultivo, kcs] of Object.entries(KC_POR_CULTIVO)) {
    const kcSignature = JSON.stringify(kcs);
    if (seenKc.has(kcSignature)) {
      kcDuplicados.push(`${cultivo} (igual a ${seenKc.get(kcSignature)})`);
    } else {
      seenKc.set(kcSignature, cultivo);
    }
  }

  const dDuplicados: string[] = [];
  const seenD = new Map<string, string>();

  for (const [cultivo, duraciones] of Object.entries(DURACION_ETAPAS)) {
    const dSignature = JSON.stringify(duraciones);
    if (seenD.has(dSignature)) {
      dDuplicados.push(`${cultivo} (igual a ${seenD.get(dSignature)})`);
    } else {
      seenD.set(dSignature, cultivo);
    }
  }

  return {
    cultivos_catalogoArica: cultivosArica,
    cultivos_conKc: cultivosKc,
    cultivos_conDuracion: cultivosDuracion,
    campos_faltantes: camposFaltantes,
    cultivos_sin_cobertura_kc: sinCoberturaKc,
    cultivos_sin_cobertura_duracion: sinCoberturaD,
    duplicados_en_kc: kcDuplicados,
    duplicados_en_duracion: dDuplicados,
  };
}
