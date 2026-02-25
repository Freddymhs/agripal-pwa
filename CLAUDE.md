# CLAUDE.md - AgriPlan PWA Context & Conventions

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (Strict)
- **Styling**: TailwindCSS 4
- **State**: SWR + React Hooks
- **Persistence**: IndexedDB (Dexie.js)
- **PWA**: @ducanh2912/next-pwa

## Architecture
- **Offline-First**: UI optimistic, sync background queue.
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
- APIs en `lib/repositories/` por dominio (ej: `shipmentsRepository`).
- Los repositorios devuelven tipos/DTOs, nunca `any` ni objetos sueltos.
- Base de datos: patrón Singleton para conexiones.

### Centralización obligatoria
- **Constantes**: centralizar en `src/lib/constants/`. No hardcodear valores repetidos.
- **Query Keys**: centralizar en un solo archivo (ej: `src/lib/query-keys.ts`).
- **Logger**: usar logger centralizado. Prohibido `console.log/warn/error` directo en código de producción.
- **Funciones utilitarias**: antes de crear una función, verificar si ya existe en `src/lib/utils/`.

### Error Handling
- Todas las rutas deben tener su `error.tsx` con UX coherente.
- Toda llamada a API pasa por un helper común con manejo de errores y logging.

### Testing (cuando esté implementado)
- Unit (Vitest): obligatorio para lógica compleja.
- E2E (Cypress): al menos un test por flujo crítico.
- Bug fixes críticos: acompañar con test que falle antes del cambio.

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
