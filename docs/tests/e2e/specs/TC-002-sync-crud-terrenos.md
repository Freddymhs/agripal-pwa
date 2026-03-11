# TC-002 — Sync CRUD incremental — Terrenos

## Metadata

| Campo       | Valor                          |
| ----------- | ------------------------------ |
| ID          | TC-002                         |
| Feature     | Sync — CRUD incremental        |
| Prioridad   | Alta                           |
| Tipo        | E2E / Browser                  |
| Ejecutor    | AI Agent (Chrome DevTools MCP) |
| Creado      | 2026-03-10                     |
| Última rev. | 2026-03-10                     |

## Preconditions

- [ ] `pnpm dev` corriendo en `http://localhost:3000`
- [ ] Usuario autenticado
- [ ] Sync activado (`window.__agriplan_sync_habilitado__ === true`)
- [ ] Al menos un proyecto seleccionado

## Steps

### CREATE

| #   | Acción                                                     | Resultado esperado        |
| --- | ---------------------------------------------------------- | ------------------------- |
| 1   | Navegar a `/terrenos`                                      | Lista de terrenos visible |
| 2   | Click "+ Nuevo Terreno"                                    | Formulario aparece        |
| 3   | Escribir nombre: "Terreno TC-002"                          | Campo relleno             |
| 4   | Click "Crear Terreno"                                      | Terreno aparece en lista  |
| 5   | Esperar 6 segundos                                         | Sync engine procesa       |
| 6   | Verificar en Supabase: `terrenos?nombre=eq.Terreno TC-002` | 1 registro encontrado     |

### UPDATE

| #   | Acción                                                          | Resultado esperado                            |
| --- | --------------------------------------------------------------- | --------------------------------------------- |
| 7   | Click ✏️ en "Terreno TC-002"                                    | Formulario de edición                         |
| 8   | Cambiar nombre a "Terreno TC-002 Editado"                       | Campo actualizado                             |
| 9   | Guardar                                                         | Nombre actualizado en lista                   |
| 10  | Esperar 6 segundos                                              | Sync engine procesa                           |
| 11  | Verificar Supabase: `terrenos?nombre=eq.Terreno TC-002 Editado` | 1 registro con nombre nuevo                   |
| 12  | Verificar que `datos` JSONB está completo (no parcial)          | Objeto con todos los campos, no solo `nombre` |

### DELETE

| #   | Acción                                                          | Resultado esperado                   |
| --- | --------------------------------------------------------------- | ------------------------------------ |
| 13  | Click 🗑️ en "Terreno TC-002 Editado"                            | Diálogo de confirmación              |
| 14  | Escribir nombre exacto en campo de confirmación                 | Botón "Eliminar Terreno" se habilita |
| 15  | Click "Eliminar Terreno"                                        | Terreno desaparece de la lista       |
| 16  | Esperar 6 segundos                                              | Sync engine procesa                  |
| 17  | Verificar Supabase: `terrenos?nombre=eq.Terreno TC-002 Editado` | Array vacío (eliminado)              |

## Expected Final State

- "Terreno TC-002 Editado" NO existe en IndexedDB ni en Supabase
- `sync_queue` no tiene items `pendiente` para entidad `terreno`

## Notes

- BUG-02 fix: el hook "updating" envía `{ ...obj, ...modifications }` para evitar datos parciales en Supabase JSONB
- BUG-04 fix: `setTimeout(fn, 0)` escapa la PSD zone de Dexie — sin esto el enqueue falla silenciosamente
- El engine de sync corre cada 30s; para tests usar 6s de espera (el engine puede estar a mitad del ciclo)
