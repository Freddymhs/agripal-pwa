import { describe, it, expect, vi, afterEach } from "vitest";
import {
  calcularEtapaActual,
  getDiasRestantesEtapa,
  getDiasTotalesCultivo,
} from "../calculos-etapas";

afterEach(() => {
  vi.useRealTimers();
});

describe("getDiasTotalesCultivo", () => {
  it("sums all stage durations for tomate (30+45+90+75=240)", () => {
    expect(getDiasTotalesCultivo("tomate")).toBe(240);
  });

  it("sums all stage durations for olivo (365+730+1825+3650=6570)", () => {
    expect(getDiasTotalesCultivo("olivo")).toBe(6570);
  });

  it("uses default when cultivo not found (30+45+90+60=225)", () => {
    expect(getDiasTotalesCultivo("cultivo-inexistente")).toBe(225);
  });

  it("matches by partial name (tuna matches 'tuna')", () => {
    expect(getDiasTotalesCultivo("Tuna")).toBe(180 + 365 + 730 + 3650);
  });

  it("returns positive total for all known crops", () => {
    const cultivos = [
      "tomate",
      "olivo",
      "limon",
      "quinoa",
      "maracuya",
      "arandano",
    ];
    for (const c of cultivos) {
      expect(getDiasTotalesCultivo(c)).toBeGreaterThan(0);
    }
  });
});

describe("calcularEtapaActual", () => {
  it("returns plántula when planted today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-01T00:00:00Z"));
    const fechaPlantacion = new Date("2025-06-01T00:00:00Z");
    expect(calcularEtapaActual("tomate", fechaPlantacion)).toBe("plántula");
  });

  it("returns plántula when date is in the future", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-01T00:00:00Z"));
    const futuro = new Date("2025-12-01T00:00:00Z");
    expect(calcularEtapaActual("tomate", futuro)).toBe("plántula");
  });

  it("returns joven after plántula duration passes", () => {
    vi.useFakeTimers();
    // tomate plántula = 30 días
    vi.setSystemTime(new Date("2025-07-10T00:00:00Z")); // 39 días después
    const fechaPlantacion = new Date("2025-06-01T00:00:00Z");
    expect(calcularEtapaActual("tomate", fechaPlantacion)).toBe("joven");
  });

  it("returns adulta after plántula + joven duration passes", () => {
    vi.useFakeTimers();
    // tomate: plántula=30, joven=45 → adulta empieza en día 75
    vi.setSystemTime(new Date("2025-08-15T00:00:00Z")); // 75 días después
    const fechaPlantacion = new Date("2025-06-01T00:00:00Z");
    expect(calcularEtapaActual("tomate", fechaPlantacion)).toBe("adulta");
  });

  it("returns madura when plant has lived past total duration", () => {
    vi.useFakeTimers();
    // tomate total = 240 días
    vi.setSystemTime(new Date("2026-06-01T00:00:00Z")); // 365 días después
    const fechaPlantacion = new Date("2025-06-01T00:00:00Z");
    expect(calcularEtapaActual("tomate", fechaPlantacion)).toBe("madura");
  });

  it("handles unknown cultivo using default durations", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-01T00:00:00Z"));
    const fechaPlantacion = new Date("2025-06-01T00:00:00Z");
    expect(calcularEtapaActual("cultivo-raro", fechaPlantacion)).toBe(
      "plántula",
    );
  });
});

describe("getDiasRestantesEtapa", () => {
  it("returns positive days remaining when still in plántula", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-10T00:00:00Z")); // 9 días desde plantación
    const fechaPlantacion = new Date("2025-06-01T00:00:00Z");
    // tomate plántula = 30 días → quedan 30-9 = 21 días
    const result = getDiasRestantesEtapa("tomate", "plántula", fechaPlantacion);
    expect(result).toBe(21);
  });

  it("returns 0 when past etapa boundary", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-09-01T00:00:00Z")); // 92 días → adulta
    const fechaPlantacion = new Date("2025-06-01T00:00:00Z");
    // plántula ya pasó → 0
    const result = getDiasRestantesEtapa("tomate", "plántula", fechaPlantacion);
    expect(result).toBe(0);
  });

  it("returns 0 for unknown etapa", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-01T00:00:00Z"));
    const result = getDiasRestantesEtapa(
      "tomate",
      "etapa-rara" as never,
      new Date("2025-06-01T00:00:00Z"),
    );
    expect(result).toBe(0);
  });
});
