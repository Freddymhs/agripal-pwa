# TC-010 — Sync CRUD — Cosechas

## Metadata

| Campo       | Valor                          |
| ----------- | ------------------------------ |
| ID          | TC-010                         |
| Feature     | Sync — CRUD Cosechas           |
| Prioridad   | Alta                           |
| Tipo        | E2E / Browser                  |
| Ejecutor    | AI Agent (Chrome DevTools MCP) |
| Creado      | 2026-03-10                     |
| Última rev. | 2026-03-10                     |

## Preconditions

- [ ] `pnpm dev` corriendo en `http://localhost:3000`
- [ ] Usuario autenticado
- [ ] Sync activado (`window.__agriplan_sync_habilitado__ === true`)
- [ ] Existe al menos una zona en IndexedDB (FK: `zona_id`)

## Steps

```js
// En browser console
const db = window.__agriplanDb__;
const zonas = await db.zonas.toArray();
const zonaId = zonas[0].id;

// CREATE
const cosechaId = crypto.randomUUID();
await db.cosechas.add({
  id: cosechaId,
  zona_id: zonaId,
  tipo_cultivo_id: "datil-medjool",
  fecha: new Date().toISOString().split("T")[0],
  datos: {
    cantidad_kg: 50,
    calidad: "primera",
    precio_kg: 3500,
    notas: "cosecha prueba TC-010",
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});
```

| #   | Verificación                                           | Resultado esperado                     |
| --- | ------------------------------------------------------ | -------------------------------------- |
| 1   | Esperar 6s → `cosechas?id=eq.${cosechaId}` en Supabase | 1 registro con `datos.cantidad_kg: 50` |

```js
// UPDATE
await db.cosechas
  .where("id")
  .equals(cosechaId)
  .modify({
    datos: {
      cantidad_kg: 75,
      calidad: "segunda",
      precio_kg: 2800,
      notas: "actualizado TC-010",
    },
    updated_at: new Date().toISOString(),
  });
```

| #   | Verificación                                    | Resultado esperado                  |
| --- | ----------------------------------------------- | ----------------------------------- |
| 2   | Esperar 6s → mismo query, revisar `datos` JSONB | `datos.cantidad_kg: 75` en Supabase |

```js
// DELETE
await db.cosechas.where("id").equals(cosechaId).delete();
```

| #   | Verificación             | Resultado esperado |
| --- | ------------------------ | ------------------ |
| 3   | Esperar 6s → mismo query | Array vacío        |

## Expected Final State

- Cosecha creada, actualizada y eliminada correctamente en Supabase
- `sync_queue` sin items `pendiente` para entidad `cosecha`

## Notes

- `tipo_cultivo_id` debe ser un string válido — verificar con `await db.catalogo_cultivos.limit(1).toArray()` primero
- Si `zona_id` no existe en Supabase, la FK fallará — verificar que la zona esté sincronizada
