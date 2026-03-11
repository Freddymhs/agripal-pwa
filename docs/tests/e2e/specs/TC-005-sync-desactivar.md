# TC-005 — Desactivar sincronización

## Metadata

| Campo       | Valor                          |
| ----------- | ------------------------------ |
| ID          | TC-005                         |
| Feature     | Sync — Desactivación           |
| Prioridad   | Media                          |
| Tipo        | E2E / Browser                  |
| Ejecutor    | AI Agent (Chrome DevTools MCP) |
| Creado      | 2026-03-10                     |
| Última rev. | 2026-03-10                     |

## Preconditions

- [ ] `pnpm dev` corriendo en `http://localhost:3000`
- [ ] Usuario autenticado
- [ ] Sync activado (`window.__agriplan_sync_habilitado__ === true`)

## Steps

| #   | Acción                                                        | Resultado esperado                                                     |
| --- | ------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 1   | Navegar a `/configuracion`                                    | Sección "Respaldo en la nube" visible                                  |
| 2   | Verificar toggle                                              | Toggle ON (verde)                                                      |
| 3   | Click toggle                                                  | Modal de confirmación aparece                                          |
| 4   | Click "Desactivar"                                            | Toggle pasa a OFF                                                      |
| 5   | Verificar en consola: `window.__agriplan_sync_habilitado__`   | `false`                                                                |
| 6   | Navegar a `/terrenos` → crear terreno "Terreno B07 Sin Sync"  | Terreno aparece en lista local                                         |
| 7   | Esperar 6 segundos                                            | Engine corre pero sync está desactivado                                |
| 8   | Verificar Supabase: `terrenos?nombre=eq.Terreno B07 Sin Sync` | Array vacío (no llegó)                                                 |
| 9   | Verificar `sync_queue` en IndexedDB                           | Items con estado `pendiente` o `sync_queue` vacía según implementación |

## Expected Final State

- Toggle OFF en `/configuracion`
- `window.__agriplan_sync_habilitado__ === false`
- "Terreno B07 Sin Sync" SOLO en IndexedDB, no en Supabase
- Escrituras locales no llegan a Supabase mientras sync esté desactivado

## Notes

- El flag `window.__agriplan_sync_habilitado__` es la fuente de verdad en runtime (no solo IndexedDB)
- Al desactivar, el engine no procesa la cola aunque tenga items pendientes
