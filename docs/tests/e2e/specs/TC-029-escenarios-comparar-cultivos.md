# TC-029 — Escenarios: comparar hasta 3 cultivos lado a lado

## Metadata

| Campo     | Valor                               |
| --------- | ----------------------------------- |
| ID        | TC-029                              |
| Feature   | Escenarios — comparador de cultivos |
| Prioridad | Media                               |
| Tipo      | E2E / Browser (UI + cálculos)       |
| Ejecutor  | AI Agent (Chrome DevTools MCP)      |

## Contexto

La página `/escenarios` permite al agricultor comparar hasta 3 cultivos diferentes en las mismas
condiciones (misma área, misma zona) para decidir qué plantar. Muestra ROI, consumo de agua y
punto de equilibrio de cada uno.

Caso de uso real: agricultor con 1 hectárea disponible quiere saber si le conviene más Limón,
Higuera o Maracuyá.

## Precondiciones

- Terreno activo con al menos 1 zona de cultivo
- Catálogo con al menos 3 cultivos disponibles
- Navegar a `/escenarios`

## Pasos

| #   | Acción                                                                           | Resultado esperado                |
| --- | -------------------------------------------------------------------------------- | --------------------------------- |
| 1   | Navegar a `http://localhost:3000/escenarios`                                     | Página carga con terreno actual   |
| 2   | Verificar que muestra el terreno correcto en el header                           | Nombre del terreno visible        |
| 3   | Seleccionar cultivo A (ej. Limón) en el primer slot                              | Datos del Limón aparecen          |
| 4   | Seleccionar cultivo B (ej. Higuera) en el segundo slot                           | Datos comparativos visibles       |
| 5   | Seleccionar cultivo C (ej. Maracuyá) en el tercer slot                           | Tabla con 3 columnas              |
| 6   | Verificar que cada cultivo muestra: inversión, ingreso 4a, ROI, punto equilibrio | 4 métricas por cultivo            |
| 7   | Verificar que los valores son distintos entre cultivos                           | No todos iguales                  |
| 8   | Identificar el "ganador" según ROI                                               | Uno de los 3 resaltado como mejor |

## Verificación numérica

```
Área de comparación: debe ser la misma para todos (ej. zona seleccionada o área estándar)
Costo agua: debe usar el mismo costo/m³ para los 3 (fair comparison)
Precio kg: desde catálogo (verificar con db.catalogo_cultivos)
```

```js
const db = window.__agriplanDb__;
const cultivos = await db.catalogo_cultivos.toArray();
const limon = cultivos.find((c) => c.nombre.toLowerCase().includes("lim"));
const higuera = cultivos.find((c) =>
  c.nombre.toLowerCase().includes("higuera"),
);
console.log({
  limon: {
    precio_min: limon?.precio_kg_min_clp,
    precio_max: limon?.precio_kg_max_clp,
  },
  higuera: {
    precio_min: higuera?.precio_kg_min_clp,
    precio_max: higuera?.precio_kg_max_clp,
  },
});
```

## Criterios de éxito

- [ ] Página carga sin "No hay terrenos creados" (TC-023 prerequisito)
- [ ] Se pueden seleccionar 3 cultivos distintos
- [ ] Cada cultivo muestra inversión, ingreso 4 años, ROI y punto de equilibrio
- [ ] Los valores matemáticos son consistentes con los de `/economia` para el mismo cultivo
- [ ] El cultivo con mejor ROI tiene algún indicador visual de "mejor opción"
- [ ] Con 1 o 2 cultivos seleccionados (sin llenar los 3 slots) la página no crashea
- [ ] Cambiar un cultivo actualiza el comparador inmediatamente

## Casos límite

- Solo 1 cultivo en catálogo → solo 1 slot disponible o slots 2 y 3 deshabilitados
- ROI de los 3 cultivos negativo → muestra todos en rojo, sin "ganador"
- Cultivo sin datos de producción en catálogo → slot muestra "sin datos" sin crash

## Coherencia con TC-015 y TC-024

Los valores de ROI en escenarios deben ser coherentes con:

- TC-015: mismo cultivo, misma zona → mismo ROI
- TC-024: si hay costo agua configurado, el comparador lo incluye

## Estado

⬜ Pendiente ejecución
