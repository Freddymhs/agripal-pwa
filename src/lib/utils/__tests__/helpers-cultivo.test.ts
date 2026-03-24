import { describe, it, expect } from "vitest";
import type { CatalogoCultivo, Zona } from "@/types";
import type { PrecioMayorista, MercadoDetalle } from "@/lib/data/tipos-mercado";
import {
  calcularPrecioKgPromedio,
  calcularAguaPromedioHaAño,
  calcularDensidadPlantas,
  calcularPlantasPorHa,
  resolverAreaZona,
  filtrarEstanques,
  obtenerStockAgua,
  calcularFactorCalidad,
  esCultivoCompleto,
} from "../helpers-cultivo";
import { TIPO_ZONA } from "@/lib/constants/entities";

const cultivoBase = {
  id: "cultivo-1",
  proyecto_id: "p-1",
  nombre: "Olivo",
  agua_m3_ha_año_min: 4000,
  agua_m3_ha_año_max: 6000,
  precio_kg_min_clp: 2000,
  precio_kg_max_clp: 4000,
  espaciado_min_m: 5,
  espaciado_recomendado_m: 6,
  ph_min: 6.0,
  ph_max: 8.5,
  salinidad_tolerancia_dS_m: 4,
  boro_tolerancia_ppm: 2,
  tolerancia_boro: "alta",
  tolerancia_salinidad: "alta",
  calendario: { meses_siembra: [3], meses_cosecha: [5], meses_descanso: [] },
  produccion: {
    produccion_kg_ha_año2: 2000,
    produccion_kg_ha_año3: 5000,
    produccion_kg_ha_año4: 8000,
    vida_util_dias: 10000,
  },
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

const zonaBase: Zona = {
  id: "z-1",
  terreno_id: "t-1",
  nombre: "Zona A",
  tipo: TIPO_ZONA.CULTIVO,
  estado: "activa",
  x: 0,
  y: 0,
  ancho: 50,
  alto: 40,
  area_m2: 2000,
  color: "#22c55e",
  notas: "",
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

describe("calcularPrecioKgPromedio", () => {
  it("returns average of min and max", () => {
    expect(calcularPrecioKgPromedio(cultivoBase)).toBe(3000);
  });

  it("returns the value when min equals max", () => {
    const c = {
      ...cultivoBase,
      precio_kg_min_clp: 5000,
      precio_kg_max_clp: 5000,
    };
    expect(calcularPrecioKgPromedio(c)).toBe(5000);
  });
});

describe("calcularAguaPromedioHaAño", () => {
  it("returns average of min and max water", () => {
    expect(calcularAguaPromedioHaAño(cultivoBase)).toBe(5000);
  });
});

describe("calcularDensidadPlantas", () => {
  it("calculates number of plants for given spacing and area", () => {
    const result = calcularDensidadPlantas(2, 100);
    expect(result.espaciadoM2).toBe(4);
    expect(result.numPlantas).toBe(25);
  });

  it("returns 0 plants for spacing=0", () => {
    const result = calcularDensidadPlantas(0, 1000);
    expect(result.numPlantas).toBe(0);
  });

  it("floors partial plants (no fractions)", () => {
    const result = calcularDensidadPlantas(3, 100); // 100/9 = 11.11
    expect(result.numPlantas).toBe(11);
  });
});

describe("calcularPlantasPorHa", () => {
  it("returns plants per hectare for given spacing", () => {
    // 10000 / (2^2) = 2500
    expect(calcularPlantasPorHa(2)).toBe(2500);
  });

  it("returns 0 for spacing=0", () => {
    expect(calcularPlantasPorHa(0)).toBe(0);
  });
});

describe("resolverAreaZona", () => {
  it("returns area_m2 when set", () => {
    expect(resolverAreaZona(zonaBase)).toBe(2000);
  });

  it("falls back to ancho * alto when area_m2 is 0/falsy", () => {
    const zona = { ...zonaBase, area_m2: 0 };
    expect(resolverAreaZona(zona)).toBe(50 * 40);
  });
});

describe("filtrarEstanques", () => {
  it("returns only estanque zones with config", () => {
    const estanque: Zona = {
      ...zonaBase,
      tipo: TIPO_ZONA.ESTANQUE,
      estanque_config: {
        capacidad_m3: 10,
        nivel_actual_m3: 0,
        material: "plastico",
        costo_por_m3: 100,
      },
    };
    const result = filtrarEstanques([zonaBase, estanque]);
    expect(result).toHaveLength(1);
    expect(result[0].tipo).toBe(TIPO_ZONA.ESTANQUE);
  });

  it("excludes estanque zones without config", () => {
    const sinConfig: Zona = { ...zonaBase, tipo: TIPO_ZONA.ESTANQUE };
    expect(filtrarEstanques([sinConfig])).toHaveLength(0);
  });
});

describe("obtenerStockAgua", () => {
  it("returns aguaTotalEstanques when estanques exist", () => {
    const estanque: Zona = {
      ...zonaBase,
      tipo: TIPO_ZONA.ESTANQUE,
      estanque_config: {
        capacidad_m3: 50,
        nivel_actual_m3: 0,
        material: "plastico",
        costo_por_m3: 100,
      },
    };
    expect(obtenerStockAgua([estanque], 999, 120)).toBe(120);
  });

  it("returns aguaTerrenoM3 when no estanques", () => {
    expect(obtenerStockAgua([], 75, 0)).toBe(75);
  });
});

describe("calcularFactorCalidad", () => {
  it("returns 1.0 when perfil is null", () => {
    expect(calcularFactorCalidad(cultivoBase, null)).toBe(1.0);
  });

  it("returns 1.0 when cultivo.aplica_calidad is false", () => {
    const c = { ...cultivoBase, aplica_calidad: false };
    expect(calcularFactorCalidad(c, "basico")).toBe(1.0);
  });

  it("calculates weighted factor for basico profile with default prices", () => {
    // basico: {primera:0.2, segunda:0.5, tercera:0.3}
    // default prices: {primera:1.4, segunda:1.0, tercera:0.6}
    // = 0.2*1.4 + 0.5*1.0 + 0.3*0.6 = 0.28 + 0.50 + 0.18 = 0.96
    const c = { ...cultivoBase, aplica_calidad: true };
    expect(calcularFactorCalidad(c, "basico")).toBeCloseTo(0.96);
  });

  it("uses cultivo.calidad_precios when present instead of default", () => {
    // custom prices: primera=2.0, segunda=1.2, tercera=0.4
    // basico dist: {primera:0.2, segunda:0.5, tercera:0.3}
    // = 0.2*2.0 + 0.5*1.2 + 0.3*0.4 = 0.4 + 0.6 + 0.12 = 1.12
    const c = {
      ...cultivoBase,
      aplica_calidad: true,
      calidad_precios: { primera: 2.0, segunda: 1.2, tercera: 0.4 },
    } as CatalogoCultivo;
    expect(calcularFactorCalidad(c, "basico")).toBeCloseTo(1.12);
  });

  it("premium profile yields higher factor than basico", () => {
    const c = { ...cultivoBase, aplica_calidad: true };
    expect(calcularFactorCalidad(c, "premium")).toBeGreaterThan(
      calcularFactorCalidad(c, "basico"),
    );
  });
});

describe("esCultivoCompleto", () => {
  const precio: PrecioMayorista = {
    id: "precio-1",
    cultivo_id: "cultivo-base-olivo",
    region: "Arica",
    nombre: "Olivo",
    nombre_odepa: null,
    precio_min_clp: 2000,
    precio_max_clp: 4000,
    precio_actual_clp: 3000,
    tendencia: "estable",
    actualizado_en: "2025-01-01T00:00:00Z",
    fuente: "seed",
    factor_precio_feria: null,
    factor_precio_retail: null,
  };

  const mercado: MercadoDetalle = {
    id: "m-1",
    precio_mayorista_id: "precio-1",
    demanda_local: null,
    competencia_local: null,
    mercado_exportacion: false,
    notas: null,
  };

  const cultivoConBase = {
    ...cultivoBase,
    cultivo_base_id: "cultivo-base-olivo",
  } as CatalogoCultivo;

  it("returns true when cultivo has precio and mercado_detalle", () => {
    expect(esCultivoCompleto(cultivoConBase, [precio], [mercado])).toBe(true);
  });

  it("returns false when cultivo has no cultivo_base_id", () => {
    const sinBase = {
      ...cultivoBase,
      cultivo_base_id: undefined,
    } as CatalogoCultivo;
    expect(esCultivoCompleto(sinBase, [precio], [mercado])).toBe(false);
  });

  it("returns false when precio not found", () => {
    expect(esCultivoCompleto(cultivoConBase, [], [mercado])).toBe(false);
  });

  it("returns false when mercado_detalle not found for precio", () => {
    expect(esCultivoCompleto(cultivoConBase, [precio], [])).toBe(false);
  });
});
