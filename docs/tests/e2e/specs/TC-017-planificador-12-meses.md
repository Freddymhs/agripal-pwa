# TC-017 — Planificador 12 meses

## Metadata

| Campo     | Valor                             |
| --------- | --------------------------------- |
| ID        | TC-017                            |
| Feature   | Planificador anual — proyecciones |
| Prioridad | Media                             |
| Tipo      | E2E / UI + cálculo                |
| Creado    | 2026-03-10                        |

## Contexto

El planificador proyecta 12 meses hacia adelante: cuánta agua se necesita, cuándo cosechar, costos mensuales. Verificar que las proyecciones usan los datos reales del terreno.

## Steps

| #   | Acción                                                      | Resultado esperado                   |
| --- | ----------------------------------------------------------- | ------------------------------------ |
| 1   | Navegar a `/agua/planificador`                              | Vista de planificador 12 meses       |
| 2   | Verificar meses de consumo proyectado                       | ~1.94 m³/día × 30 días = ~58 m³/mes  |
| 3   | Verificar eventos generados: recargas, replantas, cosechas  | Lista de eventos con fechas          |
| 4   | Verificar que higueras tienen cosecha proyectada en mes 18+ | "Cosecha estimada: mes 18" o similar |
| 5   | Cambiar frecuencia de recarga → actualiza proyección        | Dinámico                             |

## Valores esperados (terreno TC012)

```
Consumo mensual: ~58 m³/mes (1.94 × 30)
Recargas necesarias: ~7/mes (8m³ × 7 = 56m³)
Costo agua/mes: ~33.600 CLP ($4.800 × 7 recargas)
Primera cosecha higuera: ~mes 18 (si plántula)
```

## Notes

- Si el planificador muestra 0 consumo con plantas activas → bug de cálculo
- Los eventos deben ser realistas para Arica (no usar valores genéricos)
