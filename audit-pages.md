# Auditoría: src/app/ (Pages) vs 17 Reglas Agnósticas

Generado por agente automático.

---

## Resumen de Violaciones

| Prioridad | Issue | Archivos Afectados |
|---|---|---|
| HIGH | **R2 — Header custom en vez de PageLayout** | `agua/planificador`, `agua/configuracion`, `alertas`, `economia/avanzado`, `escenarios`, `plagas`, `terrenos` (7 archivos) |
| HIGH | **R2 — `cultivosPorTipo` reduce duplicado** | `economia/page`, `economia/avanzado/page`, `agua/planificador/page` |
| HIGH | **R13 — useEffect+setState para datos derivados** | `economia/page`, `escenarios/page`, `terrenos/page`, `catalogo/page`, `agua/page` |
| HIGH | **R14 — Llamadas directas al DAL en pages** | `agua/page` (zonasDAL), `terrenos/page` (zonasDAL + plantasDAL), `catalogo/page` (localStorage) |
| MEDIUM | **R9 — Uso de `let`** | `page.tsx` línea 79 |
| MEDIUM | **R3 — Falta constante ROUTES** | Todas las pages con `router.push` o `<Link href>` con strings raw |
| MEDIUM | **R2 — BackIcon SVG inline duplicado** | 5 pages |
| MEDIUM | **R3 — `~$75,000 CLP` string duplicado** | `agua/configuracion`, `suelo/page` (×2) |
| LOW | **R3 — Magic numbers en umbrales** | `registro/page`, `clima/page`, `escenarios/page`, `suelo/page` |

---

## Detalle por Archivo

### `src/app/layout.tsx`
- **L25 R3**: `'#22c55e'` hex color hardcodeado → extraer a `THEME_COLOR`
- **L48 R3**: `duration={3000}` → extraer a `TOAST_DURATION_MS`
- **L48 R16**: `position="bottom-right"` prop hardcodeado → config UI

### `src/app/page.tsx`
- **L79 R9**: `let mainContent: ReactNode` → refactorizar a `const` con ternario
- **L60,384 R3**: `/auth/login`, `/terrenos` rutas raw → crear `ROUTES` en constants
- **L66,146 R1**: `'green'` como `headerColor` raw → centralizar valores permitidos
- **L30-400 R6**: 400 líneas con 3 sub-componentes lógicos → extraer `MapView` y `HeaderActions`

### `src/app/agua/page.tsx`
- **L206-218 R14**: `zonasDAL.update()` llamado directo en page → mover a hook
- **L44-53 R13**: `useEffect` + `setEstanqueSeleccionadoId` → usar `useMemo` o lazy `useState`
- **L194-199 R7**: Error logueado sin feedback al usuario → agregar toast

### `src/app/agua/planificador/page.tsx`
- **L90-128 R6/R2**: Header custom duplicado en 5 pages → usar `PageLayout`
- **L192-198 R2**: `BackIcon` SVG inline duplicado en 5 pages → extraer componente
- **L54-61 R2**: `cultivosPorTipo` reduce duplicado en 3 pages → extraer util

### `src/app/agua/configuracion/page.tsx`
- **L51-63 R6/R2**: Header custom → usar `PageLayout`
- **L32-39 R13**: Estado local de form nunca se persiste (stub)
- **L35-36 R3**: `buffer_minimo_pct: 30`, `alerta_critica_pct: 20` → usar UMBRALES
- **L70 R2**: `~$75,000 CLP` hardcodeado (3 ocurrencias total) → constante

### `src/app/alertas/page.tsx`
- **L21-25 R6/R2**: Sin `PageLayout`
- **L43 R3**: `router.push('/')` ruta raw

### `src/app/auth/login/page.tsx` + `registro/page.tsx`
- **R2**: Login/registro comparten layout casi idéntico → extraer `<AuthLayout>`
- **L23,85 R3** (registro): `password.length < 6` y `minLength={6}` → `MIN_PASSWORD_LENGTH`

### `src/app/catalogo/page.tsx`
- **L24-36 R13**: `useEffect` + `setProyectoActual` → usar `useProjectContext`
- **L26-27,100 R14**: `localStorage` directo en page → delegar a contexto
- **L54 R3**: `setTimeout(..., 3000)` → constante compartida

### `src/app/clima/page.tsx`
- **L88 R3**: `const maxEto = 6.5` magic number → mover a `ETO_ARICA`
- **L27 R8**: `new Date().getMonth() + 1` inline → crear util

### `src/app/economia/page.tsx`
- **L32-87 R13**: Gran `useEffect+setState` para `resumen` derivado → usar `useMemo`
- **L47-53 R2**: `cultivosPorTipo` reduce duplicado

### `src/app/economia/avanzado/page.tsx`
- **L87-104 R6/R2**: Header custom → `PageLayout`
- **L41-48 R2**: `cultivosPorTipo` reduce duplicado
- **L98-100 R2**: BackIcon SVG inline duplicado

### `src/app/escenarios/page.tsx`
- **L79-87 R6/R2**: Header custom
- **L30-39 R13**: `useEffect` sets estado derivado
- **L63 R3**: Magic number `3` → `MAX_ESCENARIOS_COMPARADOS`
- **L20-21 R1**: `COLORES_LINEA`, `COLORES_BG` locales → mover a constants

### `src/app/guia/page.tsx`
PASS

### `src/app/plagas/page.tsx`
- **L69-82 R6/R2**: Header custom → `PageLayout`
- **L139 R3**: `/100` max score → constante
- **L158-159 R10**: Strings `'critica'`, `'alta'` sin constante

### `src/app/suelo/page.tsx`
- **L95,104 R2/R3**: `~$75,000 CLP` duplicado
- **L67 R3**: `> 4` umbral salinidad → usar `UMBRALES`

### `src/app/terrenos/page.tsx`
- **L51-53 R14**: `zonasDAL` + `plantasDAL` directo en page
- **L122-131 R6/R2**: Header custom
- **L75 R3**: `router.push('/')` ruta raw
- **L38-42 R13**: `useEffect` para estado derivado

### Todos los `error.tsx`
PASS — Todos delegan limpiamente a `RouteError`.
