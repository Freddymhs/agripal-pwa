import { describe, it, expect } from "vitest";
import type { CatalogoCultivo, FuenteAgua, SueloTerreno } from "@/types";
import { calcularFactorSuelo, calcularScoreCalidad } from "../calidad";

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

describe("calcularFactorSuelo", () => {
  it("retorna 1.0 cuando suelo es null", () => {
    const result = calcularFactorSuelo(null, cultivoFixture);
    expect(result).toBe(1.0);
  });

  it("retorna 1.0 cuando suelo no tiene datos relevantes", () => {
    const suelo: SueloTerreno = {};
    const result = calcularFactorSuelo(suelo, cultivoFixture);
    expect(result).toBe(1.0);
  });

  it("retorna 1.0 cuando pH esta dentro del rango del cultivo", () => {
    const suelo: SueloTerreno = {
      fisico: { ph: 7.0 },
    };
    const result = calcularFactorSuelo(suelo, cultivoFixture);
    expect(result).toBe(1.0);
  });

  it("penaliza cuando pH esta por debajo del minimo", () => {
    const suelo: SueloTerreno = {
      fisico: { ph: 5.0 },
    };
    const result = calcularFactorSuelo(suelo, cultivoFixture);
    expect(result).toBeLessThan(1.0);
    expect(result).toBeGreaterThan(0.1);
  });

  it("penaliza cuando pH esta por encima del maximo", () => {
    const suelo: SueloTerreno = {
      fisico: { ph: 10.0 },
    };
    const result = calcularFactorSuelo(suelo, cultivoFixture);
    expect(result).toBeLessThan(1.0);
    expect(result).toBeGreaterThan(0.1);
  });

  it("aplica penalizacion mayor para pH muy extremo", () => {
    const sueloLeve: SueloTerreno = { fisico: { ph: 5.5 } };
    const sueloExtremo: SueloTerreno = { fisico: { ph: 3.0 } };

    const factorLeve = calcularFactorSuelo(sueloLeve, cultivoFixture);
    const factorExtremo = calcularFactorSuelo(sueloExtremo, cultivoFixture);

    expect(factorExtremo).toBeLessThan(factorLeve);
  });

  it("penaliza cuando salinidad excede tolerancia", () => {
    const suelo: SueloTerreno = {
      quimico: { salinidad_dS_m: 6.0 },
    };
    const result = calcularFactorSuelo(suelo, cultivoFixture);
    expect(result).toBeLessThan(1.0);
  });

  it("no penaliza cuando salinidad esta dentro de tolerancia", () => {
    const suelo: SueloTerreno = {
      quimico: { salinidad_dS_m: 3.0 },
    };
    const result = calcularFactorSuelo(suelo, cultivoFixture);
    expect(result).toBe(1.0);
  });

  it("penaliza cuando boro excede tolerancia", () => {
    const suelo: SueloTerreno = {
      quimico: { boro_mg_l: 5.0 },
    };
    const result = calcularFactorSuelo(suelo, cultivoFixture);
    expect(result).toBeLessThan(1.0);
  });

  it("penaliza materia organica baja (< 2%)", () => {
    const suelo: SueloTerreno = {
      fisico: { materia_organica_pct: 1.0 },
    };
    const result = calcularFactorSuelo(suelo, cultivoFixture);
    expect(result).toBe(0.9);
  });

  it("no penaliza materia organica >= 2%", () => {
    const suelo: SueloTerreno = {
      fisico: { materia_organica_pct: 3.0 },
    };
    const result = calcularFactorSuelo(suelo, cultivoFixture);
    expect(result).toBe(1.0);
  });

  it("acumula penalizaciones de multiples factores", () => {
    const suelo: SueloTerreno = {
      fisico: { ph: 4.0, materia_organica_pct: 0.5 },
      quimico: { salinidad_dS_m: 8.0, boro_mg_l: 5.0 },
    };
    const result = calcularFactorSuelo(suelo, cultivoFixture);
    expect(result).toBeLessThan(0.5);
    expect(result).toBeGreaterThanOrEqual(0.1);
  });

  it("nunca retorna menos de 0.1", () => {
    const sueloExtremo: SueloTerreno = {
      fisico: { ph: 0 },
      quimico: { salinidad_dS_m: 100, boro_mg_l: 100 },
    };
    const result = calcularFactorSuelo(sueloExtremo, cultivoFixture);
    expect(result).toBeGreaterThanOrEqual(0.1);
  });
});

describe("calcularScoreCalidad", () => {
  it("retorna score parcial (50) cuando fuente es null y suelo es null", () => {
    const result = calcularScoreCalidad(cultivoFixture, null, null, 100, 5);
    expect(result.score_agua).toBe(50);
    expect(result.score_suelo).toBe(50);
    expect(result.factores_limitantes.length).toBeGreaterThan(0);
  });

  it("retorna score alto para condiciones ideales", () => {
    const fuente: FuenteAgua = {
      id: "f-1",
      nombre: "Pozo limpio",
      tipo: "pozo",
      boro_ppm: 0.5,
      salinidad_dS_m: 1.0,
      ph: 7.0,
    };
    const suelo: SueloTerreno = {
      fisico: { ph: 7.0, materia_organica_pct: 3.0 },
      quimico: { salinidad_dS_m: 1.0 },
    };

    const result = calcularScoreCalidad(cultivoFixture, fuente, suelo, 200, 5);
    expect(result.score_agua).toBe(100);
    expect(result.score_suelo).toBe(100);
    expect(result.score_total).toBeGreaterThanOrEqual(70);
    expect(result.categoria === "excelente" || result.categoria === "buena").toBe(true);
  });

  it("penaliza boro alto en agua", () => {
    const fuenteAltosBoro: FuenteAgua = {
      id: "f-1",
      nombre: "Rio Lluta",
      tipo: "rio",
      boro_ppm: 5.0,
    };

    const result = calcularScoreCalidad(cultivoFixture, fuenteAltosBoro, null, 100, 5);
    expect(result.score_agua).toBeLessThan(100);
    expect(result.factores_limitantes.some((f) => f.includes("Boro"))).toBe(true);
  });

  it("penaliza salinidad alta en agua", () => {
    const fuenteSalina: FuenteAgua = {
      id: "f-1",
      nombre: "Fuente salina",
      tipo: "canal",
      salinidad_dS_m: 8.0,
    };

    const result = calcularScoreCalidad(cultivoFixture, fuenteSalina, null, 100, 5);
    expect(result.score_agua).toBeLessThan(100);
  });

  it("penaliza pH fuera de rango en agua", () => {
    const fuentePhBajo: FuenteAgua = {
      id: "f-1",
      nombre: "Fuente acida",
      tipo: "pozo",
      ph: 4.0,
    };

    const result = calcularScoreCalidad(cultivoFixture, fuentePhBajo, null, 100, 5);
    expect(result.score_agua).toBeLessThan(100);
  });

  it("retorna score_riego bajo con pocos dias de agua (< 7)", () => {
    const result = calcularScoreCalidad(cultivoFixture, null, null, 2, 5);
    expect(result.score_riego).toBeLessThanOrEqual(10);
  });

  it("retorna score_riego medio con 7-14 dias de agua", () => {
    const result = calcularScoreCalidad(cultivoFixture, null, null, 10, 7);
    expect(result.score_riego).toBe(50);
  });

  it("retorna score_riego 100 con > 30 dias de agua", () => {
    const result = calcularScoreCalidad(cultivoFixture, null, null, 500, 5);
    expect(result.score_riego).toBe(100);
  });

  it("retorna score_riego 100 cuando consumo es 0", () => {
    const result = calcularScoreCalidad(cultivoFixture, null, null, 100, 0);
    expect(result.score_riego).toBe(100);
  });

  it("clasifica como no_viable con score total muy bajo", () => {
    const fuenteMala: FuenteAgua = {
      id: "f-1",
      nombre: "Fuente toxica",
      tipo: "rio",
      boro_ppm: 15.0,
      salinidad_dS_m: 12.0,
      ph: 3.0,
    };
    const sueloMalo: SueloTerreno = {
      fisico: { ph: 3.0 },
      quimico: { salinidad_dS_m: 12.0 },
    };

    const result = calcularScoreCalidad(cultivoFixture, fuenteMala, sueloMalo, 1, 10);
    expect(result.score_total).toBeLessThan(50);
    expect(
      result.categoria === "riesgosa" || result.categoria === "no_viable"
    ).toBe(true);
  });

  it("penaliza suelo con pH fuera de rango", () => {
    const suelo: SueloTerreno = {
      fisico: { ph: 4.0 },
    };
    const result = calcularScoreCalidad(cultivoFixture, null, suelo, 100, 5);
    expect(result.score_suelo).toBeLessThan(100);
  });

  it("penaliza suelo con salinidad excesiva", () => {
    const suelo: SueloTerreno = {
      quimico: { salinidad_dS_m: 8.0 },
    };
    const result = calcularScoreCalidad(cultivoFixture, null, suelo, 100, 5);
    expect(result.score_suelo).toBeLessThan(100);
  });

  it("score total es promedio ponderado de sub-scores", () => {
    const result = calcularScoreCalidad(cultivoFixture, null, null, 500, 5);
    const expected = Math.round(
      result.score_agua * 0.3 +
        result.score_suelo * 0.25 +
        result.score_clima * 0.2 +
        result.score_riego * 0.25,
    );
    expect(result.score_total).toBe(expected);
  });

  it("incluye cultivo_id y cultivo_nombre en el resultado", () => {
    const result = calcularScoreCalidad(cultivoFixture, null, null, 100, 5);
    expect(result.cultivo_id).toBe("cultivo-1");
    expect(result.cultivo_nombre).toBe("Olivo");
  });
});
