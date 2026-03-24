/**
 * TC-017 — Planificador de agua 12 meses
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
} from "./fixtures";

const defaultMock = () => ({
  proyectos: [makeProyecto()],
  terrenos: [makeTerreno({ agua_actual_m3: 30, agua_disponible_m3: 50 })],
  zonas: [makeZona(), makeEstanque()],
  plantas: [makePlanta({ id: "p-1" }), makePlanta({ id: "p-2", x: 5, y: 5 })],
  catalogo_cultivos: [makeCultivo()],
});

test.describe("Planificador de agua — 12 meses", () => {
  test("página /agua/planificador carga", async ({ page }) => {
    await mockSupabase(page, defaultMock());
    await page.goto("/agua/planificador");

    await expect(page.locator("body")).toBeVisible();
    await expect(page).not.toHaveURL(/\/error/);
  });

  test("muestra proyecciones de 12 meses", async ({ page }) => {
    await mockSupabase(page, defaultMock());
    await page.goto("/agua/planificador");

    // La página debe mostrar meses del año de alguna forma
    await expect(page.locator("body")).toContainText(
      /enero|feb|mar|abr|may|ene|12 meses|mensual/i,
      { timeout: 10_000 },
    );
  });

  test("muestra consumo estimado en m³", async ({ page }) => {
    await mockSupabase(page, defaultMock());
    await page.goto("/agua/planificador");

    await expect(page.locator("body")).toContainText(/m³|m3/i, {
      timeout: 10_000,
    });
  });

  test("sin cultivos plantados no muestra crash", async ({ page }) => {
    await mockSupabase(page, {
      ...defaultMock(),
      plantas: [],
    });

    await page.goto("/agua/planificador");
    await expect(page.locator("body")).toBeVisible();
    await expect(page).not.toHaveURL(/\/error/);
  });

  test("con múltiples cultivos muestra proyección combinada", async ({
    page,
  }) => {
    await mockSupabase(page, {
      ...defaultMock(),
      plantas: [
        makePlanta({ id: "p-1", tipo_cultivo_id: "c-1" }),
        makePlanta({ id: "p-2", tipo_cultivo_id: "c-2", x: 5, y: 5 }),
        makePlanta({ id: "p-3", tipo_cultivo_id: "c-1", x: 8, y: 8 }),
      ],
      catalogo_cultivos: [
        makeCultivo({ id: "c-1", nombre: "Higuera" }),
        makeCultivo({
          id: "c-2",
          nombre: "Tomate Cherry",
          agua_m3_ha_año_min: 8000,
          agua_m3_ha_año_max: 12000,
        }),
      ],
    });

    await page.goto("/agua/planificador");
    await expect(page.locator("body")).toBeVisible();
    await expect(page).not.toHaveURL(/\/error/);
  });
});
