import { describe, it, expect } from "vitest";
import { evaluarSuelo, NIVEL_ALERTA } from "../umbrales-suelo";
import type { SueloTerreno } from "@/types";

const sueloOk: SueloTerreno = {
  fisico: {
    textura: "franco",
    ph: 7.0,
    profundidad_efectiva_cm: 80,
  },
  quimico: {
    analisis_realizado: true,
    salinidad_dS_m: 1.0,
    boro_mg_l: 0.5,
    arsenico_mg_l: 0.01,
  },
} as SueloTerreno;

describe("evaluarSuelo", () => {
  it("returns viable=true and nivel=ok for good soil", () => {
    const result = evaluarSuelo(sueloOk);
    expect(result.viable).toBe(true);
    expect(result.nivel).toBe(NIVEL_ALERTA.OK);
    expect(result.problemas).toHaveLength(0);
  });

  it("returns advertencia when no analisis_realizado", () => {
    const suelo: SueloTerreno = {
      ...sueloOk,
      quimico: { ...sueloOk.quimico!, analisis_realizado: false },
    } as SueloTerreno;
    const result = evaluarSuelo(suelo);
    expect(result.advertencias.some((a) => a.includes("laboratorio"))).toBe(
      true,
    );
  });

  it("returns critico when salinidad > 4 dS/m", () => {
    const suelo: SueloTerreno = {
      ...sueloOk,
      quimico: { ...sueloOk.quimico!, salinidad_dS_m: 5.0 },
    } as SueloTerreno;
    const result = evaluarSuelo(suelo);
    expect(result.viable).toBe(false);
    expect(result.nivel).toBe(NIVEL_ALERTA.CRITICO);
    expect(result.problemas.some((p) => p.includes("Salinidad"))).toBe(true);
  });

  it("returns advertencia when salinidad is close to limit (> 4*0.75=3 dS/m)", () => {
    const suelo: SueloTerreno = {
      ...sueloOk,
      quimico: { ...sueloOk.quimico!, salinidad_dS_m: 3.5 },
    } as SueloTerreno;
    const result = evaluarSuelo(suelo);
    expect(result.viable).toBe(true);
    expect(result.advertencias.some((a) => a.includes("Salinidad"))).toBe(true);
  });

  it("returns critico when boro > 2 mg/L", () => {
    const suelo: SueloTerreno = {
      ...sueloOk,
      quimico: { ...sueloOk.quimico!, boro_mg_l: 3.0 },
    } as SueloTerreno;
    const result = evaluarSuelo(suelo);
    expect(result.viable).toBe(false);
    expect(result.problemas.some((p) => p.includes("Boro"))).toBe(true);
  });

  it("returns advertencia when boro is close to limit (> 2*0.75=1.5 mg/L)", () => {
    const suelo: SueloTerreno = {
      ...sueloOk,
      quimico: { ...sueloOk.quimico!, boro_mg_l: 1.8 },
    } as SueloTerreno;
    const result = evaluarSuelo(suelo);
    expect(result.advertencias.some((a) => a.includes("Boro"))).toBe(true);
  });

  it("returns critico when arsenico > 0.05 mg/L", () => {
    const suelo: SueloTerreno = {
      ...sueloOk,
      quimico: { ...sueloOk.quimico!, arsenico_mg_l: 0.1 },
    } as SueloTerreno;
    const result = evaluarSuelo(suelo);
    expect(result.viable).toBe(false);
    expect(result.problemas.some((p) => p.includes("Arsénico"))).toBe(true);
  });

  it("returns advertencia when pH out of 5.5-8.5 range", () => {
    const suelo: SueloTerreno = {
      ...sueloOk,
      fisico: { ...sueloOk.fisico!, ph: 4.5 },
    } as SueloTerreno;
    const result = evaluarSuelo(suelo);
    expect(result.advertencias.some((a) => a.includes("pH"))).toBe(true);
  });

  it("returns advertencia when profundidad < 60 cm", () => {
    const suelo: SueloTerreno = {
      ...sueloOk,
      fisico: { ...sueloOk.fisico!, profundidad_efectiva_cm: 40 },
    } as SueloTerreno;
    const result = evaluarSuelo(suelo);
    expect(result.advertencias.some((a) => a.includes("Profundidad"))).toBe(
      true,
    );
  });

  it("returns advertencia nivel (not critico) when only warnings", () => {
    const suelo: SueloTerreno = {
      ...sueloOk,
      quimico: { ...sueloOk.quimico!, salinidad_dS_m: 3.5 },
    } as SueloTerreno;
    const result = evaluarSuelo(suelo);
    expect(result.nivel).toBe(NIVEL_ALERTA.ADVERTENCIA);
  });

  it("returns ok for undefined suelo", () => {
    const result = evaluarSuelo(undefined);
    expect(result.viable).toBe(true);
    // No quimico → adds "laboratorio" advertencia
    expect(result.advertencias.length).toBeGreaterThanOrEqual(1);
  });
});
