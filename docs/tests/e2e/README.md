# E2E Tests — AgriPlan PWA

Tests automatizados con Playwright. Las llamadas HTTP a Supabase se interceptan con `page.route()` — no se requiere Supabase local.

## Estructura

```
src/__tests__/e2e/           ← specs Playwright automatizados
├── fixtures/index.ts        ← factories tipadas (importan src/types/index.ts)
├── helpers/supabase-mock.ts ← interceptores page.route()
├── auth.spec.ts
├── terrenos.spec.ts
├── agua.spec.ts
├── alertas.spec.ts
├── economia.spec.ts
├── escenarios.spec.ts
├── planificador.spec.ts
├── billing.spec.ts
└── context-switch.spec.ts

docs/tests/e2e/specs/        ← specs markdown pendientes de automatizar
playwright.config.ts         ← configuración en raíz del proyecto
```

## Cómo correr

```bash
pnpm test:e2e               # todos los specs
pnpm test:e2e:ui            # modo UI interactivo
pnpm test:e2e auth.spec.ts  # un spec específico
```

> `pnpm dev` debe estar corriendo en `:3000`, o Playwright lo arranca automáticamente vía `webServer`.

## Sincronización de tipos

Las factories en `fixtures/index.ts` importan `src/types/index.ts` directamente.
Si un interface TypeScript cambia y el fixture no actualiza → `pnpm tsc --noEmit` falla → CI se detiene antes de ejecutar tests.

## Specs markdown pendientes de automatizar

Los siguientes TCs permanecen como specs de intención hasta ser convertidos a Playwright:

| ID     | Feature                                  | Bloqueante        |
| ------ | ---------------------------------------- | ----------------- |
| TC-018 | Multi-estanque — asignación por zona     | Pendiente feature |
| TC-019 | Proveedores agua — historial             | Pendiente         |
| TC-020 | Mapa stress — 2000+ plantas              | Canvas/PixiJS     |
| TC-021 | PlantaInfo defensivo — datos corruptos   | Pendiente         |
| TC-022 | Alertas O(n²) — zonas grandes            | Pendiente         |
| TC-026 | Mapa — plantar via UI canvas             | Canvas/PixiJS     |
| TC-027 | Mapa — panel PlantaInfo                  | Canvas/PixiJS     |
| TC-030 | Agua — historial de entradas             | Pendiente         |
| TC-031 | Catálogo — editar precio propaga ROI     | Pendiente         |
| TC-036 | Suelo — análisis y quality score         | Pendiente         |
| TC-037 | Plagas — predicción de riesgo            | Pendiente         |
| TC-038 | Insumos — módulo y compatibilidad        | Pendiente         |
| TC-039 | Mapa — crear zona vía canvas drag        | Canvas/PixiJS     |
| TC-040 | Mapa — plantar batch, selección múltiple | Canvas/PixiJS     |
