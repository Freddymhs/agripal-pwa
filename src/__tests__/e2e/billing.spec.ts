/**
 * TC-042, TC-043 — Billing: trial activo y flujo de suscripción
 */
import { test, expect } from "@playwright/test";
import { mockSupabase } from "./helpers/supabase-mock";
import { makeProyecto, makeTerreno, MOCK_USER_ID } from "./fixtures";

const TRIAL_SUSCRIPCION = {
  id: "sus-e2e-001",
  usuario_id: MOCK_USER_ID,
  estado: "trial",
  plan: "basic",
  trial_ends_at: "2026-09-01T00:00:00Z",
  created_at: "2026-03-01T00:00:00Z",
  updated_at: "2026-03-01T00:00:00Z",
};

const SUSCRIPCION_ACTIVA = {
  ...TRIAL_SUSCRIPCION,
  id: "sus-e2e-002",
  estado: "active",
  trial_ends_at: null,
};

test.describe("Billing — trial y suscripción", () => {
  test("página /billing/subscribe es accesible", async ({ page }) => {
    await mockSupabase(page, {
      proyectos: [makeProyecto()],
      terrenos: [makeTerreno()],
    });

    // Mock adicional para la tabla suscripciones
    await page.route("**/rest/v1/suscripciones*", (route) => {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([TRIAL_SUSCRIPCION]),
      });
    });

    await page.goto("/billing/subscribe");
    await expect(page.locator("body")).toBeVisible();
    await expect(page).not.toHaveURL(/\/error/);
  });

  test("TC-043: usuario en trial ve información del período de prueba", async ({
    page,
  }) => {
    await mockSupabase(page, {
      proyectos: [makeProyecto()],
      terrenos: [makeTerreno()],
    });

    await page.route("**/rest/v1/suscripciones*", (route) => {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([TRIAL_SUSCRIPCION]),
      });
    });

    await page.goto("/billing/subscribe");

    // Debe mostrar algo sobre el trial o la suscripción
    await expect(page.locator("body")).toContainText(
      /trial|prueba|suscripci[oó]n|plan/i,
      { timeout: 10_000 },
    );
  });

  test("TC-042: página de suscripción muestra precio en CLP", async ({
    page,
  }) => {
    await mockSupabase(page, {
      proyectos: [makeProyecto()],
      terrenos: [makeTerreno()],
    });

    await page.route("**/rest/v1/suscripciones*", (route) => {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.goto("/billing/subscribe");

    // La página de suscripción debe mostrar precio (9.990 CLP/mes)
    await expect(page.locator("body")).toContainText(/CLP|\$9|9\.990|9,990/i, {
      timeout: 10_000,
    });
  });

  test("usuario con suscripción activa ve estado correcto", async ({
    page,
  }) => {
    await mockSupabase(page, {
      proyectos: [makeProyecto()],
      terrenos: [makeTerreno()],
    });

    await page.route("**/rest/v1/suscripciones*", (route) => {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([SUSCRIPCION_ACTIVA]),
      });
    });

    await page.goto("/billing/manage");
    await expect(page.locator("body")).toBeVisible();
    // No debe crashear con estado "active"
    await expect(page).not.toHaveURL(/\/error/);
  });
});
