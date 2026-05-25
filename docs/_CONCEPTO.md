# Concepto Inicial del Proyecto

> Documento de origen — no editar. Refleja la idea original con la que se generó el backlog.
> Fecha: 2026-01-28

---

# AgriPlan PWA

PWA SaaS para pequeños agricultores (1-10 ha) en zonas áridas — principalmente Arica y el norte de Chile — que necesitan datos reales antes de invertir y herramientas operativas para gestionar su producción día a día.

## Doble propósito declarado

1. **Producto real** para agricultores sin herramientas digitales accesibles, técnicos agrícolas y asesores INDAP.
2. **Portafolio técnico defendible**: arquitectura limpia, fallbacks, caching, billing real, testing E2E.

## Problema que resuelve

Los pequeños agricultores toman decisiones "a ojo": cuánta agua usar, qué plantar, cuándo cosechar, si el cultivo es rentable. La información existe (clima, precios mayoristas, coeficientes de riego, calidad de suelo) pero está dispersa en fuentes gubernamentales y documentos técnicos que ningún agricultor consulta.

AgriPlan PWA es la **herramienta operativa** que pone esos datos al servicio del agricultor en una interfaz simple, con un mapa visual de su terreno y cálculos en CLP.

## Decisión arquitectónica central

```
Componente → Hook → DAL → Supabase
```

- **Sin capa offline (Dexie/IndexedDB fue eliminado)**: todos los datos viven en Supabase. El service worker cachea solo assets UI.
- **Sin librería de fetching** (TanStack Query, SWR): `useState` + `useEffect` + `useCallback` → DAL.
- **Mutaciones centralizadas**: toda escritura a BD pasa por un wrapper único (`ejecutarMutacion`) que logea, refresca y maneja errores.
- **Wrappers obligatorios para primitivos volátiles**: `getCurrentTimestamp()`, `generateUUID()`. Prohibido `new Date().toISOString()` o `crypto.randomUUID()` inline.

## Features implementados

| Feature                      | Descripción                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------ |
| **Mapa interactivo**         | PixiJS v8 (WebGL) + hit-testing con R-tree (rbush). Terreno, zonas, plantas con grid automático. |
| **Gestión de agua**          | Consumo diario (Kc, ET0, tipo de suelo). Dashboard `/agua` + planificador 12 meses.              |
| **Alertas automáticas**      | Agua crítica (<7 días), replante pendiente, lavado salino (30 días), riesgo encharcamiento.      |
| **Economía ROI**             | ROI por cultivo, inversión, ingresos proyectados 4 años en CLP.                                  |
| **Economía avanzada**        | Costo/kg, break-even, margen de contribución, tiempo de recuperación.                            |
| **Comparador de escenarios** | `/escenarios`: hasta 3 cultivos lado a lado con métricas completas.                              |
| **Riesgo de plagas**         | Evaluación por temperatura + etapa de crecimiento. Niveles bajo/medio/alto/crítico.              |
| **Análisis de suelo**        | pH, CE, boro, materia orgánica. Score de calidad cultivo-terreno.                                |
| **Catálogo de cultivos**     | 25+ cultivos calibrados para Arica, Kc por etapa, personalizable por proyecto.                   |
| **Multi-estanques**          | Múltiples fuentes de agua con capacidad, calidad, costo/m³.                                      |
| **Cosechas**                 | Registro de fechas y rendimientos.                                                               |
| **Insumos**                  | Log de fertilizantes/plaguicidas por proyecto.                                                   |
| **Reportes PDF**             | Exportación de todos los datos.                                                                  |
| **Guía de usuario**          | Onboarding paso a paso (10 pasos).                                                               |
| **Billing**                  | Trial 6 meses → 9.990 CLP/mes vía MercadoPago.                                                   |
| **Auth**                     | Supabase Auth (email/password) con cookies httpOnly.                                             |

## Stack técnico

| Capa      | Tecnología                                                       |
| --------- | ---------------------------------------------------------------- |
| Framework | Next.js 16 + App Router + TypeScript                             |
| UI        | TailwindCSS 4                                                    |
| Mapa      | PixiJS v8 (WebGL) + rbush (R-tree para hit-testing)              |
| State     | React hooks puros (sin librerías de fetching)                    |
| BD        | Supabase (PostgreSQL + Auth)                                     |
| PWA       | `@ducanh2912/next-pwa` (service worker para assets UI, NO datos) |
| Billing   | MercadoPago                                                      |
| PDF       | jsPDF                                                            |
| Tests     | Vitest + Playwright (E2E, 33 specs en `docs/tests/e2e/specs/`)   |
| Deploy    | Vercel                                                           |

## Modelo de datos central

```
Usuario (Supabase Auth)
  ├── Suscripción (1:1) → Plan
  │     └── Pago (1:N)
  └── Proyecto (1:N)
        └── Terreno (1:N)
              ├── Zona (1:N) → Planta (1:N)
              │     └── tipo: cultivo | bodega | casa | camino | decoracion | estanque
              │           └── EstanqueConfig (si tipo=estanque)
              ├── EntradaAgua (1:N) → estanque_id
              ├── Suelo (análisis)
              ├── CalidadAgua (análisis)
              └── CatalogoCultivo (1:N por proyecto)
```

## Decisiones de diseño

- **Datos globales (seed) vs per-proyecto**: tablas `*_base` son globales. Al crear un proyecto, triggers copian datos a tablas per-proyecto.
- **Puente entre IDs**: las tablas per-proyecto tienen UUID propio + campo TEXT que preserva el ID global original (`cultivo_base_id`). Para joins con tablas globales (precios, variedades, mercado) → usar el campo TEXT puente, **nunca** el UUID.
- **Componentes máx 1000 líneas**. Si supera → subcomponentes o hooks.
- **Navegación primaria**: solo acciones de uso diario. Todo lo demás en menú secundario.
- **Inmutabilidad por defecto**: nunca `let`. Estado derivado sobre estado duplicado.

## Restricciones y no-objetivos

- **No es app móvil nativa** — es PWA. Funciona en Chrome/Safari del celular sin app store.
- **No tiene capa offline real** — requiere conexión para leer/escribir. El service worker solo cachea assets UI.
- **No reemplaza al API** (`agriplan-api-nestjs`): la API alimenta los datos de mercado/clima en Supabase; la PWA solo los lee.
- **No es marketplace** — no conecta agricultores con compradores. Solo herramienta interna.

## Usuarios objetivo

- **Agricultores activos (1–10 ha)** en zonas áridas, especialmente Arica/Tarapacá
- **Técnicos agrícolas y asesores INDAP** que necesitan datos para asesorar clientes
- **Personas evaluando inversión agrícola** antes de comprar terreno (caso piloto: usuario del proyecto)

## Modelo de negocio

- Trial 6 meses → 9.990 CLP/mes vía MercadoPago
- Posicionamiento: **simplicidad como ventaja competitiva** vs Granular/Climate FieldView (complejas y costosas)
- Target B2B futuro: convenios INDAP (~100.000 productores en Chile)

## Posicionamiento en el ecosistema AgriPlan

```
┌────────────────────────────────────────────────────────┐
│  AgriPlan API (NestJS)                                 │
│  Cron → ODEPA/Open-Meteo/INIA → Supabase               │
└─────────────────┬──────────────────────────────────────┘
                  │ escribe Supabase
                  ▼
┌────────────────────────┐    ┌────────────────────────┐
│  AgriPlan PWA          │    │  Portal Agrícola       │
│  (este proyecto)       │    │  (vitrina pública)     │
│  Operativo agricultor  │    │  Lee API REST          │
│  Lee Supabase          │    │                        │
└────────────────────────┘    └────────────────────────┘
```

## Terreno piloto de referencia

- **Coordenadas:** `-18.3651, -70.0429`
- **Ubicación:** Pampa elevada sobre el Valle de Azapa, Arica
- **Elevación:** ~1086m | Zona: meseta desértica (NO valle aluvial, NO costa)
- **Tmax verano:** ~26°C | **Tmin invierno:** ~10°C | **Lluvia:** ~23 mm/año
- **ET0 anual:** 4.2 mm/día

Los cálculos y datos de referencia están calibrados para este punto específico (ET0, Kc, suelo).
