import { describe, it, expect } from "vitest";
import {
  validarEstadoPlanta,
  validarEtapaPlanta,
  validarPosicionParaMover,
} from "../planta";
import type { Zona, Planta, CatalogoCultivo } from "@/types";

const crearCultivoTest = (
  overrides?: Partial<CatalogoCultivo>,
): CatalogoCultivo => ({
  id: "c1",
  proyecto_id: "p1",
  nombre: "Tomate",
  agua_m3_ha_año_min: 400,
  agua_m3_ha_año_max: 600,
  espaciado_min_m: 0.5,
  espaciado_recomendado_m: 1.0,
  ph_min: 6.0,
  ph_max: 6.8,
  salinidad_tolerancia_dS_m: 2.5,
  boro_tolerancia_ppm: 0.3,
  tolerancia_boro: "media" as const,
  tolerancia_salinidad: "media" as const,
  calendario: {
    meses_siembra: [1, 2, 3],
    meses_cosecha: [5, 6, 7],
    meses_descanso: [],
  },
  produccion: {
    produccion_kg_ha_año2: 50000,
    produccion_kg_ha_año3: 60000,
    produccion_kg_ha_año4: 60000,
    vida_util_dias: 120,
  },
  precio_kg_min_clp: 500,
  precio_kg_max_clp: 800,
  plagas: [],
  tiempo_produccion_meses: 4,
  vida_util_años: 1,
  tier: 1 as const,
  riesgo: "bajo" as const,
  notas: "",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  ...overrides,
});

describe("Validadores de Plantas", () => {
  describe("validarEstadoPlanta", () => {
    it("debe aceptar estados válidos", () => {
      expect(validarEstadoPlanta("plantada")).toBe(true);
      expect(validarEstadoPlanta("creciendo")).toBe(true);
      expect(validarEstadoPlanta("produciendo")).toBe(true);
      expect(validarEstadoPlanta("muerta")).toBe(true);
    });

    it("debe rechazar estados inválidos", () => {
      expect(validarEstadoPlanta("replantada")).toBe(false);
      expect(validarEstadoPlanta("enfermedad")).toBe(false);
      expect(validarEstadoPlanta("")).toBe(false);
      expect(validarEstadoPlanta(null)).toBe(false);
      expect(validarEstadoPlanta(undefined)).toBe(false);
    });
  });

  describe("validarEtapaPlanta", () => {
    it("debe aceptar etapas válidas", () => {
      expect(validarEtapaPlanta("plántula")).toBe(true);
      expect(validarEtapaPlanta("joven")).toBe(true);
      expect(validarEtapaPlanta("adulta")).toBe(true);
      expect(validarEtapaPlanta("madura")).toBe(true);
    });

    it("debe rechazar etapas inválidas", () => {
      expect(validarEtapaPlanta("bebé")).toBe(false);
      expect(validarEtapaPlanta("vieja")).toBe(false);
      expect(validarEtapaPlanta("")).toBe(false);
      expect(validarEtapaPlanta(null)).toBe(false);
      expect(validarEtapaPlanta(undefined)).toBe(false);
    });
  });

  describe("validarPosicionParaMover", () => {
    const zona: Zona = {
      id: "z1",
      terreno_id: "t1",
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
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    };

    const plantasExistentes: Planta[] = [
      {
        id: "p1",
        zona_id: "z1",
        tipo_cultivo_id: "c1",
        x: 5,
        y: 5,
        estado: "plantada",
        etapa_actual: "joven",
        fecha_plantacion: "2024-01-01T00:00:00Z",
        notas: "",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
    ];

    it("debe aceptar posiciones válidas dentro de la zona", () => {
      const resultado = validarPosicionParaMover(
        { x: 2, y: 2 },
        zona,
        [],
        undefined,
      );
      expect(resultado.valida).toBe(true);
    });

    it("debe rechazar posiciones fuera del límite X", () => {
      const resultado = validarPosicionParaMover(
        { x: -1, y: 5 },
        zona,
        [],
        undefined,
      );
      expect(resultado.valida).toBe(false);
      expect(resultado.error).toContain("Posición X");
    });

    it("debe rechazar posiciones fuera del límite X (máximo)", () => {
      const resultado = validarPosicionParaMover(
        { x: 11, y: 5 },
        zona,
        [],
        undefined,
      );
      expect(resultado.valida).toBe(false);
      expect(resultado.error).toContain("Posición X");
    });

    it("debe rechazar posiciones fuera del límite Y", () => {
      const resultado = validarPosicionParaMover(
        { x: 5, y: -1 },
        zona,
        [],
        undefined,
      );
      expect(resultado.valida).toBe(false);
      expect(resultado.error).toContain("Posición Y");
    });

    it("debe rechazar posiciones fuera del límite Y (máximo)", () => {
      const resultado = validarPosicionParaMover(
        { x: 5, y: 11 },
        zona,
        [],
        undefined,
      );
      expect(resultado.valida).toBe(false);
      expect(resultado.error).toContain("Posición Y");
    });

    it("debe validar espaciado mínimo cuando se proporciona cultivo", () => {
      const cultivo = crearCultivoTest({ espaciado_recomendado_m: 1.0 });

      // Posición muy cercana a planta existente
      const resultado = validarPosicionParaMover(
        { x: 5.5, y: 5 },
        zona,
        plantasExistentes,
        cultivo,
      );
      expect(resultado.valida).toBe(false);
      expect(resultado.error).toContain("Demasiado cerca");
    });

    it("debe aceptar posiciones que respetan espaciado mínimo", () => {
      const cultivo = crearCultivoTest({ espaciado_recomendado_m: 1.0 });

      // Posición suficientemente alejada
      const resultado = validarPosicionParaMover(
        { x: 2, y: 2 },
        zona,
        plantasExistentes,
        cultivo,
      );
      expect(resultado.valida).toBe(true);
    });

    it("debe ignorar plantas de otras zonas para validación de espaciado", () => {
      const cultivo = crearCultivoTest({ espaciado_recomendado_m: 1.0 });

      const plantasOtraZona: Planta[] = [
        {
          id: "p2",
          zona_id: "z2", // Otra zona
          tipo_cultivo_id: "c1",
          x: 5.5,
          y: 5,
          estado: "plantada",
          etapa_actual: "joven",
          fecha_plantacion: "2024-01-01T00:00:00Z",
          notas: "",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ];

      // Posición cercana pero en otra zona - debe ser válida
      const resultado = validarPosicionParaMover(
        { x: 5.5, y: 5 },
        zona,
        plantasOtraZona,
        cultivo,
      );
      expect(resultado.valida).toBe(true);
    });
  });
});
