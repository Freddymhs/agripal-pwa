# TC-031 — Catálogo de cultivos: ver, editar y reflejar en cálculos

## Metadata

| Campo     | Valor                                       |
| --------- | ------------------------------------------- |
| ID        | TC-031                                      |
| Feature   | Catálogo — personalización por proyecto     |
| Prioridad | Media                                       |
| Tipo      | E2E / Browser (UI + propagación a cálculos) |
| Ejecutor  | AI Agent (Chrome DevTools MCP)              |

## Contexto

Cada proyecto tiene su propio catálogo de cultivos (copia del catálogo base al crear el proyecto).
El agricultor puede editar precios de venta y costos según su realidad local.

**Caso crítico**: si el agricultor edita el precio de venta del Limón de $600/kg a $900/kg,
los cálculos de ROI en `/economia` y `/escenarios` deben reflejar ese cambio inmediatamente.

## Precondiciones

- Proyecto activo con catálogo inicializado
- Navegar a `/catalogo`

## Pasos — Ver catálogo

| #   | Acción                                                                                | Resultado esperado                     |
| --- | ------------------------------------------------------------------------------------- | -------------------------------------- |
| 1   | Navegar a `/catalogo`                                                                 | Lista de cultivos del proyecto visible |
| 2   | Verificar que los cultivos son los del proyecto activo (no de otro proyecto)          | IDs coinciden con `proyecto_id` actual |
| 3   | Buscar/filtrar un cultivo (ej. "Limón")                                               | Filtra correctamente                   |
| 4   | Click en un cultivo                                                                   | Detalle del cultivo visible            |
| 5   | Verificar campos: nombre, precio_kg_min, precio_kg_max, produccion_kg_ha, espaciado_m | Valores no vacíos                      |

## Pasos — Editar precio de un cultivo

| #   | Acción                                                              | Resultado esperado                               |
| --- | ------------------------------------------------------------------- | ------------------------------------------------ |
| 6   | Click en editar cultivo (ej. Limón)                                 | Formulario editable                              |
| 7   | Cambiar `precio_kg_max_clp` de su valor actual a 1.5× el valor      | Campo editable                                   |
| 8   | Guardar                                                             | Cambio persistido                                |
| 9   | Verificar en IDB que el campo cambió                                | Nuevo valor en `catalogo_cultivos`               |
| 10  | Navegar a `/economia`                                               | ROI del Limón cambió (mayor con precio más alto) |
| 11  | Verificar que el ROI del Limón aumentó respecto al paso 10 de antes | Cambio proporcional                              |

## Verificación en IDB

```js
const db = window.__agriplanDb__;
const cultivos = await db.catalogo_cultivos.toArray();
const limon = cultivos.find((c) => c.nombre.toLowerCase().includes("lim"));
console.log({
  id: limon?.id,
  proyecto_id: limon?.proyecto_id,
  precio_kg_min: limon?.precio_kg_min_clp,
  precio_kg_max: limon?.precio_kg_max_clp,
  produccion_año2: limon?.produccion?.produccion_kg_ha_año2,
});
```

## Propagación a cálculos

Después de editar precio, verificar en `/economia`:

```
ROI antes: basado en precio original
ROI después: basado en precio editado
Δ ROI esperado ≈ proporcional al cambio de precio
```

```js
// Cálculo manual para verificar
const precioOriginal = 600; // CLP/kg
const precioNuevo = 900; // CLP/kg (1.5×)
const factor = precioNuevo / precioOriginal;
// Si ROI original era X%, ROI nuevo debería ser ~X% × factor (aproximado)
```

## Criterios de éxito

- [ ] Catálogo muestra cultivos del proyecto actual (no todos los proyectos)
- [ ] Editar precio persiste en IDB con `proyecto_id` correcto
- [ ] El cambio se refleja en `/economia` sin recargar la página
- [ ] El cambio se refleja en `/escenarios` en el comparador
- [ ] Dos proyectos con el mismo cultivo pueden tener precios distintos (aislamiento)
- [ ] Editar a precio 0 → validación o warning (ROI sin precio es 0)

## Casos límite

- Catálogo vacío (sin cultivos inicializados) → mensaje "Sin cultivos" no crash
- Proyecto nuevo sin catálogo → catálogo se crea automáticamente al crear proyecto
- Cultivo con `precio_kg_min > precio_kg_max` tras edición → validación UI

## Aislamiento entre proyectos

```js
const db = window.__agriplanDb__;
const catalogo = await db.catalogo_cultivos.toArray();
const porProyecto = catalogo.reduce((acc, c) => {
  acc[c.proyecto_id] = (acc[c.proyecto_id] || 0) + 1;
  return acc;
}, {});
console.log("Cultivos por proyecto:", porProyecto);
// Cada proyecto debe tener el mismo número base de cultivos
```

## Estado

⬜ Pendiente ejecución
