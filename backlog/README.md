# Backlog - AgriPlan PWA

## Proyecto
Sistema de planificación agrícola offline-first para pequeños agricultores de Arica, Chile.

## Stack
- Next.js 16 + App Router + TypeScript
- TailwindCSS 4
- IndexedDB con Dexie
- PWA con @ducanh2912/next-pwa
- SWR para estado
- SVG para mapa interactivo (NO Leaflet)

## Arquitectura de Datos
```
Usuario
  └── Proyecto (1:N)
        └── Terreno (1:N)
              ├── Zona (1:N) → Planta (1:N)
              ├── EntradaAgua (1:N)
              └── CatalogoCultivo (1:N por proyecto)
```

## Decisiones Técnicas Clave
- **Mapa**: SVG puro con zoom/pan (no Leaflet - muy complejo)
- **Zonas**: Siempre rectángulos, exclusivas (no se superponen)
- **Plantas**: Colocación individual o grilla con preview
- **Espaciado mínimo**: 0.5m entre plantas
- **Agua**: Por terreno, factores temporada (verano=1.4, invierno=0.6)
- **Sync**: Offline-first, usuario resuelve conflictos manualmente
- **Auth**: JWT básico, Supabase/Firebase futuro

---

## Índice de Fases

| Fase | Nombre | Prioridad | Tareas |
|------|--------|-----------|--------|
| 0 | Estructura Base | 🔴 Alta | 5 |
| 1 | Modelo de Datos | 🔴 Alta | 4 |
| 2 | Mapa SVG Interactivo | 🔴 Alta | 6 |
| 3 | CRUD Zonas | 🔴 Alta | 5 |
| 4 | Sistema de Plantas | 🔴 Alta | 5 |
| 5 | Catálogo de Cultivos | 🟡 Media | 4 |
| 6 | Control de Agua | 🟡 Media | 5 |
| 7 | Alertas y Dashboard | 🟡 Media | 4 |
| 8 | PWA y Sync Offline | 🔴 Alta | 5 |
| 9 | Autenticación JWT | 🟢 Baja | 3 |

**Total**: ~46 tareas

---

## Archivos

- `MODELO_DATOS.md` - Tipos TypeScript completos
- `FASE_0_ESTRUCTURA.md` - Carpetas, layout, navegación
- `FASE_1_TIPOS.md` - TypeScript + Dexie
- `FASE_2_MAPA_SVG.md` - Componente mapa interactivo
- `FASE_3_ZONAS.md` - CRUD zonas con validaciones
- `FASE_4_PLANTAS.md` - Colocación individual y grilla
- `FASE_5_CATALOGO.md` - Gestión catálogo cultivos
- `FASE_6_AGUA.md` - Entradas, consumo, cálculos
- `FASE_7_ALERTAS.md` - Sistema alertas y dashboard
- `FASE_8_PWA.md` - Service worker, sync, offline
- `FASE_9_AUTH.md` - JWT y protección rutas
- `futuro/` - Features post-MVP (calendario, cosechas, reportes, APIs)

---

## Comandos

```bash
pnpm dev          # Desarrollo
pnpm build        # Producción
pnpm lint         # Linter
```
