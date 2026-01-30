import { describe, it, expect } from "vitest";
import type { Zona, Planta, CatalogoCultivo } from "@/types";
import {
  calcularConsumoZona,
  calcularDiasRestantes,
  determinarEstadoAgua,
} from "../agua";

const zonaFixture: Zona = {
  id: "zona-1",
  terreno_id: "terreno-1",
  nombre: "Zona Test",
  tipo: "cultivo",
  estado: "activa",
  x: 0,
  y: 0,
  ancho: 10,
  alto: 10,
  area_m2: 100,
  color: "#22c55e",
  notas: "",
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

const plantaFixture: Planta = {
  id: "planta-1",
  zona_id: "zona-1",
  tipo_cultivo_id: "cultivo-1",
  x: 1,
  y: 1,
  estado: "creciendo",
  etapa_actual: "adulta",
  fecha_plantacion: "2025-01-01T00:00:00Z",
  notas: "",
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

const cultivoFixture = {
  id: "cultivo-1",
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
  plagas: [],
  tiempo_produccion_meses: 4,
  vida_util_años: 1,
  tier: 1,
  riesgo: "bajo",
  notas: "",
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
} as CatalogoCultivo;

describe("calcularConsumoZona", () => {
  it("returns 0 for zona tipo !== cultivo", () => {
    const zonaEstanque: Zona = { ...zonaFixture, tipo: "estanque" };
    const result = calcularConsumoZona(
      zonaEstanque,
      [plantaFixture],
      [cultivoFixture],
      "verano",
    );
    expect(result).toBe(0);
  });

  it("returns 0 for empty plantas array", () => {
    const result = calcularConsumoZona(
      zonaFixture,
      [],
      [cultivoFixture],
      "verano",
    );
    expect(result).toBe(0);
  });

  it("calculates correct consumption for alive plants", () => {
    const result = calcularConsumoZona(
      zonaFixture,
      [plantaFixture],
      [cultivoFixture],
      "verano",
    );
    // avg=10000, espaciadoM2=0.25, plantasPorHa=40000
    // aguaPorPlantaAño=0.25, aguaPorPlantaSemana=0.25/52
    // result = (0.25/52) * 1.4 * 1.15
    const expected = (0.25 / 52) * 1.4 * 1.15;
    expect(result).toBeCloseTo(expected, 6);
  });

  it("skips dead plants", () => {
    const deadPlanta: Planta = {
      ...plantaFixture,
      id: "planta-dead",
      estado: "muerta",
    };
    const alivePlanta: Planta = { ...plantaFixture, id: "planta-alive" };
    const result = calcularConsumoZona(
      zonaFixture,
      [deadPlanta, alivePlanta],
      [cultivoFixture],
      "verano",
    );
    const singlePlantConsumo = (0.25 / 52) * 1.4 * 1.15;
    expect(result).toBeCloseTo(singlePlantConsumo, 6);
  });
});

describe("calcularDiasRestantes", () => {
  it("returns 999 when consumo is 0", () => {
    const result = calcularDiasRestantes(10, 0);
    expect(result).toBe(999);
  });

  it("returns correct days for valid inputs", () => {
    // 10 m3 agua, 7 m3/week => consumoDiario=1 => 10 days
    const result = calcularDiasRestantes(10, 7);
    expect(result).toBe(10);
  });

  it("returns 0 for NaN inputs", () => {
    expect(calcularDiasRestantes(NaN, 5)).toBe(0);
    expect(calcularDiasRestantes(10, NaN)).toBe(0);
  });
});

describe("determinarEstadoAgua", () => {
  it("returns ok when margin > 20% of necesaria", () => {
    // disponible=130, necesaria=100 => margin=30 > 20
    const result = determinarEstadoAgua(130, 100);
    expect(result).toBe("ok");
  });

  it("returns ajustado when margin >= 0 but <= 20%", () => {
    // disponible=110, necesaria=100 => margin=10, threshold=20
    const result = determinarEstadoAgua(110, 100);
    expect(result).toBe("ajustado");
  });

  it("returns deficit when margin < 0", () => {
    const result = determinarEstadoAgua(80, 100);
    expect(result).toBe("deficit");
  });
});
