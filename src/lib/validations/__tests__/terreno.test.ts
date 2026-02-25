import { describe, it, expect } from "vitest";
import { validarTerreno } from "../terreno";

describe("validarTerreno", () => {
  it("acepta terreno con datos validos", () => {
    const result = validarTerreno({
      nombre: "Mi terreno",
      ancho_m: 100,
      alto_m: 50,
    });
    expect(result.valida).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("rechaza nombre vacio", () => {
    const result = validarTerreno({
      nombre: "",
      ancho_m: 100,
      alto_m: 50,
    });
    expect(result.valida).toBe(false);
    expect(result.error).toContain("nombre");
  });

  it("rechaza nombre con solo espacios", () => {
    const result = validarTerreno({
      nombre: "   ",
      ancho_m: 100,
      alto_m: 50,
    });
    expect(result.valida).toBe(false);
    expect(result.error).toContain("nombre");
  });

  it("rechaza ancho negativo", () => {
    const result = validarTerreno({
      nombre: "Terreno",
      ancho_m: -10,
      alto_m: 50,
    });
    expect(result.valida).toBe(false);
    expect(result.error).toContain("ancho");
  });

  it("rechaza ancho igual a 0", () => {
    const result = validarTerreno({
      nombre: "Terreno",
      ancho_m: 0,
      alto_m: 50,
    });
    expect(result.valida).toBe(false);
    expect(result.error).toContain("ancho");
  });

  it("rechaza alto negativo", () => {
    const result = validarTerreno({
      nombre: "Terreno",
      ancho_m: 100,
      alto_m: -5,
    });
    expect(result.valida).toBe(false);
    expect(result.error).toContain("alto");
  });

  it("rechaza alto igual a 0", () => {
    const result = validarTerreno({
      nombre: "Terreno",
      ancho_m: 100,
      alto_m: 0,
    });
    expect(result.valida).toBe(false);
    expect(result.error).toContain("alto");
  });

  it("rechaza ancho que no es numero", () => {
    const result = validarTerreno({
      nombre: "Terreno",
      ancho_m: "abc" as unknown as number,
      alto_m: 50,
    });
    expect(result.valida).toBe(false);
    expect(result.error).toContain("ancho");
  });

  it("rechaza alto que no es numero", () => {
    const result = validarTerreno({
      nombre: "Terreno",
      ancho_m: 100,
      alto_m: NaN,
    });
    expect(result.valida).toBe(false);
    expect(result.error).toContain("alto");
  });
});
