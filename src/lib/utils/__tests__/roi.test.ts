import { describe, it, expect } from "vitest";
import type {
  CatalogoCultivo,
  Zona,
  Terreno,
  FuenteAgua,
  ConfiguracionRecarga,
} from "@/types";
import { obtenerCostoAguaM3, calcularROI } from "../roi";

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

const cultivoFixture: CatalogoCultivo = {
  id: "cultivo-1",
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

const terrenoFixture: Terreno = {
  id: "terreno-1",
  proyecto_id: "p-1",
  nombre: "Terreno Test",
  ancho_m: 100,
  alto_m: 100,
  area_m2: 10000,
  agua_disponible_m3: 50,
  agua_recarga_anual_m3: 600,
  agua_actual_m3: 50,
  agua_costo_clp_por_m3: 500,
  sistema_riego: {
    litros_hora: 100,
    descuento_auto: true,
    ultima_actualizacion: "2025-01-01T00:00:00Z",
  },
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
} as Terreno;

describe("obtenerCostoAguaM3", () => {
  it("returns fuente.costo_m3_clp when available", () => {
    const fuente: FuenteAgua = {
      id: "f-1",
      nombre: "Pozo",
      tipo: "pozo",
      costo_m3_clp: 300,
    };
    const result = obtenerCostoAguaM3(fuente, terrenoFixture);
    expect(result).toBe(300);
  });

  it("falls back to terreno.agua_costo_clp_por_m3 when fuente has no cost", () => {
    const fuente: FuenteAgua = { id: "f-2", nombre: "Rio", tipo: "rio" };
    const result = obtenerCostoAguaM3(fuente, terrenoFixture);
    expect(result).toBe(500);
  });

  it("calculates from recargaConfig when no direct cost", () => {
    const terrenoSinCosto = {
      ...terrenoFixture,
      agua_costo_clp_por_m3: undefined,
    } as Terreno;
    const recarga: ConfiguracionRecarga = {
      frecuencia_dias: 7,
      cantidad_litros: 5000,
      ultima_recarga: "2025-01-01T00:00:00Z",
      proxima_recarga: "2025-01-08T00:00:00Z",
      costo_recarga_clp: 2500,
    };
    const result = obtenerCostoAguaM3(null, terrenoSinCosto, recarga);
    expect(result).toBe(500);
  });
});

describe("calcularROI", () => {
  const espaciadoM2 = cultivoFixture.espaciado_recomendado_m ** 2;
  const plantasPorHa = 10000 / espaciadoM2;
  const numPlantas = 277;
  const factorArea = numPlantas / plantasPorHa;
  const costoAguaM3 = 200;

  it("returns correct kg production for years 2-4", () => {
    const result = calcularROI(
      cultivoFixture,
      zonaFixture,
      numPlantas,
      costoAguaM3,
    );

    expect(result.kg_año2).toBeCloseTo(
      cultivoFixture.produccion.produccion_kg_ha_año2 * factorArea,
      0,
    );
    expect(result.kg_año3).toBeCloseTo(
      cultivoFixture.produccion.produccion_kg_ha_año3 * factorArea,
      0,
    );
    expect(result.kg_año4).toBeCloseTo(
      cultivoFixture.produccion.produccion_kg_ha_año4 * factorArea,
      0,
    );
  });

  it("returns viable=true for a profitable cultivo", () => {
    const result = calcularROI(
      cultivoFixture,
      zonaFixture,
      numPlantas,
      costoAguaM3,
    );

    expect(result.viable).toBe(true);
    expect(result.roi_4_años_pct).toBeGreaterThan(0);
    expect(result.punto_equilibrio_meses).toBeGreaterThan(0);
    expect(result.punto_equilibrio_meses).toBeLessThanOrEqual(48);
  });

  it("returns viable=false when water cost is extremely high", () => {
    const result = calcularROI(cultivoFixture, zonaFixture, numPlantas, 50000);

    expect(result.viable).toBe(false);
    expect(result.roi_4_años_pct).toBeLessThan(0);
  });

  it("applies suelo factor to reduce kg production", () => {
    const sueloBueno = calcularROI(
      cultivoFixture,
      zonaFixture,
      numPlantas,
      costoAguaM3,
    );
    const sueloMalo = calcularROI(
      cultivoFixture,
      zonaFixture,
      numPlantas,
      costoAguaM3,
      undefined,
      {
        fisico: { ph: 4.0 },
        quimico: { salinidad_dS_m: 8.0, boro_mg_l: 5.0 },
      },
    );

    expect(sueloMalo.kg_año3).toBeLessThan(sueloBueno.kg_año3);
    expect(sueloMalo.kg_año4).toBeLessThan(sueloBueno.kg_año4);
  });

  it("uses consumoSemanalReal when provided", () => {
    const sinReal = calcularROI(
      cultivoFixture,
      zonaFixture,
      numPlantas,
      costoAguaM3,
    );
    const conReal = calcularROI(
      cultivoFixture,
      zonaFixture,
      numPlantas,
      costoAguaM3,
      50,
    );

    expect(conReal.costo_agua_anual).toBe(50 * 52 * costoAguaM3);
    expect(conReal.costo_agua_anual).not.toBe(sinReal.costo_agua_anual);
  });
});
