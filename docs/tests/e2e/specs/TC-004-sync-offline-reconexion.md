# TC-004 — Sync cola pendiente + reconexión offline/online

## Metadata

| Campo       | Valor                          |
| ----------- | ------------------------------ |
| ID          | TC-004                         |
| Feature     | Sync — Offline / Reconexión    |
| Prioridad   | Alta                           |
| Tipo        | E2E / Browser                  |
| Ejecutor    | AI Agent (Chrome DevTools MCP) |
| Creado      | 2026-03-10                     |
| Última rev. | 2026-03-10                     |

## Preconditions

- [ ] `pnpm dev` corriendo
- [ ] Usuario autenticado
- [ ] Sync activado

## Steps

| #   | Acción                                                                                                            | Resultado esperado            |
| --- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| 1   | En consola: `window._originalFetch = window.fetch; window.fetch = () => Promise.reject(new TypeError('offline'))` | Fetch bloqueado               |
| 2   | Navegar a `/terrenos` → click "+ Nuevo Terreno"                                                                   | Formulario visible            |
| 3   | Escribir nombre: "Terreno TC-004 Offline" → click "Crear Terreno"                                                 | Terreno aparece en lista      |
| 4   | Verificar IndexedDB: `db.terrenos.where('nombre').equals('Terreno TC-004 Offline').count()`                       | `1`                           |
| 5   | Verificar `sync_queue`: items con `estado: 'pendiente'` para entidad `terreno`                                    | ≥ 1 item                      |
| 6   | Verificar Supabase: `terrenos?nombre=eq.Terreno TC-004 Offline`                                                   | Array vacío (no llegó)        |
| 7   | Restaurar fetch: `window.fetch = window._originalFetch; window.dispatchEvent(new Event('online'))`                | Fetch restaurado              |
| 8   | Recargar página (para limpiar override)                                                                           | App carga normalmente         |
| 9   | Esperar 6 segundos                                                                                                | Engine procesa cola pendiente |
| 10  | Verificar Supabase: `terrenos?nombre=eq.Terreno TC-004 Offline`                                                   | 1 registro (sincronizado)     |

## Expected Final State

- "Terreno TC-004 Offline" en Supabase
- `sync_queue` sin items `pendiente` para ese terreno

## Notes

- `window.fetch = () => Promise.reject(...)` simula offline sin DevTools Network throttling
- El engine de sync escucha el evento `online` y procesa la cola inmediatamente al reconectar
- Si el override de fetch no se limpia antes del reload, simplemente recargar restaura el fetch original
