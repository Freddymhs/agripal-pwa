import { describe, it, expect } from "vitest";
import { validarProyecto } from "../proyecto";

describe("validarProyecto", () => {
  it("acepta nombre valido", () => {
    const result = validarProyecto({ nombre: "Mi proyecto" });
    expect(result.valida).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("rechaza nombre vacio", () => {
    const result = validarProyecto({ nombre: "" });
    expect(result.valida).toBe(false);
    expect(result.error).toContain("nombre");
  });

  it("rechaza nombre con solo espacios en blanco", () => {
    const result = validarProyecto({ nombre: "   " });
    expect(result.valida).toBe(false);
    expect(result.error).toContain("nombre");
  });

  it("acepta nombre con un solo caracter", () => {
    const result = validarProyecto({ nombre: "A" });
    expect(result.valida).toBe(true);
  });

  it("acepta nombre con caracteres especiales", () => {
    const result = validarProyecto({ nombre: "Proyecto Arica - 2025 (test)" });
    expect(result.valida).toBe(true);
  });

  it("rechaza nombre undefined", () => {
    const result = validarProyecto({ nombre: undefined as unknown as string });
    expect(result.valida).toBe(false);
    expect(result.error).toContain("nombre");
  });

  it("rechaza nombre null", () => {
    const result = validarProyecto({ nombre: null as unknown as string });
    expect(result.valida).toBe(false);
    expect(result.error).toContain("nombre");
  });
});
