# TC-006 — Reactivar sincronización (upload inicial pendiente)

## Metadata

| Campo       | Valor                          |
| ----------- | ------------------------------ |
| ID          | TC-006                         |
| Feature     | Sync — Reactivación            |
| Prioridad   | Media                          |
| Tipo        | E2E / Browser                  |
| Ejecutor    | AI Agent (Chrome DevTools MCP) |
| Creado      | 2026-03-10                     |
| Última rev. | 2026-03-10                     |

## Preconditions

- [ ] `pnpm dev` corriendo en `http://localhost:3000`
- [ ] Usuario autenticado
- [ ] Sync desactivado (`window.__agriplan_sync_habilitado__ === false`)
- [ ] Existe al menos 1 terreno creado mientras sync estaba desactivado (TC-005)

## Steps

| #   | Acción                                                        | Resultado esperado                                                               |
| --- | ------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 1   | Navegar a `/configuracion`                                    | Toggle OFF visible                                                               |
| 2   | Click toggle                                                  | Modal de confirmación                                                            |
| 3   | Click "Activar sincronización"                                | Texto "Activando sincronización..." aparece                                      |
| 4   | Esperar hasta 30s                                             | Mensaje verde "Sincronización activada. Tus datos se respaldan automáticamente." |
| 5   | Verificar toggle                                              | Toggle ON (verde)                                                                |
| 6   | Verificar `window.__agriplan_sync_habilitado__`               | `true`                                                                           |
| 7   | Verificar Supabase: `terrenos?nombre=eq.Terreno B07 Sin Sync` | 1 registro (subido en carga inicial)                                             |

## Expected Final State

- Toggle ON en `/configuracion`
- `window.__agriplan_sync_habilitado__ === true`
- Datos locales creados mientras sync estuvo desactivado ahora en Supabase
- Alertas con FK huérfanas: warning en consola, NO abortan la activación

## Notes

- La reactivación ejecuta `ejecutarCargaInicial()` — sube TODOS los datos locales
- Alertas con terrenos no subidos generan warning RLS tolerado (non-critical table)
- BUG-01 fix: "Activando sincronización..." visible incluso con IndexedDB vacío
