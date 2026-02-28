# FASE 0: Estructura Base

**Status**: ✅ COMPLETADA
**Prioridad**: 🔴 Alta
**Dependencias**: Ninguna
**Estimación**: 2-3 horas

---

## Objetivo

Crear la estructura de carpetas, layout principal y navegación por tabs.

---

## Tareas

### Tarea 1: Crear Estructura de Carpetas

**Archivo**: `src/` (estructura)
**Acción**: Crear directorios

```bash
mkdir -p src/components/{ui,layout,mapa,plantas,agua,alertas,catalogo}
mkdir -p src/lib/{db,utils,api,validations}
mkdir -p src/hooks
mkdir -p src/types
mkdir -p src/app/{auth,terrenos,proyecto}
```

**Estructura final**:

```
src/
├── app/
│   ├── auth/              # Login (futuro)
│   ├── terrenos/
│   │   └── [id]/          # Vista de terreno
│   ├── proyecto/          # Config proyecto
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/                # Button, Input, Modal, etc.
│   ├── layout/            # Navbar, Sidebar
│   ├── mapa/              # MapaTerreno, ZonaRect
│   ├── plantas/           # PlantaMarker, GridModal
│   ├── agua/              # EntradaAguaForm
│   ├── alertas/           # AlertasList
│   └── catalogo/          # CatalogoList, CultivoForm
├── lib/
│   ├── db/                # Dexie setup
│   ├── utils/             # uuid, coordinates, formatters
│   ├── api/               # API calls (futuro)
│   └── validations/       # Zona, planta validations
├── hooks/                 # useTerrenos, useZonas, etc.
└── types/                 # index.ts con todos los tipos
```

---

### Tarea 2: Configurar Variables de Entorno

**Archivo**: `.env.local` (crear)

```bash
JWT_SECRET=agriplan_dev_secret_change_in_production
NEXT_PUBLIC_APP_NAME=AgriPlan PWA
NEXT_PUBLIC_APP_VERSION=0.1.0
```

**Archivo**: `.env.example` (crear)

```bash
JWT_SECRET=your_jwt_secret_here
NEXT_PUBLIC_APP_NAME=AgriPlan PWA
NEXT_PUBLIC_APP_VERSION=0.1.0
```

---

### Tarea 3: Actualizar Layout Principal

**Archivo**: `src/app/layout.tsx` (modificar)

```typescript
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AgriPlan PWA',
  description: 'Sistema de planificación agrícola offline-first',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#22c55e',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="antialiased bg-gray-50">
        {children}
      </body>
    </html>
  )
}
```

---

### Tarea 4: Crear Componente Navbar (Tabs)

**Archivo**: `src/components/layout/Navbar.tsx` (crear)

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Tab = {
  id: string
  label: string
  href: string
}

interface NavbarProps {
  terrenoId: string
}

export function Navbar({ terrenoId }: NavbarProps) {
  const pathname = usePathname()

  const tabs: Tab[] = [
    { id: 'mapa', label: 'Mapa', href: `/terrenos/${terrenoId}` },
    { id: 'agua', label: 'Agua', href: `/terrenos/${terrenoId}/agua` },
    { id: 'catalogo', label: 'Cultivos', href: `/terrenos/${terrenoId}/catalogo` },
    { id: 'alertas', label: 'Alertas', href: `/terrenos/${terrenoId}/alertas` },
    { id: 'config', label: 'Config', href: `/terrenos/${terrenoId}/config` },
  ]

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-2">
      <div className="flex items-center gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href ||
            (tab.id === 'mapa' && pathname === `/terrenos/${terrenoId}`)

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`
                px-4 py-2 rounded-lg transition-colors whitespace-nowrap
                text-sm font-medium
                ${isActive
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

---

### Tarea 5: Crear Componente Sidebar

**Archivo**: `src/components/layout/Sidebar.tsx` (crear)

```typescript
'use client'

import type { Zona, DashboardTerreno } from '@/types'

interface SidebarProps {
  zonaSeleccionada?: Zona | null
  dashboard?: DashboardTerreno | null
  children?: React.ReactNode
}

export function Sidebar({ zonaSeleccionada, dashboard, children }: SidebarProps) {
  return (
    <aside className="w-80 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-900">
          {zonaSeleccionada ? zonaSeleccionada.nombre : 'Panel de Información'}
        </h2>
        {!zonaSeleccionada && (
          <p className="text-sm text-gray-500">
            Selecciona una zona en el mapa
          </p>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {children ? (
          children
        ) : zonaSeleccionada ? (
          <ZonaInfo zona={zonaSeleccionada} />
        ) : dashboard ? (
          <DashboardResumen dashboard={dashboard} />
        ) : (
          <p className="text-sm text-gray-500 text-center">
            No hay información disponible
          </p>
        )}
      </div>
    </aside>
  )
}

function ZonaInfo({ zona }: { zona: Zona }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div
          className="w-4 h-4 rounded"
          style={{ backgroundColor: zona.color }}
        />
        <span className="text-sm font-medium capitalize">{zona.tipo}</span>
      </div>
      <div className="text-sm">
        <div className="text-gray-500">Área</div>
        <div className="font-medium">{zona.area_m2} m²</div>
      </div>
      <div className="text-sm">
        <div className="text-gray-500">Dimensiones</div>
        <div className="font-medium">{zona.ancho}m × {zona.alto}m</div>
      </div>
      <div className="text-sm">
        <div className="text-gray-500">Estado</div>
        <div className="font-medium capitalize">{zona.estado.replace('_', ' ')}</div>
      </div>
      {zona.notas && (
        <div className="text-sm">
          <div className="text-gray-500">Notas</div>
          <div>{zona.notas}</div>
        </div>
      )}
    </div>
  )
}

function DashboardResumen({ dashboard }: { dashboard: DashboardTerreno }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 bg-blue-50 rounded">
          <div className="text-xs text-blue-600">Área Usada</div>
          <div className="text-sm font-bold text-blue-900">
            {dashboard.porcentaje_uso.toFixed(0)}%
          </div>
        </div>
        <div className={`p-2 rounded ${
          dashboard.estado_agua === 'ok' ? 'bg-green-50' :
          dashboard.estado_agua === 'ajustado' ? 'bg-yellow-50' : 'bg-red-50'
        }`}>
          <div className={`text-xs ${
            dashboard.estado_agua === 'ok' ? 'text-green-600' :
            dashboard.estado_agua === 'ajustado' ? 'text-yellow-600' : 'text-red-600'
          }`}>Agua</div>
          <div className={`text-sm font-bold ${
            dashboard.estado_agua === 'ok' ? 'text-green-900' :
            dashboard.estado_agua === 'ajustado' ? 'text-yellow-900' : 'text-red-900'
          }`}>
            {dashboard.agua_disponible_m3} m³
          </div>
        </div>
      </div>
      <div className="text-sm">
        <div className="text-gray-500">Plantas</div>
        <div className="font-medium">{dashboard.total_plantas}</div>
      </div>
      {dashboard.alertas_criticas > 0 && (
        <div className="p-2 bg-red-100 rounded text-sm text-red-800">
          {dashboard.alertas_criticas} alertas críticas
        </div>
      )}
    </div>
  )
}
```

---

## Criterios de Aceptación

- [ ] Estructura de carpetas creada completamente
- [ ] `.env.local` y `.env.example` configurados
- [ ] Layout con metadata PWA actualizado
- [ ] Navbar con tabs funcionales (links)
- [ ] Sidebar muestra info de zona o dashboard
- [ ] `pnpm dev` corre sin errores
- [ ] Layout es mobile-first (horizontal en móvil)

---

## Siguiente Fase

**FASE_1_TIPOS** - Implementar tipos TypeScript e IndexedDB con Dexie
