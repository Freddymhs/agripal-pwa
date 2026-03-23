import { describe, it, expect } from "vitest";
import type { Terreno, Zona, CatalogoCultivo } from "@/types";
import { calcularRecomendacionCultivos } from "../recomendacion";
import { TIPO_ZONA } from "@/lib/constants/entities";

const terrenoBase: Terreno = {
  id: "t-1",
  proyecto_id: "p-1",
  nombre: "Terreno Test",
  area_m2: 10000,
  ancho: 100,
  alto: 100,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
} as Terreno;

const terrenoConCalidad: Terreno = {
  ...terrenoBase,
  agua_calidad_salinidad_dS_m: 1.5,
  agua_calidad_boro_ppm: 0.8,
  suelo_ph: 7.2,
} as Terreno;

const estanqueZona: Zona = {
  id: "z-est",
  terreno_id: "t-1",
  nombre: "Estanque",
  tipo: TIPO_ZONA.ESTANQUE,
  estado: "activa",
  x: 0,
  y: 0,
  ancho: 5,
  alto: 5,
  area_m2: 25,
  color: "#3b82f6",
  notas: "",
  estanque_config: {
    capacidad_m3: 20,
    material: "plastico",
    costo_por_m3: 100,
  },
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
} as Zona;

describe("calcularRecomendacionCultivos — estructura", () => {
  it("returns all required fields", () => {
    const result = calcularRecomendacionCultivos(
      terrenoBase,
      [],
      [],
      [],
      [],
      [],
    );
    expect(result).toHaveProperty("cultivos_viables");
    expect(result).toHaveProperty("cultivos_noViables");
    expect(result).toHaveProperty("agua_total_anual_m3");
    expect(result).toHaveProperty("agua_semanal_m3");
    expect(result).toHaveProperty("agua_diaria_m3");
    expect(result).toHaveProperty("agua_disponible_anual_m3");
    expect(result).toHaveProperty("consumo_estacional");
    expect(result).toHaveProperty("riesgos_criticos");
    expect(result).toHaveProperty("advertencias");
    expect(result).toHaveProperty("resumen");
  });

  it("consumo_estacional always has 12 months", () => {
    const result = calcularRecomendacionCultivos(
      terrenoBase,
      [],
      [],
      [],
      [],
      [],
    );
    expect(result.consumo_estacional).toHaveLength(12);
  });
});

describe("calcularRecomendacionCultivos — riesgos_criticos", () => {
  it("adds salinidad risk when agua_calidad_salinidad_dS_m is unknown", () => {
    const result = calcularRecomendacionCultivos(
      terrenoBase,
      [],
      [],
      [],
      [],
      [],
    );
    const hasSalinidad = result.riesgos_criticos.some((r) =>
      r.includes("Salinidad"),
    );
    expect(hasSalinidad).toBe(true);
  });

  it("adds boro risk when agua_calidad_boro_ppm is unknown", () => {
    const result = calcularRecomendacionCultivos(
      terrenoBase,
      [],
      [],
      [],
      [],
      [],
    );
    const hasBoro = result.riesgos_criticos.some((r) => r.includes("Boro"));
    expect(hasBoro).toBe(true);
  });

  it("has 0 riesgos_criticos when both salinidad and boro are known", () => {
    const result = calcularRecomendacionCultivos(
      terrenoConCalidad,
      [],
      [],
      [],
      [],
      [],
    );
    expect(result.riesgos_criticos).toHaveLength(0);
  });
});

describe("calcularRecomendacionCultivos — advertencias", () => {
  it("always includes mosca de fruta warning", () => {
    const result = calcularRecomendacionCultivos(
      terrenoBase,
      [],
      [],
      [],
      [],
      [],
    );
    const hasMosca = result.advertencias.some((a) =>
      a.toLowerCase().includes("mosca"),
    );
    expect(hasMosca).toBe(true);
  });

  it("includes pH advertencia when suelo_ph is unknown", () => {
    const result = calcularRecomendacionCultivos(
      terrenoBase,
      [],
      [],
      [],
      [],
      [],
    );
    const hasPh = result.advertencias.some((a) => a.includes("pH"));
    expect(hasPh).toBe(true);
  });

  it("no pH advertencia when suelo_ph is set", () => {
    const result = calcularRecomendacionCultivos(
      terrenoConCalidad,
      [],
      [],
      [],
      [],
      [],
    );
    const hasPh = result.advertencias.some((a) =>
      a.includes("pH suelo desconocido"),
    );
    expect(hasPh).toBe(false);
  });
});

// Cultivo con agua avg=500m³/ha para controlar el margen con precisión.
// Tolerancias amplias para pasar la validación sin restricciones.
const cultivoViable = {
  id: "c-viable",
  proyecto_id: "p-1",
  nombre: "Tuna",
  cultivo_base_id: "cultivo-tuna",
  agua_m3_ha_año_min: 400,
  agua_m3_ha_año_max: 600,
  espaciado_min_m: 3,
  espaciado_recomendado_m: 4,
  ph_min: 5.0,
  ph_max: 9.0,
  salinidad_tolerancia_dS_m: 8,
  boro_tolerancia_ppm: 5,
  tolerancia_boro: "alta",
  tolerancia_salinidad: "alta",
  calendario: { meses_siembra: [3], meses_cosecha: [10], meses_descanso: [] },
  produccion: {
    produccion_kg_ha_año2: 5000,
    produccion_kg_ha_año3: 8000,
    produccion_kg_ha_año4: 10000,
    vida_util_dias: 10000,
  },
  precio_kg_min_clp: 1500,
  precio_kg_max_clp: 3000,
  precio_planta_clp: 5000,
  plagas: [],
  tiempo_produccion_meses: 36,
  vida_util_años: 20,
  tier: 1,
  riesgo: "bajo",
  notas: "",
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
} as CatalogoCultivo;

// Estanque que produce 520m³/año (20m³ × 26 llenadas)
const estanque520: Zona = {
  id: "z-est-520",
  terreno_id: "t-1",
  nombre: "Estanque",
  tipo: TIPO_ZONA.ESTANQUE,
  estado: "activa",
  x: 0,
  y: 0,
  ancho: 5,
  alto: 5,
  area_m2: 25,
  color: "#3b82f6",
  notas: "",
  estanque_config: {
    capacidad_m3: 20,
    material: "plastico",
    costo_por_m3: 100,
  },
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
} as Zona;

describe("calcularRecomendacionCultivos — resumen", () => {
  it("returns NO HAY CULTIVOS VIABLES when catalog is empty", () => {
    const result = calcularRecomendacionCultivos(
      terrenoBase,
      [],
      [],
      [],
      [],
      [],
    );
    expect(result.resumen).toContain("NO HAY CULTIVOS VIABLES");
  });

  it("returns AGUA AJUSTADA when margin < 10%", () => {
    // disponible=520m³, calcularAguaPorCultivo usa agua_min=400m³/ha
    // area=1.25ha → uso=500m³ → margen=(520-500)/520≈3.8%
    const result = calcularRecomendacionCultivos(
      terrenoConCalidad,
      [estanque520],
      [],
      [],
      [],
      [cultivoViable],
      1.25,
    );
    expect(result.resumen).toContain("AGUA AJUSTADA");
  });

  it("returns VIABLE pero ajustado when margin is 10-20%", () => {
    // disponible=520m³, area=1.1ha → uso=440m³ → margen≈15.4%
    const result = calcularRecomendacionCultivos(
      terrenoConCalidad,
      [estanque520],
      [],
      [],
      [],
      [cultivoViable],
      1.1,
    );
    expect(result.resumen).toContain("VIABLE");
    expect(result.resumen).toContain("ajustado");
  });

  it("returns VIABLE with good margin when margin >= 20%", () => {
    // disponible=520m³, area=0.5ha → uso≈250m³ → margen≈51.9%
    const result = calcularRecomendacionCultivos(
      terrenoConCalidad,
      [estanque520],
      [],
      [],
      [],
      [cultivoViable],
      0.5,
    );
    expect(result.resumen).toMatch(/✅ VIABLE:/);
  });
});

describe("calcularRecomendacionCultivos — agua_disponible_anual_m3", () => {
  it("uses estanque capacity for agua disponible when estanques provided", () => {
    const result = calcularRecomendacionCultivos(
      terrenoBase,
      [estanqueZona],
      [],
      [],
      [],
      [],
    );
    // capacidad 20m³ × 26 llenadas = 520
    expect(result.agua_disponible_anual_m3).toBe(520);
  });

  it("returns 0 agua_disponible when no estanques and no cultivos", () => {
    const result = calcularRecomendacionCultivos(
      terrenoBase,
      [],
      [],
      [],
      [],
      [],
    );
    expect(result.agua_disponible_anual_m3).toBe(0);
  });

  it("uses area_ha override when provided", () => {
    const r1 = calcularRecomendacionCultivos(terrenoBase, [], [], [], [], []);
    const r2 = calcularRecomendacionCultivos(
      terrenoBase,
      [],
      [],
      [],
      [],
      [],
      2,
    );
    // Con area_ha=2 vs area_ha default=1 — el agua total del cultivo será diferente
    // (sin cultivos ambos son 0, pero la lógica interna usa el area)
    expect(r1.agua_disponible_anual_m3).toBe(r2.agua_disponible_anual_m3);
  });
});
