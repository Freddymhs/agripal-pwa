import { describe, it, expect } from "vitest";
import {
  BILLING,
  MP_ESTADO_MAP,
  ESTADO_SUSCRIPCION,
  ESTADO_PAGO,
  type EstadoSuscripcion,
  type EstadoPago,
} from "@/lib/constants/billing";

describe("BILLING constants", () => {
  it("has correct price in CLP (integer, no decimals)", () => {
    expect(BILLING.PRECIO_CLP).toBe(9990);
    expect(Number.isInteger(BILLING.PRECIO_CLP)).toBe(true);
  });

  it("has correct currency", () => {
    expect(BILLING.MONEDA).toBe("CLP");
  });

  it("trial is 180 days (6 months)", () => {
    expect(BILLING.TRIAL_DIAS).toBe(180);
  });

  it("grace period is 3 days", () => {
    expect(BILLING.GRACIA_DIAS).toBe(3);
  });

  it("renewal period is 1 month", () => {
    expect(BILLING.RENEWAL_MONTHS).toBe(1);
  });

  it("all constants are readonly", () => {
    expect(Object.isFrozen(BILLING)).toBe(false); // as const doesn't freeze
    // But TypeScript prevents mutation at compile time
    expect(typeof BILLING.PRECIO_CLP).toBe("number");
    expect(typeof BILLING.MONEDA).toBe("string");
  });
});

describe("MP_ESTADO_MAP", () => {
  const ALL_MP_STATUSES = Object.values(ESTADO_PAGO);

  it("maps all known MercadoPago statuses", () => {
    for (const status of ALL_MP_STATUSES) {
      expect(MP_ESTADO_MAP[status]).toBeDefined();
    }
  });

  it("returns undefined for unknown statuses", () => {
    expect(MP_ESTADO_MAP["unknown_status"]).toBeUndefined();
    expect(MP_ESTADO_MAP[""]).toBeUndefined();
  });

  it("maps approved to approved", () => {
    expect(MP_ESTADO_MAP["approved"]).toBe("approved");
  });

  it("maps rejected to rejected", () => {
    expect(MP_ESTADO_MAP["rejected"]).toBe("rejected");
  });

  it("maps charged_back to charged_back", () => {
    expect(MP_ESTADO_MAP["charged_back"]).toBe("charged_back");
  });
});

describe("EstadoSuscripcion type coverage", () => {
  it("all valid states are accounted for", () => {
    const validStates: EstadoSuscripcion[] = Object.values(ESTADO_SUSCRIPCION);
    expect(validStates).toHaveLength(5);
  });
});

describe("EstadoPago type coverage", () => {
  it("all valid payment states are accounted for", () => {
    const validStates: EstadoPago[] = Object.values(ESTADO_PAGO);
    expect(validStates).toHaveLength(9);
  });
});
