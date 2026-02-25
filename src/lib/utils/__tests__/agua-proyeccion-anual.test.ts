import { describe, it, expect, vi } from "vitest";
import type { Terreno, Zona, Planta, CatalogoCultivo } from "@/types";

vi.mock("@/lib/utils/agua", () => ({
  calcularConsumoTerreno: vi.fn(() => 3),
  calcularStockEstanques: vi.fn(() => ({ aguaTotal: 20, capacidadTotal: 50 })),
}));

vi.mock("@/lib/utils/roi", () => ({
  obtenerCostoAguaPromedio: vi.fn(() => 200),
}));

vi.mock("@/lib/data/duracion-etapas", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/data/duracion-etapas")>();
  return {
    ...actual,
    getDiasTotalesCultivo: vi.fn(() => 240),
  };
});

import { generarProyeccionAnual } from "../agua-proyeccion-anual";

const terrenoFixture: Terreno = {
  id: "terreno-1",
  proyecto_id: "p-1",
  nombre: "Terreno Test",
  ancho_m: 100,
  alto_m: 100,
  area_m2: 10000,
  agua_disponible_m3: 50,
  agua_actual_m3: 30,
  agua_costo_clp_por_m3: 200,
  sistema_riego: {
    litros_hora: 100,
    descuento_auto: true,
    ultima_actualizacion: "2025-01-01T00:00:00Z",
  },
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
} as Terreno;

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

const estanqueFixture: Zona = {
  id: "estanque-1",
  terreno_id: "terreno-1",
  nombre: "Estanque 1",
  tipo: "estanque",
  estado: "activa",
  x: 50,
  y: 50,
  ancho: 5,
  alto: 5,
  area_m2: 25,
  color: "#06b6d4",
  notas: "",
  estanque_config: {
    capacidad_m3: 50,
    nivel_actual_m3: 20,
    recarga: {
      frecuencia_dias: 7,
      cantidad_litros: 5000,
      ultima_recarga: "2025-01-01T00:00:00Z",
      proxima_recarga: "2025-01-08T00:00:00Z",
      costo_recarga_clp: 2500,
    },
  },
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
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
  plagas: [],
  tiempo_produccion_meses: 4,
  vida_util_años: 1,
  tier: 1,
  riesgo: "bajo",
  notas: "",
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
} as CatalogoCultivo;

const plantaFixture: Planta = {
  id: "planta-1",
  zona_id: "zona-1",
  tipo_cultivo_id: "cultivo-1",
  x: 2,
  y: 2,
  estado: "creciendo",
  etapa_actual: "adulta",
  fecha_plantacion: "2025-06-01T00:00:00Z",
  notas: "",
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

describe("generarProyeccionAnual", () => {
  it("genera exactamente 12 meses de proyeccion", () => {
    const result = generarProyeccionAnual(
      terrenoFixture,
      [zonaFixture],
      [plantaFixture],
      [cultivoFixture],
    );
    expect(result.meses).toHaveLength(12);
  });

  it("retorna estructura completa de resumen", () => {
    const result = generarProyeccionAnual(
      terrenoFixture,
      [zonaFixture],
      [plantaFixture],
      [cultivoFixture],
    );
    expect(result.resumen).toBeDefined();
    expect(typeof result.resumen.consumoTotalAnual).toBe("number");
    expect(typeof result.resumen.recargasTotales).toBe("number");
    expect(typeof result.resumen.costosAgua).toBe("number");
    expect(typeof result.resumen.mesesDeficit).toBe("number");
  });

  it("cada mes tiene las propiedades esperadas", () => {
    const result = generarProyeccionAnual(
      terrenoFixture,
      [zonaFixture],
      [plantaFixture],
      [cultivoFixture],
    );
    const primerMes = result.meses[0];
    expect(primerMes.mes).toBe(0);
    expect(primerMes.mesNombre).toBeDefined();
    expect(typeof primerMes.nivelInicio).toBe("number");
    expect(typeof primerMes.consumo).toBe("number");
    expect(typeof primerMes.recargas).toBe("number");
    expect(typeof primerMes.nivelFin).toBe("number");
    expect(typeof primerMes.diasDeficit).toBe("number");
    expect(primerMes.temporada).toBeDefined();
  });

  it("maneja terreno sin zonas ni plantas", () => {
    const result = generarProyeccionAnual(terrenoFixture, [], [], []);
    expect(result.meses).toHaveLength(12);
    expect(result.resumen.consumoTotalAnual).toBeGreaterThanOrEqual(0);
    expect(result.eventos).toHaveLength(0);
  });

  it("calcula recargas mensuales desde estanques", () => {
    const result = generarProyeccionAnual(
      terrenoFixture,
      [zonaFixture, estanqueFixture],
      [plantaFixture],
      [cultivoFixture],
    );
    const tieneRecargaPositiva = result.meses.some((m) => m.recargas > 0);
    expect(tieneRecargaPositiva).toBe(true);
  });

  it("genera eventos de recarga para estanques con recarga configurada", () => {
    const result = generarProyeccionAnual(
      terrenoFixture,
      [zonaFixture, estanqueFixture],
      [plantaFixture],
      [cultivoFixture],
    );
    const eventosRecarga = result.eventos.filter((e) => e.tipo === "recarga");
    expect(eventosRecarga.length).toBeGreaterThan(0);
  });

  it("genera eventos de cosecha para plantas con tiempo_produccion_meses", () => {
    const plantaReciente: Planta = {
      ...plantaFixture,
      fecha_plantacion: new Date().toISOString(),
    };

    const result = generarProyeccionAnual(
      terrenoFixture,
      [zonaFixture],
      [plantaReciente],
      [cultivoFixture],
    );
    const eventosCosecha = result.eventos.filter((e) => e.tipo === "cosecha");
    expect(eventosCosecha.length).toBeGreaterThan(0);
  });

  it("no genera eventos para plantas muertas", () => {
    const plantaMuerta: Planta = {
      ...plantaFixture,
      estado: "muerta",
    };

    const result = generarProyeccionAnual(
      terrenoFixture,
      [zonaFixture],
      [plantaMuerta],
      [cultivoFixture],
    );
    const eventosReplanta = result.eventos.filter((e) => e.tipo === "replanta");
    const eventosCosecha = result.eventos.filter((e) => e.tipo === "cosecha");
    expect(eventosReplanta).toHaveLength(0);
    expect(eventosCosecha).toHaveLength(0);
  });

  it("eventos estan ordenados por fecha", () => {
    const result = generarProyeccionAnual(
      terrenoFixture,
      [zonaFixture, estanqueFixture],
      [plantaFixture],
      [cultivoFixture],
    );

    for (let i = 1; i < result.eventos.length; i++) {
      expect(
        result.eventos[i].fecha.getTime(),
      ).toBeGreaterThanOrEqual(result.eventos[i - 1].fecha.getTime());
    }
  });

  it("nivel fin nunca es negativo", () => {
    const result = generarProyeccionAnual(
      terrenoFixture,
      [zonaFixture],
      [plantaFixture],
      [cultivoFixture],
    );

    for (const mes of result.meses) {
      expect(mes.nivelFin).toBeGreaterThanOrEqual(0);
    }
  });

  it("genera eventos de lavado salino para estanques con ultima_recarga", () => {
    const result = generarProyeccionAnual(
      terrenoFixture,
      [zonaFixture, estanqueFixture],
      [plantaFixture],
      [cultivoFixture],
    );
    const eventosLavado = result.eventos.filter((e) => e.tipo === "lavado");
    expect(eventosLavado.length).toBeGreaterThan(0);
  });

  it("usa agua_actual_m3 del terreno cuando no hay estanques", () => {
    const result = generarProyeccionAnual(
      terrenoFixture,
      [zonaFixture],
      [plantaFixture],
      [cultivoFixture],
    );
    expect(result.meses[0].nivelInicio).toBe(terrenoFixture.agua_actual_m3);
  });
});
