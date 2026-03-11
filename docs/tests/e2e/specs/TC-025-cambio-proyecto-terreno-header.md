# TC-025 — Cambio de proyecto/terreno desde el header: mapa recarga correctamente

## Metadata

| Campo     | Valor                               |
| --------- | ----------------------------------- |
| ID        | TC-025                              |
| Feature   | ProjectContext — selección dinámica |
| Prioridad | Alta                                |
| Tipo      | E2E / Browser (interacción UI)      |
| Ejecutor  | AI Agent (Chrome DevTools MCP)      |

## Contexto

El header en `/app` muestra el proyecto y terreno actualmente seleccionados. El usuario puede
cambiar entre proyectos y terrenos sin recargar la página. El `ProjectContext` debe reflejar
el cambio en todos los hooks dependientes (zonas, plantas, alertas, agua).

**Flujo crítico**: agricultor que tiene 2 terrenos distintos y necesita comparar o gestionar ambos.

## Precondiciones

- Al menos 2 proyectos creados, cada uno con al menos 1 terreno
- Terrenos con zonas y plantas distintas (para distinguir visualmente el cambio)
- Usuario en `/app`

## Verificación en IDB antes del test

```js
const db = window.__agriplanDb__;
const proyectos = await db.proyectos.toArray();
const terrenos = await db.terrenos.toArray();
console.log({
  proyectos: proyectos.map((p) => p.nombre),
  terrenos: terrenos.map((t) => t.nombre),
});
```

## Pasos — Cambio de terreno (mismo proyecto)

| #   | Acción                                                      | Resultado esperado                          |
| --- | ----------------------------------------------------------- | ------------------------------------------- |
| 1   | Navegar a `/app`                                            | Mapa cargado con terreno A                  |
| 2   | Anotar nombre y dimensiones del terreno actual en el header | Estado inicial conocido                     |
| 3   | Click en el nombre del terreno en el header                 | Dropdown con lista de terrenos del proyecto |
| 4   | Seleccionar terreno B                                       | Header actualiza nombre y dimensiones       |
| 5   | Verificar mapa                                              | Muestra zonas y plantas del terreno B       |
| 6   | Verificar `localStorage.getItem('agriplan_terreno_actual')` | ID del terreno B                            |
| 7   | Navegar a `/agua`                                           | Muestra datos de agua del terreno B (no A)  |
| 8   | Volver a `/app`                                             | Terreno B sigue seleccionado                |

## Pasos — Cambio de proyecto

| #   | Acción                                                               | Resultado esperado                  |
| --- | -------------------------------------------------------------------- | ----------------------------------- |
| 9   | Click en el nombre del proyecto en el header                         | Dropdown con lista de proyectos     |
| 10  | Seleccionar proyecto distinto                                        | Header actualiza proyecto y terreno |
| 11  | Verificar que el terreno cambió al primer terreno del nuevo proyecto | No queda el terreno anterior        |
| 12  | Verificar `localStorage.getItem('agriplan_proyecto_actual')`         | ID del nuevo proyecto               |
| 13  | Mapa muestra zonas del nuevo terreno                                 | Sin datos del terreno anterior      |

## Criterios de éxito

- [ ] Header se actualiza inmediatamente al cambiar terreno
- [ ] Mapa recarga zonas y plantas sin recargar la página
- [ ] `/agua` y `/economia` muestran datos del terreno seleccionado
- [ ] `localStorage` persiste la selección
- [ ] Al hacer hard refresh, el terreno correcto carga (TC-023 verificado)
- [ ] Al cambiar proyecto, el terreno se resetea al primero del nuevo proyecto

## Casos límite

- Terreno sin zonas → mapa vacío (no crash)
- Proyecto sin terrenos → header muestra "Sin terreno" o botón crear
- Cambio rápido (click proyecto A → proyecto B antes de cargar) → queda en B

## Estado

⬜ Pendiente ejecución
