/**
 * TC-013, TC-014 — Dashboard agua y consumo por cultivos
 */
import { test, expect } from "@playwright/test";
import { mockSupabase } from "./helpers/supabase-mock";
import { makeProyecto, makeTerreno, makeEstanque } from "./fixtures";

test.describe("Agua — dashboard y consumo", () => {
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
});
