import { describe, it, expect } from "vitest";
import {
  verificarCompatibilidadPorIds,
  mapearNombresAIds,
  getNivelMayorIncompatibilidad,
} from "../compatibilidad-insumos";
import { NIVEL_INCOMPATIBILIDAD } from "@/lib/constants/entities";

describe("verificarCompatibilidadPorIds", () => {
  it("returns empty array for fewer than 2 ids", () => {
    expect(verificarCompatibilidadPorIds([])).toHaveLength(0);
    expect(verificarCompatibilidadPorIds(["sulfato-calcio"])).toHaveLength(0);
  });

  it("detects known incompatibility between sulfato-calcio and fosfato-monoamonico", () => {
    const result = verificarCompatibilidadPorIds([
      "sulfato-calcio",
      "fosfato-monoamonico",
    ]);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].nivel).toBe("alto");
  });

  it("returns empty for two compatible products", () => {
    // IDs que no tienen incompatibilidad registrada
    const result = verificarCompatibilidadPorIds([
      "agua",
      "fertilizante-generico",
    ]);
    expect(result).toHaveLength(0);
  });

  it("each result has insumo_a, insumo_b, nivel, razon and recomendacion", () => {
    const result = verificarCompatibilidadPorIds([
      "sulfato-calcio",
      "fosfato-monoamonico",
    ]);
    if (result.length > 0) {
      expect(result[0]).toHaveProperty("insumo_a");
      expect(result[0]).toHaveProperty("insumo_b");
      expect(result[0]).toHaveProperty("nivel");
      expect(result[0]).toHaveProperty("razon");
      expect(result[0]).toHaveProperty("recomendacion");
    }
  });

  it("detects incompatibility for nitrato-calcio and fosfato-monoamonico", () => {
    const result = verificarCompatibilidadPorIds([
      "nitrato-calcio",
      "fosfato-monoamonico",
    ]);
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("mapearNombresAIds", () => {
  const catalogo = [
    { id: "sulfato-calcio", nombre: "Sulfato de Calcio" },
    { id: "fosfato-monoamonico", nombre: "MAP" },
    { id: "nitrato-calcio", nombre: "Nitrato de Calcio" },
  ] as const;

  it("maps display names to slug ids", () => {
    const result = mapearNombresAIds(
      ["Sulfato de Calcio", "MAP"],
      catalogo as never,
    );
    expect(result).toEqual(["sulfato-calcio", "fosfato-monoamonico"]);
  });

  it("filters out names not found in catalogo", () => {
    const result = mapearNombresAIds(["No Existe"], catalogo as never);
    expect(result).toHaveLength(0);
  });

  it("returns empty for empty nombres array", () => {
    expect(mapearNombresAIds([], catalogo as never)).toHaveLength(0);
  });
});

describe("getNivelMayorIncompatibilidad", () => {
  it("returns ninguno for empty list", () => {
    expect(getNivelMayorIncompatibilidad([])).toBe(
      NIVEL_INCOMPATIBILIDAD.NINGUNO,
    );
  });

  it("returns alto when any incompatibilidad has nivel alto", () => {
    const lista = [
      {
        insumo_a: "a",
        insumo_b: "b",
        nivel: NIVEL_INCOMPATIBILIDAD.MEDIO,
        razon: "",
        recomendacion: "",
      },
      {
        insumo_a: "c",
        insumo_b: "d",
        nivel: NIVEL_INCOMPATIBILIDAD.ALTO,
        razon: "",
        recomendacion: "",
      },
    ];
    expect(getNivelMayorIncompatibilidad(lista)).toBe(
      NIVEL_INCOMPATIBILIDAD.ALTO,
    );
  });

  it("returns medio when only medio incompatibilidades", () => {
    const lista = [
      {
        insumo_a: "a",
        insumo_b: "b",
        nivel: NIVEL_INCOMPATIBILIDAD.MEDIO,
        razon: "",
        recomendacion: "",
      },
    ];
    expect(getNivelMayorIncompatibilidad(lista)).toBe(
      NIVEL_INCOMPATIBILIDAD.MEDIO,
    );
  });

  it("alto takes priority over medio", () => {
    const lista = [
      {
        insumo_a: "a",
        insumo_b: "b",
        nivel: NIVEL_INCOMPATIBILIDAD.ALTO,
        razon: "",
        recomendacion: "",
      },
      {
        insumo_a: "c",
        insumo_b: "d",
        nivel: NIVEL_INCOMPATIBILIDAD.MEDIO,
        razon: "",
        recomendacion: "",
      },
    ];
    expect(getNivelMayorIncompatibilidad(lista)).toBe(
      NIVEL_INCOMPATIBILIDAD.ALTO,
    );
  });
});
