/**
 * Typed fixture factories for Playwright E2E tests.
 *
 * All factories import directly from src/types/index.ts.
 * If a TypeScript interface changes and the factory doesn't compile,
 * `pnpm tsc --noEmit` will fail before any test runs — keeping mocks
 * in sync with real types at compile time.
 */

import type {
  Proyecto,
  Terreno,
  Zona,
  Planta,
  CatalogoCultivo,
  Alerta,
  SistemaRiego,
  EntradaAgua,
} from "@/types";

const NOW = "2026-01-15T10:00:00Z";

// ─── Auth mock ────────────────────────────────────────────────────────────────

export const MOCK_USER_ID = "user-e2e-test-001";
export const MOCK_PROJECT_ID = "project-e2e-test-001";
export const MOCK_TERRENO_ID = "terreno-e2e-test-001";

export const MOCK_SESSION = {
  access_token: "mock-access-token-e2e",
  refresh_token: "mock-refresh-token-e2e",
  expires_in: 3600,
  token_type: "bearer",
  user: {
    id: MOCK_USER_ID,
    email: "test@agriplan.cl",
    role: "authenticated",
    aud: "authenticated",
    created_at: NOW,
    updated_at: NOW,
  },
};

// ─── Factories ────────────────────────────────────────────────────────────────

export function makeProyecto(overrides?: Partial<Proyecto>): Proyecto {
  return {
    id: MOCK_PROJECT_ID,
    usuario_id: MOCK_USER_ID,
    nombre: "Proyecto Test Arica",
    ubicacion_referencia: "Valle de Azapa, Arica",
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

const DEFAULT_SISTEMA_RIEGO: SistemaRiego = {
  litros_hora: 100,
  descuento_auto: true,
  ultima_actualizacion: NOW,
};

export function makeTerreno(overrides?: Partial<Terreno>): Terreno {
  return {
    id: MOCK_TERRENO_ID,
    proyecto_id: MOCK_PROJECT_ID,
    nombre: "Terreno Principal",
    ancho_m: 75,
    alto_m: 183,
    area_m2: 13725,
    agua_disponible_m3: 50,
    agua_actual_m3: 30,
    agua_fuente: "aljibe",
    agua_confiabilidad: "media",
    agua_costo_clp_por_m3: 2500,
    sistema_riego: DEFAULT_SISTEMA_RIEGO,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

export function makeZona(overrides?: Partial<Zona>): Zona {
  return {
    id: "zona-e2e-001",
    terreno_id: MOCK_TERRENO_ID,
    nombre: "Zona Tomates",
    tipo: "cultivo",
    estado: "activa",
    x: 5,
    y: 5,
    ancho: 20,
    alto: 20,
    area_m2: 400,
    color: "#22c55e",
    notas: "",
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

export function makeEstanque(overrides?: Partial<Zona>): Zona {
  return {
    id: "estanque-e2e-001",
    terreno_id: MOCK_TERRENO_ID,
    nombre: "Estanque Principal",
    tipo: "estanque",
    estado: "activa",
    x: 50,
    y: 50,
    ancho: 6,
    alto: 6,
    area_m2: 36,
    color: "#06b6d4",
    notas: "",
    estanque_config: {
      capacidad_m3: 50,
      nivel_actual_m3: 30,
      costo_por_m3: 2500,
      recarga: {
        frecuencia_dias: 7,
        cantidad_litros: 5000,
        ultima_recarga: "2025-12-01T00:00:00Z",
        proxima_recarga: "2026-01-08T00:00:00Z",
        costo_transporte_clp: 6438,
      },
    },
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

export function makePlanta(overrides?: Partial<Planta>): Planta {
  return {
    id: "planta-e2e-001",
    zona_id: "zona-e2e-001",
    tipo_cultivo_id: "cultivo-e2e-001",
    x: 2,
    y: 2,
    estado: "creciendo",
    etapa_actual: "adulta",
    fecha_plantacion: "2025-06-01T00:00:00Z",
    notas: "",
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

export function makeCultivo(
  overrides?: Partial<CatalogoCultivo>,
): CatalogoCultivo {
  return {
    id: "cultivo-e2e-001",
    proyecto_id: MOCK_PROJECT_ID,
    cultivo_base_id: "cultivo-higuera",
    nombre: "Higuera",
    agua_m3_ha_año_min: 6000,
    agua_m3_ha_año_max: 9000,
    espaciado_min_m: 4,
    espaciado_recomendado_m: 5,
    ph_min: 6.0,
    ph_max: 8.0,
    salinidad_tolerancia_dS_m: 2.7,
    boro_tolerancia_ppm: 1.0,
    tolerancia_boro: "media",
    tolerancia_salinidad: "media",
    calendario: {
      meses_siembra: [3, 4],
      meses_cosecha: [8, 9, 10],
      meses_descanso: [12, 1],
    },
    produccion: {
      produccion_kg_ha_año2: 8000,
      produccion_kg_ha_año3: 15000,
      produccion_kg_ha_año4: 20000,
      vida_util_dias: 365,
    },
    precio_kg_min_clp: 900,
    precio_kg_max_clp: 1800,
    precio_planta_clp: 6000,
    plagas: [],
    tiempo_produccion_meses: 6,
    vida_util_años: 20,
    tier: 1,
    riesgo: "bajo",
    notas: "",
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

export function makeAlerta(overrides?: Partial<Alerta>): Alerta {
  return {
    id: "alerta-e2e-001",
    terreno_id: MOCK_TERRENO_ID,
    tipo: "agua_critica",
    severidad: "critical",
    estado: "activa",
    titulo: "Agua crítica",
    descripcion: "Quedan menos de 7 días de agua disponible",
    sugerencia: "Programar recarga de estanque",
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

export function makeEntradaAgua(overrides?: Partial<EntradaAgua>): EntradaAgua {
  return {
    id: "entrada-agua-e2e-001",
    terreno_id: MOCK_TERRENO_ID,
    fecha: "2026-01-10T00:00:00Z",
    cantidad_m3: 10,
    costo_clp: 25000,
    proveedor: "Proveedor Test",
    notas: "",
    created_at: NOW,
    ...overrides,
  };
}
