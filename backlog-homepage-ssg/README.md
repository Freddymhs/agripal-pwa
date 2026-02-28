# Backlog: Homepage SSG

## Epic

- Servir el homepage como SSG para mejorar LCP/SEO y justificar Next; el planner sigue siendo CSR/PWA offline-first.

## Story 1: Auditoría y partición

- Ubicar el homepage (`app/page.tsx` o similar) y mapear secciones que dependan de estado cliente/Dexie.
- Separar en componentes server (`/components/marketing/*`) y aislar interactividad en `ClientBoundary`/componentes `use client`.
- Criterio: el archivo de página deja de usar `use client`; no importa hooks React Query/Dexie.

## Story 2: Fuente de datos estática

- Definir contenido estático (textos, métricas, FAQ, screenshots, features) y moverlo a `src/content/home.ts` o JSON.
- Si se usa fetch externo, envolver con `fetch(..., { cache: 'force-cache' })` y fallback a contenido embebido.
- Criterio: la página se renderiza en build sin Dexie ni network en runtime.

## Story 3: Configurar SSG en la ruta

- Marcar la página como estática: `export const dynamic = 'force-static'` (o `revalidate = 3600` si quieres ISR).
- Usar `generateMetadata` para SEO (title/description/open graph).
- Verificar que no se usan `headers()`/`cookies()` ni patrones que la hagan dinámica.
- Criterio: `next build` genera HTML estático para `/`; `curl http://localhost:3000` muestra el contenido renderizado sin JS.

## Story 4: Integración con PWA

- Asegurar que manifest y service worker siguen precacheando el homepage.
- Revisar que la navegación del home al planner sigue siendo CSR (links normales).
- Criterio: el SW sirve el HTML estático offline para `/` y no se rompe el flujo offline-first del planner.

## Story 5: Observabilidad y DX

- Añadir prueba mínima de snapshot/render del home (p.ej. Vitest + Testing Library) para validar el HTML estático.
- Documentar en `docs/architecture.md` (o README) el modelo híbrido: “home SSG, planner CSR”.
- Criterio: test del home pasando en CI; documento actualizado con decisiones.

## Opcional: ISR

- Si necesitas refresco sin rebuild completo: `export const revalidate = 3600;` y usar fuente de datos con TTL.
- Asegura no introducir dependencias de runtime server en el resto de la app.
