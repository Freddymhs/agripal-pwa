# CLAUDE.md - AgriPlan PWA Context & Conventions

## 🛠 Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (Strict)
- **Styling**: TailwindCSS 4
- **State**: SWR + React Hooks
- **Persistence**: IndexedDB (Dexie.js)
- **PWA**: @ducanh2912/next-pwa

## 🏗 Architecture
- **Offline-First**: UI optimistic, sync background queue.
- **Data Model**: Defined in `src/types/index.ts`.
- **Components**: Functional, composed, strictly typed props.
- **Logic**: Custom hooks (`src/hooks/`) for logic separation.

## 📝 Code Style Guidelines
- **Nombres**: `PascalCase` componentes, `camelCase` funciones/vars, `kebab-case` archivos.
- **Tipos**: Interfaces explícitas, evitar `any`.
- **Imports**: Absolutos con `@/` (e.g. `@/components/ui/button`).
- **Comentarios**: Solo para lógica compleja ("Por qué", no "Qué").
- **Exports**: Named exports preferidos para componentes.

## 🚀 Commands
- `pnpm dev` - Start dev server
- `pnpm build` - Build for production
- `pnpm lint` - Run linter
- `pnpm type-check` - Run TypeScript compiler check
