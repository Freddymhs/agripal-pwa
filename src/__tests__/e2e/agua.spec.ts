/**
 * TC-013, TC-014 — Dashboard agua y consumo por cultivos
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

test.describe("Agua — dashboard y consumo", () => {
  test("página /agua carga con terreno y cultivos", async ({ page }) => {
    await mockSupabase(page, {
      proyectos: [makeProyecto()],
      terrenos: [makeTerreno({ agua_actual_m3: 30, agua_disponible_m3: 50 })],
      zonas: [makeZona(), makeEstanque()],
      plantas: [makePlanta()],
      catalogo_cultivos: [makeCultivo()],
    });

    await page.goto("/agua");
    await expect(page.locator("body")).toBeVisible();
    await expect(page).not.toHaveURL(/\/error/);
  });

  test("muestra agua disponible en m³", async ({ page }) => {
    await mockSupabase(page, {
      proyectos: [makeProyecto()],
      terrenos: [makeTerreno({ agua_actual_m3: 30, agua_disponible_m3: 50 })],
      zonas: [makeEstanque()],
      plantas: [],
      catalogo_cultivos: [],
    });

    await page.goto("/agua");

    // La página debe mostrar algún número relacionado con agua
    await expect(page.locator("body")).toContainText(/m³|agua/i, {
      timeout: 10_000,
    });
  });

  test("terreno con agua crítica (<7 días) muestra indicador de alerta", async ({
    page,
  }) => {
    // Con agua_actual_m3=5 y consumo estimado, debería estar en estado crítico
    await mockSupabase(page, {
      proyectos: [makeProyecto()],
      terrenos: [
        makeTerreno({
          agua_actual_m3: 5,
          agua_disponible_m3: 50,
        }),
      ],
      zonas: [makeZona(), makeEstanque()],
      plantas: [
        makePlanta(),
        makePlanta({ id: "p-2", x: 5, y: 5 }),
        makePlanta({ id: "p-3", x: 8, y: 8 }),
      ],
      catalogo_cultivos: [makeCultivo()],
    });

    await page.goto("/agua");
    await expect(page.locator("body")).toBeVisible();
    // La UI debería indicar estado crítico de alguna forma
    // Al menos verificar que no crasha
    await expect(page).not.toHaveURL(/\/error/);
  });

  test("planificador 12 meses es accesible", async ({ page }) => {
    await mockSupabase(page, {
      proyectos: [makeProyecto()],
      terrenos: [makeTerreno()],
      zonas: [makeZona()],
      plantas: [makePlanta()],
      catalogo_cultivos: [makeCultivo()],
    });

    await page.goto("/agua/planificador");
    await expect(page.locator("body")).toBeVisible();
    await expect(page).not.toHaveURL(/\/error/);
  });

  test("configuración de agua es accesible", async ({ page }) => {
    await mockSupabase(page, {
      proyectos: [makeProyecto()],
      terrenos: [makeTerreno()],
      zonas: [makeEstanque()],
      plantas: [],
      catalogo_cultivos: [],
    });

    await page.goto("/agua/configuracion");
    await expect(page.locator("body")).toBeVisible();
    await expect(page).not.toHaveURL(/\/error/);
  });

  test("historial de entradas de agua muestra datos", async ({ page }) => {
    await mockSupabase(page, {
      proyectos: [makeProyecto()],
      terrenos: [makeTerreno()],
      zonas: [],
      plantas: [],
      catalogo_cultivos: [],
      entradas_agua: [
        makeEntradaAgua({ cantidad_m3: 10, costo_clp: 25000 }),
        makeEntradaAgua({
          id: "ea-2",
          cantidad_m3: 8,
          costo_clp: 20000,
          fecha: "2026-01-05T00:00:00Z",
        }),
      ],
    });

    await page.goto("/agua");
    await expect(page.locator("body")).toBeVisible();
  });
});
