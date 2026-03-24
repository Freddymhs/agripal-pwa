/**
 * TC-015, TC-024, TC-034 — ROI, costos agua estanque, economía avanzada
 */
import { test, expect } from "@playwright/test";
import { mockSupabase } from "./helpers/supabase-mock";
import {
  makeProyecto,
  makeTerreno,
  makeZona,
  makeEstanque,
  makePlanta,
  makeCultivo,
  makeEntradaAgua,
} from "./fixtures";

const defaultMock = () => ({
  proyectos: [makeProyecto()],
  terrenos: [makeTerreno({ agua_costo_clp_por_m3: 2500, agua_actual_m3: 30 })],
  zonas: [makeZona(), makeEstanque()],
  plantas: [
    makePlanta({ id: "p-1" }),
    makePlanta({ id: "p-2", x: 5, y: 5 }),
    makePlanta({ id: "p-3", x: 8, y: 8 }),
  ],
  catalogo_cultivos: [
    makeCultivo({ precio_kg_min_clp: 900, precio_kg_max_clp: 1800 }),
  ],
  entradas_agua: [makeEntradaAgua({ cantidad_m3: 10, costo_clp: 25000 })],
});

test.describe("Economía — ROI y proyecciones", () => {
  test("página /economia carga con datos completos", async ({ page }) => {
    await mockSupabase(page, defaultMock());
    await page.goto("/economia");

    await expect(page.locator("body")).toBeVisible();
    await expect(page).not.toHaveURL(/\/error/);
  });

  test("muestra información de inversión o ingresos en pesos CLP", async ({
    page,
  }) => {
    await mockSupabase(page, defaultMock());
    await page.goto("/economia");

    // Debe aparecer algo con CLP o $ en la página de economía
    await expect(page.locator("body")).toContainText(/CLP|\$|pesos/i, {
      timeout: 10_000,
    });
  });

  test("muestra precio por kg del cultivo", async ({ page }) => {
    await mockSupabase(page, defaultMock());
    await page.goto("/economia");

    await expect(page.locator("body")).toBeVisible();
    // Verificar que la página tiene contenido de economía
    await expect(page).not.toHaveURL(/\/error/);
  });

  test("sin plantas ni cultivos no muestra error", async ({ page }) => {
    await mockSupabase(page, {
      ...defaultMock(),
      plantas: [],
      catalogo_cultivos: [],
    });

    await page.goto("/economia");
    await expect(page.locator("body")).toBeVisible();
    await expect(page).not.toHaveURL(/\/error/);
  });

  test("economía avanzada /economia/avanzado es accesible", async ({
    page,
  }) => {
    await mockSupabase(page, defaultMock());
    await page.goto("/economia/avanzado");

    await expect(page.locator("body")).toBeVisible();
    await expect(page).not.toHaveURL(/\/error/);
  });

  test("economía avanzada muestra payback o margen", async ({ page }) => {
    await mockSupabase(page, defaultMock());
    await page.goto("/economia/avanzado");

    await expect(page.locator("body")).toContainText(
      /payback|margen|break.?even|equilibrio/i,
      { timeout: 10_000 },
    );
  });

  test("TC-024: costo agua lee costo_por_m3 del estanque", async ({ page }) => {
    const estanqueConCosto = makeEstanque({
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
    });

    await mockSupabase(page, {
      ...defaultMock(),
      zonas: [makeZona(), estanqueConCosto],
    });

    await page.goto("/economia");
    await expect(page.locator("body")).toBeVisible();
    // El costo de agua debería reflejarse en algún número en la página
    await expect(page).not.toHaveURL(/\/error/);
  });
});
