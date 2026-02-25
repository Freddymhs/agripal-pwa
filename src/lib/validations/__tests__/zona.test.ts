import { describe, it, expect } from "vitest";
import type { Zona, Terreno, Planta } from "@/types";
import {
  zonasSeSuperponen,
  validarNuevaZona,
  validarRedimensionarZona,
  validarMoverZona,
  advertenciaEliminarZona,
} from "../zona";

const terrenoFixture: Terreno = {
  id: "terreno-1",
  proyecto_id: "p-1",
  nombre: "Terreno Test",
  ancho_m: 100,
  alto_m: 100,
  area_m2: 10000,
  agua_disponible_m3: 50,
  agua_actual_m3: 50,
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

describe("zonasSeSuperponen", () => {
  it("detecta superposicion total", () => {
    const z1 = { x: 0, y: 0, ancho: 10, alto: 10 };
    const z2 = { x: 5, y: 5, ancho: 10, alto: 10 };
    expect(zonasSeSuperponen(z1, z2)).toBe(true);
  });

  it("no detecta superposicion cuando estan separadas horizontalmente", () => {
    const z1 = { x: 0, y: 0, ancho: 10, alto: 10 };
    const z2 = { x: 20, y: 0, ancho: 10, alto: 10 };
    expect(zonasSeSuperponen(z1, z2)).toBe(false);
  });

  it("no detecta superposicion cuando estan separadas verticalmente", () => {
    const z1 = { x: 0, y: 0, ancho: 10, alto: 10 };
    const z2 = { x: 0, y: 20, ancho: 10, alto: 10 };
    expect(zonasSeSuperponen(z1, z2)).toBe(false);
  });

  it("no detecta superposicion cuando son adyacentes exactas", () => {
    const z1 = { x: 0, y: 0, ancho: 10, alto: 10 };
    const z2 = { x: 10, y: 0, ancho: 10, alto: 10 };
    expect(zonasSeSuperponen(z1, z2)).toBe(false);
  });

  it("detecta superposicion parcial en esquina", () => {
    const z1 = { x: 0, y: 0, ancho: 10, alto: 10 };
    const z2 = { x: 9, y: 9, ancho: 10, alto: 10 };
    expect(zonasSeSuperponen(z1, z2)).toBe(true);
  });

  it("detecta cuando una zona esta completamente dentro de otra", () => {
    const z1 = { x: 0, y: 0, ancho: 20, alto: 20 };
    const z2 = { x: 5, y: 5, ancho: 5, alto: 5 };
    expect(zonasSeSuperponen(z1, z2)).toBe(true);
  });
});

describe("validarNuevaZona", () => {
  it("acepta zona valida dentro del terreno", () => {
    const result = validarNuevaZona(
      { x: 20, y: 20, ancho: 10, alto: 10 },
      [],
      terrenoFixture,
    );
    expect(result.valida).toBe(true);
  });

  it("rechaza zona con ancho menor a 1m", () => {
    const result = validarNuevaZona(
      { x: 0, y: 0, ancho: 0.5, alto: 10 },
      [],
      terrenoFixture,
    );
    expect(result.valida).toBe(false);
    expect(result.error).toContain("1m");
  });

  it("rechaza zona con alto menor a 1m", () => {
    const result = validarNuevaZona(
      { x: 0, y: 0, ancho: 10, alto: 0.5 },
      [],
      terrenoFixture,
    );
    expect(result.valida).toBe(false);
    expect(result.error).toContain("1m");
  });

  it("rechaza zona con coordenadas negativas", () => {
    const result = validarNuevaZona(
      { x: -1, y: 0, ancho: 10, alto: 10 },
      [],
      terrenoFixture,
    );
    expect(result.valida).toBe(false);
    expect(result.error).toContain("negativas");
  });

  it("rechaza zona que excede ancho del terreno", () => {
    const result = validarNuevaZona(
      { x: 95, y: 0, ancho: 10, alto: 10 },
      [],
      terrenoFixture,
    );
    expect(result.valida).toBe(false);
    expect(result.error).toContain("ancho del terreno");
  });

  it("rechaza zona que excede alto del terreno", () => {
    const result = validarNuevaZona(
      { x: 0, y: 95, ancho: 10, alto: 10 },
      [],
      terrenoFixture,
    );
    expect(result.valida).toBe(false);
    expect(result.error).toContain("alto del terreno");
  });

  it("rechaza zona que se superpone con existente", () => {
    const result = validarNuevaZona(
      { x: 5, y: 5, ancho: 10, alto: 10 },
      [zonaFixture],
      terrenoFixture,
    );
    expect(result.valida).toBe(false);
    expect(result.error).toContain("superpone");
  });

  it("acepta zona que no se superpone con existentes", () => {
    const result = validarNuevaZona(
      { x: 50, y: 50, ancho: 10, alto: 10 },
      [zonaFixture],
      terrenoFixture,
    );
    expect(result.valida).toBe(true);
  });
});

describe("validarRedimensionarZona", () => {
  it("acepta redimension valida", () => {
    const result = validarRedimensionarZona(
      zonaFixture,
      { ancho: 20, alto: 20 },
      [],
      [zonaFixture],
      terrenoFixture,
    );
    expect(result.valida).toBe(true);
  });

  it("rechaza cuando ancho es menor a 1m", () => {
    const result = validarRedimensionarZona(
      zonaFixture,
      { ancho: 0.5, alto: 10 },
      [],
      [zonaFixture],
      terrenoFixture,
    );
    expect(result.valida).toBe(false);
  });

  it("rechaza cuando excede ancho del terreno", () => {
    const result = validarRedimensionarZona(
      zonaFixture,
      { ancho: 150, alto: 10 },
      [],
      [zonaFixture],
      terrenoFixture,
    );
    expect(result.valida).toBe(false);
  });

  it("rechaza cuando plantas quedarian fuera", () => {
    const planta: Planta = {
      id: "p1",
      zona_id: "zona-1",
      tipo_cultivo_id: "c1",
      x: 8,
      y: 8,
      estado: "creciendo",
      etapa_actual: "adulta",
      fecha_plantacion: "2025-01-01T00:00:00Z",
      notas: "",
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    };

    const result = validarRedimensionarZona(
      zonaFixture,
      { ancho: 5, alto: 5 },
      [planta],
      [zonaFixture],
      terrenoFixture,
    );
    expect(result.valida).toBe(false);
    expect(result.error).toContain("planta");
  });

  it("rechaza cuando se superpondria con otra zona", () => {
    const otraZona: Zona = {
      ...zonaFixture,
      id: "zona-2",
      nombre: "Zona 2",
      x: 15,
      y: 0,
      ancho: 10,
      alto: 10,
    };

    const result = validarRedimensionarZona(
      zonaFixture,
      { ancho: 20, alto: 10 },
      [],
      [zonaFixture, otraZona],
      terrenoFixture,
    );
    expect(result.valida).toBe(false);
    expect(result.error).toContain("superpondría");
  });
});

describe("validarMoverZona", () => {
  it("acepta movimiento valido", () => {
    const result = validarMoverZona(
      zonaFixture,
      { x: 50, y: 50 },
      [zonaFixture],
      terrenoFixture,
    );
    expect(result.valida).toBe(true);
  });

  it("rechaza posicion con coordenadas negativas", () => {
    const result = validarMoverZona(
      zonaFixture,
      { x: -1, y: 0 },
      [zonaFixture],
      terrenoFixture,
    );
    expect(result.valida).toBe(false);
    expect(result.error).toContain("negativas");
  });

  it("rechaza cuando excede ancho del terreno", () => {
    const result = validarMoverZona(
      zonaFixture,
      { x: 95, y: 0 },
      [zonaFixture],
      terrenoFixture,
    );
    expect(result.valida).toBe(false);
    expect(result.error).toContain("ancho del terreno");
  });

  it("rechaza cuando excede alto del terreno", () => {
    const result = validarMoverZona(
      zonaFixture,
      { x: 0, y: 95 },
      [zonaFixture],
      terrenoFixture,
    );
    expect(result.valida).toBe(false);
    expect(result.error).toContain("alto del terreno");
  });

  it("rechaza cuando se superpondria con otra zona", () => {
    const otraZona: Zona = {
      ...zonaFixture,
      id: "zona-2",
      nombre: "Zona 2",
      x: 50,
      y: 50,
      ancho: 10,
      alto: 10,
    };

    const result = validarMoverZona(
      zonaFixture,
      { x: 55, y: 55 },
      [zonaFixture, otraZona],
      terrenoFixture,
    );
    expect(result.valida).toBe(false);
    expect(result.error).toContain("superpondría");
  });

  it("ignora la propia zona al verificar superposicion", () => {
    const result = validarMoverZona(
      zonaFixture,
      { x: 0, y: 0 },
      [zonaFixture],
      terrenoFixture,
    );
    expect(result.valida).toBe(true);
  });
});

describe("advertenciaEliminarZona", () => {
  it("retorna null si la zona no tiene plantas", () => {
    const result = advertenciaEliminarZona(zonaFixture, []);
    expect(result).toBe(null);
  });

  it("retorna advertencia con conteo de plantas", () => {
    const plantas: Planta[] = [
      {
        id: "p1",
        zona_id: "zona-1",
        tipo_cultivo_id: "c1",
        x: 1,
        y: 1,
        estado: "creciendo",
        etapa_actual: "adulta",
        fecha_plantacion: "2025-01-01T00:00:00Z",
        notas: "",
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      },
      {
        id: "p2",
        zona_id: "zona-1",
        tipo_cultivo_id: "c1",
        x: 3,
        y: 3,
        estado: "creciendo",
        etapa_actual: "adulta",
        fecha_plantacion: "2025-01-01T00:00:00Z",
        notas: "",
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      },
    ];

    const result = advertenciaEliminarZona(zonaFixture, plantas);
    expect(result).not.toBe(null);
    expect(result).toContain("2 planta(s)");
  });

  it("no cuenta plantas de otras zonas", () => {
    const plantas: Planta[] = [
      {
        id: "p1",
        zona_id: "zona-otra",
        tipo_cultivo_id: "c1",
        x: 1,
        y: 1,
        estado: "creciendo",
        etapa_actual: "adulta",
        fecha_plantacion: "2025-01-01T00:00:00Z",
        notas: "",
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      },
    ];

    const result = advertenciaEliminarZona(zonaFixture, plantas);
    expect(result).toBe(null);
  });
});
