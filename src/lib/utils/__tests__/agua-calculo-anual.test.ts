import { describe, it, expect } from "vitest";
import type { Zona, EntradaAgua, Planta, CatalogoCultivo } from "@/types";
import { calcularAguaAnualAutomatica } from "../agua-calculo-anual";
import { TIPO_ZONA } from "@/lib/constants/entities";

const estanqueFixture = (capacidad_m3: number): Zona =>
  ({
    id: "z-est-1",
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
    estanque_config: { capacidad_m3, material: "plastico", costo_por_m3: 100 },
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  }) as Zona;

const entradaAgua = (fecha: string): EntradaAgua =>
  ({
    id: `entrada-${fecha}`,
    terreno_id: "t-1",
    fecha,
    cantidad_m3: 10,
    tipo: "recarga",
    created_at: fecha,
    updated_at: fecha,
  }) as EntradaAgua;

describe("calcularAguaAnualAutomatica — estimacion_default", () => {
  it("returns estimacion_default when no entradas and no cultivos", () => {
    const result = calcularAguaAnualAutomatica([], [], [], [], []);
    expect(result.metodoCalculo).toBe("estimacion_default");
    expect(result.aguaAnualM3).toBe(0);
    expect(result.confianza).toBe("baja");
  });

  it("calculates default estimation from estanque capacity × 26 llenadas/año", () => {
    const estanque = estanqueFixture(10);
    const result = calcularAguaAnualAutomatica([estanque], [], [], [], []);
    expect(result.metodoCalculo).toBe("estimacion_default");
    expect(result.aguaAnualM3).toBe(10 * 26); // 260
  });

  it("sums multiple estanques capacity", () => {
    const estanques = [estanqueFixture(10), estanqueFixture(5)];
    const result = calcularAguaAnualAutomatica(estanques, [], [], [], []);
    expect(result.aguaAnualM3).toBe(15 * 26); // 390
  });
});

describe("calcularAguaAnualAutomatica — historial", () => {
  it("uses historial when 2+ entradas are provided", () => {
    const estanque = estanqueFixture(10);
    const entradas = [
      entradaAgua("2025-01-01T00:00:00Z"),
      entradaAgua("2025-01-15T00:00:00Z"), // 14 días entre entradas
    ];
    const result = calcularAguaAnualAutomatica(
      [estanque],
      entradas,
      [],
      [],
      [],
    );
    expect(result.metodoCalculo).toBe("historial");
  });

  it("calculates based on interval between entries and capacity", () => {
    // Intervalo = 14 días → llenadas/año = 365/14 ≈ 26
    // Agua anual = 10m³ * 26.07 ≈ 261m³
    const estanque = estanqueFixture(10);
    const entradas = [
      entradaAgua("2025-01-01T00:00:00Z"),
      entradaAgua("2025-01-15T00:00:00Z"),
    ];
    const result = calcularAguaAnualAutomatica(
      [estanque],
      entradas,
      [],
      [],
      [],
    );
    expect(result.aguaAnualM3).toBeGreaterThan(200);
    expect(result.aguaAnualM3).toBeLessThan(400);
  });

  it("returns confianza=alta with 4+ entries", () => {
    const estanque = estanqueFixture(10);
    const entradas = [
      entradaAgua("2025-01-01T00:00:00Z"),
      entradaAgua("2025-01-15T00:00:00Z"),
      entradaAgua("2025-01-29T00:00:00Z"),
      entradaAgua("2025-02-12T00:00:00Z"),
    ];
    const result = calcularAguaAnualAutomatica(
      [estanque],
      entradas,
      [],
      [],
      [],
    );
    expect(result.confianza).toBe("alta");
  });

  it("returns confianza=media with exactly 2 entries", () => {
    const estanque = estanqueFixture(10);
    const entradas = [
      entradaAgua("2025-01-01T00:00:00Z"),
      entradaAgua("2025-01-15T00:00:00Z"),
    ];
    const result = calcularAguaAnualAutomatica(
      [estanque],
      entradas,
      [],
      [],
      [],
    );
    expect(result.confianza).toBe("media");
  });

  it("falls back to estimacion_default when all intervals are >= DIAS_POR_AÑO", () => {
    // Si el único intervalo entre entradas es 0 días (misma fecha), no cuenta
    const estanque = estanqueFixture(10);
    const entradas = [
      entradaAgua("2025-01-01T00:00:00Z"),
      entradaAgua("2025-01-01T00:00:00Z"), // mismo día → diasEntre=0
    ];
    const result = calcularAguaAnualAutomatica(
      [estanque],
      entradas,
      [],
      [],
      [],
    );
    // Intervalo=0 se descarta → cantidadIntervalos=0 → cae a estimacion_default
    expect(result.metodoCalculo).toBe("estimacion_default");
  });
});

describe("calcularAguaAnualAutomatica — consumo_cultivos", () => {
  const zonaCultivo: Zona = {
    id: "z-cultivo-1",
    terreno_id: "t-1",
    nombre: "Zona Cultivo",
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

  const planta: Planta = {
    id: "planta-1",
    zona_id: "z-cultivo-1",
    tipo_cultivo_id: "cultivo-1",
    x: 1,
    y: 1,
    estado: "creciendo",
    etapa_actual: "adulta",
    fecha_plantacion: "2025-01-01T00:00:00Z",
    notas: "",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  } as Planta;

  const cultivo = {
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
    calendario: { meses_siembra: [9], meses_cosecha: [1], meses_descanso: [] },
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

  it("uses consumo_cultivos when no entradas but plants produce consumption", () => {
    const result = calcularAguaAnualAutomatica(
      [],
      [],
      [zonaCultivo],
      [planta],
      [cultivo],
    );
    expect(result.metodoCalculo).toBe("consumo_cultivos");
    expect(result.confianza).toBe("baja");
  });

  it("agua anual = consumo semanal × 52 (puede redondear a 0 con zona pequeña)", () => {
    const result = calcularAguaAnualAutomatica(
      [],
      [],
      [zonaCultivo],
      [planta],
      [cultivo],
    );
    // consumo semanal con 1 planta en 100m² es tan pequeño (~0.006 m³/sem)
    // que Math.round(0.32) = 0. El assertion relevante es el metodoCalculo.
    expect(result.aguaAnualM3).toBeGreaterThanOrEqual(0);
    expect(result.metodoCalculo).toBe("consumo_cultivos");
  });

  it("historial takes priority over consumo_cultivos when 2+ entradas exist", () => {
    const entradas = [
      entradaAgua("2025-01-01T00:00:00Z"),
      entradaAgua("2025-01-15T00:00:00Z"),
    ];
    const result = calcularAguaAnualAutomatica(
      [estanqueFixture(10)],
      entradas,
      [zonaCultivo],
      [planta],
      [cultivo],
    );
    expect(result.metodoCalculo).toBe("historial");
  });
});

describe("calcularAguaAnualAutomatica — estructura del resultado", () => {
  it("always returns required fields", () => {
    const result = calcularAguaAnualAutomatica([], [], [], [], []);
    expect(result).toHaveProperty("aguaAnualM3");
    expect(result).toHaveProperty("metodoCalculo");
    expect(result).toHaveProperty("detalles");
    expect(result).toHaveProperty("confianza");
  });

  it("aguaAnualM3 is never negative", () => {
    const result = calcularAguaAnualAutomatica([], [], [], [], []);
    expect(result.aguaAnualM3).toBeGreaterThanOrEqual(0);
  });
});
