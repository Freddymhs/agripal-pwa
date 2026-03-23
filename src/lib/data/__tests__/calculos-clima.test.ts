import { describe, it, expect, vi, afterEach } from "vitest";
import {
  getTemporadaActual,
  getEtoMesActual,
  hayCamanchaca,
  getFactorClimatico,
} from "../calculos-clima";
import type { DatosETo } from "../calculos-clima";

afterEach(() => {
  vi.useRealTimers();
});

const etoData: DatosETo = {
  eto_referencia_mm_dia: 4.2,
  mensual: {
    "1": { eto_mm_dia: 5.5, label: "Enero" },
    "2": { eto_mm_dia: 5.1, label: "Febrero" },
    "3": { eto_mm_dia: 4.8, label: "Marzo" },
    "6": { eto_mm_dia: 2.7, label: "Junio" },
    "7": { eto_mm_dia: 2.8, label: "Julio" },
    "12": { eto_mm_dia: 5.4, label: "Diciembre" },
  },
  camanchaca: {
    nota: "Camanchaca de invierno",
    meses_presencia: [6, 7, 8],
    aporte_estimado_mm_dia: 0.3,
    reduccion_eto_pct: 10,
    info: "Nubosidad matutina",
  },
};

describe("getTemporadaActual", () => {
  it("returns verano for December (month index 11)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-12-15T00:00:00Z"));
    expect(getTemporadaActual()).toBe("verano");
  });

  it("returns verano for January (month index 0)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-15T00:00:00Z"));
    expect(getTemporadaActual()).toBe("verano");
  });

  it("returns verano for February (month index 1)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-02-15T00:00:00Z"));
    expect(getTemporadaActual()).toBe("verano");
  });

  it("returns otoño for March (month index 2)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-03-15T00:00:00Z"));
    expect(getTemporadaActual()).toBe("otoño");
  });

  it("returns otoño for May (month index 4)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-05-15T00:00:00Z"));
    expect(getTemporadaActual()).toBe("otoño");
  });

  it("returns invierno for June (month index 5)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-15T00:00:00Z"));
    expect(getTemporadaActual()).toBe("invierno");
  });

  it("returns invierno for August (month index 7)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-08-15T00:00:00Z"));
    expect(getTemporadaActual()).toBe("invierno");
  });

  it("returns primavera for September (month index 8)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-09-15T00:00:00Z"));
    expect(getTemporadaActual()).toBe("primavera");
  });

  it("returns primavera for November (month index 10)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-11-15T00:00:00Z"));
    expect(getTemporadaActual()).toBe("primavera");
  });
});

describe("getEtoMesActual", () => {
  it("returns eto for current month when present in mensual", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-15T00:00:00Z"));
    expect(getEtoMesActual(etoData)).toBe(5.5);
  });

  it("returns eto_referencia_mm_dia as fallback when month not in mensual", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-04-15T00:00:00Z")); // mes 4 no está en fixture
    expect(getEtoMesActual(etoData)).toBe(4.2);
  });

  it("returns June ET0 in June", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-15T00:00:00Z"));
    expect(getEtoMesActual(etoData)).toBe(2.7);
  });
});

describe("hayCamanchaca", () => {
  it("returns true in June (month 6 in meses_presencia)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-15T00:00:00Z"));
    expect(hayCamanchaca(etoData)).toBe(true);
  });

  it("returns false in January (not in meses_presencia)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-15T00:00:00Z"));
    expect(hayCamanchaca(etoData)).toBe(false);
  });
});

describe("getFactorClimatico", () => {
  it("returns ratio etoActual/etoRef when no camanchaca", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-15T00:00:00Z")); // eto=5.5, ref=4.2, no camanchaca
    const expected = Math.round((5.5 / 4.2) * 100) / 100;
    expect(getFactorClimatico(etoData)).toBe(expected);
  });

  it("applies camanchaca reduction in June", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-15T00:00:00Z")); // eto=2.7, ref=4.2, camanchaca 10%
    const baseFactor = 2.7 / 4.2;
    const expected = Math.round(baseFactor * (1 - 0.1) * 100) / 100;
    expect(getFactorClimatico(etoData)).toBe(expected);
  });

  it("factor with camanchaca is less than without", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-15T00:00:00Z"));
    const conCamanchaca = getFactorClimatico(etoData);
    vi.setSystemTime(new Date("2025-01-15T00:00:00Z"));
    const sinCamanchaca = getFactorClimatico(etoData);
    // La reducción por camanchaca baja el factor respecto al baseFactor sin ella
    expect(conCamanchaca).toBeLessThan(sinCamanchaca);
  });
});
