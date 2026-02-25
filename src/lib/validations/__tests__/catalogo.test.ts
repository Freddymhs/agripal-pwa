import { describe, it, expect } from "vitest";
import type { CatalogoCultivo } from "@/types";
import { validarCatalogoCultivo } from "../catalogo";

const datosValidosFixture: Partial<CatalogoCultivo> = {
  nombre: "Olivo",
  agua_m3_ha_año_min: 5000,
  agua_m3_ha_año_max: 7000,
  espaciado_min_m: 5,
  espaciado_recomendado_m: 6,
  ph_min: 6.0,
  ph_max: 8.5,
  salinidad_tolerancia_dS_m: 4.0,
  boro_tolerancia_ppm: 2.0,
  precio_kg_min_clp: 3000,
  precio_kg_max_clp: 5000,
  tiempo_produccion_meses: 36,
  vida_util_años: 30,
};

describe("validarCatalogoCultivo", () => {
  it("acepta datos completos y validos", () => {
    const result = validarCatalogoCultivo(datosValidosFixture);
    expect(result.valida).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("rechaza nombre vacio", () => {
    const result = validarCatalogoCultivo({ ...datosValidosFixture, nombre: "" });
    expect(result.valida).toBe(false);
    expect(result.error).toContain("nombre");
  });

  it("rechaza nombre solo con espacios", () => {
    const result = validarCatalogoCultivo({ ...datosValidosFixture, nombre: "   " });
    expect(result.valida).toBe(false);
    expect(result.error).toContain("nombre");
  });

  it("rechaza agua minima <= 0", () => {
    const result = validarCatalogoCultivo({ ...datosValidosFixture, agua_m3_ha_año_min: 0 });
    expect(result.valida).toBe(false);
    expect(result.error).toContain("agua mínima");
  });

  it("rechaza agua maxima <= 0", () => {
    const result = validarCatalogoCultivo({ ...datosValidosFixture, agua_m3_ha_año_max: -1 });
    expect(result.valida).toBe(false);
    expect(result.error).toContain("agua máxima");
  });

  it("rechaza agua minima mayor que maxima", () => {
    const result = validarCatalogoCultivo({
      ...datosValidosFixture,
      agua_m3_ha_año_min: 10000,
      agua_m3_ha_año_max: 5000,
    });
    expect(result.valida).toBe(false);
    expect(result.error).toContain("agua mínima no puede ser mayor");
  });

  it("rechaza espaciado minimo <= 0", () => {
    const result = validarCatalogoCultivo({ ...datosValidosFixture, espaciado_min_m: 0 });
    expect(result.valida).toBe(false);
    expect(result.error).toContain("espaciado mínimo");
  });

  it("rechaza espaciado recomendado <= 0", () => {
    const result = validarCatalogoCultivo({ ...datosValidosFixture, espaciado_recomendado_m: -1 });
    expect(result.valida).toBe(false);
    expect(result.error).toContain("espaciado recomendado");
  });

  it("rechaza espaciado minimo mayor que recomendado", () => {
    const result = validarCatalogoCultivo({
      ...datosValidosFixture,
      espaciado_min_m: 10,
      espaciado_recomendado_m: 5,
    });
    expect(result.valida).toBe(false);
    expect(result.error).toContain("espaciado mínimo no puede ser mayor");
  });

  it("rechaza pH minimo fuera de rango", () => {
    const result = validarCatalogoCultivo({ ...datosValidosFixture, ph_min: -1 });
    expect(result.valida).toBe(false);
    expect(result.error).toContain("pH mínimo");
  });

  it("rechaza pH maximo mayor a 14", () => {
    const result = validarCatalogoCultivo({ ...datosValidosFixture, ph_max: 15 });
    expect(result.valida).toBe(false);
    expect(result.error).toContain("pH máximo");
  });

  it("rechaza pH minimo mayor que maximo", () => {
    const result = validarCatalogoCultivo({
      ...datosValidosFixture,
      ph_min: 9,
      ph_max: 6,
    });
    expect(result.valida).toBe(false);
    expect(result.error).toContain("pH mínimo no puede ser mayor");
  });

  it("rechaza salinidad tolerancia <= 0", () => {
    const result = validarCatalogoCultivo({ ...datosValidosFixture, salinidad_tolerancia_dS_m: 0 });
    expect(result.valida).toBe(false);
    expect(result.error).toContain("salinidad");
  });

  it("rechaza boro tolerancia <= 0", () => {
    const result = validarCatalogoCultivo({ ...datosValidosFixture, boro_tolerancia_ppm: -1 });
    expect(result.valida).toBe(false);
    expect(result.error).toContain("boro");
  });

  it("rechaza precio minimo negativo", () => {
    const result = validarCatalogoCultivo({ ...datosValidosFixture, precio_kg_min_clp: -100 });
    expect(result.valida).toBe(false);
    expect(result.error).toContain("precio mínimo");
  });

  it("rechaza precio maximo negativo", () => {
    const result = validarCatalogoCultivo({ ...datosValidosFixture, precio_kg_max_clp: -100 });
    expect(result.valida).toBe(false);
    expect(result.error).toContain("precio máximo");
  });

  it("rechaza precio minimo mayor que maximo", () => {
    const result = validarCatalogoCultivo({
      ...datosValidosFixture,
      precio_kg_min_clp: 10000,
      precio_kg_max_clp: 5000,
    });
    expect(result.valida).toBe(false);
    expect(result.error).toContain("precio mínimo no puede ser mayor");
  });

  it("rechaza tiempo de produccion <= 0", () => {
    const result = validarCatalogoCultivo({ ...datosValidosFixture, tiempo_produccion_meses: 0 });
    expect(result.valida).toBe(false);
    expect(result.error).toContain("tiempo de producción");
  });

  it("rechaza vida util <= 0", () => {
    const result = validarCatalogoCultivo({ ...datosValidosFixture, vida_util_años: -1 });
    expect(result.valida).toBe(false);
    expect(result.error).toContain("vida útil");
  });

  it("acepta precio minimo igual a 0", () => {
    const result = validarCatalogoCultivo({ ...datosValidosFixture, precio_kg_min_clp: 0, precio_kg_max_clp: 0 });
    expect(result.valida).toBe(true);
  });

  it("acepta pH exacto en limites 0 y 14", () => {
    const result = validarCatalogoCultivo({
      ...datosValidosFixture,
      ph_min: 0,
      ph_max: 14,
    });
    expect(result.valida).toBe(true);
  });
});
