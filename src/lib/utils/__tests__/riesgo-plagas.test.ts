import { describe, it, expect } from "vitest";
import type { CatalogoCultivo, PlantPlague } from "@/types";
import type { DatosClimaticos } from "@/lib/data/calculos-clima";
import { evaluarRiesgoPlagas } from "../riesgo-plagas";

const mockClima = {} as DatosClimaticos;

const plagaFixture: PlantPlague = {
  nombre: "Mosca blanca",
  grados_dia_base: 10,
  grados_dia_ciclo: 300,
  grados_dia_ovicida_ventana: 100,
  control_recomendado: "Trampas amarillas",
  temperatura_min: 15,
  temperatura_max: 35,
  etapas_vulnerables: ["joven", "adulta"],
  severidad: "alta",
};

const cultivoFixture: CatalogoCultivo = {
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
  plagas: [plagaFixture],
  tiempo_produccion_meses: 4,
  vida_util_años: 1,
  tier: 1,
  riesgo: "bajo",
  notas: "",
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
} as CatalogoCultivo;

describe("evaluarRiesgoPlagas", () => {
  it("retorna array vacio para cultivo sin plagas", () => {
    const cultivoSinPlagas: CatalogoCultivo = {
      ...cultivoFixture,
      plagas: [],
    };
    const result = evaluarRiesgoPlagas(cultivoSinPlagas, "adulta", mockClima);
    expect(result).toHaveLength(0);
  });

  it("retorna una evaluacion por cada plaga del cultivo", () => {
    const result = evaluarRiesgoPlagas(cultivoFixture, "adulta", mockClima);
    expect(result).toHaveLength(1);
    expect(result[0].plaga.nombre).toBe("Mosca blanca");
  });

  it("cada resultado tiene la estructura esperada", () => {
    const result = evaluarRiesgoPlagas(cultivoFixture, "adulta", mockClima);
    const evaluacion = result[0];
    expect(evaluacion.plaga).toBeDefined();
    expect(typeof evaluacion.scoreRiesgo).toBe("number");
    expect(evaluacion.condicionesActuales).toBeDefined();
    expect(typeof evaluacion.condicionesActuales.temperaturaFavorable).toBe(
      "boolean",
    );
    expect(typeof evaluacion.condicionesActuales.etapaVulnerable).toBe(
      "boolean",
    );
    expect(typeof evaluacion.condicionesActuales.tempActual).toBe("number");
    expect(["bajo", "medio", "alto", "critico"]).toContain(
      evaluacion.alertaNivel,
    );
  });

  it("marca etapa vulnerable correctamente", () => {
    const resultVulnerable = evaluarRiesgoPlagas(
      cultivoFixture,
      "adulta",
      mockClima,
    );
    expect(resultVulnerable[0].condicionesActuales.etapaVulnerable).toBe(true);

    const resultNoVulnerable = evaluarRiesgoPlagas(
      cultivoFixture,
      "madura",
      mockClima,
    );
    expect(resultNoVulnerable[0].condicionesActuales.etapaVulnerable).toBe(
      false,
    );
  });

  it("agrega score por severidad de la plaga", () => {
    const plagaBaja: PlantPlague = {
      ...plagaFixture,
      severidad: "baja",
    };
    const plagaCritica: PlantPlague = {
      ...plagaFixture,
      severidad: "critica",
    };

    const cultivoBaja = {
      ...cultivoFixture,
      plagas: [plagaBaja],
    } as CatalogoCultivo;
    const cultivoCritica = {
      ...cultivoFixture,
      plagas: [plagaCritica],
    } as CatalogoCultivo;

    const resultBaja = evaluarRiesgoPlagas(cultivoBaja, "plántula", mockClima);
    const resultCritica = evaluarRiesgoPlagas(
      cultivoCritica,
      "plántula",
      mockClima,
    );

    expect(resultCritica[0].scoreRiesgo).toBeGreaterThan(
      resultBaja[0].scoreRiesgo,
    );
  });

  it("ordena resultados por scoreRiesgo descendente", () => {
    const plagaAlta: PlantPlague = {
      ...plagaFixture,
      nombre: "Plaga Alta",
      severidad: "critica",
      etapas_vulnerables: ["adulta"],
    };
    const plagaBaja: PlantPlague = {
      ...plagaFixture,
      nombre: "Plaga Baja",
      severidad: "baja",
      etapas_vulnerables: [],
    };

    const cultivoMulti = {
      ...cultivoFixture,
      plagas: [plagaBaja, plagaAlta],
    } as CatalogoCultivo;

    const result = evaluarRiesgoPlagas(cultivoMulti, "adulta", mockClima);
    expect(result).toHaveLength(2);
    expect(result[0].scoreRiesgo).toBeGreaterThanOrEqual(result[1].scoreRiesgo);
  });

  it("maneja plaga sin etapas_vulnerables", () => {
    const plagaSinEtapas: PlantPlague = {
      ...plagaFixture,
      etapas_vulnerables: undefined,
    };
    const cultivoTest = {
      ...cultivoFixture,
      plagas: [plagaSinEtapas],
    } as CatalogoCultivo;

    const result = evaluarRiesgoPlagas(cultivoTest, "adulta", mockClima);
    expect(result[0].condicionesActuales.etapaVulnerable).toBe(false);
  });

  it("maneja plaga sin severidad definida", () => {
    const plagaSinSeveridad: PlantPlague = {
      ...plagaFixture,
      severidad: undefined,
    };
    const cultivoTest = {
      ...cultivoFixture,
      plagas: [plagaSinSeveridad],
    } as CatalogoCultivo;

    const result = evaluarRiesgoPlagas(cultivoTest, "adulta", mockClima);
    expect(result).toHaveLength(1);
    expect(result[0].scoreRiesgo).toBeGreaterThan(0);
  });

  it("alertaNivel es critico cuando score >= 80 (temp + etapa + alta)", () => {
    // 50 (temp_favorable) + 30 (etapa_vulnerable) + 15 (alta) = 95 → critico
    // plagaFixture: temperatura_min=15, temperatura_max=35; etapas_vulnerables=["joven","adulta"]
    // TEMP_DEFAULT_C=19 → dentro del rango → temp favorable
    const result = evaluarRiesgoPlagas(cultivoFixture, "adulta", mockClima);
    expect(result[0].scoreRiesgo).toBe(95);
    expect(result[0].alertaNivel).toBe("critico");
  });

  it("alertaNivel es bajo cuando score < 40 (sin temp, sin etapa, severidad baja)", () => {
    const plagaFria: PlantPlague = {
      ...plagaFixture,
      temperatura_min: 30,
      temperatura_max: 40, // rango fuera de TEMP_DEFAULT_C=19
      etapas_vulnerables: [],
      severidad: "baja",
    };
    const cultivoTest = {
      ...cultivoFixture,
      plagas: [plagaFria],
    } as CatalogoCultivo;
    const result = evaluarRiesgoPlagas(cultivoTest, "adulta", mockClima);
    // 0 + 0 + 5 = 5 → bajo
    expect(result[0].scoreRiesgo).toBe(5);
    expect(result[0].alertaNivel).toBe("bajo");
  });

  it("alertaNivel es alto cuando score es exactamente 60", () => {
    // 50 (temp) + 0 (sin etapa) + 10 (media) = 60 → alto
    const plagaMedia: PlantPlague = {
      ...plagaFixture,
      etapas_vulnerables: [],
      severidad: "media",
    };
    const cultivoTest = {
      ...cultivoFixture,
      plagas: [plagaMedia],
    } as CatalogoCultivo;
    const result = evaluarRiesgoPlagas(cultivoTest, "adulta", mockClima);
    expect(result[0].scoreRiesgo).toBe(60);
    expect(result[0].alertaNivel).toBe("alto");
  });

  it("usa temperatura real cuando clima tiene temperatura definida", () => {
    const climaConTemp: DatosClimaticos = {
      ...({} as DatosClimaticos),
      temperatura: {
        maxima_verano_c: 26,
        minima_historica_c: 8,
        promedio_anual_c: 18,
        horas_frio_aprox: 50,
      },
    };
    const result = evaluarRiesgoPlagas(cultivoFixture, "adulta", climaConTemp);
    // Temperatura real calculada es distinta de TEMP_DEFAULT_C (19)
    // pero sigue siendo favorable para plagaFixture (min=15, max=35)
    expect(result[0].condicionesActuales.temperaturaFavorable).toBe(true);
    expect(result[0].condicionesActuales.tempActual).not.toBeNaN();
  });

  it("maneja plaga sin temperatura definida, usa rango default 15-35", () => {
    const plagaSinTemp: PlantPlague = {
      ...plagaFixture,
      temperatura_min: undefined,
      temperatura_max: undefined,
    };
    const cultivoTest = {
      ...cultivoFixture,
      plagas: [plagaSinTemp],
    } as CatalogoCultivo;

    const result = evaluarRiesgoPlagas(cultivoTest, "adulta", mockClima);
    expect(result).toHaveLength(1);
  });
});
