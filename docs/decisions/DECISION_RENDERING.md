# Arquitectura de Rendering — Hoja de Ruta

**Última revisión**: 2026-03-01
**Tipo**: Documento de decisiones técnicas (no es una FASE ejecutable)

---

## Estado Actual (pre-FASE_12)

La app usa un modelo híbrido: SSG para el landing, CSR para toda la aplicación.

```
/                   → SSG (force-static) — HTML estático en build
/auth/**            → CSR ("use client") — formularios sin datos de servidor
/app/**             → CSR ("use client") — offline-first con IndexedDB
/agua, /clima...    → CSR ("use client") — offline-first con IndexedDB
/auth/callback      → Route Handler (server) — solo para OAuth code exchange
proxy.ts            → Edge guard — auth + billing check (getSession, offline-safe)
```

**Por qué CSR para la app:** IndexedDB es el almacén primario. El rendering en servidor no tiene acceso a IndexedDB del browser. Offline-first requiere que toda la lógica de datos viva en el cliente.

---

## Evolución post-Supabase (FASE_12+)

Con Supabase como backend, algunas rutas pueden mejorar su estrategia de rendering. **El criterio de decisión es uno solo:**

> ¿El contenido de esta ruta necesita estar fresco en cada carga, o puede cargarse desde IndexedDB local?

### Regla general

| Caso                                                  | Estrategia                                 |
| ----------------------------------------------------- | ------------------------------------------ |
| Datos que el usuario edita (terrenos, zonas, plantas) | **CSR** — offline-first, IndexedDB primero |
| Resúmenes calculados que no cambian frecuentemente    | **ISR** — servidor calcula, cachea N horas |
| Datos críticos o tiempo-real                          | **SSR** — servidor siempre, sin caché      |
| Contenido de marketing o estático                     | **SSG** — build time, CDN                  |

---

## Mapa de Rutas con Estrategia

### `/` — Landing

**Estrategia actual y futura**: SSG (`force-static`)
**Razón**: Marketing puro. Ningún dato dinámico. Excelente SEO y LCP.
**Cambio requerido**: Ninguno. Estable para siempre.

---

### `/auth/login`, `/auth/registro`

**Estrategia actual y futura**: CSR (`"use client"`)
**Razón**: Solo formularios. Sin datos del servidor. Podrían ser SSG pero CSR es igualmente válido.
**Cambio requerido**: Ninguno.

---

### `/auth/callback`

**Estrategia actual y futura**: Route Handler (server)
**Razón**: Intercambia el OAuth code por sesión. Requiere servidor. Sin renders.
**Cambio requerido**: Ninguno.

---

### `/app` (terrenos y proyectos), `/agua`, `/clima`, `/suelo`, `/catalogo`

**Estrategia actual**: CSR (`"use client"`)
**Estrategia futura (post-FASE_12)**: **Sigue CSR** — IndexedDB primero, Supabase como sync background

**Razón**: Estas son las rutas de trabajo del agricultor. Deben funcionar offline. El usuario puede estar en el campo sin señal y necesita poder crear zonas, registrar agua, etc. Supabase es solo el destino de sync, no la fuente de lectura.

**Patrón recomendado** (cuando Supabase esté activo):

```typescript
// Patrón: IndexedDB como fuente primaria, Supabase como sync opcional
const { data } = useQuery({
  queryKey: QUERY_KEYS.ZONAS(terrenoId),
  queryFn: () => zonasDAL.getByTerreno(terrenoId), // Lee IndexedDB local
  // Supabase se sincroniza en background via useSync() — no bloquea la UI
});
```

**Cambio requerido**: Ninguno en rendering. El sync background (SupabaseAdapter) se activa en FASE_12.

---

### `/alertas`

**Estrategia actual**: CSR (`"use client"`)
**Estrategia futura (post-FASE_12)**: Candidata a **SSR** (`force-dynamic`)

**Razón**: Las alertas críticas (agua, plagas, replantas) deben estar siempre frescas. Si el usuario abre `/alertas` desde un segundo dispositivo, quiere ver el estado real, no el local del otro dispositivo.

**Implementación futura**:

```typescript
// src/app/alertas/page.tsx
export const dynamic = "force-dynamic"; // SSR en cada request

export default async function AlertasPage() {
  // Servidor consulta Supabase — siempre fresco
  const alertas = await alertasDAL.getActivas(terrenoId);
  return <AlertasClient initialAlertas={alertas} />;
}

// AlertasClient sigue siendo "use client" para interactividad
// y como fallback offline con IndexedDB
```

**Cuándo hacer este cambio**: FASE después de FASE_12 cuando el usuario tenga multi-dispositivo real.

---

### `/economia`, `/economia/avanzado`, `/escenarios`

**Estrategia actual**: CSR (`"use client"`)
**Estrategia futura (post-FASE_12)**: Candidata a **ISR** (revalidate: 3600)

**Razón**: Los cálculos de ROI y economía son intensivos pero no cambian cada minuto. El servidor puede calcularlos una vez por hora y servirlos precacheados. Si el usuario está offline, cae al IndexedDB local.

**Implementación futura**:

```typescript
// src/app/economia/page.tsx
export const revalidate = 3600; // ISR: regenerar cada 1 hora

export default async function EconomiaPage() {
  // Servidor calcula métricas desde Supabase, cachea 1h
  const metricas = await calcularMetricasEconomicas(proyectoId);
  return <EconomiaClient initialMetricas={metricas} />;
}
```

**Cuándo hacer este cambio**: Solo si los cálculos de servidor demuestran ser más rápidos que el cliente. No urgente.

---

### `/reportes`

**Estrategia actual**: CSR (no existe aún, FASE_17)
**Estrategia futura (post-FASE_17)**: **SSR** (`force-dynamic`)

**Razón**: Los PDFs se generan client-side con `@react-pdf/renderer` (decisión en FASE_17). Sin embargo, los datos que alimentan el reporte (ROI, cosechas, zonas) deben estar actualizados. SSR garantiza que el servidor entregue datos frescos de Supabase al componente antes de renderizar.

**Implementación futura**:

```typescript
// src/app/reportes/page.tsx
export const dynamic = "force-dynamic";

export default async function ReportesPage() {
  // Servidor trae datos frescos de Supabase
  const [roi, agua, cosechas] = await Promise.all([
    calcularROIServer(proyectoId),
    getProyeccionAguaServer(terrenoId),
    cosechasDAL.getByProyecto(proyectoId),
  ]);
  // PDF se genera en el cliente con estos datos iniciales
  return <ReportesClient initialData={{ roi, agua, cosechas }} />;
}
```

**Cuándo hacer este cambio**: Al implementar FASE_17, evaluar si SSR + datos frescos mejora la UX del reporte.

---

### `/calendario` (FASE_18)

**Estrategia**: CSR (`"use client"`)
**Razón**: El calendario consolida alertas, proyección de agua y cosechas — todo está en IndexedDB. No hay ventaja de SSR aquí. Funciona perfectamente offline.
**Cambio requerido**: Ninguno.

---

### `/historial` (FASE_FINAL)

**Estrategia**: CSR (`"use client"`)
**Razón**: El historial es read-only desde `db.historial` (IndexedDB). Funciona offline.
**Cambio requerido**: Ninguno.

---

## Gotchas críticos de esta arquitectura

### 1. Providers solo en rutas CSR

`ProjectProvider`, `AuthProvider`, `QueryProvider` son `"use client"`. Si se aplican en `app/layout.tsx` (que es SSG), el build falla o se serializa mal.

**Solución actual correcta**:

```
app/layout.tsx          → sin providers (SSG-safe)
app/app/layout.tsx      → con providers (CSR)
```

Verificar que este patrón se mantiene al agregar nuevas rutas.

---

### 2. `LandingAccessButton` importa Supabase client

El `"use client"` island en la landing importa `supabase` de `@/lib/supabase/client`. Esto es correcto — el island se hidrata en el browser, no en build time. El HTML estático se genera sin ejecutar este código.

**Riesgo**: Si se importa algo de Supabase en el componente servidor de la landing (fuera del island), el build fallará. Nunca importar hooks ni Supabase client en el server component de la landing.

---

### 3. Service Worker y rutas SSR

Si se migra `/alertas` a SSR, el service worker NO debe cachear esa ruta. Las rutas SSR deben siempre ir a la red.

**Configuración en `next.config.ts`** (cuando aplique):

```typescript
// Excluir rutas SSR del precache del SW
runtimeCaching: [
  {
    urlPattern: /^\/alertas/,
    handler: "NetworkOnly", // nunca caché offline
  },
  {
    urlPattern: /^\/app\//,
    handler: "CacheFirst", // offline-first para app routes
  },
];
```

---

### 4. `getSession()` vs `getUser()` en proxy.ts

Esta decisión está fija: siempre `getSession()` en `proxy.ts`. Ver FASE_13 para la explicación completa.

Nunca cambiar a `getUser()` — rompe el funcionamiento offline.

---

## Resumen ejecutivo

```
AHORA (pre-FASE_12)
├── /                    SSG        ✅ implementado
├── /auth/**             CSR        ✅ implementado
├── /app/** y demás      CSR        ✅ implementado
└── /auth/callback       Route Handler ✅ implementado

POST-FASE_12 (con Supabase)
├── /                    SSG        sin cambio
├── /auth/**             CSR        sin cambio
├── /app/**, /agua...    CSR        sin cambio — IndexedDB primero
├── /alertas             SSR        migrar cuando haya multi-dispositivo
├── /economia            ISR 1h     migrar si el cálculo server es beneficioso
├── /reportes            SSR        evaluar al implementar FASE_17
├── /calendario          CSR        sin cambio
└── /historial           CSR        sin cambio
```

**Principio rector**: No migrar a SSR/ISR por moda. Solo cuando el contenido fresco del servidor aporte valor real al usuario que CSR + sync no puede dar.
