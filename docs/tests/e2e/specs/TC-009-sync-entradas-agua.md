# TC-009 — Sync CRUD — Entradas de Agua

## Metadata

| Campo       | Valor                          |
| ----------- | ------------------------------ |
| ID          | TC-009                         |
| Feature     | Sync — CRUD Entradas de Agua   |
| Prioridad   | Alta                           |
| Tipo        | E2E / Browser                  |
| Ejecutor    | AI Agent (Chrome DevTools MCP) |
| Creado      | 2026-03-10                     |
| Última rev. | 2026-03-10                     |

## Preconditions

- [ ] `pnpm dev` corriendo en `http://localhost:3000`
- [ ] Usuario autenticado
- [ ] Sync activado (`window.__agriplan_sync_habilitado__ === true`)
- [ ] Existe al menos un terreno en IndexedDB (FK: `terreno_id`)

## Steps

```js
// En browser console
const db = window.__agriplanDb__;
const terrenos = await db.terrenos.toArray();
const terrenoId = terrenos[0].id;

// CREATE
const entradaId = crypto.randomUUID();
await db.entradas_agua.add({
  id: entradaId,
  terreno_id: terrenoId,
  fecha: new Date().toISOString().split("T")[0], // 'YYYY-MM-DD'
  datos: {
    volumen_m3: 5.0,
    costo: 1500,
    proveedor: "Test TC-009",
    notas: "entrada de prueba sync",
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});
```

| #   | Verificación                                                | Resultado esperado                   |
| --- | ----------------------------------------------------------- | ------------------------------------ |
| 1   | Esperar 6s → `entradas_agua?id=eq.${entradaId}` en Supabase | 1 registro con `datos.volumen_m3: 5` |

```js
// UPDATE
await db.entradas_agua
  .where("id")
  .equals(entradaId)
  .modify({
    datos: {
      volumen_m3: 10.0,
      costo: 3000,
      proveedor: "Test TC-009 Edit",
      notas: "actualizado",
    },
    updated_at: new Date().toISOString(),
  });
```

| #   | Verificación                                    | Resultado esperado                 |
| --- | ----------------------------------------------- | ---------------------------------- |
| 2   | Esperar 6s → mismo query, revisar `datos` JSONB | `datos.volumen_m3: 10` en Supabase |

```js
// DELETE
await db.entradas_agua.where("id").equals(entradaId).delete();
```

| #   | Verificación             | Resultado esperado |
| --- | ------------------------ | ------------------ |
| 3   | Esperar 6s → mismo query | Array vacío        |

## Expected Final State

- Entrada de agua creada, actualizada y eliminada correctamente en Supabase
- `sync_queue` sin items `pendiente` para entidad `entrada_agua`

## Notes

- `fecha` es tipo `date` en Supabase — pasar formato `'YYYY-MM-DD'`, no ISO completo
- El modal "Registrar Entrada de Agua" en la UI también debería funcionar — este test usa `window.__agriplanDb__` para automatización
