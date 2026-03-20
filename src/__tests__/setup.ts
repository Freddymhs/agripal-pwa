import { vi } from "vitest";

vi.mock("@/lib/utils/index.ts", () => ({
  getTemporadaActual: vi.fn(() => "verano" as const),
  generateUUID: vi.fn(() => "mock-uuid"),
  getCurrentTimestamp: vi.fn(() => "2025-01-01T00:00:00Z"),
  parseTimestamp: vi.fn((ts: string) => new Date(ts)),
  formatDate: vi.fn((ts: string) => ts),
  formatArea: vi.fn((m2: number) => `${m2} m2`),
  formatCLP: vi.fn((clp: number) => `$${clp}`),
}));

vi.mock("@/lib/data/coeficientes-kc.ts", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/data/coeficientes-kc")>();
  return {
    ...actual,
    getKc: vi.fn(() => 1.15),
  };
});

vi.mock("@/lib/data/calculos-etapas.ts", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/data/calculos-etapas")>();
  return {
    ...actual,
  };
});

vi.mock("@/lib/data/fuentes-agua.ts", () => ({
  obtenerFuente: vi.fn(() => null),
}));
