# Diagramas de Secuencia

Proposito: contratos criticos de interaccion entre actores. Solo actualizar si cambia el flujo de negocio, no por tweaks de UI.

## Login / Sesion Supabase

```mermaid
sequenceDiagram
  participant U as Usuario (PWA)
  participant App as Next.js (client)
  participant Auth as Supabase Auth

  U->>App: email/password u OAuth
  App->>Auth: signIn / signUp
  Auth-->>App: session (access + refresh tokens)
  App->>App: guarda session en cookies httpOnly
  App->>U: UI autenticada (usa SWR + Dexie)
```

## Sync offline → online (Dexie ↔ Supabase)

```mermaid
sequenceDiagram
  participant App as UI + State
  participant Dexie as IndexedDB (cola cambios)
  participant Sync as SupabaseAdapter
  participant API as Supabase REST/RPC
  participant RT as Supabase Realtime

  App->>Dexie: write (mutaciones locales)
  Dexie->>Sync: enqueue pending ops
  Sync->>API: flush cuando hay red
  API-->>Sync: ack / errores (conflicto)
  Sync->>Dexie: marca resuelto / conflicto
  RT-->>App: cambios de otros clientes
  App->>Dexie: aplica snapshot/patch
```

## Checkout MercadoPago (suscripcion)

```mermaid
sequenceDiagram
  participant U as Usuario
  participant App as PWA
  participant MP as MercadoPago Checkout
  participant Hook as Webhook backend ligero
  participant Supa as Supabase (DB)

  U->>App: inicia suscripcion
  App->>MP: crea preferencia / redirect
  MP-->>U: UI de pago
  MP-->>Hook: webhook (paid/failure/pending)
  Hook->>Supa: update suscripcion (status, next_charge)
  App->>Supa: consulta status (polling o RT)
  Supa-->>App: status actualizado
  App->>U: acceso a features de pago
```
