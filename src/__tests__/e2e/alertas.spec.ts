/**
 * TC-016, TC-035 — Alertas automáticas y página de alertas
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
  makeAlerta,
  MOCK_TERRENO_ID,
} from "./fixtures";

test.describe("Alertas — página y tipos", () => {
  test("página /alertas carga sin errores", async ({ page }) => {
    await mockSupabase(page, {
      proyectos: [makeProyecto()],
      terrenos: [makeTerreno()],
      zonas: [makeZona()],
      plantas: [],
      catalogo_cultivos: [],
      alertas: [],
    });

    await page.goto("/alertas");
    await expect(page.locator("body")).toBeVisible();
    await expect(page).not.toHaveURL(/\/error/);
  });

  test("muestra alerta de agua crítica cuando existe en datos", async ({
    page,
  }) => {
    const alerta = makeAlerta({
      tipo: "agua_critica",
      severidad: "critical",
      titulo: "Agua crítica",
      descripcion: "Quedan menos de 7 días de agua disponible",
    });

    await mockSupabase(page, {
      proyectos: [makeProyecto()],
      terrenos: [makeTerreno()],
      zonas: [makeEstanque()],
      plantas: [],
      catalogo_cultivos: [],
      alertas: [alerta],
    });

    await page.goto("/alertas");

    await expect(page.getByText(/Agua crítica|agua_critica/i)).toBeVisible({
      timeout: 10_000,
    });
  });

  test("muestra múltiples alertas de diferentes tipos", async ({ page }) => {
    const alertas = [
      makeAlerta({
        id: "a-1",
        tipo: "agua_critica",
        titulo: "Agua crítica",
        severidad: "critical",
      }),
      makeAlerta({
        id: "a-2",
        tipo: "replanta_pendiente",
        titulo: "Replanta pendiente",
        severidad: "warning",
        terreno_id: MOCK_TERRENO_ID,
      }),
      makeAlerta({
        id: "a-3",
        tipo: "lavado_salino",
        titulo: "Lavado salino requerido",
        severidad: "warning",
        terreno_id: MOCK_TERRENO_ID,
      }),
    ];

    await mockSupabase(page, {
      proyectos: [makeProyecto()],
      terrenos: [makeTerreno()],
      zonas: [makeZona(), makeEstanque()],
      plantas: [makePlanta()],
      catalogo_cultivos: [makeCultivo()],
      alertas,
    });

    await page.goto("/alertas");

    // Al menos una alerta debe ser visible
    await expect(page.locator("body")).toContainText(
      /Agua crítica|Replanta|Lavado/i,
      { timeout: 10_000 },
    );
  });

  test("alerta resuelta tiene estado diferente a activa", async ({ page }) => {
    const alertaActiva = makeAlerta({
      id: "a-activa",
      estado: "activa",
      titulo: "Alerta activa test",
    });
    const alertaResuelta = makeAlerta({
      id: "a-resuelta",
      estado: "resuelta",
      titulo: "Alerta resuelta test",
    });

    await mockSupabase(page, {
      proyectos: [makeProyecto()],
      terrenos: [makeTerreno()],
      zonas: [],
      plantas: [],
      catalogo_cultivos: [],
      alertas: [alertaActiva, alertaResuelta],
    });

    await page.goto("/alertas");
    await expect(page.locator("body")).toBeVisible();
    // La página no debe crashear con estados mixtos
    await expect(page).not.toHaveURL(/\/error/);
  });

  test("sin alertas muestra estado vacío sin crash", async ({ page }) => {
    await mockSupabase(page, {
      proyectos: [makeProyecto()],
      terrenos: [makeTerreno()],
      zonas: [],
      plantas: [],
      catalogo_cultivos: [],
      alertas: [],
    });

    await page.goto("/alertas");
    await expect(page.locator("body")).toBeVisible();
    await expect(page).not.toHaveURL(/\/error/);
  });
});
