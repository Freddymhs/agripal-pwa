import { describe, it, expect } from "vitest";
import { obtenerEnmienda, sugerirEnmiendas } from "../enmiendas-suelo";
import type { Enmienda } from "../enmiendas-suelo";

const enmiendas: Enmienda[] = [
  {
    id: "azufre-agricola",
    nombre: "Azufre Agrícola",
    tipo: "quimico",
    npk: { n: 0, p: 0, k: 0 },
    efecto_ph: -0.5,
    dosis_kg_m2: 0.1,
    frecuencia_meses: 6,
    tiempo_efecto_dias: 30,
    costo_kg_clp: 1200,
    notas: "Reduce pH alcalino",
  },
  {
    id: "cal-agricola",
    nombre: "Cal Agrícola",
    tipo: "enmienda",
    npk: { n: 0, p: 0, k: 0 },
    efecto_ph: 0.5,
    dosis_kg_m2: 0.2,
    frecuencia_meses: 12,
    tiempo_efecto_dias: 60,
    costo_kg_clp: 500,
    notas: "Sube pH ácido",
  },
  {
    id: "yeso-agricola",
    nombre: "Yeso Agrícola",
    tipo: "quimico",
    npk: { n: 0, p: 0, k: 0 },
    efecto_ph: 0,
    dosis_kg_m2: 0.3,
    frecuencia_meses: 12,
    tiempo_efecto_dias: 45,
    costo_kg_clp: 800,
    notas: "Reduce salinidad",
  },
];

describe("obtenerEnmienda", () => {
  it("returns enmienda by id", () => {
    const result = obtenerEnmienda(enmiendas, "cal-agricola");
    expect(result?.nombre).toBe("Cal Agrícola");
  });

  it("returns undefined for unknown id", () => {
    expect(obtenerEnmienda(enmiendas, "no-existe")).toBeUndefined();
  });
});

describe("sugerirEnmiendas", () => {
  it("returns empty array when ph and salinidad are not an issue", () => {
    const result = sugerirEnmiendas(enmiendas, 7.0, false);
    expect(result).toHaveLength(0);
  });

  it("suggests azufre when ph > 7.5", () => {
    const result = sugerirEnmiendas(enmiendas, 8.0, false);
    expect(result.some((e) => e.id === "azufre-agricola")).toBe(true);
  });

  it("does NOT suggest azufre when ph <= 7.5", () => {
    const result = sugerirEnmiendas(enmiendas, 7.5, false);
    expect(result.some((e) => e.id === "azufre-agricola")).toBe(false);
  });

  it("suggests cal when ph < 5.5", () => {
    const result = sugerirEnmiendas(enmiendas, 5.0, false);
    expect(result.some((e) => e.id === "cal-agricola")).toBe(true);
  });

  it("does NOT suggest cal when ph >= 5.5", () => {
    const result = sugerirEnmiendas(enmiendas, 6.0, false);
    expect(result.some((e) => e.id === "cal-agricola")).toBe(false);
  });

  it("suggests yeso when salinidadAlta is true", () => {
    const result = sugerirEnmiendas(enmiendas, undefined, true);
    expect(result.some((e) => e.id === "yeso-agricola")).toBe(true);
  });

  it("can suggest multiple enmiendas at once", () => {
    // pH muy ácido + salinidad alta → cal + yeso
    const result = sugerirEnmiendas(enmiendas, 4.5, true);
    expect(result.some((e) => e.id === "cal-agricola")).toBe(true);
    expect(result.some((e) => e.id === "yeso-agricola")).toBe(true);
  });

  it("returns empty when enmiendas list is empty", () => {
    const result = sugerirEnmiendas([], 8.0, true);
    expect(result).toHaveLength(0);
  });

  it("works when ph is undefined", () => {
    const result = sugerirEnmiendas(enmiendas, undefined, false);
    expect(result).toHaveLength(0);
  });
});
