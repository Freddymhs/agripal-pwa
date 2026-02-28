# Audit: `src/lib/utils/` and `src/lib/helpers/`

Rules source: `/home/fmarcosdev/Desktop/practicasGoodAgnostics.md` (17 rules)
Audited files: all `.ts` files in `src/lib/utils/` and `src/lib/helpers/` (excludes `__tests__/`)

---

## File-by-file Results

---

### `src/lib/utils/agua-calculo-anual.ts`

**VIOLATION — Rule 3 (Magic Numbers / Magic Strings)**

- **Line 45**: `(1000 * 60 * 60 * 24)` — milliseconds-per-day computed inline.
  - `MS_POR_DIA = 86_400_000` already exists in `@/lib/constants/conversiones`.
  - Fix: replace with `MS_POR_DIA`.

- **Line 47**: magic number `365` (days per year) used inline.
  - `DIAS_POR_AÑO = 365` already exists in `@/lib/constants/conversiones`.
  - Fix: replace with `DIAS_POR_AÑO`.

- **Line 59**: magic number `365` again (`llenadaPorAño = 365 / promedioEntreLlenadas`).
  - Fix: replace with `DIAS_POR_AÑO`.

- **Line 47**: magic number `365` in guard `diasEntre < 365`.
  - Fix: replace with `DIAS_POR_AÑO`.

- **Line 66**: magic number `4` (`entradasAgua.length >= 4`) — hardcoded threshold with no named constant.
  - Fix: extract to a named constant e.g. `MIN_ENTRADAS_CONFIANZA_ALTA = 4` in constants.

- **Line 83**: magic number `26` (`capacidadTotal * 26` — estimated fillings per year) — appears only here, no constant.
  - Fix: extract to a named constant e.g. `LLENADAS_ESTIMADAS_AÑO = 26` in constants.

- **Line 76**: string `× 52 semanas` in `detalles` interpolates the number 52 literally rather than using `SEMANAS_POR_AÑO`. Minor cosmetic issue — the constant IS used in the calculation but not the template string.
  - Fix: use `${SEMANAS_POR_AÑO}` in the string.

**VIOLATION — Rule 9 (Immutability)**

- **Lines 39–50**: `let sumaDiasEntreEntradas = 0` and `let cantidadIntervalos = 0` are accumulators inside a `for` loop — this is the one valid exception the rule permits for accumulators. Acceptable as-is.

- **Lines 42, 43**: `for (let i = 1; ...)` — loop counter, acceptable.

**PASS on**: R1, R2, R4, R5, R6, R7, R8, R10, R12, R14, R15, R16, R17.

---

### `src/lib/utils/agua-descuento.ts`

**PASS** — No violations found.

- Uses absolute imports (`@/lib/...`).
- No magic numbers or strings.
- No `let` outside of loop counters (none present).
- Error handling: function is async but has no try/catch — callers are expected to handle errors. The function itself does not swallow errors.
- Single responsibility: applies automatic water discount.
- Well-typed.

---

### `src/lib/utils/agua-proyeccion-anual.ts`

**VIOLATION — Rule 3 (Magic Numbers / Magic Strings)**

- **Line 80**: `freq <= 0` guard, fine. But line **83**: `const diasEnMes = 30` — local constant instead of reusing `DIAS_POR_MES_PROMEDIO` that exists in `@/lib/constants/conversiones`.
  - Fix: import and use `DIAS_POR_MES_PROMEDIO` directly.

- **Line 95**: `consumoMensual / 30` — same hardcoded 30 (days per month), should use `DIAS_POR_MES_PROMEDIO`.

- **Line 165**: `cultivo.tiempo_produccion_meses * 30` — again 30 (days per month) inline.
  - Fix: use `DIAS_POR_MES_PROMEDIO`.

**VIOLATION — Rule 9 (Immutability — `let` that should be `const` or refactored)**

- **Lines 60–64**: `let nivelActual`, `let consumoTotalAnual`, `let recargasTotales`, `let mesesDeficit`, `let fechaPrimerDeficit` — all are accumulators updated in the loop. These are loop accumulators which the rule permits. Acceptable.

- **Line 76**: `let recargasMes = 0` — accumulator inside the month loop. Acceptable.

- **Line 126**: `let fechaRecarga = ...` — then reassigned at line 138 inside a while loop. This is a genuine mutation loop variable. Acceptable.

- **Line 181**: `let fechaLavado = ...` — same pattern, while loop iterator. Acceptable.

**VIOLATION — Rule 1 (Centralization — known bug documented in MEMORY.md)**

- **Lines 42–45**: `getTemporadaPorMes()` receives `getMonth()` which returns a 0-indexed month (0=Jan … 11=Dec). The function's conditions use `mes >= 11 || mes <= 1` for summer, which maps Dec(11), Jan(0), Feb(1) correctly. However this is marked as BUG-1 in the project MEMORY (`getTemporadaPorMes() receives 0-indexed month but expects 1-indexed`). The logic at line 42 actually does handle 0-indexed correctly for months 0,1,11. This is an existing known ambiguity/bug to track but not strictly a rule violation per se. Noted for completeness.

**PASS on**: R2, R4, R5, R6, R7, R8, R10, R12, R14, R15, R16, R17.

---

### `src/lib/utils/agua.ts`

**VIOLATION — Rule 9 (Immutability — `let` usages)**

- **Line 54**: `let consumoTotal = 0` in `calcularConsumoZona` — loop accumulator. Acceptable.
- **Line 75**: `let consumoTotal = 0` in `calcularConsumoTerreno` — loop accumulator. Acceptable.
- **Lines 95–107**: `let horasDia: number` — declared `let`, assigned conditionally across multiple branches, never reassigned after first assignment in each branch. This is a conditional assignment that can be refactored.
  - Fix: restructure with early returns or ternary chain; use `const horasDia = ...` pattern.
- **Line 122**: `let consumoTotal = 0` — accumulator, acceptable.
- **Lines 159–160**: `let aguaTotal = 0; let capacidadTotal = 0` — accumulators, acceptable.
- **Line 216**: `let consumoTotal = 0` — accumulator, acceptable.

**VIOLATION — Rule 3 (Magic Number)**

- **Line 151**: `return 999` — magic sentinel value meaning "infinite days". No named constant.
  - Fix: extract to `DIAS_INFINITO_SENTINEL = 999` or return `Infinity` (which is semantically correct for "no consumption").

- **Line 243**: `aguaNecesaria * 0.2` — threshold factor (20% margin) inline. Not a named constant.
  - Fix: extract to a named constant e.g. `MARGEN_AGUA_OK_FACTOR = 0.2` in `umbrales.ts`.

**PASS on**: R1, R2, R4, R5, R6, R7, R8, R10, R12, R14, R15, R16, R17.

---

### `src/lib/utils/alertas.ts`

**VIOLATION — Rule 3 (Magic Strings)**

- **Lines 188–189**: `texturaSuelo === "arcillosa"` and `texturaSuelo === "franco-arcillosa"` — hardcoded raw strings for soil texture types. If these values are defined as an enum/constant elsewhere (check `entities.ts`), they should be referenced from there. Even if not, they should be extracted to named constants to avoid scattered magic strings.
  - Fix: check `@/lib/constants/entities` for a texture enum; if none, create `TEXTURA_SUELO.ARCILLOSA` etc.

**VIOLATION — Rule 9 (Immutability)**

- **Line 57**: `let sugerencia = ...` then conditionally reassigned at line 65. Can be refactored to `const sugerencia = condition ? ... : ...` using a ternary.
  - Fix: `const sugerencia = (proximaRecarga && diasHastaRecarga > diasRestantes) ? ... : ...`

- **Lines 131–133**: `for (let i = 0; ...) / for (let j = i + 1; ...)` — loop counters. Acceptable.

**PASS on**: R1, R2, R4, R5, R6, R7, R8, R10, R12, R14, R15, R16, R17.

---

### `src/lib/utils/calidad.ts`

**VIOLATION — Rule 3 (Magic Numbers)**

- **Line 40**: `ratio > 2` and `ratio > 1` — hardcoded boro ratio thresholds. No constants.
  - Fix: extract to named constants e.g. `BORO_RATIO_CRITICO = 2`, `BORO_RATIO_LIMITE = 1` in umbrales.

- **Line 53**: `ratio > 1.5` and `ratio > 1` — hardcoded salinidad ratio thresholds.
  - Fix: extract to named constants.

- **Lines 42, 55**: score deductions (`-60`, `-30`, `-40`, `-20`, `-15`) — hardcoded penalty values.
  - Fix: these are complex scoring weights; minimally should be extracted to named constants or a scoring config object for maintainability.

- **Line 97**: `materia_organica_pct < 2` — threshold value. Similar threshold appears at line 138.
  - Fix: extract to `MATERIA_ORGANICA_MINIMA_PCT = 2` in umbrales.

- **Line 117**: `desviacion * 0.2` and `Math.min(0.5, ...)` — magic penalty factors.

- **Lines 124–125**: `(ratio - 1) * 0.3` and `Math.min(0.6, ...)` — magic penalty factors.

- **Lines 131–133**: `(ratio - 1) * 0.4` and `Math.min(0.7, ...)` — magic penalty factors.

- **Line 139**: `factor *= 0.9` — penalty for low organic matter, magic number.

- **Lines 183–194**: `calcScoreRiego` uses hardcoded thresholds `7`, `14`, `30` days and scores `10`, `50`, `75`, `100`. The 7 and 14-day thresholds overlap with `DIAS_AGUA_UMBRAL_CRITICO = 7` and `DIAS_AGUA_UMBRAL_ALTO = 14` that already exist in `@/lib/constants/umbrales.ts`.
  - Fix: import and use `DIAS_AGUA_UMBRAL_CRITICO` and `DIAS_AGUA_UMBRAL_ALTO` from constants.

**VIOLATION — Rule 9 (Immutability)**

- **Lines 34, 75, 111, 146**: `let score = 100` in multiple functions — then mutated via `score -= N`. These are accumulators by subtraction; structurally acceptable but could be refactored as `const` with a final `clamp(100 - penalties, 0, 100)` approach. Not a hard violation given complexity.

- **Lines 34, 75, 111**: `let score = 100` and reassigned with `-=`. Same pattern across 4 functions — this repeated pattern is a candidate for a helper.

**VIOLATION — Rule 5 (Nomenclature)**

- **Lines 31, 72, 145, 176**: function names `calcScoreAgua`, `calcScoreSuelo`, `calcScoreClima`, `calcScoreRiego` use abbreviated `calc` prefix instead of `calcular` which is the domain convention used throughout the project (e.g. `calcularROI`, `calcularConsumoTerreno`, `calcularDensidadPlantas`).
  - Fix: rename to `calcularScoreAgua`, `calcularScoreSuelo`, `calcularScoreClima`, `calcularScoreRiego` for consistency.

**PASS on**: R1, R2, R6, R7, R8, R10, R12, R14, R15, R16, R17.

---

### `src/lib/utils/comparador-cultivos.ts`

**PASS** — No violations found.

- Short (43 lines), single responsibility.
- Uses absolute imports only.
- All constants imported from centralized locations.
- No magic numbers or strings.
- No `let`, no `any`.

---

### `src/lib/utils/economia-avanzada.ts`

**VIOLATION — Rule 3 (Magic Number)**

- **Line 41**: `/ 12` — months per year hardcoded. `MESES_POR_AÑO = 12` exists in `@/lib/constants/conversiones`.
  - Fix: import and use `MESES_POR_AÑO`.

**PASS on**: R1, R2, R4, R5, R6, R7, R8, R9, R10, R12, R14, R15, R16, R17.

---

### `src/lib/utils/helpers-cultivo.ts`

**PASS** — No violations found.

- Short (38 lines), clear single responsibility: pure helper functions for crop calculations.
- No magic numbers (uses `M2_POR_HECTAREA` from constants).
- No `let`, no `any`.
- Absolute imports only.

---

### `src/lib/utils/index.ts`

**PASS** — No violations found.

- Utility barrel for generic helpers: UUID, timestamp, date formatting, CLP formatting.
- No magic numbers or strings.
- No `let`.
- Uses absolute imports.

---

### `src/lib/utils/math.ts`

**PASS** — No violations found.

- Pure math utility functions: `clamp`, `distancia`, `isValidNum`.
- Minimal, focused, no magic values.

---

### `src/lib/utils/recomendacion.ts`

**VIOLATION — Rule 3 (Magic Strings — unicode escapes)**

- **Lines 48, 51, 54, 56**: Raw unicode escapes (`\u26a0\ufe0f`, `\u2705`, `\u00cdTICO`, `\u00edtico`) for emoji and accented characters. These are embedded in user-facing strings. The string literals are obfuscated; they should use direct UTF-8 characters.
  - Fix: write the strings directly with proper UTF-8: `⚠️`, `✅`, `CRÍTICO`, `crítico`.

**VIOLATION — Rule 3 (Magic Numbers)**

- **Line 50**: `porcentajeMargen < 10` — hardcoded 10% margin threshold. No constant.
- **Line 53**: `porcentajeMargen < 20` — hardcoded 20% margin threshold. `MARGEN_BAJO_PCT = 20` exists in `@/lib/constants/umbrales.ts`.
  - Fix: import `MARGEN_BAJO_PCT` for the 20% check; add `MARGEN_MUY_BAJO_PCT = 10` for the 10% check.

**VIOLATION — Rule 16 (Hardcoded presentation values in business logic strings)**

- **Lines 105, 111**: hardcoded business values embedded in warning strings: `"$3.12M"` (investment amount), `"$500k/año"` (filtration cost), `"14 brotes mosca"`, `"Dic 2024"`, `"Feb 2025"`. These are time-sensitive factual data embedded as magic strings in code.
  - Fix: extract to named constants or move to a data file (e.g., `@/lib/data/riesgos-arica.ts`) with clearly named exports. At minimum mark with `// TODO: actualizar con dato real`.

**PASS on**: R1, R2, R4, R5, R6, R7, R8, R9, R10, R12, R14, R15, R17.

---

### `src/lib/utils/riesgo-plagas.ts`

**VIOLATION — Rule 3 (Magic Numbers)**

- **Line 21**: `return 19` — fallback temperature in Celsius when climate data is unavailable. Magic number with no named constant.
  - Fix: extract to `TEMP_FALLBACK_ARICA_C = 19` or similar in constants.

- **Lines 25–38**: arrays `maxPorMes` and `minPorMes` built with magic offsets (`-2`, `-5`, `-8`, `-10`, `+6`, `+4`, `+2`, `+0`). These represent temperature deltas per month vs. the base values, but are entirely undocumented inline numbers with no explanation.
  - Fix: at minimum add a comment explaining the seasonal adjustment model. Ideally extract offsets to named constants or a data file.

- **Line 54**: `tempActual >= 15 && tempActual <= 35` — hardcoded default temperature tolerance range when plague data is missing. No constants.
  - Fix: extract to `TEMP_PLAGA_MIN_DEFAULT = 15`, `TEMP_PLAGA_MAX_DEFAULT = 35`.

- **Lines 56, 59**: `score += 50` (temperature factor) and `score += 30` (stage factor) — magic scoring weights.
  - Fix: extract to named constants e.g. `SCORE_TEMPERATURA_FAVORABLE = 50`, `SCORE_ETAPA_VULNERABLE = 30`.

- **Lines 62–65**: `severidadScore` map with hardcoded values `5`, `10`, `15`, `20` — magic score contributions per severity level.
  - Fix: extract to a named constant map.

- **Line 69**: `score += ... ?? 10` — default severity score is a magic number.

- **Lines 71–74**: `score >= 80`, `score >= 60`, `score >= 40` — hardcoded alert level thresholds.
  - Fix: extract to named constants e.g. `SCORE_NIVEL_CRITICO = 80`, `SCORE_NIVEL_ALTO = 60`, `SCORE_NIVEL_MEDIO = 40`.

**VIOLATION — Rule 9 (Immutability)**

- **Line 50**: `let score = 0` then mutated with `+= N`. Same pattern as calidad.ts — accumulator by addition. Acceptable for a scoring function but consistent with a repeated style issue.

**PASS on**: R1, R2, R4, R5, R6, R7, R8, R10, R12, R14, R15, R16, R17.

---

### `src/lib/utils/roi.ts`

**VIOLATION — Rule 9 (Immutability)**

- **Line 135**: `let puntoEquilibrio: number | null = null` — declared mutable, then assigned once inside a loop. This is a genuine mutable sentinel pattern (loop that finds when accumulator crosses zero). Technically requires `let` here; acceptable given the algorithm. However the nested `let acum` and `for (let mes = 1; ...)` are proper loop variables.

- **Line 137**: `let acum = -costoPlantasTotal` — accumulator inside the loop. Acceptable.

**VIOLATION — Rule 3 (Magic Numbers)**

- **Line 144**: `for (let mes = 1; mes <= 48; mes++)` — `48` is 4 years × 12 months. No named constant.
  - Fix: use `MESES_POR_AÑO * 4` or extract `MESES_PROYECCION_ROI = 48`.

- **Line 145**: `Math.min(Math.floor((mes - 1) / 12), 3)` — `12` months per year and `3` (max index = year 4 - 1). The 12 should use `MESES_POR_AÑO`.

**PASS on**: R1, R2, R4, R5, R6, R7, R8, R10, R12, R14, R15, R16, R17.

---

### `src/lib/helpers/dal-mutation.ts`

**PASS** — No violations found.

- Single responsibility: shared try/catch/refetch wrapper.
- Uses centralized logger.
- No magic values.
- No `let`.
- Absolute imports.

---

## Summary Table

| File | Rules Violated | Violation Count |
|---|---|---|
| `utils/agua-calculo-anual.ts` | R3, R3, R3, R3, R3, R3 | 6 |
| `utils/agua-descuento.ts` | — | 0 (PASS) |
| `utils/agua-proyeccion-anual.ts` | R3, R3, R3 | 3 |
| `utils/agua.ts` | R3, R3, R9 | 3 |
| `utils/alertas.ts` | R3, R9 | 2 |
| `utils/calidad.ts` | R3 (×many), R5, R9 | 10+ |
| `utils/comparador-cultivos.ts` | — | 0 (PASS) |
| `utils/economia-avanzada.ts` | R3 | 1 |
| `utils/helpers-cultivo.ts` | — | 0 (PASS) |
| `utils/index.ts` | — | 0 (PASS) |
| `utils/math.ts` | — | 0 (PASS) |
| `utils/recomendacion.ts` | R3, R3, R16 | 4 |
| `utils/riesgo-plagas.ts` | R3 (×many) | 8 |
| `utils/roi.ts` | R3, R9 | 3 |
| `helpers/dal-mutation.ts` | — | 0 (PASS) |

---

## Top Priority Fixes (by frequency and impact)

1. **Rule 3 — Magic numbers in `calidad.ts` and `riesgo-plagas.ts`**: Both files have the highest density of unnamed magic constants (scoring weights, thresholds, ratios). These are the most fragile to maintain.

2. **Rule 3 — Existing constants not reused**: `DIAS_POR_MES_PROMEDIO`, `MESES_POR_AÑO`, `MS_POR_DIA`, `DIAS_POR_AÑO`, `DIAS_AGUA_UMBRAL_CRITICO`, `DIAS_AGUA_UMBRAL_ALTO` all exist in the constants files but are not imported in files that need them — instead the raw numbers are repeated inline.

3. **Rule 5 — `calc` prefix vs `calcular` in `calidad.ts`**: naming inconsistency with the established domain convention.

4. **Rule 3/16 — `recomendacion.ts`**: Time-sensitive hardcoded business data (`$3.12M`, `Dic 2024`, `Feb 2025`, `14 brotes`) embedded as magic strings will silently become stale. These need to be extracted to a data file or at minimum annotated with `// TODO`.

5. **Rule 9 — `agua.ts` line 95**: `let horasDia` that could be a `const` using a ternary or early-return pattern.
