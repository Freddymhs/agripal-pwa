# Diagramas de Componentes (Flowcharts)

Proposito: mapa estable del sistema. Actualizar solo si cambia topologia (agregar/quitar servicios) o se mueve la frontera cliente/servidor.

## Contexto (alto nivel)

```mermaid
flowchart LR
  U["Usuario\n(PWA)"]
  App["Next.js 16\nApp Router"]
  SW["Service Worker\n@ducanh2912/next-pwa"]
  Dexie["IndexedDB\nDexie + useLiveQuery"]
  Supa["Supabase Edge\nAuth / PostgREST / Realtime / Storage"]
  PG["PostgreSQL\nSchema + RLS"]
  MP["MercadoPago\nCheckout/Subs"]
  CDN["CDN estatico\nassets"]

  U <--> App
  App <--> SW
  App <--> Dexie
  App --> Supa
  Supa --> PG
  App --> MP
  MP --> Supa
  App --> CDN
```

## Componentes principales (cliente + backend)

```mermaid
flowchart TB
  subgraph Cliente PWA
    UI["UI React\nApp Router + Tailwind"]
    State["Estado\nSWR / contextos"]
    Cache["IndexedDB\nDexie + adaptador offline"]
    Sync["SupabaseAdapter\ncola de cambios + reconciliacion"]
  end

  subgraph Servicios
    Auth["Supabase Auth"]
    API["PostgREST / RPC"]
    RT["Realtime"]
    Storage["Storage (archivos)"]
    MP["MercadoPago\nwebhooks"]
  end

  UI --> State
  State <--> Cache
  State <--> Sync
  Sync --> API
  Sync <--> RT
  UI --> Auth
  UI --> Storage
  UI --> MP
```

## Notas

- La PWA opera offline con Dexie; Sync reintenta cuando vuelve la conexion.
- MercadoPago solo se conecta en flujos de checkout; webhooks actualizan estado de suscripcion.
- Realtime alimenta la UI solo en conectividad; offline sigue leyendo Dexie.
