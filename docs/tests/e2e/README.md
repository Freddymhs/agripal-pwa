# E2E Tests — AgriPlan PWA

Tests de extremo a extremo para el pipeline de sincronización offline/online.

## Estructura

```
docs/tests/e2e/
├── README.md           ← este archivo
├── specs/              ← specs de intent (comprometidos en git)
│   ├── TC-001-sync-activar-primera-vez.md
│   ├── TC-002-sync-crud-terrenos.md
│   ├── TC-003-sync-crud-otras-tablas.md
│   ├── TC-004-sync-offline-reconexion.md
│   ├── TC-005-sync-desactivar.md
│   ├── TC-006-sync-reactivar.md
│   ├── TC-007-rls-aislamiento.md
│   ├── TC-008 … TC-022  (sync avanzado, stress, defensivo)
│   ├── TC-023-race-condition-navegacion-directa.md
│   ├── TC-024-economia-costo-agua-estanque.md
│   ├── TC-025-cambio-proyecto-terreno-header.md
│   ├── TC-026-plantar-via-ui-mapa.md
│   ├── TC-027-planta-info-panel.md
│   ├── TC-028-offline-flujo-mapa.md
│   ├── TC-029-escenarios-comparar-cultivos.md
│   ├── TC-030-historial-agua-contingencias.md
│   ├── TC-031-catalogo-cultivos-personalizado.md
│   ├── TC-032-terrenos-crud-ui.md
│   ├── TC-034-economia-avanzado.md
│   ├── TC-035-alertas-pagina.md
│   ├── TC-036-suelo-analisis.md
│   ├── TC-037-plagas-riesgo.md
│   ├── TC-038-insumos-modulo.md
│   ├── TC-039-mapa-crear-zona-canvas.md
│   ├── TC-040-mapa-plantar-batch-seleccion-multiple.md
│   └── TC-041-sync-conflictos-modal.md
└── results/            ← resultados de ejecución (gitignored)
    └── 2026-03-10/
        └── run-summary.md
```

## Tipos de archivos

| Tipo                           | Ubicación        | Git           | Propósito                                               |
| ------------------------------ | ---------------- | ------------- | ------------------------------------------------------- |
| **Specs** (`TC-NNN-*.md`)      | `specs/`         | ✅ Committed  | Intent estable, pasos reproducibles, criterios de éxito |
| **Results** (`run-summary.md`) | `results/FECHA/` | ❌ Gitignored | Evidencia de ejecución específica                       |

## Convención de naming

- `TC-NNN`: Test Case número (001, 002...)
- Slug descriptivo: `sync-activar-primera-vez`, `crud-terrenos`, etc.

## Ejecutor

Los tests se ejecutan con **Chrome DevTools MCP** desde Claude Code:

- `mcp__chrome-devtools__navigate_page` — navegación
- `mcp__chrome-devtools__evaluate_script` — scripts en consola
- `mcp__chrome-devtools__take_screenshot` — evidencia visual
- REST directo a Supabase para verificar estado del backend

## Tests disponibles

| ID     | Feature                                                                    | Prioridad | Estado                                                                               |
| ------ | -------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------ |
| TC-001 | Sync — Activación inicial                                                  | Alta      | ✅ Verificado 2026-03-10                                                             |
| TC-002 | Sync — CRUD Terrenos                                                       | Alta      | ✅ Verificado 2026-03-10                                                             |
| TC-003 | Sync — CRUD otras tablas (Zonas, Catálogo, Insumos)                        | Alta      | ✅ Verificado 2026-03-10                                                             |
| TC-004 | Sync — Offline / Reconexión                                                | Alta      | ✅ Verificado 2026-03-10                                                             |
| TC-005 | Sync — Desactivar                                                          | Media     | ✅ Verificado 2026-03-10                                                             |
| TC-006 | Sync — Reactivar                                                           | Media     | ✅ Verificado 2026-03-10                                                             |
| TC-007 | RLS — Aislamiento                                                          | Alta      | ✅ Verificado por diseño 2026-03-10                                                  |
| TC-008 | Sync — CRUD Plantas                                                        | Alta      | ✅ Verificado 2026-03-10 (BUG-05 corregido)                                          |
| TC-009 | Sync — CRUD Entradas de Agua                                               | Alta      | ✅ Verificado 2026-03-10 (REST directo)                                              |
| TC-010 | Sync — CRUD Cosechas                                                       | Alta      | ✅ Verificado 2026-03-10 (REST directo)                                              |
| TC-011 | Sync — Terreno Configuración Avanzada (datos JSONB)                        | Media     | ✅ Verificado 2026-03-10                                                             |
| TC-012 | Flujo completo — Terreno real 75×183m (Arica)                              | Crítica   | ✅ Verificado 2026-03-10 (5/5 fases)                                                 |
| TC-013 | Agua — consumo real vs cultivos plantados                                  | Alta      | ✅ Verificado 2026-03-10 (3.27 m³/sem, 12 plantas Limón+Higuera, cálculo verificado) |
| TC-014 | Sistema de Riego — configuración por zona                                  | Alta      | ✅ Verificado 2026-03-10                                                             |
| TC-015 | Economía — ROI y punto de equilibrio                                       | Alta      | ✅ Verificado 2026-03-10                                                             |
| TC-016 | Alertas automáticas — generación y sync                                    | Media     | ✅ Verificado 2026-03-10 (4 alertas TC012)                                           |
| TC-017 | Planificador 12 meses — proyecciones                                       | Media     | ✅ Verificado 2026-03-10                                                             |
| TC-018 | Multi-estanque — asignación por zona                                       | Media     | 📋 GAP-01 (backlog: zona.estanque_id FK)                                             |
| TC-019 | Proveedores agua — historial y deduplicación                               | Media     | ✅ Verificado 2026-03-10                                                             |
| TC-020 | Mapa stress — terreno 200×200m con 2000+ plantas                           | Alta      | ✅ Verificado 2026-03-10 (BUG-STRESS-01 y 02 corregidos)                             |
| TC-021 | PlantaInfo defensivo — datos corruptos en IDB no crashean                  | Alta      | ✅ Verificado 2026-03-10                                                             |
| TC-022 | Alertas O(n²) — zonas >80 plantas no bloquean el thread                    | Alta      | ✅ Verificado 2026-03-10                                                             |
| TC-023 | Race condition — carga directa a páginas internas muestra terreno correcto | Alta      | ✅ Verificado 2026-03-10 (useLiveQuery stale cache fix)                              |
| TC-024 | Economía — costo agua lee `estanque_config.costo_por_m3` correctamente     | Alta      | ✅ Verificado 2026-03-10 ($424.575/año con $2500/m³)                                 |
| TC-025 | Mapa — cambio de proyecto/terreno desde header recarga datos               | Alta      | ✅ Verificado 2026-03-10                                                             |
| TC-026 | Mapa — plantar cultivos via UI (individual y lote, no script IDB)          | Crítica   | ✅ Verificado 2026-03-10 (MouseEvent nativo en canvas PixiJS → planta creada en IDB) |
| TC-027 | Mapa — panel PlantaInfo: etapa, Kc, días restantes, consumo estimado       | Alta      | ✅ Verificado 2026-03-10                                                             |
| TC-028 | Mapa — flujo offline completo: crear zona → plantar → sync al reconectar   | Alta      | ✅ Verificado 2026-03-10 (queue offline→sync ✅, cola grande en proceso)             |
| TC-029 | Escenarios — comparar 3 cultivos lado a lado con valores coherentes        | Media     | ✅ Verificado 2026-03-10 (BUG-AREA-01 corregido: resolverAreaZona fallback)          |
| TC-030 | Agua — historial de entradas y contingencias (tabs de /agua)               | Media     | ✅ Verificado 2026-03-10                                                             |
| TC-031 | Catálogo — editar precio de cultivo se propaga a ROI y escenarios          | Media     | ✅ Verificado 2026-03-10 (campos precio añadidos al formulario)                      |
| TC-032 | Terrenos — CRUD completo vía UI (sin scripts IDB)                          | Crítica   | 📋 Pendiente                                                                         |
| TC-034 | Economía Avanzada — payback, margen, costo/kg                              | Media     | 📋 Pendiente                                                                         |
| TC-035 | Alertas — página completa, tipos y gestión (marcar leída)                  | Media     | 📋 Pendiente                                                                         |
| TC-036 | Suelo — análisis, thresholds y quality score                               | Media     | 📋 Pendiente                                                                         |
| TC-037 | Plagas — predicción de riesgo por cultivo/zona                             | Media     | 📋 Pendiente                                                                         |
| TC-038 | Insumos — módulo completo y compatibilidad química (FASE_21)               | Media     | 📋 Pendiente                                                                         |
| TC-039 | Mapa — crear zona vía canvas drag (modo crear_zona)                        | Crítica   | 📋 Pendiente                                                                         |
| TC-040 | Mapa — plantar batch, selección múltiple Shift+drag, mover grupo           | Media     | 📋 Pendiente                                                                         |
| TC-041 | Sync — conflictos y modal de resolución                                    | Media     | 📋 Pendiente                                                                         |

## Cómo correr un test

1. Asegurarse que `pnpm dev` esté corriendo
2. Usuario autenticado en `http://localhost:3000`
3. Seguir los pasos del spec correspondiente (TC-NNN)
4. Registrar resultado en `results/FECHA/run-summary.md`
