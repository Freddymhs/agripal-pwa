# Arquitectura AgriPlan PWA

**Última revisión**: 2026-05-06

---

## Modelo de rendering híbrido

```
/                    → SSG (force-static) — HTML estático en build
/(marketing)/**      → SSG — landing, páginas SEO, comparativas
/auth/**             → CSR ("use client") — formularios de autenticación
/auth/callback       → Route Handler (server) — solo OAuth code exchange
/(app)/**            → CSR ("use client") — requiere contexto de sesión y datos Supabase
/billing/**          → CSR ("use client") — MercadoPago integration
middleware.ts        → Edge guard — auth + billing check (getSession)
```

**Por qué CSR para la app:** La app usa hooks y contextos (`ProjectContext`, `AuthContext`) que son `"use client"`. No hay capa offline — todos los datos se leen de Supabase en tiempo real.

> Estrategia de rendering por ruta y decisiones históricas:
> [`docs/decisions/DECISION_RENDERING.md`](./decisions/DECISION_RENDERING.md)

---

## Layouts y providers

```
app/layout.tsx              → sin providers (SSG-safe, raíz global)
app/(marketing)/layout.tsx  → sin providers (server component, SEO)
app/(app)/layout.tsx        → con providers CSR (ProjectProvider, AuthProvider)
app/(auth)/layout.tsx       → sin providers complejos
```

**Regla:** Providers son `"use client"`. Solo en subtrees que los necesitan — nunca en `app/layout.tsx`.

---

## Stack técnico

| Capa              | Tecnología              |
|-------------------|-------------------------|
| Framework         | Next.js 16 (App Router) |
| Lenguaje          | TypeScript strict       |
| Estilos           | TailwindCSS 4           |
| Auth + Datos      | Supabase (PostgREST, Auth, Realtime) |
| Mapa interactivo  | PixiJS                  |
| PWA               | @ducanh2912/next-pwa (assets only) |
| Billing           | MercadoPago             |

---

## Capas de datos

```
UI (componentes)
  └── Hooks (src/hooks/)
        └── DAL — Data Access Layer (src/lib/dal/)
              └── Supabase (lectura/escritura directa)
```

- Sin cache layer (TanStack Query, SWR). Fetching manual: `useState + useEffect + useCallback → DAL`.
- Sin IndexedDB ni Dexie. Service worker solo cachea assets UI.
- Los hooks encapsulan toda lógica de datos — componentes nunca llaman a DAL directamente.
- Los DALs retornan tipos explícitos del dominio, nunca `any`.

---

## Tests

- **Unit (Vitest):** `src/**/*.test.ts` — lógica de utilidades, validaciones, cálculos.
- **E2E (specs):** `docs/tests/e2e/specs/` — flujos críticos documentados.

---

## Documentos relacionados

- [`docs/decisions/DECISION_RENDERING.md`](./decisions/DECISION_RENDERING.md) — estrategia de rendering por ruta
- [`docs/diagrams/DIAGRAMAS_COMPONENTES.md`](./diagrams/DIAGRAMAS_COMPONENTES.md) — topología del sistema
- [`CLAUDE.md`](../CLAUDE.md) — convenciones de código
