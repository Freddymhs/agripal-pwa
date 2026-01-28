# AgriPlan PWA

Sistema de planificación agrícola offline-first para pequeños agricultores de Arica, Chile.

## Stack Técnico

- **Framework:** Next.js 16 + App Router + TypeScript
- **Estilos:** TailwindCSS
- **PWA:** @ducanh2912/next-pwa
- **Estado:** SWR
- **Persistencia:** IndexedDB con Dexie
- **Mapa:** SVG interactivo (zoom, pan, dibujo de zonas)

## Características Principales

- Gestión de terrenos con mapa interactivo SVG
- Creación de zonas (cultivo, bodega, casa, etc.)
- Colocación de plantas individual o en grilla
- Control de agua (entradas, consumo, alertas)
- Catálogo de cultivos editable por proyecto
- Funciona 100% offline con sincronización

## Setup

```bash
pnpm install
pnpm dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## Variables de Entorno

```bash
# .env.local
JWT_SECRET=tu_secret_aqui
```

## Estructura del Proyecto

```
src/
├── app/           # Next.js App Router
├── components/    # Componentes React
├── lib/           # Lógica de negocio, DB, utils
├── hooks/         # Custom hooks
└── types/         # TypeScript types
```

Ver `backlog/` para la especificación completa del proyecto.

## Backlog

El directorio `backlog/` contiene la especificación detallada:

- `README.md` - Overview y decisiones técnicas
- `MODELO_DATOS.md` - Esquemas TypeScript completos
- `sprint-01-fundamentos/` - Estructura, tipos, layout, IndexedDB, auth
- `sprint-02-zonas-plantas/` - Mapa SVG, CRUD zonas, plantas, catálogo
- `sprint-03-agua-alertas/` - Agua, consumo, alertas, dashboard
- `sprint-04-sync-pwa/` - PWA, service worker, sync offline
- `futuro/` - Calendario, cosechas, reportes, APIs

## Deployment

```bash
pnpm build
vercel --prod
```

## Recursos

- [ODEPA - Precios Agrícolas](https://www.odepa.gob.cl/)
- [INDAP - Subsidios](https://www.indap.gob.cl/)
- [Open-Meteo API](https://open-meteo.com/) - Clima y ET0
