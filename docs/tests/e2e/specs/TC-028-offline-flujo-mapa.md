# TC-028 — Flujo offline desde /app: crear zona → plantar → sync al reconectar

## Metadata

| Campo     | Valor                                     |
| --------- | ----------------------------------------- |
| ID        | TC-028                                    |
| Feature   | Offline-first — flujo completo desde mapa |
| Prioridad | Alta                                      |
| Tipo      | E2E / Browser (offline simulation)        |
| Ejecutor  | AI Agent (Chrome DevTools MCP)            |

## Contexto

TC-004 verificó el ciclo offline/reconexión a nivel de sync engine. Este TC verifica el flujo
desde la perspectiva del agricultor: usar el mapa sin conexión y que todo se sincronice al volver.

El caso de uso real: agricultor en el campo con señal intermitente. Hace cambios, pierde red,
sigue trabajando, recupera red → todo aparece en Supabase.

## Precondiciones

- Usuario autenticado y sync activado
- Terreno con al menos 1 zona de cultivo existente
- Sync en estado "Sincronizado" antes de empezar

## Pasos

### Fase 1 — Estado inicial online

| #   | Acción                                             | Resultado esperado                  |
| --- | -------------------------------------------------- | ----------------------------------- |
| 1   | Navegar a `/app`                                   | Mapa cargado, header "Sincronizado" |
| 2   | Anotar cantidad de plantas actual en zona objetivo | Baseline conocido                   |
| 3   | Verificar conteo en Supabase                       | Coincide con IDB                    |

### Fase 2 — Simular offline

| #   | Acción                                | Resultado esperado                     |
| --- | ------------------------------------- | -------------------------------------- |
| 4   | DevTools → Network → Offline          | Red desconectada                       |
| 5   | Verificar indicador de sync en la app | "Sin conexión" o icono offline visible |

### Fase 3 — Operar offline en el mapa

| #   | Acción                                                                       | Resultado esperado                         |
| --- | ---------------------------------------------------------------------------- | ------------------------------------------ |
| 6   | Plantar 3 plantas en zona de cultivo (via UI o IDB)                          | Plantas aparecen en mapa inmediatamente    |
| 7   | Verificar en IDB que las plantas tienen `estado_sync: 'pendiente'` o similar | Cambio local guardado                      |
| 8   | Navegar a `/agua`                                                            | Consumo actualiza con las 3 plantas nuevas |
| 9   | Verificar que sync_queue tiene entradas pendientes                           | 3+ registros en cola                       |

```js
const db = window.__agriplanDb__;
const cola = await db.sync_queue.toArray();
console.log(
  "Pendientes en cola:",
  cola.filter((i) => i.estado === "pendiente").length,
);
```

### Fase 4 — Reconectar y verificar sync

| #   | Acción                                        | Resultado esperado                                        |
| --- | --------------------------------------------- | --------------------------------------------------------- |
| 10  | DevTools → Network → Online                   | Red reconectada                                           |
| 11  | Esperar 8 segundos                            | Sync automático arranca                                   |
| 12  | Verificar indicador en app                    | "Sincronizado" (sin errores)                              |
| 13  | Verificar Supabase: `plantas?zona_id=eq.{id}` | +3 plantas nuevas en backend                              |
| 14  | Verificar sync_queue vacía                    | `cola.filter(i => i.estado === 'pendiente').length === 0` |

## Verificación de sync_queue

```js
const db = window.__agriplanDb__;
const cola = await db.sync_queue.toArray();
console.log({
  total: cola.length,
  pendientes: cola.filter((i) => i.estado === "pendiente").length,
  procesados: cola.filter((i) => i.estado === "procesado").length,
  fallidos: cola.filter((i) => i.estado === "fallido").length,
});
```

## Criterios de éxito

- [ ] Operaciones offline se guardan localmente sin error
- [ ] Mapa funciona normalmente sin conexión (no pantalla de error)
- [ ] Al reconectar, sync_engine detecta cambios y los envía automáticamente
- [ ] Supabase recibe exactamente los cambios hechos offline
- [ ] No hay duplicados en Supabase post-sync
- [ ] Indicador de sync vuelve a "Sincronizado"

## Casos límite

- Conflicto: mismo registro editado online y offline simultáneamente → last-write-wins
- Reconexión múltiple: desconectar 2x antes de sync → cola se procesa una sola vez
- Offline largo (>1h) → token puede expirar; sync debe refrescar token antes de enviar

## Diferencia con TC-004

TC-004 testea el sync engine directamente (create/update/delete via IDB). Este TC testea el
**flujo completo desde la UI del mapa** — el camino que sigue un agricultor real.

## Estado

⬜ Pendiente ejecución
