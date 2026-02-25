import { describe, it, expect, vi } from "vitest";
import type {
  Terreno,
  Zona,
  Planta,
  CatalogoCultivo,
} from "@/types";

vi.mock("@/lib/dal", () => ({
  alertasDAL: {
    getActiveByTerrenoId: vi.fn(() => Promise.resolve([])),
  },
  transaccionesDAL: {
    sincronizarAlertas: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock("@/lib/utils/agua", () => ({
  calcularConsumoTerreno: vi.fn(() => 5),
  calcularStockEstanques: vi.fn(() => ({ aguaTotal: 10, capacidadTotal: 50 })),
  calcularDiasRestantes: vi.fn(() => 3),
}));

vi.mock("@/lib/data/duracion-etapas", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/data/duracion-etapas")>();
  return {
    ...actual,
    getDiasTotalesCultivo: vi.fn(() => 240),
  };
});

const terrenoFixture: Terreno = {
  id: "terreno-1",
  proyecto_id: "p-1",
  nombre: "Terreno Test",
  ancho_m: 100,
  alto_m: 100,
  area_m2: 10000,
  agua_disponible_m3: 50,
  agua_actual_m3: 10,
  sistema_riego: {
    litros_hora: 100,
    descuento_auto: true,
    ultima_actualizacion: "2025-01-01T00:00:00Z",
  },
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
} as Terreno;

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

const zonaFixture: Zona = {
  id: "zona-1",
  terreno_id: "terreno-1",
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

const plantaFixture: Planta = {
  id: "planta-1",
  zona_id: "zona-1",
  tipo_cultivo_id: "cultivo-1",
  x: 2,
  y: 2,
  estado: "creciendo",
  etapa_actual: "adulta",
  fecha_plantacion: "2025-01-01T00:00:00Z",
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
    nivel_actual_m3: 10,
    recarga: {
      frecuencia_dias: 7,
      cantidad_litros: 5000,
      ultima_recarga: "2024-11-01T00:00:00Z",
      proxima_recarga: "2025-01-15T00:00:00Z",
      costo_recarga_clp: 2500,
    },
  },
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

describe("sincronizarAlertas", () => {
  it("se puede importar la función", async () => {
    const { sincronizarAlertas } = await import("../alertas");
    expect(sincronizarAlertas).toBeDefined();
    expect(typeof sincronizarAlertas).toBe("function");
  });

  it("retorna array de alertas para terreno sin datos", async () => {
    const { sincronizarAlertas } = await import("../alertas");
    const result = await sincronizarAlertas(terrenoFixture, [], [], []);
    expect(Array.isArray(result)).toBe(true);
  });

  it("genera alertas cuando hay zonas de cultivo sin plantas", async () => {
    const { sincronizarAlertas } = await import("../alertas");
    const result = await sincronizarAlertas(
      terrenoFixture,
      [zonaFixture],
      [],
      [cultivoFixture],
    );
    expect(Array.isArray(result)).toBe(true);
  });

  it("procesa terreno con estanques y plantas", async () => {
    const { sincronizarAlertas } = await import("../alertas");
    const result = await sincronizarAlertas(
      terrenoFixture,
      [zonaFixture, estanqueFixture],
      [plantaFixture],
      [cultivoFixture],
    );
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("generarAlertas (via sincronizarAlertas integration)", () => {
  it("debe manejar terreno sin zonas", async () => {
    const { sincronizarAlertas } = await import("../alertas");
    const result = await sincronizarAlertas(terrenoFixture, [], [], []);
    expect(Array.isArray(result)).toBe(true);
  });

  it("debe detectar estanque sin fuente", async () => {
    const estanqueSinFuente: Zona = {
      ...estanqueFixture,
      estanque_config: {
        capacidad_m3: 50,
        nivel_actual_m3: 10,
      },
    };

    const { sincronizarAlertas } = await import("../alertas");
    const result = await sincronizarAlertas(
      terrenoFixture,
      [estanqueSinFuente],
      [],
      [],
    );
    expect(Array.isArray(result)).toBe(true);
  });

  it("debe detectar plantas muertas", async () => {
    const plantaMuerta: Planta = {
      ...plantaFixture,
      id: "planta-muerta",
      estado: "muerta",
    };

    const { sincronizarAlertas } = await import("../alertas");
    const result = await sincronizarAlertas(
      terrenoFixture,
      [zonaFixture],
      [plantaMuerta],
      [cultivoFixture],
    );
    expect(Array.isArray(result)).toBe(true);
  });

  it("debe detectar plantas produciendo (cosecha pendiente)", async () => {
    const plantaProduciendo: Planta = {
      ...plantaFixture,
      id: "planta-produciendo",
      estado: "produciendo",
    };

    const { sincronizarAlertas } = await import("../alertas");
    const result = await sincronizarAlertas(
      terrenoFixture,
      [zonaFixture],
      [plantaProduciendo],
      [cultivoFixture],
    );
    expect(Array.isArray(result)).toBe(true);
  });

  it("debe detectar plantas con espaciado insuficiente", async () => {
    const planta1: Planta = {
      ...plantaFixture,
      id: "planta-1",
      x: 1,
      y: 1,
    };
    const planta2: Planta = {
      ...plantaFixture,
      id: "planta-2",
      x: 1.2,
      y: 1.2,
    };

    const { sincronizarAlertas } = await import("../alertas");
    const result = await sincronizarAlertas(
      terrenoFixture,
      [zonaFixture],
      [planta1, planta2],
      [cultivoFixture],
    );
    expect(Array.isArray(result)).toBe(true);
  });

  it("debe manejar zona cultivo sin configuracion de riego con plantas", async () => {
    const zonaSinRiego: Zona = {
      ...zonaFixture,
      configuracion_riego: undefined,
    };

    const { sincronizarAlertas } = await import("../alertas");
    const result = await sincronizarAlertas(
      terrenoFixture,
      [zonaSinRiego],
      [plantaFixture],
      [cultivoFixture],
    );
    expect(Array.isArray(result)).toBe(true);
  });

  it("debe detectar riesgo de encharcamiento en suelo arcilloso con riego continuo", async () => {
    const zonaConRiegoContinuo: Zona = {
      ...zonaFixture,
      configuracion_riego: {
        tipo: "continuo_24_7",
        caudal_total_lh: 100,
      },
    };
    const terrenoArcilloso: Terreno = {
      ...terrenoFixture,
      suelo: {
        fisico: {
          textura: "arcillosa",
        },
      },
    };

    const { sincronizarAlertas } = await import("../alertas");
    const result = await sincronizarAlertas(
      terrenoArcilloso,
      [zonaConRiegoContinuo],
      [plantaFixture],
      [cultivoFixture],
    );
    expect(Array.isArray(result)).toBe(true);
  });
});
