# Arquitectura AgriPlan PWA

**Última revisión**: 2026-03-12

---

## Modelo de rendering híbrido

AgriPlan combina SSG para marketing y CSR offline-first para la aplicación.

```
/                    → SSG (force-static) — HTML estático en build
/(marketing)/**      → SSG — landing, páginas SEO, comparativas
/auth/**             → CSR ("use client") — formularios de autenticación
/auth/callback       → Route Handler (server) — solo OAuth code exchange
/(app)/**            → CSR ("use client") — offline-first con IndexedDB
/billing/**          → CSR ("use client") — MercadoPago integration
proxy.ts             → Edge guard — auth + billing check (getSession, offline-safe)
```

**Por qué CSR para la app:** IndexedDB es el almacén primario. El rendering en servidor no tiene acceso a IndexedDB del browser. Offline-first requiere que toda la lógica de datos viva en el cliente.

> Documento detallado con evolución post-Supabase, gotchas y decisiones futuras:
> [`docs/decisions/DECISION_RENDERING.md`](./decisions/DECISION_RENDERING.md)

---

## Layouts y providers

```
app/layout.tsx              → sin providers (SSG-safe, raíz global)
app/(marketing)/layout.tsx  → sin providers (server component, SEO)
app/(app)/layout.tsx        → con providers CSR (ProjectProvider, QueryProvider)
app/(auth)/layout.tsx       → sin providers complejos
```

**Regla:** `ProjectProvider`, `AuthProvider`, `QueryProvider` son `"use client"`. Solo deben aplicarse en subtrees que los necesitan — nunca en `app/layout.tsx`.

---

## Stack técnico

| Capa                   | Tecnología              |
| ---------------------- | ----------------------- |
| Framework              | Next.js 16 (App Router) |
| Lenguaje               | TypeScript strict       |
| Estilos                | TailwindCSS 4           |
| Estado servidor        | React Query (TanStack)  |
| Estado cliente offline | IndexedDB (Dexie.js)    |
| Auth + Sync            | Supabase                |
| Mapa interactivo       | PixiJS                  |
| PWA                    | @ducanh2912/next-pwa    |
| Billing                | MercadoPago             |

---

## Capas de datos

```
UI (componentes)
  └── Hooks personalizados (src/hooks/)
        └── DAL — Data Access Layer (src/lib/dal/)
              ├── IndexedDB / Dexie (offline-first)
              └── Supabase (sync background)
```

- Los hooks encapsulan toda lógica de datos — los componentes nunca llaman a DAL directamente.
- Los DALs retornan tipos explícitos del dominio, nunca `any`.
- Supabase sync corre en background sin bloquear la UI.

---

## Tests

- **Unit (Vitest):** `src/**/*.test.ts` — lógica de utilidades, validaciones, cálculos.
- **E2E (specs):** `docs/tests/e2e/specs/` — flujos críticos documentados (TC-001 a TC-031+).
- **Arquitectónico:** `src/__tests__/homepage-ssg.test.ts` — valida restricciones SSG del homepage.

---

## Documentos relacionados

- [`docs/decisions/DECISION_RENDERING.md`](./decisions/DECISION_RENDERING.md) — estrategia de rendering por ruta
- [`docs/diagrams/DIAGRAMAS_COMPONENTES.md`](./diagrams/DIAGRAMAS_COMPONENTES.md) — componentes y relaciones
- [`docs/diagrams/DIAGRAMAS_SECUENCIA.md`](./diagrams/DIAGRAMAS_SECUENCIA.md) — flujos de datos
- [`docs/diagrams/DIAGRAMAS_ESTADOS.md`](./diagrams/DIAGRAMAS_ESTADOS.md) — estados del sistema
- [`CLAUDE.md`](../CLAUDE.md) — convenciones de código y comandos
