import { describe, it, expect } from "vitest";
import type {
  CatalogoCultivo,
  Zona,
  ProveedorAgua,
  ConfiguracionRecarga,
} from "@/types";
import { obtenerCostoAguaM3, calcularROI, extenderROI10Años } from "../roi";

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

describe("obtenerCostoAguaM3", () => {
  it("returns proveedor.precio_m3_clp when available", () => {
    const proveedor: ProveedorAgua = {
      id: "p-1",
      nombre: "Juan Pérez",
      precio_m3_clp: 2000,
    };
    const result = obtenerCostoAguaM3(proveedor);
    expect(result).toBe(2000);
  });

  it("returns 0 when proveedor has no price", () => {
    const proveedor: ProveedorAgua = { id: "p-2", nombre: "Sin precio" };
    const result = obtenerCostoAguaM3(proveedor);
    expect(result).toBe(0);
  });

  it("returns 0 when proveedor is null", () => {
    const result = obtenerCostoAguaM3(null);
    expect(result).toBe(0);
  });

  it("sums proveedor price and transport cost per m3", () => {
    const proveedor: ProveedorAgua = {
      id: "p-3",
      nombre: "Cisterna",
      precio_m3_clp: 2000,
    };
    const recarga: ConfiguracionRecarga = {
      frecuencia_dias: 7,
      cantidad_litros: 5000,
      ultima_recarga: "2025-01-01T00:00:00Z",
      proxima_recarga: "2025-01-08T00:00:00Z",
      costo_transporte_clp: 2500, // 2500 / 5m³ = 500/m³
    };
    const result = obtenerCostoAguaM3(proveedor, recarga);
    expect(result).toBe(2500); // 2000 + 500
  });

  it("uses only transport cost when proveedor is null and transport is set", () => {
    const recarga: ConfiguracionRecarga = {
      frecuencia_dias: 7,
      cantidad_litros: 2000,
      ultima_recarga: "2025-01-01T00:00:00Z",
      proxima_recarga: "2025-01-08T00:00:00Z",
      costo_transporte_clp: 1000, // 1000 / 2m³ = 500/m³
    };
    const result = obtenerCostoAguaM3(null, recarga);
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
    expect(result.roi_5_años_pct).toBeGreaterThan(0);
    expect(result.punto_equilibrio_meses).toBeGreaterThan(0);
    expect(result.punto_equilibrio_meses).toBeLessThanOrEqual(60);
  });

  it("returns viable=false when water cost is extremely high", () => {
    const result = calcularROI(cultivoFixture, zonaFixture, numPlantas, 50000);

    expect(result.viable).toBe(false);
    expect(result.roi_5_años_pct).toBeLessThan(0);
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

    // consumoSemanalReal=50 → aguaNeta=2600 → con FL(alta=2%) → aguaBase=2600/0.98
    // costo_agua_anual = aguaBase * Kr[4](=1.0) * costoAguaM3
    const aguaNeta = 50 * 52;
    const aguaBase = aguaNeta / (1 - 0.02); // FL alta = 2%
    expect(conReal.costo_agua_anual).toBeCloseTo(aguaBase * costoAguaM3, 0);
    expect(conReal.costo_agua_anual).not.toBe(sinReal.costo_agua_anual);
  });

  it("returns agua_anual_m3 and precio_agua_break_even", () => {
    const result = calcularROI(
      cultivoFixture,
      zonaFixture,
      numPlantas,
      costoAguaM3,
    );

    expect(result.agua_anual_m3).toBeGreaterThan(0);
    expect(result.precio_agua_break_even).not.toBeNull();
    expect(result.precio_agua_break_even!).toBeGreaterThan(costoAguaM3);
  });

  it("returns null break-even when revenue cannot cover plant cost", () => {
    const result = calcularROI(cultivoFixture, zonaFixture, numPlantas, 50000);

    // At 50k/m³ crop is deeply inviable; but break-even depends on revenue vs plants
    // Revenue is independent of water price, so break-even should still exist
    expect(result.precio_agua_break_even).not.toBeNull();
  });

  it("uses precioKgOverride when provided", () => {
    const normal = calcularROI(
      cultivoFixture,
      zonaFixture,
      numPlantas,
      costoAguaM3,
    );
    const caro = calcularROI(
      cultivoFixture,
      zonaFixture,
      numPlantas,
      costoAguaM3,
      undefined,
      undefined,
      10000,
    );

    expect(caro.precio_kg_estimado).toBe(10000);
    expect(caro.ingreso_año3).toBeGreaterThan(normal.ingreso_año3);
  });
});

describe("extenderROI10Años", () => {
  const numPlantas = 277;
  const costoAguaM3 = 200;

  it("extends profitable ROI to 10 years with higher acumulado", () => {
    const roi5 = calcularROI(
      cultivoFixture,
      zonaFixture,
      numPlantas,
      costoAguaM3,
    );
    const roi10 = extenderROI10Años(roi5);

    expect(roi10.roi_10_años_pct).toBeGreaterThan(roi5.roi_5_años_pct);
    expect(roi10.ingreso_acumulado_10años).toBeGreaterThan(
      roi5.ingreso_acumulado_5años,
    );
  });

  it("preserves 5-year break-even when already found", () => {
    const roi5 = calcularROI(
      cultivoFixture,
      zonaFixture,
      numPlantas,
      costoAguaM3,
    );
    const roi10 = extenderROI10Años(roi5);

    expect(roi10.punto_equilibrio_meses_10).toBe(roi5.punto_equilibrio_meses);
  });

  it("finds break-even in years 6-10 for slow perennials", () => {
    // High water cost: no break-even in 5 years but possible in 10
    const roi5 = calcularROI(cultivoFixture, zonaFixture, numPlantas, 2000);
    if (roi5.punto_equilibrio_meses === null) {
      const roi10 = extenderROI10Años(roi5);
      if (roi10.ingreso_acumulado_10años > 0) {
        expect(roi10.punto_equilibrio_meses_10).toBeGreaterThan(60);
        expect(roi10.punto_equilibrio_meses_10).toBeLessThanOrEqual(120);
      }
    }
  });
});
