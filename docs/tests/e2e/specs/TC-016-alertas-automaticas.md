# TC-016 — Alertas automáticas: generación y sync

## Metadata

| Campo     | Valor               |
| --------- | ------------------- |
| ID        | TC-016              |
| Feature   | Alertas automáticas |
| Prioridad | Media               |
| Tipo      | E2E / UI + sync     |
| Creado    | 2026-03-10          |

## Contexto

La app genera alertas automáticas basadas en condiciones reales: agua crítica (<7 días), replanta pendiente, lavado salino (30+ días sin lavado), riesgo encharcamiento. Verificar que se generan correctamente y se sincronizan a Supabase.

## Steps

| #   | Acción                                                  | Resultado esperado                                       |
| --- | ------------------------------------------------------- | -------------------------------------------------------- |
| 1   | Con 8m³ agua y consumo 1.94m³/día → días restantes = ~4 | Alerta "agua_critica" generada (<7 días)                 |
| 2   | Navegar a UI → sección alertas                          | Alerta visible con severidad "alta"                      |
| 3   | Verificar tipo: `agua_critica`                          | Campo `tipo` correcto en alerta                          |
| 4   | Esperar sync                                            | `alertas?terreno_id=eq.{id}` en Supabase tiene la alerta |
| 5   | Marcar alerta como revisada                             | Estado cambia a "revisada"                               |
| 6   | Verificar update llega a Supabase                       | `estado: 'revisada'` en Supabase                         |

## Tipos de alerta a verificar

- `agua_critica` — < 7 días de agua disponible
- `replanta_pendiente` — zona sin plantas desde hace X días
- `lavado_salino` — 30+ días sin lavado programado
- `riesgo_encharcamiento` — entrada de agua excede capacidad estanque

## Notes

- Las alertas tienen FK `terreno_id` — si el terreno no está en Supabase, RLS falla (error tolerado, non-critical)
- En sesión anterior: alertas huérfanas generaban error RLS en initial upload → ya corregido (critica: false)
