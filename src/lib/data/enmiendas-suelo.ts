export interface Enmienda {
  id: string;
  nombre: string;
  tipo: "organico" | "quimico" | "enmienda";
  npk: { n: number; p: number; k: number };
  efecto_ph: number;
  dosis_kg_m2: number;
  frecuencia_meses: number;
  tiempo_efecto_dias: number;
  costo_kg_clp: number;
  notas: string;
}

export function obtenerEnmienda(
  enmiendas: Enmienda[],
  id: string,
): Enmienda | undefined {
  return enmiendas.find((e) => e.id === id);
}

export function sugerirEnmiendas(
  enmiendas: Enmienda[],
  ph?: number,
  salinidadAlta?: boolean,
): Enmienda[] {
  const sugerencias: Enmienda[] = [];

  if (ph != null && ph > 7.5) {
    const azufre = enmiendas.find((e) => e.id === "azufre-agricola");
    if (azufre) sugerencias.push(azufre);
  }

  if (ph != null && ph < 5.5) {
    const cal = enmiendas.find((e) => e.id === "cal-agricola");
    if (cal) sugerencias.push(cal);
  }

  if (salinidadAlta) {
    const yeso = enmiendas.find((e) => e.id === "yeso-agricola");
    if (yeso) sugerencias.push(yeso);
  }

  return sugerencias;
}
