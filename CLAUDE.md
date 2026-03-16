# CLAUDE.md - AgriPlan PWA Context & Conventions

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (Strict)
- **Styling**: TailwindCSS 4
- **State**: React Hooks (useState, useEffect, useCallback, useMemo)
- **Persistence**: Supabase (PostgreSQL) — sin almacenamiento local
- **PWA**: @ducanh2912/next-pwa

## Architecture

- **Supabase-direct**: UI ↔ Supabase via DAL. Sin capa de cache intermedia.
- **Data Model**: Defined in `src/types/index.ts`.
- **Components**: Functional, composed, strictly typed props.
- **Logic**: Custom hooks (`src/hooks/`) for logic separation.

## Code Style Guidelines

- **Nombres**: `PascalCase` componentes, `camelCase` funciones/vars, `kebab-case` archivos.
- **Tipos**: Interfaces explícitas, evitar `any`.
- **Imports**: Absolutos con `@/` (e.g. `@/components/ui/button`).
- **Comentarios**: Solo para lógica compleja ("Por qué", no "Qué").
- **Exports**: Named exports preferidos para componentes.

## Commands

- `pnpm dev` - Start dev server
- `pnpm build` - Build for production
- `pnpm lint` - Run linter
- `pnpm type-check` - Run TypeScript compiler check

## Reglas React / Next.js

### Componentes

- Máximo 200 líneas. Si supera, dividir en subcomponentes y/o hooks.
- Hooks > HOC. HOC solo para librerías legacy o integraciones raras.
- Prohibido usar `fetch`, `query` o `mutate` directamente en componentes UI.

### Data Layer (DAL)

- APIs en `src/lib/dal/` por dominio (ej: `terrenosDAL`, `plantasDAL`).
- Los DALs devuelven tipos/DTOs, nunca `any` ni objetos sueltos.
- Base de datos: patrón Singleton (`supabase` client en `src/lib/supabase/client.ts`).
- Serialización: usar `serializarParaSupabase()` / `deserializarDesdeSupabase()` de `src/lib/supabase/schema.ts` en todos los DAL.

### Patrón único de data fetching y mutaciones

- **Prohibido TanStack Query** y cualquier librería de cache/fetching externa.
- **Fetching en hooks**: `useState` + `useEffect` + `useCallback` → DAL.
- **Mutaciones siempre via `ejecutarMutacion()`** de `src/lib/helpers/dal-mutation.ts`. Wraps DAL call + refetch + logging. Sin excepciones.
- **Error handling en mutaciones**: validación → retornar `{ error: string }`. Errores de DAL → `ejecutarMutacion` logea y hace throw.
- **Timestamps**: siempre usar `getCurrentTimestamp()` de `@/lib/utils`. Prohibido `new Date().toISOString()` inline en hooks/componentes.
- **UUIDs**: siempre usar `generateUUID()` de `@/lib/utils`.

### Centralización obligatoria

- **Constantes**: centralizar en `src/lib/constants/`. No hardcodear valores repetidos.
- **Logger**: usar logger centralizado. Prohibido `console.log/warn/error` directo en código de producción.
- **Funciones utilitarias**: antes de crear una función, verificar si ya existe en `src/lib/utils/`.

### Error Handling

- Todas las rutas deben tener su `error.tsx` con UX coherente.
- Toda llamada a API pasa por `ejecutarMutacion` con manejo de errores y logging.

### Testing (cuando esté implementado)

- Unit (Vitest): obligatorio para lógica compleja.
- E2E (Cypress): al menos un test por flujo crítico.
- Bug fixes críticos: acompañar con test que falle antes del cambio.

## Navegación

- `NAV_ITEMS` (barra principal) solo para acciones de uso diario: Mapa, Agua, Economía, Alertas.
- Todo lo demás va a `ADVANCED_ITEMS` (dropdown "Avanzado"). No saturar el nav primario.

## Features nuevas

- Antes de implementar un módulo nuevo: (a) analizar qué valor concreto le da al usuario, (b) verificar que no sature la interfaz existente (nav, páginas), (c) scopear v1 mínima — funcionalidad core primero, gráficos y avanzado en fase siguiente.

## Dónde va cada dato

- **Nunca cambia** (leyes físicas, fórmulas, umbrales científicos) → constante en código.
- **Puede crecer o actualizarse** (catálogos, listas, entidades con nombre) → base de datos.
- **Cada usuario lo personaliza** → tabla per-project, copiada automáticamente desde la base global.
- **Aún no tiene tabla** → `data/pendiente/`, nunca importar en código de producción.

Componentes nunca importan datos de catálogo desde archivos locales. Siempre desde la BD via hooks.

## Sistema de Agua (FASE 11C)

### Páginas principales

- `/agua` - Gestión diaria del agua (cyan). Monitoreo real, entradas, consumo.
- `/agua/planificador` - Planificador 12 meses (blue). Proyecciones, simulación.
- `/economia` - Economía del cultivo. ROI, inversión, ingresos proyectados.

### Kc (Coeficiente de Cultivo)

- Multiplicador de consumo de agua según etapa de crecimiento.
- Datos en `src/lib/data/kc-cultivos.ts` (25+ cultivos región Arica).
- Etapas: plántula (Kc 0.4-0.5), joven (0.7-0.8), adulta (1.0-1.2), madura (0.8-0.9).

### Duración Etapas

- Datos en `src/lib/data/duracion-etapas.ts`.
- Funciones: `calcularEtapaActual()`, `getDiasRestantesEtapa()`, `getDiasTotalesCultivo()`.

### Alertas Automáticas

- `src/lib/utils/alertas.ts` - Sistema de alertas críticas.
- Tipos: agua_critica (<7 días), replanta_pendiente, lavado_salino (30 días), riesgo_encharcamiento.

### Proyección Anual

- `src/lib/utils/agua-proyeccion-anual.ts` - Proyección 12 meses.
- Genera eventos: recargas, replantas, lavado, cosechas.
