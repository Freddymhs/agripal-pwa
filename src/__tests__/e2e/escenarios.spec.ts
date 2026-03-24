/**
 * TC-029 — Comparador de escenarios (hasta 3 cultivos)
 */
import { test, expect } from "@playwright/test";
import { mockSupabase } from "./helpers/supabase-mock";
import {
  makeProyecto,
  makeTerreno,
  makeZona,
  makePlanta,
  makeCultivo,
} from "./fixtures";

test.describe("Escenarios — comparador de cultivos", () => {
  test("página /economia/escenarios carga", async ({ page }) => {
    await mockSupabase(page, {
      proyectos: [makeProyecto()],
      terrenos: [makeTerreno()],
      zonas: [makeZona()],
      plantas: [makePlanta()],
      catalogo_cultivos: [
        makeCultivo({ id: "c-1", nombre: "Higuera" }),
        makeCultivo({
          id: "c-2",
          nombre: "Tomate Cherry",
          cultivo_base_id: "cultivo-tomate-cherry",
          precio_kg_min_clp: 800,
          precio_kg_max_clp: 1500,
        }),
        makeCultivo({
          id: "c-3",
          nombre: "Limón",
          cultivo_base_id: "cultivo-limon",
          precio_kg_min_clp: 600,
          precio_kg_max_clp: 1200,
        }),
      ],
    });

    await page.goto("/economia/escenarios");
    await expect(page.locator("body")).toBeVisible();
    await expect(page).not.toHaveURL(/\/error/);
  });

  test("muestra listado de cultivos disponibles para comparar", async ({
    page,
  }) => {
    await mockSupabase(page, {
      proyectos: [makeProyecto()],
      terrenos: [makeTerreno()],
      zonas: [makeZona()],
      plantas: [],
      catalogo_cultivos: [
        makeCultivo({ id: "c-1", nombre: "Higuera" }),
        makeCultivo({ id: "c-2", nombre: "Tomate Cherry" }),
      ],
    });

    await page.goto("/economia/escenarios");

    // Alguno de los cultivos del catálogo debe estar visible para selección
    await expect(page.locator("body").getByText(/Higuera|Tomate/i)).toBeVisible(
      { timeout: 10_000 },
    );
  });

  test("sin catálogo no muestra error 500", async ({ page }) => {
    await mockSupabase(page, {
      proyectos: [makeProyecto()],
      terrenos: [makeTerreno()],
      zonas: [],
      plantas: [],
      catalogo_cultivos: [],
    });

    await page.goto("/economia/escenarios");
    await expect(page.locator("body")).toBeVisible();
    await expect(page).not.toHaveURL(/\/error/);
  });

  test("métricas de comparación contienen valores en CLP", async ({ page }) => {
    await mockSupabase(page, {
      proyectos: [makeProyecto()],
      terrenos: [makeTerreno({ area_m2: 400 })],
      zonas: [makeZona({ area_m2: 400 })],
      plantas: [makePlanta()],
      catalogo_cultivos: [
        makeCultivo({
          id: "c-1",
          nombre: "Higuera",
          precio_kg_min_clp: 900,
          precio_kg_max_clp: 1800,
        }),
      ],
    });

    await page.goto("/economia/escenarios");

    // La página debe mostrar valores monetarios
    await expect(page.locator("body")).toContainText(/\$|CLP|precio/i, {
      timeout: 10_000,
    });
  });
});
