# FASE 11D: Mejoras y Features No Registradas

**Status**: ✅ COMPLETADA
**Prioridad**: 🔴 Alta
**Dependencias**: FASE_11C, FASE_10C
**Fecha completada**: 2026-02-08
**Nota**: Este documento registra retroactivamente todo el trabajo implementado entre FASE_11 y el feedback de usuario real que no fue documentado en el backlog.

---

## Contexto

Tras completar FASE_11C (Dashboard + Planificador), se realizaron múltiples mejoras, features nuevos y correcciones de bugs que nunca se registraron en el backlog. Este documento sincroniza el backlog con el estado real del código.

**Commits involucrados**: 15 commits post-FASE_11 (`3dbb975..cbb7030`)
**Impacto**: 251 archivos, +63,941 líneas, -3,743 líneas

---

## 1. Módulo Economía Completo

### 1A. Página Principal (`/economia`)
**Archivos**: `src/app/economia/page.tsx`

**Funcionalidad**:
- Dashboard ROI por cultivo/zona
- Resumen de inversión, costos agua anuales, ingresos proyectados (año 2-4)
- ROI acumulado a 4 años con indicador de viabilidad
- Cálculo automático desde datos reales (plantas plantadas, catálogo, zona)
- Formato CLP (pesos chilenos)

**Dependencias**: `calcularROI()` de `roi.ts`, `calcularConsumoZona()` de `agua.ts`

### 1B. Economía Avanzada (`/economia/avanzado`)
**Archivos**: `src/app/economia/avanzado/page.tsx`, `src/lib/utils/economia-avanzada.ts`

**Funcionalidad**:
- Costo de producción por kg
- Punto de equilibrio en kg (break-even)
- Margen de contribución (%)
- Tiempo de recuperación de inversión (meses)
- Métricas globales agregadas de todos los cultivos

**Tipo exportado**: `MetricasEconomicas`
**Función**: `calcularMetricasEconomicas(roi, cultivo, kgProducidosAño)`

### 1C. Integración Suelo → ROI
**Archivos**: `src/lib/utils/roi.ts`, `src/lib/utils/calidad.ts`

**Cambio**: `calcularROI()` ahora acepta parámetro opcional `suelo?: SueloTerreno`
- Si hay suelo, aplica `calcularFactorSuelo()` sobre la producción en kg
- Factor suelo penaliza por: pH extremo, salinidad alta, boro excesivo, baja materia orgánica
- Si no hay suelo, factor = 1.0 (sin penalización)

---

## 2. Comparador de Escenarios (`/escenarios`)

**Archivos**: `src/app/escenarios/page.tsx`, `src/lib/utils/comparador-cultivos.ts`

**Funcionalidad**:
- Comparar hasta 3 cultivos lado a lado en una misma zona
- Métricas comparadas: ROI 4 años, inversión total, ingresos, costo/kg, margen, consumo agua, factor suelo, break-even
- Selector de zona y cultivos del catálogo
- Colores diferenciados (azul, verde, púrpura)

**Tipo exportado**: `EscenarioCultivo`
**Función**: `compararCultivos(cultivos, zona, suelo, costoAguaM3)`

---

## 3. Predicción de Riesgo de Plagas (`/plagas`)

**Archivos**: `src/app/plagas/page.tsx`, `src/lib/utils/riesgo-plagas.ts`

**Funcionalidad**:
- Evaluación de riesgo por plaga basada en:
  - Temperatura actual del mes (calculada desde `CLIMA_ARICA`)
  - Etapa de crecimiento actual (vulnerabilidad variable)
  - Severidad de la plaga
- Niveles de alerta: bajo, medio, alto, crítico
- Score numérico de riesgo (0-100)
- Datos de plagas vienen del catálogo (`cultivo.plagas[]`)
- Colores diferenciados por nivel de alerta

**Tipo exportado**: `RiesgoPlaga`
**Función**: `evaluarRiesgoPlagas(cultivo, etapaActual)`

---

## 4. Score de Calidad Integrado

**Archivo**: `src/lib/utils/calidad.ts`

**Funcionalidad**:
- Evaluación ponderada de compatibilidad cultivo-terreno
- Sub-scores: agua (boro, salinidad, pH), suelo (pH, materia orgánica, drenaje), clima (temp), riego
- Categorías: excelente, buena, aceptable, riesgosa, no_viable
- Factores limitantes y mejoras sugeridas auto-generadas
- `calcularFactorSuelo()`: factor multiplicador (0.0-1.0) para ajustar producción en ROI

**Tipos exportados**: `ScoreCalidad`, `CategoriaCalidad`

---

## 5. Guía de Usuario (`/guia`)

**Archivo**: `src/app/guia/page.tsx` (~600 líneas)

**Funcionalidad**:
- Onboarding paso a paso (10 pasos)
- Cada paso con resumen y botón directo a la pantalla correspondiente
- Cubre: crear proyecto/terreno, catálogo, agua, suelo, clima, mapa, planificador, economía, alertas, offline

---

## 6. Datos Estáticos Extendidos

Archivos JSON en `data/static/` con loaders TypeScript en `src/lib/data/`:

| Dato | JSON | Loader TS | Contenido |
|------|------|-----------|-----------|
| Precios mercado | `mercado/precios-arica.json` | `mercado.ts` | Precios min/max CLP/kg por cultivo, indicadores demanda |
| Variedades cultivos | `variedades/arica.json` | `variedades.ts` | Variedades por cultivo, días cosecha, rendimientos |
| Técnicas mejora | `tecnicas/mejora-crecimiento.json` | `tecnicas-mejora.ts` | Técnicas, costo, mejora rendimiento esperada |
| Enmiendas suelo | `suelo/enmiendas.json` | `enmiendas-suelo.ts` | NPK, orgánicos, correctores pH, dosis, costos |
| Fuentes agua | `fuentes-agua/arica.json` | `fuentes-agua.ts` | Pozos, ríos, canales, costo/m3, calidad |
| Evapotranspiración | `clima/evapotranspiracion-arica.json` | (usado en cálculos) | ET₀ mensual para Arica |

---

## 7. Context Providers

**Archivos**: `src/contexts/map-context.tsx`, `src/contexts/project-context.tsx`

**Propósito**:
- `MapContext` (~362 líneas): Estado centralizado del mapa PixiJS (zoom, pan, selección, modo edición)
- `ProjectContext` (~372 líneas): Datos del proyecto activo (terreno, zonas, plantas, catálogo)

---

## 8. Simplificaciones y Removals

### ConfigurarGoteros eliminado
- Componente `ConfigurarGoteros` eliminado - mostraba goteros por planta que NO afectaban cálculos reales de agua
- Consumo de agua ahora se calcula SOLO vía: catálogo (agua_m3_ha_año, Kc, espaciado) × cantidad plantas
- Campo `Planta.goteros` existe en schema DB pero no se usa (reservado para futuro)

### Configuración riego a nivel zona se mantiene
- `configuracion_riego` en Zona SÍ se usa para planificación/dimensionamiento del sistema

---

## 9. Suelo Default Azapa

**Archivo**: `src/hooks/use-terrenos.ts`, `src/lib/data/suelo-arica.ts`

**Cambio**: Al crear un terreno nuevo, se aplica `SUELO_DEFAULT_AZAPA` automáticamente con valores típicos del Valle de Azapa (pH, CE, materia orgánica, etc.)

---

## 10. Bug Fixes y Mejoras UI

Commits: `fabd71d`, `8224fc9`, `9b7be51`, `360dc82`, `d2b5a91`, `8178193`, `7e388a1`

**Fixes aplicados**:
- Fix agua: correcciones en cálculos de consumo
- Fix navbar: ajustes de navegación
- Fix UI: múltiples correcciones de interfaz
- Fix formulario suelo: 11 inputs corregidos (problema con `parseFloat || undefined` que descartaba 0)
- Mejoras ROI: recálculos y ajustes de proyección

---

## Inventario de Archivos

### Páginas nuevas (4)
- `src/app/economia/page.tsx`
- `src/app/economia/avanzado/page.tsx`
- `src/app/escenarios/page.tsx`
- `src/app/plagas/page.tsx`
- `src/app/guia/page.tsx`

### Utilidades nuevas (3)
- `src/lib/utils/economia-avanzada.ts`
- `src/lib/utils/comparador-cultivos.ts`
- `src/lib/utils/riesgo-plagas.ts`

### Utilidades extendidas (2)
- `src/lib/utils/roi.ts` (suelo param)
- `src/lib/utils/calidad.ts` (calcularFactorSuelo + ScoreCalidad)

### Datos nuevos (6 JSON + 6 TS loaders)
- `data/static/mercado/precios-arica.json` + `src/lib/data/mercado.ts`
- `data/static/variedades/arica.json` + `src/lib/data/variedades.ts`
- `data/static/tecnicas/mejora-crecimiento.json` + `src/lib/data/tecnicas-mejora.ts`
- `data/static/suelo/enmiendas.json` + `src/lib/data/enmiendas-suelo.ts`
- `data/static/fuentes-agua/arica.json` + `src/lib/data/fuentes-agua.ts`
- `data/static/clima/evapotranspiracion-arica.json`

### Contexts nuevos (2)
- `src/contexts/map-context.tsx`
- `src/contexts/project-context.tsx`

---

## Navegación Actual Completa

```
/ (Mapa principal)
├── /terrenos         → Gestión proyectos/terrenos
├── /catalogo         → Catálogo de cultivos
├── /agua             → Dashboard agua día a día (cyan)
│   ├── /agua/planificador    → Planificador 12 meses (blue)
│   └── /agua/configuracion   → Configuración agua
├── /economia         → ROI y economía por cultivo
│   └── /economia/avanzado    → Métricas avanzadas
├── /escenarios       → Comparador multi-cultivo
├── /plagas           → Predicción riesgo plagas
├── /suelo            → Análisis y gestión suelo
├── /clima            → Datos climáticos
├── /alertas          → Sistema de alertas
├── /guia             → Guía de usuario
└── /auth/login       → Login (mock)
```
