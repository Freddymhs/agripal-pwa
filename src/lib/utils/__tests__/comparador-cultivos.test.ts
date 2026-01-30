import { describe, it, expect } from "vitest";
import type { CatalogoCultivo, Zona } from "@/types";
import { compararCultivos } from "../comparador-cultivos";

const zonaFixture: Zona = {
  id: "zona-1",
  terreno_id: "terreno-1",
  nombre: "Zona Test",
  tipo: "cultivo",
  estado: "activa",
  x: 0,
  y: 0,
  ancho: 100,
  alto: 100,
  area_m2: 10000,
  color: "#22c55e",
  notas: "",
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

const olivoFixture = {
  id: "cultivo-olivo",
  proyecto_id: "p-1",
  nombre: "Olivo",
  agua_m3_ha_año_min: 5000,
  agua_m3_ha_año_max: 7000,
  espaciado_min_m: 5,
  espaciado_recomendado_m: 6,
  ph_min: 6.0,
  ph_max: 8.5,
  salinidad_tolerancia_dS_m: 4.0,
  boro_tolerancia_ppm: 2.0,
  tolerancia_boro: "alta",
  tolerancia_salinidad: "alta",
  calendario: {
    meses_siembra: [3, 4],
    meses_cosecha: [5, 6, 7],
    meses_descanso: [8],
  },
  produccion: {
    produccion_kg_ha_año2: 2000,
    produccion_kg_ha_año3: 5000,
    produccion_kg_ha_año4: 8000,
    vida_util_dias: 365 * 30,
  },
  precio_kg_min_clp: 3000,
  precio_kg_max_clp: 5000,
  precio_planta_clp: 8000,
  plagas: [],
  tiempo_produccion_meses: 36,
  vida_util_años: 30,
  tier: 1,
  riesgo: "bajo",
  notas: "",
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
} as CatalogoCultivo;

const tomateFixture = {
  id: "cultivo-tomate",
  proyecto_id: "p-1",
  nombre: "Tomate",
  agua_m3_ha_año_min: 8000,
  agua_m3_ha_año_max: 12000,
  espaciado_min_m: 0.4,
  espaciado_recomendado_m: 0.5,
  ph_min: 5.5,
  ph_max: 7.5,
  salinidad_tolerancia_dS_m: 2.5,
  boro_tolerancia_ppm: 1.0,
  tolerancia_boro: "media",
  tolerancia_salinidad: "media",
  calendario: {
    meses_siembra: [9, 10],
    meses_cosecha: [1, 2, 3],
    meses_descanso: [4, 5],
  },
  produccion: {
    produccion_kg_ha_año2: 40000,
    produccion_kg_ha_año3: 60000,
    produccion_kg_ha_año4: 50000,
    vida_util_dias: 365,
  },
  precio_kg_min_clp: 800,
  precio_kg_max_clp: 1500,
  precio_planta_clp: 500,
  plagas: [],
  tiempo_produccion_meses: 4,
  vida_util_años: 1,
  tier: 1,
  riesgo: "bajo",
  notas: "",
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
} as CatalogoCultivo;

describe("compararCultivos", () => {
  it("returns array with same length as input cultivos", () => {
    const result = compararCultivos(
      [olivoFixture, tomateFixture],
      zonaFixture,
      null,
      200,
    );
    expect(result).toHaveLength(2);
  });

  it("each result has roi, metricas, consumoAguaAnualM3, and factorSuelo", () => {
    const result = compararCultivos([olivoFixture], zonaFixture, null, 200);
    const entry = result[0];

    expect(entry.roi).toBeDefined();
    expect(entry.metricas).toBeDefined();
    expect(entry.consumoAguaAnualM3).toBeGreaterThan(0);
    expect(entry.factorSuelo).toBeDefined();
    expect(entry.cultivo.id).toBe("cultivo-olivo");
  });

  it("returns factorSuelo=1.0 for all when suelo is null", () => {
    const result = compararCultivos(
      [olivoFixture, tomateFixture],
      zonaFixture,
      null,
      200,
    );
    for (const entry of result) {
      expect(entry.factorSuelo).toBe(1.0);
    }
  });

  it("higher water cultivo has higher consumoAguaAnualM3", () => {
    const result = compararCultivos(
      [olivoFixture, tomateFixture],
      zonaFixture,
      null,
      200,
    );
    const olivoResult = result.find((r) => r.cultivo.id === "cultivo-olivo")!;
    const tomateResult = result.find((r) => r.cultivo.id === "cultivo-tomate")!;

    expect(tomateResult.consumoAguaAnualM3).toBeGreaterThan(
      olivoResult.consumoAguaAnualM3,
    );
  });
});
