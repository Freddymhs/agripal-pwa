# FASE 12C — Contenido SEO: Páginas Geográficas + Comparativa

## Contexto

Continuación de FASE_12B. Basada en la investigación SEO que identificó que el norte de Chile
es un nicho sin competencia. Ningún software agrícola tiene cobertura, contenido ni SEO
específico para Arica, Tarapacá o Antofagasta.

**Estrategia:** Páginas de destino geográficas (geo-landing) + página comparativa de fondo de
embudo para capturar intención de compra alta.

---

## Tareas

### Tarea 1 — Keywords long-tail adicionales en `page.tsx` ✅ COMPLETADA

Agregadas 8 keywords nuevas al metadata del landing principal:

- `software horticultura Chile`
- `gestión agua cultivos norte Chile`
- `app agricola offline Chile`
- `cuaderno de campo digital Chile`
- `planificación riego Azapa`
- `software pequeños agricultores Chile`
- `cultivos hortícolas norte Chile`
- `evapotranspiración cultivos Chile`

### Tarea 2 — Schema `WebApplication` + `Organization` con `areaServed` ✅ COMPLETADA

Agregado al `JSON_LD` de `page.tsx`:

- `WebApplication`: PWA metadata explícita (browserRequirements, softwareVersion)
- `Organization` con `areaServed`: Arica y Parinacota, Tarapacá, Antofagasta

### Tarea 3 — Landing page `/norte-chile` ✅ COMPLETADA

**Archivo:** `src/app/norte-chile/page.tsx`

- Hero con copy orientado a la escasez hídrica del norte de Chile
- Sección de 3 regiones (Arica, Tarapacá, Antofagasta) con cultivos y desafíos
- 6 ventajas diferenciadoras vs software genérico
- Metadata + JSON-LD con `areaServed` específico
- Keywords: "software agrícola norte de Chile", "gestión agua agrícola norte Chile", etc.

### Tarea 4 — Landing page `/arica` ✅ COMPLETADA

**Archivo:** `src/app/arica/page.tsx`

- Hero con foco en valles de Azapa y Lluta
- Tabla de 4 cultivos principales con Kc, consumo hídrico, ciclo y ROI
- 4 problemas reales del agricultor de Arica (salinidad, Kc específico, señal, escasez)
- Metadata + JSON-LD con `areaServed: Arica y Parinacota`
- Keywords: "software agrícola Arica", "gestión agua Azapa", "riego tomate Azapa", etc.

### Tarea 5 — Landing page `/tarapaca` ✅ COMPLETADA

**Archivo:** `src/app/tarapaca/page.tsx`

- Hero con foco en Camiña, Pica y Pampa del Tamarugal
- Sección de 3 zonas agrícolas con cultivos típicos
- 4 funcionalidades clave con diseño de tarjetas con icono
- Color diferenciador: azul (`#1d4e89`) para distinguir de la page de Arica (verde)
- Keywords: "software agrícola Tarapacá", "app agricultores Iquique", "gestión agua Pica", etc.

### Tarea 6 — Página de comparativa `/comparativa` ✅ COMPLETADA

**Archivo:** `src/app/comparativa/page.tsx`

- Tabla de 10 características vs AGROsmart, SpaceAG, Instacrops, AGRI.cl
- Análisis individual de cada competidor (enfoque, precio, gap)
- Sección "Lo que solo AgriPlan tiene" con 3 diferenciadores clave
- JSON-LD `WebPage` para rich results en búsquedas de comparativa
- Keywords: "comparativa software agrícola Chile", "AgriPlan vs AGROsmart", etc.

### Tarea 7 — Sitemap actualizado ✅ COMPLETADA

**Archivo:** `src/app/sitemap.ts`

Agregadas 4 URLs nuevas con prioridades:

- `/norte-chile` → priority 0.9
- `/arica` → priority 0.9
- `/tarapaca` → priority 0.8
- `/comparativa` → priority 0.8

---

## Archivos creados/modificados

| Archivo                        | Cambio                                                              |
| ------------------------------ | ------------------------------------------------------------------- |
| `src/app/page.tsx`             | +8 keywords long-tail, +WebApplication schema, +Organization schema |
| `src/app/norte-chile/page.tsx` | **NUEVO** — Landing geográfica norte Chile                          |
| `src/app/arica/page.tsx`       | **NUEVO** — Landing geográfica Arica                                |
| `src/app/tarapaca/page.tsx`    | **NUEVO** — Landing geográfica Tarapacá                             |
| `src/app/comparativa/page.tsx` | **NUEVO** — Página comparativa vs competidores                      |
| `src/app/sitemap.ts`           | +4 URLs nuevas                                                      |

---

## Impacto SEO esperado

| Página         | Keywords objetivo                                              | Competencia                 |
| -------------- | -------------------------------------------------------------- | --------------------------- |
| `/norte-chile` | "software agrícola norte de Chile"                             | Muy baja — nicho sin cubrir |
| `/arica`       | "software agrícola Arica", "riego tomate Azapa"                | Nula — nadie tiene esto     |
| `/tarapaca`    | "software agrícola Tarapacá", "gestión agua Pica"              | Nula                        |
| `/comparativa` | "AgriPlan vs AGROsmart", "comparativa software agrícola Chile" | Baja                        |

---

## Próxima fase recomendada: FASE_12D — Blog y Guías por Cultivo

La mayor oportunidad no explotada en largo plazo:

1. **Guía: "Cuánta agua necesita el tomate en Azapa"** — long-tail con intención informacional alta
2. **Guía: "Kc del pimiento en el norte de Chile"** — búsqueda técnica específica
3. **Guía: "Cómo hacer el lavado salino en Azapa"** — búsqueda de problema concreto
4. **Guía: "ROI del tomate en Arica: análisis 2026"** — intención de compra alta

Skills a usar: `/seo-content`, `/seo-programmatic`
