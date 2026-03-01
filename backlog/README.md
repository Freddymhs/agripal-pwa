# Backlog - AgriPlan PWA

## Proyecto

Sistema de planificación agrícola offline-first para pequeños agricultores de Arica, Chile.

## Stack

- Next.js 16 + App Router + TypeScript
- TailwindCSS 4
- **Supabase** (PostgreSQL + Auth + Realtime)
- IndexedDB con Dexie (offline-first)
- PWA con @ducanh2912/next-pwa
- SWR para estado
- PixiJS v8 (WebGL) para mapa interactivo (migrado desde SVG en FASE_10B)
- **MercadoPago** para billing y suscripciones

## Arquitectura de Datos

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

## Decisiones Técnicas Clave

- **Mapa**: PixiJS v8 WebGL con ParticleContainer (migrado desde SVG en FASE_10B)
- **Zonas**: Siempre rectángulos, exclusivas (no se superponen)
- **Plantas**: Colocación individual o grilla con preview
- **Espaciado**: Definido por cultivo (ej: zanahoria 0.05m, tomate 0.4m)
- **Agua**: Por terreno, factores temporada (verano=1.4, invierno=0.6)
- **Sync**: Offline-first con SupabaseAdapter, usuario resuelve conflictos manualmente
- **Auth**: Supabase Auth con sesiones seguras (cookies httpOnly)
- **Billing**: MercadoPago, suscripción mensual 9,990 CLP
- **Datos estáticos**: `data/static/` (JSON) + `src/lib/data/` (loaders TS)
- **Datos dinámicos**: PostgreSQL (Supabase) + IndexedDB (offline)

## ✨ Features UX Implementadas

- **Snap automático**: Al crear zonas, snap a bordes de terreno y zonas existentes (< 0.5m)
- **Zoom centrado**: Con zona seleccionada, zoom +/- se centra en ella
- **Panel terreno**: Muestra dimensiones totales, área usada y disponible
- **Etiquetas zonas**: Muestran ancho×alto en vez de solo área
- **Plantas proporcionales**: Tamaño visual refleja espaciado del cultivo
- **Selección múltiple de plantas**: Shift+arrastrar dibuja rectángulo de selección
- **Movimiento de plantas en grupo**: Selecciona plantas, arrastra cualquiera para mover todas (preview en amarillo)
- **Snap-to-grid**: Al plantar individual, snap a la posición de grilla vacía más cercana
- **Score calidad**: Evaluación ponderada agua/suelo/clima/riego por cultivo
- **Comparador ROI**: Comparar rentabilidad de cultivos lado a lado
- **Compatibilidad agua/suelo**: Alertas automáticas por boro, salinidad, pH
- **Economía avanzada**: Costo/kg, punto equilibrio, margen contribución, payback
- **Escenarios multi-cultivo**: Comparar hasta 3 cultivos lado a lado con métricas completas
- **Predicción plagas**: Riesgo basado en temperatura y etapa de crecimiento
- **Guía paso a paso**: Onboarding completo de 10 pasos con links directos
- **Suelo → ROI**: Factor suelo penaliza producción según calidad real del terreno
- **Suelo default Azapa**: Valores típicos del valle aplicados automáticamente

---

## ⚠️ REGLA CRÍTICA PARA CADA FASE

> **Toda fase DEBE terminar con una "Tarea de Integración" que:**
>
> 1. Actualiza la página principal o crea nueva página
> 2. Agrega controles en la UI (botones, modos, estados)
> 3. Conecta los hooks con la interfaz
> 4. Usa datos reales de IndexedDB (NO datos demo)
> 5. Permite al usuario USAR la funcionalidad

Cada archivo FASE_X.md incluye esta tarea de integración al final.

---

## 📋 Fases de Desarrollo

### Completadas ✅

| Fase    | Status | Progreso | Nombre                                                              | Prioridad  |
| ------- | ------ | -------- | ------------------------------------------------------------------- | ---------- |
| 0       | ✅     | 100%     | Estructura Base                                                     | 🔴 Alta    |
| 1       | ✅     | 100%     | Modelo de Datos (Tipos + Dexie)                                     | 🔴 Alta    |
| 2       | ✅     | 100%     | Mapa SVG Interactivo                                                | 🔴 Alta    |
| 3       | ✅     | 100%     | CRUD Zonas + Integración                                            | 🔴 Alta    |
| 4       | ✅     | 100%     | Sistema de Plantas + Integración                                    | 🔴 Alta    |
| 4B      | ✅     | 100%     | Selección Múltiple + Mover Plantas                                  | 🟡 Media   |
| 4C      | ✅     | 100%     | Gestión Proyectos/Terrenos                                          | 🔴 Alta    |
| 5       | ✅     | 100%     | Configuración Terreno Avanzada (legal, ubicación)                   | 🟡 Media   |
| 5B      | ✅     | 100%     | Panel Clima (datos estáticos)                                       | 🟢 Baja    |
| 5C      | ✅     | 100%     | Panel Suelo (análisis, umbrales)                                    | 🟡 Media   |
| 5D      | ✅     | 100%     | Agua Avanzada (calidad, proveedores)                                | 🟡 Media   |
| 6       | ✅     | 100%     | Motor Recomendación Inteligente                                     | 🔴 Alta    |
| 7       | ✅     | 100%     | Catálogo de Cultivos (CRUD editable)                                | 🟡 Media   |
| 8A      | ✅     | 100%     | Estanques de Agua (zona física)                                     | 🔴 Alta    |
| 8       | ✅     | 100%     | Control de Agua (entradas, consumo)                                 | 🟡 Media   |
| 9       | ✅     | 100%     | Alertas y Dashboard                                                 | 🟡 Media   |
| 10      | ✅     | 100%     | PWA y Sync Offline                                                  | 🔴 Alta    |
| **10B** | ✅     | 100%     | Fix Performance: SVG → PixiJS v8 WebGL                              | 🔴 Alta    |
| **10C** | ✅     | 100%     | Mejoras UX + Agua Funcional + Datos Agrícolas                       | 🔴 Alta    |
| 11      | ✅     | 100%     | Autenticación JWT Mock                                              | 🟢 Baja    |
| **11B** | ✅     | 100%     | Segmentación UX Agua (Experimentación vs Gestión)                   | 🔴 Alta    |
| **11C** | ✅     | 100%     | Dashboard Mejorado + Planificador Económico                         | 🔴 CRÍTICA |
| **11D** | ✅     | 100%     | Mejoras No Registradas (Economía, Escenarios, Plagas, Datos, Fixes) | 🔴 Alta    |

### Pendientes ⏳

| Fase      | Status | Progreso | Nombre                                       | Prioridad     |
| --------- | ------ | -------- | -------------------------------------------- | ------------- |
| **15B**   | ⏳     | 0%       | Bugs Críticos de UX (pre-Supabase)           | 🔴 ALTA       |
| 12        | ⏳     | 0%       | Migración a Supabase (Backend Real)          | 🔴 CRÍTICA    |
| 13        | ⏳     | 0%       | Autenticación Real con Supabase Auth         | 🔴 CRÍTICA    |
| 14        | ⏳     | 0%       | Sistema de Billing con MercadoPago           | 🔴 ALTA       |
| 16        | ⏳     | 0%       | Registro de Cosechas (UI)                    | 🟡 MEDIA      |
| 17        | ⏳     | 0%       | Reportes y Exportación PDF                   | 🟡 MEDIA      |
| 18        | ⏳     | 0%       | Calendario de Eventos (Vista Mensual)        | 🟢 BAJA-MEDIA |
| 19        | ⏳     | 0%       | Integraciones API Externas (Clima + Precios) | 🟢 BAJA       |
| **FINAL** | ⏳     | 0%       | Historial de Cambios (UI)                    | 🟢 BAJA       |

**Total fases**: 32 (23 completadas, 9 pendientes)

---

## 📍 Actual

**Fase actual:** FASE_12 - Migración a Supabase (Backend Real)

**Completadas (23)**: Estructura, Tipos, Mapa, Zonas, Plantas, Selección Múltiple, Gestión Proyectos/Terrenos, Terreno Avanzado, Panel Clima, Panel Suelo, Agua Avanzada, Motor Recomendación, Catálogo Cultivos, Estanques, Control Agua, Alertas y Dashboard, PWA y Sync Offline, **Performance PixiJS**, **Mejoras UX/Agua/Datos**, **Autenticación JWT Mock**, **Segmentación UX Agua**, **Dashboard + Planificador**, **Economía/Escenarios/Plagas/Datos/Fixes**

**En progreso (1)**: FASE_15 — Landing Page SSG (75% — Story 5 pendiente)

**Pendientes (9)**: Bugs UX → Supabase → Auth Real → Billing → Cosechas → PDF → Calendario → APIs → Historial

**Objetivo:** Transformar AgriPlan en un SaaS con backend real y sistema de suscripciones.

---

## Archivos de Especificación

### Completadas (0-7) ✅

- `FASE_0_ESTRUCTURA.md` - Carpetas, layout, navegación
- `FASE_1_TIPOS.md` - TypeScript + Dexie
- `FASE_2_MAPA_SVG.md` - Componente mapa interactivo
- `FASE_3_ZONAS.md` - CRUD zonas con validaciones
- `FASE_4_PLANTAS.md` - Colocación individual y grilla
- `FASE_4B_SELECCION_MULTIPLE.md` - Selección múltiple + mover plantas
- `FASE_4C_GESTION_TERRENOS.md` - Múltiples proyectos/terrenos + cascade delete
- `FASE_5_TERRENO_AVANZADO.md` - Legal, ubicación, distancias, conectividad
- `FASE_5B_CLIMA.md` - Datos climáticos estáticos por zona
- `FASE_5C_SUELO.md` - Análisis de suelo, umbrales, checklist, Plan B
- `FASE_5D_AGUA_AVANZADA.md` - Calidad agua, proveedores, contingencias
- `FASE_6_RECOMENDACION.md` - Motor de recomendación inteligente
- `FASE_7_CATALOGO.md` - Catálogo de cultivos (CRUD editable)

### Completada (8A) ✅

- `FASE_8A_ESTANQUES.md` - Estanques como zona física ✅

### Completada (8) ✅

- `FASE_8_AGUA.md` - Control de agua (entradas, consumo) ✅

### Completada (9) ✅

- `FASE_9_ALERTAS.md` - Alertas y dashboard ✅

### Completada (10) ✅

- `FASE_10_PWA.md` - PWA y sync offline ✅

### Completada (10B) ✅

- `FASE_10B_fix-bad-performance/` - Migración SVG → PixiJS v8 WebGL ✅
  - `FASE_1_FUNDACION.md` - Canvas WebGL + pan/zoom
  - `FASE_2_GRID_ZONAS.md` - Grid visual + zonas interactivas
  - `FASE_3_PLANTAS_PARTICLECONTAINER.md` - 66k plantas a 60 FPS
  - `FASE_4_HIT_TESTING.md` - Click, hover, selección con RBush
  - `FASE_5_OVERLAYS.md` - Selección rect, snap guides, previews
  - `FASE_6_INTEGRACION.md` - Conectar con page.tsx
  - `FASE_7_OPTIMIZACIONES_CLEANUP.md` - Culling, LOD, cleanup SVG

### Completada (10C) ✅

- `FASE_10C_improves/` - Mejoras UX + Agua Funcional + Datos Agrícolas ✅
  - `01-dashboard-responsive.md` - Dashboard desbordado en panel lateral
  - `02-estanques-funcionales.md` - Rellenar estanque, configurar gasto, goteo
  - `03-agua-por-zona.md` - Consumo de agua por zona de cultivo
  - `04-fuentes-agua-calidad.md` - Fuente de agua, calidad (boro, salinidad)
  - `05-suelo-nutrientes.md` - Datos químicos del terreno, enmiendas
  - `06-clima-impacto-riego.md` - Clima afectando riego, camanchaca
  - `07-semillas-mercado.md` - Variedades, mercado, técnicas de mejora
  - `08-calidad-fruto-roi.md` - Score calidad, ROI, comparador de cultivos

### Completada (11) ✅

- `FASE_11_AUTH.md` - Autenticación JWT Mock ✅

### Completada (11B) ✅

- `FASE_11B_AGUA_UX_SEGMENTACION.md` - Segmentación UX Agua (Experimentación vs Gestión) ✅

### Completada (11C) ✅

- `FASE_11C_dashboard_planificador/` - Dashboard Mejorado + Planificador Económico ✅
  - `README.md` - Overview general (2 contextos: día a día vs largo plazo)
  - `01_dashboard_agua_dia_a_dia.md` - Dashboard simple 2 semanas ✅
  - `02_etapas_crecimiento_kc.md` - Etapas automáticas + Kc variable ✅
  - `03_sistema_riego_goteros.md` - Goteros configurable + Continuo vs Programado ✅
  - `04_modulo_economia.md` - Costos + Ingresos + ROI ✅
  - `05_alertas_criticas.md` - Agua/Replantas/Lavado ✅
  - `06_planificador_largo_plazo.md` - Proyección 12 meses + Economía ✅
  - `07_integracion_final.md` - Conectar todo + Tests ✅
  - `08_suelo_integration.md` - Integrar /suelo a navegación + Score ✅

### Completada (11D) ✅

- `FASE_11D_MEJORAS_NO_REGISTRADAS.md` - Registro retroactivo de trabajo no documentado ✅
  - Módulo Economía completo (/economia, /economia/avanzado)
  - Comparador de Escenarios (/escenarios)
  - Predicción de Plagas (/plagas)
  - Guía de Usuario (/guia)
  - Score de Calidad integrado
  - Integración Suelo → ROI
  - Datos estáticos extendidos (mercado, variedades, técnicas, enmiendas, fuentes-agua, ET₀)
  - Context Providers (map-context, project-context)
  - Bug fixes y mejoras UI

### Pendientes (15B–FINAL) ⏳

- `FASE_15B_BUGS_UX.md` - Bugs Críticos de UX (BUG-01, BUG-05, BUG-10, UX-02, UX-04, UX-06) ⏳
- `FASE_12_SUPABASE.md` - Migración a Supabase (Backend Real) ⏳
- `FASE_13_AUTH_REAL.md` - Autenticación Real con Supabase Auth ⏳
- `FASE_14_BILLING_MERCADOPAGO.md` - Sistema de Billing con MercadoPago ⏳
- `FASE_16_COSECHAS.md` - Registro de Cosechas (UI) ⏳
- `FASE_17_REPORTES_PDF.md` - Reportes y Exportación PDF ⏳
- `FASE_18_CALENDARIO.md` - Calendario de Eventos (Vista Mensual) ⏳
- `FASE_19_INTEGRACIONES_API.md` - Integraciones API Externas (Open-Meteo + ODEPA) ⏳
- `FASE_FINAL_HISTORIAL.md` - Historial de Cambios (UI) ⏳

### Gap conocido

- `src/app/proyecto/page.tsx` — NO existe (solo existe `error.tsx`). Crear página de gestión de proyectos/terrenos antes o durante FASE_15B.

### Documentos de arquitectura

- `ARQUITECTURA_RENDERING.md` - Hoja de ruta de estrategias de rendering por ruta (SSG/CSR/SSR/ISR) — actual y post-Supabase
- `MODELO_DATOS.md` - Tipos TypeScript completos
- `INVESTIGACION_A_CODIGO.md` - Mapeo investigación → código
- `UX_AUDIT_USUARIO_REAL.md` - Auditoría completa de usuario real (2026-02-05)

---

## Fuente de Datos

Los datos para las nuevas fases vienen de:

```
mi primera investigacion/
└── 3-modelo_ordenado/
    ├── 1_core_agronomico/       # Catálogo cultivos, selección
    │   ├── 04_catalogo_cultivos.yaml
    │   └── 05_seleccion_cultivo.yaml
    ├── 2_recursos_base/         # Terreno, clima, suelo, agua
    │   ├── 00_terreno.yaml
    │   ├── 01_clima.yaml
    │   ├── 02_suelo.yaml
    │   └── 03_agua.yaml
    ├── 3_gestion_operativa/     # (futuro)
    └── 4_economia_negocio/      # (futuro)
```

---

## Comandos

```bash
pnpm dev          # Desarrollo
pnpm build        # Producción
pnpm lint         # Linter
pnpm type-check   # TypeScript check
```

---

## Notas Importantes

1. **Datos de suelo/agua son CRÍTICOS**: Sin análisis real, el proyecto puede fracasar
2. **INIA análisis**: ~$75,000 CLP suelo + ~$75,000 CLP agua
3. **Boro en agua Lluta**: >11 ppm (muy tóxico para muchos cultivos)
4. **Salinidad zona norte**: Riesgo alto, requiere validación
5. **Inscripción SAG**: OBLIGATORIA para vender productos agrícolas

---

## Prioridades de Implementación

### Completadas ✅

1. ✅ **Completado**: Mejoras No Registradas - Economía, Escenarios, Plagas, Datos, Fixes (FASE_11D)
2. ✅ **Completado**: Dashboard + Planificador Económico (FASE_11C)
3. ✅ **Completado**: Segmentación UX Agua (FASE_11B)
4. ✅ **Completado**: Autenticación JWT Mock (FASE_11)
5. ✅ **Completado**: Mejoras UX + Datos Agrícolas (FASE_10C)
6. ✅ **Completado**: Performance PixiJS WebGL (FASE_10B)
7. ✅ **Completado**: PWA y Sync Offline (FASE_10)
8. ✅ **Completado**: Todas las fases anteriores (0-9)

### Próximas 🚀

1. ⏳ **PRÓXIMO**: Migración a Supabase (FASE_12)
2. ⏳ **PARALELA/SIGUIENTE**: Bugs Críticos UX (FASE_15B) — sin dependencia técnica con FASE_12
3. ⏳ **LUEGO**: Autenticación Real (FASE_13)
4. ⏳ **LUEGO**: Billing MercadoPago (FASE_14)
5. ⏳ **POST-SAAS**: Cosechas → PDF → Calendario → APIs externas → Historial (FASE_16–FINAL)

**Objetivo:** Convertir AgriPlan en un SaaS funcional con suscripciones mensuales de 9,990 CLP.
