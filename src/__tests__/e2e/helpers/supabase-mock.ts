/**
 * Supabase HTTP interceptors for Playwright E2E tests.
 *
 * Intercepts REST calls at network level using page.route().
 * No Supabase local instance required.
 *
 * Usage:
 *   await mockSupabase(page, { terrenos: [makeTerreno()] });
 */

import type { Page } from "@playwright/test";
import type {
  Proyecto,
  Terreno,
  Zona,
  Planta,
  CatalogoCultivo,
  Alerta,
  EntradaAgua,
} from "@/types";
import { MOCK_SESSION } from "../fixtures";

type MockData = {
  proyectos?: Proyecto[];
  terrenos?: Terreno[];
  zonas?: Zona[];
  plantas?: Planta[];
  catalogo_cultivos?: CatalogoCultivo[];
  alertas?: Alerta[];
  entradas_agua?: EntradaAgua[];
};

const TABLE_MAP: Record<string, keyof MockData> = {
  proyectos: "proyectos",
  terrenos: "terrenos",
  zonas: "zonas",
  plantas: "plantas",
  catalogo_cultivos: "catalogo_cultivos",
  alertas: "alertas",
  entradas_agua: "entradas_agua",
};

/**
 * Intercepts Supabase REST + Auth calls and responds with mock data.
 * Call this before page.goto() in each test.
 */
export async function mockSupabase(page: Page, data: MockData = {}) {
  // Auth endpoints — respond with valid session
  await page.route("**/auth/v1/**", (route) => {
    const url = route.request().url();

    if (url.includes("/token") || url.includes("/session")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_SESSION),
      });
    }

    if (url.includes("/user")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_SESSION.user),
      });
    }

    // Default auth OK
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({}),
    });
  });

  // REST API endpoints — intercept per table
  await page.route("**/rest/v1/**", (route) => {
    const url = route.request().url();
    const method = route.request().method();

    // Detect which table is being queried from the URL path
    const tableName = Object.keys(TABLE_MAP).find((t) =>
      url.includes(`/rest/v1/${t}`),
    );

    // Mutations (POST, PATCH, DELETE) — always succeed
    if (["POST", "PATCH", "DELETE"].includes(method)) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({}),
      });
    }

    if (!tableName) {
      // Unknown table — return empty
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    }

    const key = TABLE_MAP[tableName];
    const rows = data[key] ?? [];

    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(rows),
    });
  });
}

/**
 * Mock that simulates an unauthenticated session (no user).
 */
export async function mockUnauthenticated(page: Page) {
  await page.route("**/auth/v1/**", (route) => {
    return route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ error: "not_authenticated" }),
    });
  });

  await page.route("**/rest/v1/**", (route) => {
    return route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ error: "not_authenticated" }),
    });
  });
}
