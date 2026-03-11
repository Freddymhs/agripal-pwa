# TC-030 — Historial de agua y contingencias: tabs de /agua

## Metadata

| Campo     | Valor                                 |
| --------- | ------------------------------------- |
| ID        | TC-030                                |
| Feature   | Agua — historial y contingencias      |
| Prioridad | Media                                 |
| Tipo      | E2E / Browser (UI + datos históricos) |
| Ejecutor  | AI Agent (Chrome DevTools MCP)        |

## Contexto

La página `/agua` tiene múltiples secciones más allá del monitoreo principal:

- **Historial**: registro cronológico de entradas de agua, con proveedor, volumen, costo
- **Contingencias**: alertas y situaciones de riesgo hídrico (escasez, encharcamiento, salinidad)

TC-013 verificó el cálculo de consumo. Este TC verifica que el historial se renderiza correctamente
y que las contingencias reflejan el estado real del estanque.

## Precondiciones

- Terreno activo con al menos 2 entradas de agua registradas (fechas distintas)
- Al menos 1 alerta activa (tipo `agua_critica`, `lavado_salino` o similar)

## Pasos — Historial de entradas

| #   | Acción                                                                | Resultado esperado          |
| --- | --------------------------------------------------------------------- | --------------------------- |
| 1   | Navegar a `/agua`                                                     | Dashboard principal visible |
| 2   | Localizar sección o tab "Historial"                                   | Listado de entradas visible |
| 3   | Verificar que cada entrada muestra: fecha, volumen, costo, proveedor  | 4 campos por entrada        |
| 4   | Verificar orden cronológico (más reciente primero)                    | Fechas en orden descendente |
| 5   | Verificar que el total acumulado coincide con la suma de entradas     | Sin discrepancias           |
| 6   | Verificar en IDB que la cantidad de entradas coincide con lo mostrado | Sin entradas ocultas        |

```js
const db = window.__agriplanDb__;
const terrenos = await db.terrenos.toArray();
const terreno = terrenos[0];
const entradas = await db.entradas_agua
  .where("terreno_id")
  .equals(terreno.id)
  .sortBy("fecha");
console.log({
  total: entradas.length,
  volumenTotal: entradas.reduce((s, e) => s + (e.datos?.volumen_m3 || 0), 0),
  costoTotal: entradas.reduce((s, e) => s + (e.datos?.costo || 0), 0),
  proveedores: [
    ...new Set(entradas.map((e) => e.datos?.proveedor).filter(Boolean)),
  ],
});
```

## Pasos — Contingencias

| #   | Acción                                                             | Resultado esperado                       |
| --- | ------------------------------------------------------------------ | ---------------------------------------- |
| 7   | Localizar sección "Contingencias" en `/agua`                       | Panel visible                            |
| 8   | Verificar que se listan alertas activas del terreno                | Mínimo 1 alerta si precondición cumplida |
| 9   | Verificar tipo de alerta: `agua_critica` muestra días restantes    | "X días de agua" visible                 |
| 10  | Verificar alerta `lavado_salino`: muestra días desde último lavado | Contador visible                         |
| 11  | Marcar una alerta como "resuelta" (si hay botón)                   | Alerta desaparece de la lista activa     |
| 12  | Verificar en IDB que el estado cambió                              | `estado: 'resuelta'` en la alerta        |

## Criterios de éxito

- [ ] Historial muestra todas las entradas de agua del terreno activo
- [ ] Datos de cada entrada son correctos (volumen, costo, fecha, proveedor)
- [ ] Cambiar de terreno (TC-025) actualiza el historial → muestra entradas del nuevo terreno
- [ ] Contingencias reflejan el estado real de alertas en IDB
- [ ] Marcar como resuelta persiste en IDB y desaparece de la vista
- [ ] Sin entradas de agua → historial vacío con mensaje "Sin entradas registradas" (no crash)
- [ ] Sin alertas activas → contingencias vacías con mensaje informativo (no crash)

## Casos límite

- Entrada de agua con `proveedor` vacío → muestra "Sin proveedor" o similar
- Múltiples entradas el mismo día → ordenadas por hora
- Entrada de agua con `costo = 0` → muestra "$0" (no oculta)

## Estado

⬜ Pendiente ejecución
