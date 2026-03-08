# FASE 15: Homepage SSG

**Status**: 🟡 PARCIALMENTE IMPLEMENTADO
**Prioridad**: 🟢 BAJA (las stories críticas ya están hechas)
**Dependencias**: ninguna (independiente)
**Última revisión**: 2026-03-01 (auditado)

---

## Estado Real del Código (auditado 2026-03-01)

| Story                            | Estado                                                                                        |
| -------------------------------- | --------------------------------------------------------------------------------------------- |
| Story 1: Partición server/client | ✅ Implementado — `app/page.tsx` sin `"use client"`, interactividad en `LandingAccessButton`  |
| Story 2: Datos estáticos         | ✅ Implementado — `features[]` inline en la página, sin Dexie ni React Query                  |
| Story 3: SSG configurado         | ✅ Implementado — `export const dynamic = "force-static"`, build genera HTML estático         |
| Story 4: Integración PWA         | ✅ Implementado en concepto — service worker precachea `/`, links al planner son CSR normales |
| Story 5: Test snapshot           | ❌ Pendiente — no existe ningún test del home                                                 |
| Story 5: Docs architecture.md    | ❌ Pendiente — no existe el archivo                                                           |

---

## Deuda técnica conocida

### `LandingAccessButton` se romperá en FASE_13

El componente detecta sesión activa buscando la cookie `COOKIE_KEYS.TOKEN` (JWT mock).
Después de FASE_13, la sesión estará en las cookies de Supabase (`sb-access-token`).

**Archivo**: `src/components/landing/landing-access-button.tsx`

**Cambio requerido en FASE_13**: reemplazar `hasAuthToken()` por `supabase.auth.getSession()`:

```typescript
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { ROUTES } from "@/lib/constants/routes";

export function LandingAccessButton() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session);
    });
  }, []);

  const handlePrimary = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    router.push(session ? ROUTES.HOME : ROUTES.AUTH_LOGIN);
  }, [router]);

  return (
    <div className="mt-8 flex flex-col gap-2">
      <button
        onClick={handlePrimary}
        className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-green-600 text-white font-semibold shadow-md hover:bg-green-700 transition-colors"
      >
        {authed ? "Ver planner" : "Ingresar / Registrarse"}
      </button>
      <p className="text-sm text-gray-600">
        {authed
          ? "Ya tienes sesión: te llevamos directo al planner."
          : "Si ya tienes sesión, te llevamos directo. Si no, verás el login/registro."}
      </p>
    </div>
  );
}
```

> Este cambio se ejecuta como parte de FASE_13 (Tarea 7), no como tarea de esta fase.

---

## Tareas pendientes (Story 5)

### Test mínimo del homepage

**Archivo**: `src/app/__tests__/home.test.tsx` (crear)

```typescript
import { render, screen } from "@testing-library/react";
import LandingPage from "@/app/page";

describe("LandingPage", () => {
  it("renderiza el título principal", () => {
    render(<LandingPage />);
    expect(
      screen.getByText(/Planificación agrícola offline-first/i),
    ).toBeInTheDocument();
  });

  it("renderiza las 4 features", () => {
    render(<LandingPage />);
    expect(screen.getByText("PWA offline-first")).toBeInTheDocument();
    expect(screen.getByText("Mapa PixiJS")).toBeInTheDocument();
    expect(screen.getByText("Motor hídrico y ROI")).toBeInTheDocument();
    expect(screen.getByText("Alertas inteligentes")).toBeInTheDocument();
  });
});
```

> El test no puede mockear `LandingAccessButton` directamente porque usa `supabase.auth.getSession()` post-FASE_13.
> Solución simple: mover el componente a un `Suspense` boundary y testear solo `LandingPage` con el island ausente.

### Documento de arquitectura

Crear `docs/architecture.md` con el modelo híbrido:

- `/` → SSG (Next.js build time, HTML estático)
- `/app/**` → CSR offline-first (Dexie + React Query, sin SSR)
- `proxy.ts` → edge guard (auth + billing check)
- `/auth/**` → CSR (formularios de autenticación)
- `/auth/callback` → Route Handler (solo para OAuth code exchange)

---

## Epic original (conservado para referencia)

- Servir el homepage como SSG para mejorar LCP/SEO y justificar Next; el planner sigue siendo CSR/PWA offline-first.

### Story 1: Auditoría y partición ✅

- Separar componentes server y aislar interactividad en `use client`.
- Criterio: la página no usa `use client`; no importa hooks React Query/Dexie. **CUMPLIDO**

### Story 2: Fuente de datos estática ✅

- Contenido estático en el mismo archivo de página.
- Criterio: la página se renderiza en build sin Dexie ni network. **CUMPLIDO**

### Story 3: Configurar SSG ✅

- `export const dynamic = 'force-static'`
- Criterio: `next build` genera HTML estático para `/`. **CUMPLIDO**

### Story 4: Integración con PWA ✅

- SW precachea el homepage, navegación al planner es CSR.
- Criterio: el SW sirve HTML estático offline para `/`. **CUMPLIDO EN CONCEPTO**

### Story 5: Observabilidad y DX ❌

- Test snapshot/render del home.
- Documento `docs/architecture.md`.
- Criterio: test pasando en CI; documento actualizado.
