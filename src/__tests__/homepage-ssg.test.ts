/**
 * Test arquitectónico: valida que el homepage mantenga SSG (force-static).
 * Previene que un cambio accidental rompa el rendering estático de la landing.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

const PAGE_PATH = path.resolve(__dirname, "../../src/app/(marketing)/page.tsx");

const pageSource = readFileSync(PAGE_PATH, "utf-8");

describe("Homepage SSG — restricciones arquitectónicas", () => {
  it('exporta dynamic = "force-static"', () => {
    expect(pageSource).toMatch(
      /export\s+const\s+dynamic\s*=\s*["']force-static["']/,
    );
  });

  it('NO tiene "use client" (debe ser server component)', () => {
    // "use client" solo puede estar en los islands (LandingAccessButton, NavAccessButton)
    // El archivo de página en sí NO debe tenerlo
    const lines = pageSource.split("\n");
    const firstMeaningfulLine = lines.find((l) => l.trim().length > 0) ?? "";
    expect(firstMeaningfulLine).not.toMatch(/["']use client["']/);
  });

  it("importa LandingAccessButton como island de cliente", () => {
    expect(pageSource).toContain("LandingAccessButton");
  });

  it("no importa hooks de React Query ni Dexie (sin lógica offline en server component)", () => {
    expect(pageSource).not.toMatch(/from ["']@tanstack\/react-query["']/);
    expect(pageSource).not.toMatch(/from ["']dexie["']/);
    expect(pageSource).not.toMatch(/useLiveQuery/);
    expect(pageSource).not.toMatch(/useQuery/);
  });
});
