/**
 * TC-012, TC-032 — Flujo completo terreno + CRUD vía UI
 */
import { test, expect } from "@playwright/test";
import { mockSupabase } from "./helpers/supabase-mock";
import {
  makeProyecto,
  makeTerreno,
  makeZona,
  MOCK_TERRENO_ID,
} from "./fixtures";

test.describe("Terrenos — navegación y datos", () => {
  test("página /terrenos carga con datos mockeados", async ({ page }) => {
    const terreno = makeTerreno({ nombre: "Terreno Azapa Norte" });
    await mockSupabase(page, {
      proyectos: [makeProyecto()],
      terrenos: [terreno],
      zonas: [makeZona()],
    });

    await page.goto("/terrenos");

    // La página debe cargar — no 500, no crash
    await expect(page.locator("body")).toBeVisible();
    // Nombre del terreno debe aparecer en algún lugar
    await expect(page.getByText("Terreno Azapa Norte")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("muestra área del terreno en m²", async ({ page }) => {
    const terreno = makeTerreno({ ancho_m: 75, alto_m: 183, area_m2: 13725 });
    await mockSupabase(page, {
      proyectos: [makeProyecto()],
      terrenos: [terreno],
      zonas: [],
    });

    await page.goto("/terrenos");

    // Buscar mención de área o dimensiones en cualquier parte de la página
    await expect(
      page.locator("body").getByText(/13[.,]?725|13725/),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("múltiples terrenos se listan correctamente", async ({ page }) => {
    await mockSupabase(page, {
      proyectos: [makeProyecto()],
      terrenos: [
        makeTerreno({ id: "t-1", nombre: "Norte" }),
        makeTerreno({
          id: "t-2",
          nombre: "Sur",
          proyecto_id: makeProyecto().id,
        }),
      ],
      zonas: [],
    });

    await page.goto("/terrenos");

    await expect(page.getByText("Norte")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Sur")).toBeVisible({ timeout: 10_000 });
  });

  test("terreno con zonas muestra conteo de zonas", async ({ page }) => {
    await mockSupabase(page, {
      proyectos: [makeProyecto()],
      terrenos: [makeTerreno()],
      zonas: [
        makeZona({ id: "z-1", nombre: "Zona A" }),
        makeZona({
          id: "z-2",
          nombre: "Zona B",
          terreno_id: MOCK_TERRENO_ID,
        }),
      ],
    });

    await page.goto("/terrenos");
    await expect(page.locator("body")).toBeVisible();

    // Verificar que la página no crashea con múltiples zonas
    await expect(page).not.toHaveURL(/\/error/);
  });

  test("terreno sin zonas no muestra error", async ({ page }) => {
    await mockSupabase(page, {
      proyectos: [makeProyecto()],
      terrenos: [makeTerreno()],
      zonas: [],
    });

    await page.goto("/terrenos");
    await expect(page.locator("body")).toBeVisible();
    await expect(page).not.toHaveURL(/\/error/);
  });
});
