# TC-008 — Sync CRUD — Plantas

## Metadata

| Campo       | Valor                          |
| ----------- | ------------------------------ |
| ID          | TC-008                         |
| Feature     | Sync — CRUD Plantas            |
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
const plantaId = crypto.randomUUID();
await db.plantas.add({
  id: plantaId,
  zona_id: zonaId,
  tipo_cultivo_id: "datil-medjool", // usar un id válido del catálogo
  estado: "activa",
  datos: { espaciado_m: 8, fecha_plantacion: new Date().toISOString() },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});
```

| #   | Verificación                                         | Resultado esperado |
| --- | ---------------------------------------------------- | ------------------ |
| 1   | Esperar 6s → `plantas?id=eq.${plantaId}` en Supabase | 1 registro         |

```js
// UPDATE
await db.plantas.where("id").equals(plantaId).modify({
  estado: "cosechada",
  updated_at: new Date().toISOString(),
});
```

| #   | Verificación                                               | Resultado esperado                |
| --- | ---------------------------------------------------------- | --------------------------------- |
| 2   | Esperar 6s → mismo query, revisar campo `datos` o `estado` | `estado: 'cosechada'` en Supabase |

```js
// DELETE
await db.plantas.where("id").equals(plantaId).delete();
```

| #   | Verificación             | Resultado esperado |
| --- | ------------------------ | ------------------ |
| 3   | Esperar 6s → mismo query | Array vacío        |

## Expected Final State

- Planta creada, actualizada y eliminada correctamente en Supabase
- `sync_queue` sin items `pendiente` para entidad `planta`

## Notes

- `tipo_cultivo_id` debe ser un string válido — verificar con `await db.catalogo_cultivos.limit(1).toArray()` primero
- Si `zona_id` no existe en Supabase todavía, la FK fallará — asegurarse que la zona fue sincronizada antes
