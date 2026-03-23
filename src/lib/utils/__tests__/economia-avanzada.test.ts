import { describe, it, expect } from "vitest";
import type { CatalogoCultivo } from "@/types";
import type { ProyeccionROI } from "../roi";
import { calcularMetricasEconomicas } from "../economia-avanzada";

const roiFixture: ProyeccionROI = {
  cultivo_id: "cultivo-1",
  cultivo_nombre: "Olivo",
  zona_id: "zona-1",
  zona_nombre: "Zona Test",
  num_plantas: 277,
  area_ha: 1,
  factor_riego: 1.0,
  costo_plantas: 2216000,
  costo_agua_anual: 1200000,
  inversion_total: 3416000,
  kg_año1: 0,
  kg_año2: 2000,
  kg_año3: 5000,
  kg_año4: 8000,
  kg_año5: 8000,
  precio_kg_estimado: 4000,
  ingreso_año1: 0,
  ingreso_año2: 8000000,
  ingreso_año3: 20000000,
  ingreso_año4: 32000000,
  ingreso_año5: 32000000,
  ingreso_acumulado_5años: 56400000,
  roi_5_años_pct: 1551,
  punto_equilibrio_meses: 8,
  viable: true,
  agua_anual_m3: 6000,
  precio_agua_break_even: 15400,
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

describe("calcularMetricasEconomicas", () => {
  it("retorna estructura completa de metricas", () => {
    const result = calcularMetricasEconomicas(roiFixture, cultivoFixture, 5000);
    expect(typeof result.costoProduccionKg).toBe("number");
    expect(typeof result.margenContribucion).toBe("number");
    expect(typeof result.precioVentaKg).toBe("number");
    expect(typeof result.costoVariableKg).toBe("number");
    expect(typeof result.kgProducidosAño).toBe("number");
  });

  it("calcula precio de venta como promedio de min y max", () => {
    const result = calcularMetricasEconomicas(roiFixture, cultivoFixture, 5000);
    const expected =
      (cultivoFixture.precio_kg_min_clp + cultivoFixture.precio_kg_max_clp) / 2;
    expect(result.precioVentaKg).toBe(expected);
  });

  it("calcula costo de produccion por kg correctamente", () => {
    const result = calcularMetricasEconomicas(roiFixture, cultivoFixture, 5000);
    const costoTotalAnual =
      roiFixture.costo_agua_anual + roiFixture.costo_plantas / 5;
    const expected = costoTotalAnual / 5000;
    expect(result.costoProduccionKg).toBe(expected);
  });

  it("retorna costoProduccionKg=0 cuando kgProducidosAño es 0", () => {
    const result = calcularMetricasEconomicas(roiFixture, cultivoFixture, 0);
    expect(result.costoProduccionKg).toBe(0);
  });

  it("retorna puntoEquilibrioKg=null cuando margen unitario es negativo", () => {
    const cultivoCaro: CatalogoCultivo = {
      ...cultivoFixture,
      precio_kg_min_clp: 1,
      precio_kg_max_clp: 2,
    };
    const result = calcularMetricasEconomicas(roiFixture, cultivoCaro, 5000);
    expect(result.puntoEquilibrioKg).toBe(null);
  });

  it("calcula punto de equilibrio en kg valido", () => {
    const result = calcularMetricasEconomicas(roiFixture, cultivoFixture, 5000);
    expect(result.puntoEquilibrioKg).not.toBe(null);
    if (result.puntoEquilibrioKg !== null) {
      expect(result.puntoEquilibrioKg).toBeGreaterThan(0);
    }
  });

  it("calcula margen de contribucion como porcentaje", () => {
    const result = calcularMetricasEconomicas(roiFixture, cultivoFixture, 5000);
    expect(result.margenContribucion).toBeGreaterThan(0);
    expect(result.margenContribucion).toBeLessThanOrEqual(100);
  });

  it("calcula tiempo de recuperacion en meses", () => {
    const result = calcularMetricasEconomicas(roiFixture, cultivoFixture, 5000);
    expect(result.tiempoRecuperacionMeses).not.toBe(null);
    if (result.tiempoRecuperacionMeses !== null) {
      expect(result.tiempoRecuperacionMeses).toBeGreaterThan(0);
    }
  });

  it("retorna tiempoRecuperacionMeses=null cuando no hay ingresos", () => {
    const roiSinIngresos: ProyeccionROI = {
      ...roiFixture,
      ingreso_año2: 0,
      inversion_total: 1000000,
    };
    const result = calcularMetricasEconomicas(
      roiSinIngresos,
      cultivoFixture,
      0,
    );
    expect(result.tiempoRecuperacionMeses).toBe(null);
  });

  it("usa costo_variable_kg del cultivo cuando esta definido", () => {
    const cultivoConCostoVariable: CatalogoCultivo = {
      ...cultivoFixture,
      costo_variable_kg: 500,
    };
    const result = calcularMetricasEconomicas(
      roiFixture,
      cultivoConCostoVariable,
      5000,
    );
    expect(result.costoVariableKg).toBe(500);
  });

  it("mantiene kgProducidosAño en la respuesta", () => {
    const result = calcularMetricasEconomicas(roiFixture, cultivoFixture, 3000);
    expect(result.kgProducidosAño).toBe(3000);
  });

  it("expone desglose de costos (agua, plantas amortizadas, total)", () => {
    const result = calcularMetricasEconomicas(roiFixture, cultivoFixture, 5000);
    expect(result.costoAguaAnual).toBe(roiFixture.costo_agua_anual);
    expect(result.costoPlantasAmortizado).toBe(roiFixture.costo_plantas / 5);
    expect(result.costoTotalAnual).toBe(
      roiFixture.costo_agua_anual + roiFixture.costo_plantas / 5,
    );
  });

  it("costoTotalAnual > 0 incluso cuando agua = $0 si hay plantas", () => {
    const roiSinAgua: ProyeccionROI = {
      ...roiFixture,
      costo_agua_anual: 0,
    };
    const result = calcularMetricasEconomicas(roiSinAgua, cultivoFixture, 5000);
    expect(result.costoTotalAnual).toBeGreaterThan(0);
    expect(result.costoProduccionKg).toBeGreaterThan(0);
  });
});
