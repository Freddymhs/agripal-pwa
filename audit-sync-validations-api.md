# Audit Report: sync / validations / api / auth / events
**Rules file:** `/home/fmarcosdev/Desktop/practicasGoodAgnostics.md` (17 rules)
**Audited directories:**
- `src/lib/sync/` (engine.ts, queue.ts, types.ts, index.ts, adapters/index.ts, adapters/mock.ts)
- `src/lib/validations/` (agua.ts, catalogo.ts, cultivo-restricciones.ts, planta.ts, proyecto.ts, suelo.ts, terreno.ts, types.ts, verify-data-consistency.ts, zona.ts)
- `src/lib/api/` (empty directory — no files to audit)
- `src/lib/auth/` (jwt.ts)
- `src/lib/events/` (zona-events.ts)

---

## src/lib/sync/engine.ts

### VIOLATION 1
- **Line:** 80
- **Rule:** 3 (Magic Strings) + 1 (Centralización)
- **Violation:** The Web Locks key `'agriplan-sync'` is a hardcoded magic string. If it ever changes or needs to be referenced elsewhere, it has no named constant.
- **Fix:** Extract to `SYNC_LOCK_KEY = 'agriplan-sync'` in `@/lib/constants/sync` and import it here.

### VIOLATION 2
- **Lines:** 52, 57, 203
- **Rule:** 3 (Magic Strings) + 10 (Domain-Driven)
- **Violation:** SyncEstado values (`'sincronizando'`, `'pendiente'`, `'error'`, `'conflicto'`) are scattered as raw string literals throughout `engine.ts` and `queue.ts`. The canonical union type `SyncEstado` exists in `@/types` but no const-object/enum guards its values.
- **Fix:** Add a `SYNC_ESTADO` const-object to `@/lib/constants/sync`:
  ```ts
  export const SYNC_ESTADO = {
    PENDIENTE: 'pendiente',
    SINCRONIZANDO: 'sincronizando',
    ERROR: 'error',
    CONFLICTO: 'conflicto',
  } as const satisfies Record<string, SyncEstado>
  ```
  Use `SYNC_ESTADO.PENDIENTE` etc. everywhere.

### VIOLATION 3
- **Lines:** 115–117, 174–176
- **Rule:** 9 (Inmutabilidad)
- **Violation:** `let success = 0`, `let conflicts = 0`, `let errors = 0`, `let totalPulled = 0`, `let maxTimestamp`, `let allSuccess` are mutable counters/flags that are reassigned inside loops. These are legitimate accumulators in imperative loops. However, `let allSuccess = true` (line 176) is a boolean that could be replaced by tracking failure differently (e.g., collecting errors). This is a minor pattern smell; the pure loop accumulators (`success`, `conflicts`, `errors`, `totalPulled`) are acceptable per Rule 9's exception for loop accumulators.
- **Fix (for `allSuccess` only):** Replace with a functional approach: collect errors per entity and check `errors.length === 0` after the loop.

### VIOLATION 4
- **Lines:** 152, 211, 228
- **Rule:** 4 (Type Safety)
- **Violation:** `as never` is used three times to bypass Dexie's generic table type constraints with no explanatory comment. This is an unsafe cast that silences real type errors.
- **Fix:** Add a comment justifying each cast, e.g., `// Dexie generic table type doesn't infer union of entity shapes; safe because getTabla() maps entity to its correct table`. Alternatively, type `getTabla()` to return a more precise table type per entity.

---

## src/lib/sync/queue.ts

### VIOLATION 5
- **Lines:** 19, 26, 34, 45, 60, 62, 69, 75, 77, 85, 102, 116, 129, 137, 142, 144, 145, 189
- **Rule:** 3 (Magic Strings) + 10 (Domain-Driven)
- **Violation:** Same as engine.ts — SyncEstado string literals (`'pendiente'`, `'error'`, `'sincronizando'`, `'conflicto'`) and decision strings (`'local'`, `'servidor'`) are repeated raw literals throughout the file. `'local'` / `'servidor'` are used as an inline union with no named constant.
- **Fix:** Use `SYNC_ESTADO` const-object (see Violation 2). For conflict resolution decision, add `SYNC_DECISION = { LOCAL: 'local', SERVIDOR: 'servidor' } as const`.

### VIOLATION 6
- **Line:** 112
- **Rule:** 3 (Magic Numbers) + 1 (Centralización)
- **Violation:** The jitter factor `0.3` is a magic number with no semantic name.
- **Fix:** Extract `RETRY_JITTER_FACTOR = 0.3` into `@/lib/constants/sync`.

### VIOLATION 7
- **Lines:** 184
- **Rule:** 3 (Magic Numbers) + 8 (Reutilización)
- **Violation:** `24 * 60 * 60 * 1000` is written inline. `MS_POR_DIA = 86_400_000` already exists in `@/lib/constants/conversiones`.
- **Fix:**
  ```ts
  import { MS_POR_DIA } from '@/lib/constants/conversiones'
  // ...
  const limite = new Date(Date.now() - SYNC_CLEANUP_DAYS * MS_POR_DIA).toISOString()
  ```

### VIOLATION 8
- **Lines:** 160, 200, 205
- **Rule:** 1 (Centralización / Storage Keys)
- **Violation:** The IndexedDB meta key `'lastSyncAt'` is a hardcoded string appearing in two functions. Per Rule 1, storage keys must be centralized.
- **Fix:** Add `SYNC_META_KEY_LAST_SYNC = 'lastSyncAt'` to `@/lib/constants/sync` and reference it in both `getLastSyncAt()` and `setLastSyncAt()`.

### VIOLATION 9
- **Lines:** 115–117
- **Rule:** 9 (Inmutabilidad)
- **Violation:** `let success = 0`, `let conflicts = 0`, `let errors = 0` — same note as engine.ts Violation 3. These are imperative loop accumulators and are a borderline case; they are technically acceptable by Rule 9's own exception. Noted for awareness.
- **Fix (optional):** Refactor `pushChanges` to use `Array.reduce` or collect results into an array and derive counts.

---

## src/lib/sync/types.ts

**PASS** — Clean file. Types are well-defined, no magic values, no `any`, no violations.

---

## src/lib/sync/index.ts

**PASS** — Barrel export only. No violations.

---

## src/lib/sync/adapters/index.ts

**PASS** — Barrel export only. No violations.

---

## src/lib/sync/adapters/mock.ts

### VIOLATION 10
- **Lines:** 5–6
- **Rule:** 3 (Magic Numbers)
- **Violation:** `private latencyMs = 300` is a magic number inside the class with no named constant. Even for test/mock infrastructure, numbers should be named.
- **Fix:** Extract `MOCK_ADAPTER_LATENCY_MS = 300` as a module-level constant (or a named parameter).

### VIOLATION 11
- **Line:** 1
- **Rule:** 12 (Imports absolutos)
- **Violation:** `from '../types'` is a relative import that crosses directory boundaries. The module `src/lib/sync/types.ts` is accessible via `@/lib/sync/types`.
- **Fix:** `import type { SyncAdapter, SyncRequest, SyncResponse, PullRequest, PullResponse } from '@/lib/sync/types'`

---

## src/lib/auth/jwt.ts

### VIOLATION 12
- **Line:** 29
- **Rule:** 3 (Magic Numbers) + 8 (Reutilización)
- **Violation:** Token expiry `7 * 24 * 60 * 60 * 1000` is written inline. `MS_POR_DIA = 86_400_000` already exists in `@/lib/constants/conversiones`, so the correct expression would be `7 * MS_POR_DIA`. Additionally, the value `7` (days) has no semantic name (e.g., `JWT_EXPIRY_DAYS`).
- **Fix:**
  ```ts
  import { MS_POR_DIA } from '@/lib/constants/conversiones'
  const JWT_EXPIRY_DAYS = 7
  // ...
  exp: Date.now() + JWT_EXPIRY_DAYS * MS_POR_DIA,
  ```

### VIOLATION 13
- **Line:** 3
- **Rule:** 1 (Centralización) + 17 (Documentación)
- **Violation:** `const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'` hardcodes a fallback string that is a security-sensitive value. The fallback string is a magic string with no dedicated constant. More critically, there is no warning/log when the fallback is active in dev so developers know the real secret is missing.
- **Fix:** Log a warning via the centralized logger when the env var is absent:
  ```ts
  if (!process.env.JWT_SECRET) {
    logger.warn('JWT_SECRET env var not set — using insecure dev fallback')
  }
  ```

### VIOLATION 14
- **Line:** 3
- **Rule:** 7 (Error Handling / Logger)
- **Violation:** `jwt.ts` imports nothing from `@/lib/logger`. The fallback secret scenario (Violation 13) and any misuse should be observable. The file has zero logging.
- **Fix:** Import and use `logger` at least for the missing-secret warning.

### VIOLATION 15
- **Lines:** 32, 34
- **Rule:** 3 (Magic Strings)
- **Violation:** JWT algorithm `'HS256'` and type `'JWT'` are raw string literals in the header construction. These are domain constants that should be named.
- **Fix:**
  ```ts
  const JWT_ALG = 'HS256'
  const JWT_TYP = 'JWT'
  ```

---

## src/lib/events/zona-events.ts

**PASS** — Clean file. `ZONA_UPDATED_EVENT` is already a named constant. Logic is minimal and well-scoped. No violations.

---

## src/lib/validations/types.ts

**PASS** — Single canonical `ValidationResult` interface. No violations.

---

## src/lib/validations/proyecto.ts

**PASS** — Simple, focused validation. No violations.

---

## src/lib/validations/terreno.ts

**PASS** — Clean validation. No violations.

---

## src/lib/validations/catalogo.ts

### VIOLATION 16
- **Lines:** 37–43
- **Rule:** 3 (Magic Numbers) + 8 (Reutilización)
- **Violation:** pH bounds `0` and `14` are repeated magic numbers. Although `0` is self-evident, `14` is a domain-specific maximum pH value that already appears in `validarSueloTerreno()` in `suelo.ts`. These should share a single named constant.
- **Fix:** Add `PH_MIN = 0` and `PH_MAX = 14` to `@/lib/constants/` (agro domain constants) and import them in both files.

---

## src/lib/validations/agua.ts

### VIOLATION 17
- **Lines:** 31
- **Rule:** 9 (Inmutabilidad)
- **Violation:** `let nivel: CompatibilidadNivel = 'compatible'` is assigned once conditionally and then returned. This can be refactored to a `const` expression.
- **Fix:**
  ```ts
  const nivel: CompatibilidadNivel = (() => {
    if (problemas.length === 0) return 'compatible'
    const hayExcesoGrave = hayBoro && fuente.boro_ppm! > cultivo.boro_tolerancia_ppm * 2
    const haySalinidadGrave = ...
    return (hayExcesoGrave || haySalinidadGrave || problemas.length >= 2) ? 'no_compatible' : 'limitado'
  })()
  ```

### VIOLATION 18
- **Lines:** 34, 36
- **Rule:** 3 (Magic Numbers)
- **Violation:** `* 2` (double tolerance threshold for "grave" boro) and `* 1.5` (1.5x tolerance for "grave" salinity) are magic multipliers with no semantic names.
- **Fix:** Add named constants such as `BORO_GRAVE_FACTOR = 2` and `SALINIDAD_GRAVE_FACTOR = 1.5` in the agro constants module.

---

## src/lib/validations/suelo.ts

### VIOLATION 19
- **Line:** 41
- **Rule:** 9 (Inmutabilidad)
- **Violation:** `let nivel: CompatibilidadNivel = 'compatible'` — same pattern as `agua.ts`. The variable is conditionally reassigned; can be a `const`.
- **Fix:** Same IIFE or ternary chain approach as Violation 17.

### VIOLATION 20
- **Lines:** 46, 48
- **Rule:** 3 (Magic Numbers)
- **Violation:** `cultivo.ph_min - 1` and `cultivo.ph_max + 1` use magic offset `1` to define a "grave" pH deviation threshold. `* 1.5` on salinidad again (same as agua.ts).
- **Fix:** Named constants: `PH_GRAVE_OFFSET = 1`, and share `SALINIDAD_GRAVE_FACTOR = 1.5` with agua.ts.

### VIOLATION 21
- **Lines:** 72–73
- **Rule:** 2 (DRY) — minor structural oddity
- **Violation:** There is a `export type { ValidationResult } from './types'` re-export on line 72, followed immediately by `import type { ValidationResult } from './types'` on line 73 (which is needed for the function signature below). This import/re-export inversion is confusing and creates a structural smell — the `import` should come first at the top of the file with all other imports, not interleaved mid-file.
- **Fix:** Move the `import type { ValidationResult }` to the top of the file with all other imports. Keep only the re-export at the top boundary if needed, or remove the re-export and let callers import directly from `./types`.

---

## src/lib/validations/planta.ts

### VIOLATION 22
- **Lines:** 130–131, 161
- **Rule:** 9 (Inmutabilidad)
- **Violation:** `for (let fila = ...)`, `for (let col = ...)` — loop index variables. These are the standard exception for loop counters and are acceptable per Rule 9. However, `let conflicto = false` on line 161 is a flag that is set once and could be replaced by a `break` + external tracking, or by using `Array.some()`.
- **Fix:** Replace `let conflicto` + manual flag pattern with `const hasConflict = plantasExistentes.some(planta => planta.zona_id === zona.id && distancia(pos, planta) < espaciado)`.

### VIOLATION 23
- **Lines:** 196, 202, 210–211
- **Rule:** 17 (Documentación mínima)
- **Violation:** Comments on lines 196 (`// Validar que la posición esté dentro de los límites de la zona`) and 210 (`// Si se proporciona cultivo con espaciado, validar distancia a otras plantas`) document the "what", not the "why". Per Rule 17, comments should explain why, not what.
- **Fix:** Remove these explanatory comments (the code is self-documenting) or replace with a "why" rationale if there is a non-obvious reason.

---

## src/lib/validations/cultivo-restricciones.ts

**Line count: 212 — exceeds 200-line limit for a single-responsibility file.**

### VIOLATION 24
- **Line count:** 212
- **Rule:** 6 (Modularidad / Single Responsibility)
- **Violation:** The file mixes four distinct responsibilities: (1) viability validation per terreno, (2) batch filtering, (3) ranking by criteria, (4) water consumption simulation with ET0 data. These should be split.
- **Fix:** Extract `simularConsumoEstacional()` (lines 160–212) and the ET0 data array into a separate file (e.g., `src/lib/utils/simulacion-agua-estacional.ts` or `src/lib/data/et0-arica.ts` for the ET0 values).

### VIOLATION 25
- **Line:** 26
- **Rule:** 3 (Magic Numbers)
- **Violation:** `terreno.agua_disponible_m3 * 26` — the multiplier `26` represents "26 fill cycles per year" (biweekly), which is a critical domain assumption expressed as a bare number.
- **Fix:** Add `CICLOS_LLENADO_ANUALES = 26` (or a more descriptive name like `RECARGAS_ANUALES_ESTIMADAS`) to the agro constants module.

### VIOLATION 26
- **Lines:** 29, 36
- **Rule:** 3 (Magic Numbers)
- **Violation:** `* 1.1` (10% water tolerance buffer) and `* 1.5` (grave salinity threshold) are magic multipliers.
- **Fix:** Named constants: `AGUA_TOLERANCIA_BUFFER = 1.1`, and share `SALINIDAD_GRAVE_FACTOR = 1.5` (same constant as agua.ts and suelo.ts violations).

### VIOLATION 27
- **Lines:** 155, 170, 177
- **Rule:** 8 (Reutilización) + 3 (Magic Numbers)
- **Violation:** `agua_anual_m3 / 365` appears on lines 155 and 177. `DIAS_POR_AÑO = 365` already exists in `@/lib/constants/conversiones`. Similarly `/ 12` on line 170 should use `MESES_POR_AÑO`.
- **Fix:**
  ```ts
  import { DIAS_POR_AÑO, MESES_POR_AÑO, SEMANAS_POR_AÑO } from '@/lib/constants/conversiones'
  // agua_diaria_m3 = agua_anual_m3 / DIAS_POR_AÑO
  // agua_promedio_mensual = ... / MESES_POR_AÑO
  // agua_promedio_dia = agua_anual / DIAS_POR_AÑO
  ```

### VIOLATION 28
- **Lines:** 172, 173
- **Rule:** 9 (Inmutabilidad)
- **Violation:** `for (let mes = 1; ...)` loop index — acceptable exception. `let agua_mes = 0` is a loop accumulator — also acceptable per Rule 9. However, the entire `simularConsumoEstacional` function uses an imperative `resultado.push()` pattern that could be a `Array.from({ length: 12 }, (_, i) => ...)` map.
- **Fix (low priority):** Refactor to functional style with `Array.from`.

### VIOLATION 29
- **Lines:** 179–180
- **Rule:** 6 (Separar datos estáticos de lógica) + 1 (Centralización)
- **Violation:** The ET0 monthly values `[3.0, 3.2, 3.0, 2.5, 2.0, 1.8, 1.9, 2.3, 2.8, 3.2, 3.5, 3.3]` and `ET0_promedio = 2.8` are static data embedded inside a calculation function. Per Rule 6, static data must be in a data file.
- **Fix:** Move to `src/lib/data/et0-arica.ts`:
  ```ts
  export const ET0_MENSUAL_ARICA = [3.0, 3.2, 3.0, 2.5, 2.0, 1.8, 1.9, 2.3, 2.8, 3.2, 3.5, 3.3]
  export const ET0_PROMEDIO_ARICA = 2.8
  ```

### VIOLATION 30
- **Line:** 188–200
- **Rule:** 2 (DRY) + 1 (Centralización)
- **Violation:** The month names array `['Enero', 'Febrero', ..., 'Diciembre']` is defined inline inside `simularConsumoEstacional`. Month names likely exist (or should exist) centrally — they are a static domain list.
- **Fix:** Extract to `src/lib/constants/` (e.g., `NOMBRES_MESES`) and reuse it across the app.

### VIOLATION 31
- **Lines:** 124–131
- **Rule:** 9 (Inmutabilidad)
- **Violation:** In `rankearCultivosViables`, `const ranked = cultivos.map(...)` is fine, but the score calculation for `'agua'` case (`100 - cultivo.agua_m3_ha_año_max`) uses the raw number `100` as a magic ceiling for score normalization.
- **Fix:** Named constant `SCORE_AGUA_BASE = 100` or rethink the scoring logic so it doesn't rely on an arbitrary ceiling.

---

## src/lib/validations/zona.ts

**PASS** — Clean file. Validation logic is well-focused and uses typed interfaces. No violations found.

---

## src/lib/validations/verify-data-consistency.ts

### VIOLATION 32
- **Lines:** 54–62, 72–81
- **Rule:** 2 (DRY)
- **Violation:** The fuzzy matching logic (lines 54–62 and 72–81) is duplicated verbatim between `sinCoberturaKc` and `sinCoberturaD`. Both perform the exact same three-condition name match (`includes`, reverse `includes`, `nameParts.some`).
- **Fix:** Extract to a helper:
  ```ts
  function matchNombreCultivo(nombreLower: string, candidatos: string[]): boolean {
    const nameParts = nombreLower.split(' ')
    return candidatos.some(c => {
      const cLower = c.toLowerCase()
      return nombreLower.includes(cLower) || cLower.includes(nombreLower) || nameParts.some(p => p === cLower)
    })
  }
  ```

### VIOLATION 33
- **Lines:** 24–62 vs 65–81
- **Rule:** 3 (Magic Strings / inline comments as "what")
- **Violation:** Comments `// Verificar campos requeridos`, `// Buscar match en KC`, `// Buscar match en Duración`, `// Detectar duplicados` all document the "what". Per Rule 17, only "why" comments are appropriate.
- **Fix:** Remove these comments; the function and variable names are self-describing.

---

## src/lib/api/ (empty)

No `.ts` files found in this directory. **Nothing to audit.**

---

## Summary Table

| File | Violations | Rules Violated | Severity |
|------|-----------|----------------|----------|
| `src/lib/sync/engine.ts` | 4 | 1, 3, 4, 9, 10 | Medium |
| `src/lib/sync/queue.ts` | 5 | 1, 3, 8, 9, 10 | Medium |
| `src/lib/sync/types.ts` | 0 | — | PASS |
| `src/lib/sync/index.ts` | 0 | — | PASS |
| `src/lib/sync/adapters/index.ts` | 0 | — | PASS |
| `src/lib/sync/adapters/mock.ts` | 2 | 3, 12 | Low |
| `src/lib/auth/jwt.ts` | 4 | 1, 3, 7, 17 | High |
| `src/lib/events/zona-events.ts` | 0 | — | PASS |
| `src/lib/validations/types.ts` | 0 | — | PASS |
| `src/lib/validations/proyecto.ts` | 0 | — | PASS |
| `src/lib/validations/terreno.ts` | 0 | — | PASS |
| `src/lib/validations/catalogo.ts` | 1 | 3, 8 | Low |
| `src/lib/validations/agua.ts` | 2 | 3, 9 | Low |
| `src/lib/validations/suelo.ts` | 3 | 2, 3, 9 | Low–Medium |
| `src/lib/validations/planta.ts` | 2 | 9, 17 | Low |
| `src/lib/validations/cultivo-restricciones.ts` | 8 | 1, 2, 3, 6, 8, 9 | High |
| `src/lib/validations/zona.ts` | 0 | — | PASS |
| `src/lib/validations/verify-data-consistency.ts` | 2 | 2, 17 | Low |
| `src/lib/api/` | — | — | Empty dir |

---

## Cross-Cutting Issues (affect multiple files)

### A. `SyncEstado` string literals not using a const-object
Affects: `engine.ts`, `queue.ts`
Both files scatter `'pendiente'`, `'error'`, `'sincronizando'`, `'conflicto'` as raw strings, despite `SyncEstado` union type being defined in `@/types`. A `SYNC_ESTADO` const-object (Rule 3, 10) would centralize these.

### B. `SALINIDAD_GRAVE_FACTOR = 1.5` duplicated
Affects: `agua.ts` (line 36), `suelo.ts` (line 48), `cultivo-restricciones.ts` (line 36)
The same magic multiplier `1.5` appears in three files for the "grave salinity" threshold. Extract once to agro constants (Rule 2, 3).

### C. `DIAS_POR_AÑO` / `MS_POR_DIA` not imported from conversiones
Affects: `cultivo-restricciones.ts` (365), `queue.ts` (24*60*60*1000), `jwt.ts` (7*24*60*60*1000)
The constants already exist in `@/lib/constants/conversiones` but are not imported. Inline recalculation (Rule 8).

### D. `pH` bounds `0` and `14` duplicated
Affects: `catalogo.ts` (lines 37–43), `suelo.ts` (lines 76–79)
Same numeric limits defined independently in two validators. Extract `PH_MIN / PH_MAX` once (Rule 2, 3).
