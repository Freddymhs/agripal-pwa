import { describe, it, expect } from "vitest";
import type { CatalogoCultivo, Terreno } from "@/types";
import {
  validarCultivoEnTerreno,
  filtrarCultivosViables,
  rankearCultivosViables,
  calcularAguaPorCultivo,
  simularConsumoEstacional,
} from "../cultivo-restricciones";

const cultivoFixture: CatalogoCultivo = {
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

const terrenoFixture: Terreno = {
  id: "terreno-1",
  proyecto_id: "p-1",
  nombre: "Terreno Test",
  ancho_m: 100,
  alto_m: 100,
  area_m2: 10000,
  agua_disponible_m3: 500,
  agua_actual_m3: 500,
  suelo_ph: 7.0,
  agua_calidad_salinidad_dS_m: 2.0,
  agua_calidad_boro_ppm: 1.0,
  sistema_riego: {
    litros_hora: 100,
    descuento_auto: true,
    ultima_actualizacion: "2025-01-01T00:00:00Z",
  },
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
} as Terreno;

describe("validarCultivoEnTerreno", () => {
  it("retorna viable para cultivo compatible", () => {
    const result = validarCultivoEnTerreno(cultivoFixture, terrenoFixture, 1);
    expect(result.viable).toBe(true);
    expect(result.restricciones).toHaveLength(0);
    expect(result.recomendacion).toBeDefined();
  });

  it("rechaza cultivo sin agua configurada", () => {
    const cultivoSinAgua = {
      ...cultivoFixture,
      agua_m3_ha_año_min: 0,
      agua_m3_ha_año_max: 0,
    } as CatalogoCultivo;
    const result = validarCultivoEnTerreno(cultivoSinAgua, terrenoFixture, 1);
    expect(result.viable).toBe(false);
    expect(result.restricciones.length).toBeGreaterThan(0);
  });

  it("detecta agua insuficiente", () => {
    const terrenoPocaAgua: Terreno = {
      ...terrenoFixture,
      agua_disponible_m3: 10,
    } as Terreno;
    const result = validarCultivoEnTerreno(cultivoFixture, terrenoPocaAgua, 1);
    expect(result.viable).toBe(false);
    expect(result.restricciones.some((r) => r.includes("Agua insuficiente"))).toBe(true);
  });

  it("detecta pH incompatible", () => {
    const terrenoPhBajo: Terreno = {
      ...terrenoFixture,
      suelo_ph: 4.0,
    } as Terreno;
    const result = validarCultivoEnTerreno(cultivoFixture, terrenoPhBajo, 1);
    expect(result.viable).toBe(false);
    expect(result.restricciones.some((r) => r.includes("pH incompatible"))).toBe(true);
  });

  it("detecta salinidad excesiva", () => {
    const terrenoSalino: Terreno = {
      ...terrenoFixture,
      agua_calidad_salinidad_dS_m: 10.0,
    } as Terreno;
    const result = validarCultivoEnTerreno(cultivoFixture, terrenoSalino, 1);
    expect(result.viable).toBe(false);
    expect(result.restricciones.some((r) => r.includes("Salinidad"))).toBe(true);
  });

  it("detecta boro toxico", () => {
    const terrenoBoro: Terreno = {
      ...terrenoFixture,
      agua_calidad_boro_ppm: 5.0,
    } as Terreno;
    const result = validarCultivoEnTerreno(cultivoFixture, terrenoBoro, 1);
    expect(result.viable).toBe(false);
    expect(result.restricciones.some((r) => r.includes("Boro"))).toBe(true);
  });

  it("genera advertencias cuando pH del suelo es desconocido", () => {
    const terrenoSinPh: Terreno = {
      ...terrenoFixture,
      suelo_ph: undefined,
    } as Terreno;
    const result = validarCultivoEnTerreno(cultivoFixture, terrenoSinPh, 1);
    expect(result.advertencias.some((a) => a.includes("pH"))).toBe(true);
  });

  it("genera advertencia para cultivo de alto riesgo", () => {
    const cultivoAltoRiesgo = {
      ...cultivoFixture,
      riesgo: "alto" as const,
    } as CatalogoCultivo;
    const result = validarCultivoEnTerreno(cultivoAltoRiesgo, terrenoFixture, 1);
    expect(result.advertencias.some((a) => a.includes("alto riesgo"))).toBe(true);
  });

  it("usa aguaAnualCalculada cuando se proporciona", () => {
    const result = validarCultivoEnTerreno(cultivoFixture, terrenoFixture, 1, 100000);
    expect(result.viable).toBe(true);
  });

  it("escala requerimiento por area_ha", () => {
    const resultPequeño = validarCultivoEnTerreno(cultivoFixture, terrenoFixture, 0.1);
    const resultGrande = validarCultivoEnTerreno(cultivoFixture, terrenoFixture, 10);
    expect(resultPequeño.viable).toBe(true);
    expect(resultGrande.viable).toBe(false);
  });
});

describe("filtrarCultivosViables", () => {
  it("separa cultivos viables y no viables", () => {
    const cultivoMalo = {
      ...cultivoFixture,
      id: "cultivo-malo",
      agua_m3_ha_año_min: 0,
      agua_m3_ha_año_max: 0,
    } as CatalogoCultivo;

    const result = filtrarCultivosViables(
      [cultivoFixture, cultivoMalo],
      terrenoFixture,
      1,
    );
    expect(result.viables.length).toBe(1);
    expect(result.noViables.length).toBe(1);
  });

  it("retorna arrays vacios para lista vacia", () => {
    const result = filtrarCultivosViables([], terrenoFixture, 1);
    expect(result.viables).toHaveLength(0);
    expect(result.noViables).toHaveLength(0);
  });

  it("todos son viables cuando terreno es compatible", () => {
    const result = filtrarCultivosViables([cultivoFixture], terrenoFixture, 1);
    expect(result.viables).toHaveLength(1);
    expect(result.noViables).toHaveLength(0);
  });
});

describe("rankearCultivosViables", () => {
  const cultivoBarato = {
    ...cultivoFixture,
    id: "cultivo-barato",
    nombre: "Barato",
    agua_m3_ha_año_max: 3000,
    agua_m3_ha_año_min: 2000,
    precio_kg_max_clp: 1000,
    produccion: { ...cultivoFixture.produccion, produccion_kg_ha_año4: 1000 },
    riesgo: "bajo" as const,
    tier: 1 as const,
  } as CatalogoCultivo;

  const cultivoCaro = {
    ...cultivoFixture,
    id: "cultivo-caro",
    nombre: "Caro",
    agua_m3_ha_año_max: 10000,
    agua_m3_ha_año_min: 8000,
    precio_kg_max_clp: 10000,
    produccion: { ...cultivoFixture.produccion, produccion_kg_ha_año4: 20000 },
    riesgo: "alto" as const,
    tier: 3 as const,
  } as CatalogoCultivo;

  const viablesList = [
    { cultivo: cultivoBarato, validacion: { viable: true, restricciones: [], advertencias: [] } },
    { cultivo: cultivoCaro, validacion: { viable: true, restricciones: [], advertencias: [] } },
  ];

  it("rankea por rentabilidad por defecto", () => {
    const result = rankearCultivosViables(viablesList, "rentabilidad");
    expect(result).toHaveLength(2);
    expect(result[0].score).toBeGreaterThanOrEqual(result[1].score);
  });

  it("rankea por agua (menor consumo primero)", () => {
    const result = rankearCultivosViables(viablesList, "agua");
    expect(result).toHaveLength(2);
    expect(result[0].score).toBeGreaterThanOrEqual(result[1].score);
  });

  it("rankea por seguridad (menor riesgo primero)", () => {
    const result = rankearCultivosViables(viablesList, "seguridad");
    expect(result).toHaveLength(2);
    expect(result[0].cultivo.riesgo).toBe("bajo");
  });

  it("retorna array vacio para lista vacia", () => {
    const result = rankearCultivosViables([]);
    expect(result).toHaveLength(0);
  });
});

describe("calcularAguaPorCultivo", () => {
  it("calcula agua anual total correctamente", () => {
    const result = calcularAguaPorCultivo([
      { cultivo: cultivoFixture, area_ha: 1 },
    ]);
    expect(result.agua_anual_m3).toBe(cultivoFixture.agua_m3_ha_año_min * 1);
    expect(result.agua_semanal_m3).toBeCloseTo(result.agua_anual_m3 / 52, 2);
    expect(result.agua_diaria_m3).toBeCloseTo(result.agua_anual_m3 / 365, 2);
  });

  it("suma agua de multiples cultivos", () => {
    const result = calcularAguaPorCultivo([
      { cultivo: cultivoFixture, area_ha: 1 },
      { cultivo: cultivoFixture, area_ha: 2 },
    ]);
    expect(result.agua_anual_m3).toBe(cultivoFixture.agua_m3_ha_año_min * 3);
    expect(result.detalle).toHaveLength(2);
  });

  it("retorna 0 para lista vacia", () => {
    const result = calcularAguaPorCultivo([]);
    expect(result.agua_anual_m3).toBe(0);
    expect(result.detalle).toHaveLength(0);
  });

  it("detalle contiene nombre, area y agua por cultivo", () => {
    const result = calcularAguaPorCultivo([
      { cultivo: cultivoFixture, area_ha: 0.5 },
    ]);
    expect(result.detalle[0].nombre).toBe("Olivo");
    expect(result.detalle[0].area_ha).toBe(0.5);
    expect(result.detalle[0].agua_m3).toBe(cultivoFixture.agua_m3_ha_año_min * 0.5);
  });
});

describe("simularConsumoEstacional", () => {
  it("genera 12 meses de simulacion", () => {
    const result = simularConsumoEstacional([
      { cultivo: cultivoFixture, area_ha: 1 },
    ]);
    expect(result).toHaveLength(12);
  });

  it("cada mes tiene numero, nombre, agua y variacion", () => {
    const result = simularConsumoEstacional([
      { cultivo: cultivoFixture, area_ha: 1 },
    ]);
    const enero = result[0];
    expect(enero.mes).toBe(1);
    expect(enero.mes_nombre).toBe("Enero");
    expect(typeof enero.agua_m3).toBe("number");
    expect(typeof enero.variacion_respecto_promedio).toBe("number");
  });

  it("meses de verano tienen mayor consumo que invierno", () => {
    const result = simularConsumoEstacional([
      { cultivo: cultivoFixture, area_ha: 1 },
    ]);
    const enero = result.find((m) => m.mes === 1)!;
    const julio = result.find((m) => m.mes === 7)!;
    expect(enero.agua_m3).toBeGreaterThan(julio.agua_m3);
  });

  it("retorna 12 meses aun para lista vacia", () => {
    const result = simularConsumoEstacional([]);
    expect(result).toHaveLength(12);
  });
});
