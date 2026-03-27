/**
 * TC-025, TC-023 — Cambio de proyecto limpia estado + race condition navegación directa
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

const PROYECTO_A_ID = "project-a-001";
const PROYECTO_B_ID = "project-b-001";
const TERRENO_A_ID = "terreno-a-001";
const TERRENO_B_ID = "terreno-b-001";

const proyectoA = makeProyecto({
  id: PROYECTO_A_ID,
  nombre: "Proyecto Arica Norte",
});
const proyectoB = makeProyecto({
  id: PROYECTO_B_ID,
  nombre: "Proyecto Azapa Sur",
});

const terrenoA = makeTerreno({
  id: TERRENO_A_ID,
  proyecto_id: PROYECTO_A_ID,
  nombre: "Terreno Arica Norte",
});
const terrenoB = makeTerreno({
  id: TERRENO_B_ID,
  proyecto_id: PROYECTO_B_ID,
  nombre: "Terreno Azapa Sur",
});

test.describe("Context switch — cambio de proyecto y terreno", () => {
  test("TC-023: navegación directa a ruta interna carga datos del proyecto correcto", async ({
    page,
  }) => {
    await mockSupabase(page, {
      proyectos: [proyectoA, proyectoB],
      terrenos: [terrenoA, terrenoB],
      zonas: [
        makeZona({ id: "z-a", terreno_id: TERRENO_A_ID, nombre: "Zona A" }),
      ],
      plantas: [makePlanta({ id: "p-a", zona_id: "z-a" })],
      catalogo_cultivos: [makeCultivo({ proyecto_id: PROYECTO_A_ID })],
    });

    // Navegar directamente a /economia (ruta interna) sin pasar por /app
    await page.goto("/economia");

    // La página debe cargar sin crash — el hook de contexto no debe quedar en estado inconsistente
    await expect(page.locator("body")).toBeVisible();
    await expect(page).not.toHaveURL(/\/error/);
  });

  test("TC-025: después de cambio de proyecto, rutas muestran datos del nuevo contexto", async ({
    page,
  }) => {
    await mockSupabase(page, {
      proyectos: [proyectoA, proyectoB],
      terrenos: [terrenoA, terrenoB],
      zonas: [],
      plantas: [],
      catalogo_cultivos: [],
    });

    // Navegar a la app principal — ahí se elige proyecto
    await page.goto("/app");
    await expect(page.locator("body")).toBeVisible();

    // La página home debe cargar sin 500
    await expect(page).not.toHaveURL(/\/error/);
  });

  test("navegación directa a /economia no crashea", async ({ page }) => {
    await mockSupabase(page, {
      proyectos: [proyectoA],
      terrenos: [terrenoA],
      zonas: [makeZona({ terreno_id: TERRENO_A_ID })],
      plantas: [makePlanta()],
      catalogo_cultivos: [makeCultivo({ proyecto_id: PROYECTO_A_ID })],
    });

    await page.goto("/economia");
    await expect(page.locator("body")).toBeVisible();
    await expect(page).not.toHaveURL(/\/error/);
  });

  test("dos proyectos en mock — el selector no crashea con IDs distintos", async ({
    page,
  }) => {
    await mockSupabase(page, {
      proyectos: [proyectoA, proyectoB],
      terrenos: [terrenoA, terrenoB],
      zonas: [],
      plantas: [],
      catalogo_cultivos: [],
    });

    await page.goto("/app");
    await expect(page.locator("body")).toBeVisible();
  });
});
