import type { Zona, EntradaAgua, Planta, CatalogoCultivo } from "@/types";
import { calcularConsumoTerreno } from "./agua";
import { SEMANAS_POR_AÑO, DIAS_POR_AÑO } from "@/lib/constants/conversiones";

/** Llenadas estimadas por año cuando no hay historial (cada ~2 semanas) */
const LLENADAS_POR_AÑO_DEFAULT = 26;

export interface CalculoAguaAnual {
  aguaAnualM3: number;
  metodoCalculo: "historial" | "consumo_cultivos" | "estimacion_default";
  detalles: string;
  confianza: "alta" | "media" | "baja";
}

export function calcularAguaAnualAutomatica(
  estanques: Zona[],
  entradasAgua: EntradaAgua[],
  zonas: Zona[],
  plantas: Planta[],
  catalogoCultivos: CatalogoCultivo[],
): CalculoAguaAnual {
  if (entradasAgua.length >= 2) {
    return calcularPorHistorial(estanques, entradasAgua);
  }

  const consumoSemanal = calcularConsumoTerreno(
    zonas,
    plantas,
    catalogoCultivos,
  );
  if (consumoSemanal > 0) {
    return calcularPorConsumoCultivos(consumoSemanal);
  }

  return calcularEstimacionDefault(estanques);
}

function calcularPorHistorial(
  estanques: Zona[],
  entradasAgua: EntradaAgua[],
): CalculoAguaAnual {
  const entradasOrdenadas = [...entradasAgua].sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
  );

  let sumaDiasEntreEntradas = 0;
  let cantidadIntervalos = 0;

  for (let i = 1; i < entradasOrdenadas.length; i++) {
    const fechaAnterior = new Date(entradasOrdenadas[i - 1].fecha);
    const fechaActual = new Date(entradasOrdenadas[i].fecha);
    const diasEntre =
      (fechaActual.getTime() - fechaAnterior.getTime()) / (1000 * 60 * 60 * 24);

    if (diasEntre > 0 && diasEntre < DIAS_POR_AÑO) {
      sumaDiasEntreEntradas += diasEntre;
      cantidadIntervalos++;
    }
  }

  if (cantidadIntervalos === 0) {
    return calcularEstimacionDefault(estanques);
  }

  const promedioEntreLlenadas = sumaDiasEntreEntradas / cantidadIntervalos;
  const capacidadTotal = estanques.reduce(
    (sum, e) => sum + (e.estanque_config?.capacidad_m3 || 0),
    0,
  );
  const llenadaPorAño = DIAS_POR_AÑO / promedioEntreLlenadas;
  const aguaAnual = capacidadTotal * llenadaPorAño;

  return {
    aguaAnualM3: Math.round(aguaAnual),
    metodoCalculo: "historial",
    detalles: `Basado en ${entradasAgua.length} entradas. Promedio cada ${Math.round(promedioEntreLlenadas)} días → ${Math.round(llenadaPorAño)} llenadas/año`,
    confianza: entradasAgua.length >= 4 ? "alta" : "media",
  };
}

function calcularPorConsumoCultivos(consumoSemanal: number): CalculoAguaAnual {
  const aguaAnual = consumoSemanal * SEMANAS_POR_AÑO;

  return {
    aguaAnualM3: Math.round(aguaAnual),
    metodoCalculo: "consumo_cultivos",
    detalles: `Basado en consumo de cultivos: ${consumoSemanal.toFixed(1)} m³/semana × 52 semanas`,
    confianza: "baja",
  };
}

function calcularEstimacionDefault(estanques: Zona[]): CalculoAguaAnual {
  const capacidadTotal = estanques.reduce(
    (sum, e) => sum + (e.estanque_config?.capacidad_m3 || 0),
    0,
  );
  const aguaAnual = capacidadTotal * LLENADAS_POR_AÑO_DEFAULT;

  return {
    aguaAnualM3: Math.round(aguaAnual),
    metodoCalculo: "estimacion_default",
    detalles: `Estimación conservadora: ${capacidadTotal.toFixed(1)} m³ × ${LLENADAS_POR_AÑO_DEFAULT} llenadas/año (cada 2 semanas)`,
    confianza: "baja",
  };
}
