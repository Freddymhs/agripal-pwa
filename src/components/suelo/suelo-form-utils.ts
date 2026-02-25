export type NivelIndicador = "ok" | "advertencia" | "critico" | "neutral";

export function getIndicador(
  valor: number | undefined,
  umbral: { max?: number; min?: number },
): NivelIndicador {
  if (valor === undefined) return "neutral";
  if (umbral.max !== undefined && valor > umbral.max) return "critico";
  if (umbral.min !== undefined && valor < umbral.min) return "critico";
  if (umbral.max !== undefined && umbral.min !== undefined) {
    const rango = umbral.max - umbral.min;
    if (valor < umbral.min + rango * 0.15 || valor > umbral.max - rango * 0.15)
      return "advertencia";
    return "ok";
  }
  if (umbral.max !== undefined && valor > umbral.max * 0.75)
    return "advertencia";
  return "ok";
}

export function safeParseFloat(val: string): number | undefined {
  if (val === "") return undefined;
  const num = parseFloat(val);
  return Number.isNaN(num) ? undefined : num;
}

export function safeParseInt(val: string): number | undefined {
  if (val === "") return undefined;
  const num = parseInt(val);
  return Number.isNaN(num) ? undefined : num;
}

export const coloresIndicador: Record<NivelIndicador, string> = {
  ok: "border-green-500 bg-green-50",
  advertencia: "border-yellow-500 bg-yellow-50",
  critico: "border-red-500 bg-red-50",
  neutral: "border-gray-300",
};

export function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
