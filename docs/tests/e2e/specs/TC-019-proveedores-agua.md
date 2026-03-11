# TC-019 — Proveedores de agua: historial y deduplicación

## Metadata

| Campo     | Valor                                                  |
| --------- | ------------------------------------------------------ |
| ID        | TC-019                                                 |
| Feature   | Proveedores de agua — historial por proveedor          |
| Prioridad | Media                                                  |
| Tipo      | E2E / UI + datos                                       |
| Creado    | 2026-03-10                                             |
| Estado    | 🔲 GAP conocido — proveedor es texto libre actualmente |

## Contexto

El campo "proveedor" en `entradas_agua` es texto libre. Esto fragmenta el historial: "Canal Azapa" vs "canal azapa" vs "C.Azapa" son registros distintos. Para ver "cuánto gasté con Canal Azapa en los últimos 3 meses" necesitamos consistencia.

## Steps

| #   | Acción                                               | Resultado esperado                                          |
| --- | ---------------------------------------------------- | ----------------------------------------------------------- |
| 1   | Registrar 3 entradas con proveedor "Canal Azapa"     | 3 registros con mismo proveedor                             |
| 2   | Verificar sección historial de proveedores           | Agrupado por proveedor: "Canal Azapa: 3 entregas, X m³, $Y" |
| 3   | Intentar registrar "canal azapa" (minúscula)         | Autocomplete sugiere "Canal Azapa"                          |
| 4   | Verificar que el historial consolida ambas versiones | Sin duplicados por diferencia de capitalización             |

## Gap documentado

Si paso 3 no hay autocomplete → **GAP-02** confirmado: proveedores son texto libre sin deduplicación.
Registrar en backlog: agregar autocomplete con historial de proveedores previos, o tabla `proveedores` separada.

## Workaround actual

Usar siempre el mismo formato de nombre. La búsqueda por proveedor en el historial usa match exacto.
