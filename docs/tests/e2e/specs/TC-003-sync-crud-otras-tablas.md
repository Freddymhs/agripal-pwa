# TC-003 — Sync CRUD incremental — Zonas, Catálogo, Insumos

## Metadata

| Campo       | Valor                          |
| ----------- | ------------------------------ |
| ID          | TC-003                         |
| Feature     | Sync — CRUD otras tablas       |
| Prioridad   | Alta                           |
| Tipo        | E2E / Browser                  |
| Ejecutor    | AI Agent (Chrome DevTools MCP) |
| Creado      | 2026-03-10                     |
| Última rev. | 2026-03-10                     |

## Preconditions

- [ ] `pnpm dev` corriendo en `http://localhost:3000`
- [ ] Usuario autenticado
- [ ] Sync activado
- [ ] `window.__agriplanDb__` disponible (solo en dev)
- [ ] Existe al menos un terreno en IndexedDB (para FK de zonas e insumos)
- [ ] Existe al menos un proyecto en IndexedDB (para FK de catálogo)

## Steps

### Zonas — CREATE + UPDATE

```js
// En browser console
const db = window.__agriplanDb__;
const terrenos = await db.terrenos.toArray();
const terrenoId = terrenos[0].id;

// CREATE
const zonaId = crypto.randomUUID();
await db.zonas.add({
  id: zonaId,
  terreno_id: terrenoId,
  nombre: "Zona TC-003",
  tipo: "cultivo",
  x: 5,
  y: 5,
  ancho: 20,
  alto: 10,
  lastModified: Date.now(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

// Esperar 6s, luego UPDATE
await new Promise((r) => setTimeout(r, 6000));
await db.zonas
  .where("nombre")
  .equals("Zona TC-003")
  .modify({ nombre: "Zona TC-003 Edit", lastModified: Date.now() });
```

| #   | Verificación Supabase                                 | Resultado esperado                |
| --- | ----------------------------------------------------- | --------------------------------- |
| 1   | `zonas?nombre=eq.Zona TC-003` (tras create + 6s)      | 1 registro                        |
| 2   | `zonas?nombre=eq.Zona TC-003 Edit` (tras update + 6s) | 1 registro con nombre actualizado |

### Catálogo Cultivos — CREATE + DELETE

```js
const db = window.__agriplanDb__;
const proyectos = await db.proyectos.toArray();
const proyectoId = proyectos[0].id;

const catalogoId = crypto.randomUUID();
await db.catalogo_cultivos.add({
  id: catalogoId,
  proyecto_id: proyectoId,
  nombre: "Cultivo TC-003",
  tier: "custom",
  lastModified: Date.now(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

// Esperar 6s, luego DELETE
await new Promise((r) => setTimeout(r, 6000));
await db.catalogo_cultivos.where("nombre").equals("Cultivo TC-003").delete();
```

| #   | Verificación Supabase                                           | Resultado esperado |
| --- | --------------------------------------------------------------- | ------------------ |
| 3   | `catalogo_cultivos?nombre=eq.Cultivo TC-003` (tras create + 6s) | 1 registro         |
| 4   | `catalogo_cultivos?nombre=eq.Cultivo TC-003` (tras delete + 6s) | Array vacío        |

### Insumos Usuario — CREATE + UPDATE

```js
const db = window.__agriplanDb__;
const terrenos = await db.terrenos.toArray();
const terrenoId = terrenos[0].id;

const insumoId = crypto.randomUUID();
await db.insumos_usuario.add({
  id: insumoId,
  terreno_id: terrenoId,
  nombre: "Insumo TC-003",
  tipo: "fertilizante",
  cantidad: 5,
  unidad: "kg",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

await new Promise((r) => setTimeout(r, 6000));
await db.insumos_usuario
  .where("nombre")
  .equals("Insumo TC-003")
  .modify({ cantidad: 99 });
```

| #   | Verificación Supabase                                        | Resultado esperado      |
| --- | ------------------------------------------------------------ | ----------------------- |
| 5   | `insumos_usuario?nombre=eq.Insumo TC-003` (tras create + 6s) | 1 registro              |
| 6   | Mismo query tras update + 6s, revisar `datos` JSONB          | `cantidad: 99` en datos |

## Expected Final State

- Zonas: "Zona TC-003 Edit" en Supabase
- Catálogo: "Cultivo TC-003" eliminado de Supabase
- Insumos: "Insumo TC-003" con `cantidad: 99` en Supabase

## Notes

- El canvas PixiJS no responde a eventos sintéticos — usar `window.__agriplanDb__` para crear zonas en tests
- `window.__agriplanDb__` solo disponible en `NODE_ENV=development` (`src/lib/db/index.ts`)
- Los hooks Dexie se disparan correctamente cuando se usa la API de Dexie (no raw IndexedDB)
