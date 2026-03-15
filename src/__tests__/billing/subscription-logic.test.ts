import { describe, it, expect } from "vitest";
import {
  BILLING,
  ESTADO_SUSCRIPCION,
  ESTADOS_SUSCRIPCION_PERMITIDOS,
  ESTADOS_SUSCRIPCION_ACTIVOS,
} from "@/lib/constants/billing";

// Extracted pure logic from use-subscription.ts for testability
function calcDaysRemaining(dateStr: string | null): number {
  if (!dateStr) return 0;
  return Math.max(
    0,
    Math.ceil(
      (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    ),
  );
}

function isSubscriptionActive(
  estado: string | undefined,
  endDate: string | null,
): boolean {
  if (!estado) return false;
  if (!ESTADOS_SUSCRIPCION_PERMITIDOS.has(estado)) return false;
  if (!endDate) return false;
  return new Date(endDate) > new Date();
}

function needsPayment(estado: string | undefined): boolean {
  return (
    !estado ||
    !ESTADOS_SUSCRIPCION_ACTIVOS.includes(
      estado as (typeof ESTADOS_SUSCRIPCION_ACTIVOS)[number],
    )
  );
}

describe("calcDaysRemaining", () => {
  it("returns 0 for null date", () => {
    expect(calcDaysRemaining(null)).toBe(0);
  });

  it("returns 0 for past date", () => {
    const pastDate = new Date(Date.now() - 86400000 * 5).toISOString();
    expect(calcDaysRemaining(pastDate)).toBe(0);
  });

  it("returns positive days for future date", () => {
    const futureDate = new Date(Date.now() + 86400000 * 30).toISOString();
    const days = calcDaysRemaining(futureDate);
    expect(days).toBeGreaterThanOrEqual(29);
    expect(days).toBeLessThanOrEqual(31);
  });

  it("returns 1 for tomorrow", () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString();
    expect(calcDaysRemaining(tomorrow)).toBe(1);
  });

  it("returns correct days for trial period (180 days)", () => {
    const trialEnd = new Date(
      Date.now() + 86400000 * BILLING.TRIAL_DIAS,
    ).toISOString();
    const days = calcDaysRemaining(trialEnd);
    expect(days).toBeGreaterThanOrEqual(BILLING.TRIAL_DIAS - 1);
    expect(days).toBeLessThanOrEqual(BILLING.TRIAL_DIAS + 1);
  });
});

describe("isSubscriptionActive", () => {
  const futureDate = new Date(Date.now() + 86400000 * 30).toISOString();
  const pastDate = new Date(Date.now() - 86400000 * 5).toISOString();

  it("returns true for active with future end date", () => {
    expect(isSubscriptionActive(ESTADO_SUSCRIPCION.ACTIVE, futureDate)).toBe(
      true,
    );
  });

  it("returns true for trialing with future end date", () => {
    expect(isSubscriptionActive(ESTADO_SUSCRIPCION.TRIALING, futureDate)).toBe(
      true,
    );
  });

  it("returns true for past_due with future end date (grace period)", () => {
    expect(isSubscriptionActive(ESTADO_SUSCRIPCION.PAST_DUE, futureDate)).toBe(
      true,
    );
  });

  it("returns false for canceled", () => {
    expect(isSubscriptionActive(ESTADO_SUSCRIPCION.CANCELED, futureDate)).toBe(
      false,
    );
  });

  it("returns false for inactive", () => {
    expect(isSubscriptionActive(ESTADO_SUSCRIPCION.INACTIVE, futureDate)).toBe(
      false,
    );
  });

  it("returns false for active with expired end date", () => {
    expect(isSubscriptionActive(ESTADO_SUSCRIPCION.ACTIVE, pastDate)).toBe(
      false,
    );
  });

  it("returns false for undefined estado", () => {
    expect(isSubscriptionActive(undefined, futureDate)).toBe(false);
  });

  it("returns false for null end date", () => {
    expect(isSubscriptionActive(ESTADO_SUSCRIPCION.ACTIVE, null)).toBe(false);
  });
});

describe("needsPayment", () => {
  it("returns false for active subscription", () => {
    expect(needsPayment(ESTADO_SUSCRIPCION.ACTIVE)).toBe(false);
  });

  it("returns false for trialing subscription", () => {
    expect(needsPayment(ESTADO_SUSCRIPCION.TRIALING)).toBe(false);
  });

  it("returns true for past_due (needs renewal)", () => {
    expect(needsPayment(ESTADO_SUSCRIPCION.PAST_DUE)).toBe(true);
  });

  it("returns true for canceled", () => {
    expect(needsPayment(ESTADO_SUSCRIPCION.CANCELED)).toBe(true);
  });

  it("returns true for undefined", () => {
    expect(needsPayment(undefined)).toBe(true);
  });
});

describe("Trial period calculation", () => {
  it("trial creates correct end date (180 days from now)", () => {
    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + BILLING.TRIAL_DIAS);

    const diffDays = Math.ceil(
      (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    expect(diffDays).toBe(BILLING.TRIAL_DIAS);
  });

  it("renewal creates correct end date (1 month from now)", () => {
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + BILLING.RENEWAL_MONTHS);

    expect(periodEnd.getTime()).toBeGreaterThan(now.getTime());
    // At least 28 days (shortest month)
    const diffDays = Math.ceil(
      (periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    expect(diffDays).toBeGreaterThanOrEqual(28);
    expect(diffDays).toBeLessThanOrEqual(32);
  });
});

describe("Middleware subscription check logic", () => {
  it("allows active subscription with valid date", () => {
    const estado = ESTADO_SUSCRIPCION.ACTIVE;
    const endDate = new Date(Date.now() + 86400000 * 15).toISOString();
    const isAllowed =
      ESTADOS_SUSCRIPCION_PERMITIDOS.has(estado) &&
      new Date(endDate) > new Date();
    expect(isAllowed).toBe(true);
  });

  it("blocks expired active subscription", () => {
    const estado = ESTADO_SUSCRIPCION.ACTIVE;
    const endDate = new Date(Date.now() - 86400000).toISOString();
    const isAllowed =
      ESTADOS_SUSCRIPCION_PERMITIDOS.has(estado) &&
      new Date(endDate) > new Date();
    expect(isAllowed).toBe(false);
  });

  it("blocks canceled subscription regardless of date", () => {
    const estado = ESTADO_SUSCRIPCION.CANCELED;
    const endDate = new Date(Date.now() + 86400000 * 15).toISOString();
    const isAllowed =
      ESTADOS_SUSCRIPCION_PERMITIDOS.has(estado) &&
      new Date(endDate) > new Date();
    expect(isAllowed).toBe(false);
  });

  it("allows past_due within grace period", () => {
    const estado = ESTADO_SUSCRIPCION.PAST_DUE;
    const endDate = new Date(
      Date.now() + 86400000 * BILLING.GRACIA_DIAS,
    ).toISOString();
    const isAllowed =
      ESTADOS_SUSCRIPCION_PERMITIDOS.has(estado) &&
      new Date(endDate) > new Date();
    expect(isAllowed).toBe(true);
  });
});
