# Diagramas de Estados

Proposito: ciclos de vida de entidades clave con transiciones validas. Solo actualizar si cambian reglas de negocio.

## Estados de Suscripcion (MercadoPago)

```mermaid
stateDiagram-v2
  [*] --> trial: registro nuevo usuario
  trial --> active: pago OK (checkout)
  trial --> expired: 6 meses sin pago
  active --> past_due: pago fallido (webhook)
  past_due --> active: reintento OK
  past_due --> cancelled: 3 reintentos fallidos
  active --> cancelled: usuario cancela
  cancelled --> active: re-suscripcion manual
  cancelled --> [*]
  expired --> active: usuario decide pagar
  expired --> [*]
```

## Estados de Sync Offline (cola Dexie → Supabase)

```mermaid
stateDiagram-v2
  [*] --> pending: write local (Dexie)
  pending --> syncing: red disponible + flush
  syncing --> synced: ack OK del servidor
  syncing --> conflict: error de conflicto (409/version mismatch)
  syncing --> pending: error de red (reintento)
  conflict --> pending: resolucion aplicada
  synced --> [*]
```
