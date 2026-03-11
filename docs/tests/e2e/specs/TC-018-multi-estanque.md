# TC-018 — Multi-estanque: asignación por zona

## Metadata

| Campo     | Valor                                     |
| --------- | ----------------------------------------- |
| ID        | TC-018                                    |
| Feature   | Múltiples estanques — asignación por zona |
| Prioridad | Media                                     |
| Tipo      | E2E / UI + lógica                         |
| Creado    | 2026-03-10                                |
| Estado    | ✅ Implementado (FASE_8B — 2026-03-10)    |

## Contexto

Un terreno puede tener 2+ estanques. Cada zona de cultivo puede asignarse a un estanque específico desde el panel lateral de zona. El consumo de esa zona genera una alerta `agua_critica` referenciando el estanque asignado (no el pool global). Si no hay estanque asignado, el comportamiento es igual al anterior (pool global).

## Steps

| #   | Acción                                                                       | Resultado esperado                                                             |
| --- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 1   | Crear segunda zona tipo "estanque" en el terreno                             | Segunda zona estanque visible en el mapa                                       |
| 2   | Seleccionar zona "Cultivo Norte" → panel lateral muestra "Estanque de riego" | Dropdown visible con "Sin asignar" + los 2 estanques disponibles               |
| 3   | Asignar "Cultivo Norte" → Estanque A, "Cultivo Sur" → Estanque B             | `zona.estanque_id` guardado en IDB (verificar DevTools → IndexedDB → zonas)    |
| 4   | Vacilar Estanque A a < 7 días de consumo de Cultivo Norte                    | Alerta `agua_critica` con `zona_id = estanque_A.id` y nombre del estanque      |
| 5   | Verificar Estanque B sin alerta individual                                   | No hay alerta per-estanque para Estanque B                                     |
| 6   | Quitar asignación de "Cultivo Norte" → "Sin asignar"                         | `zona.estanque_id = undefined`, alerta per-estanque desaparece en próximo sync |

## Expected Final State

- Selector "Estanque de riego" visible solo cuando hay 2+ estanques en el terreno
- `zona.estanque_id` persiste en IDB y sincroniza con Supabase via campo `estanque_id` en tabla `zonas`
- Alerta `agua_critica` per-estanque aparece cuando el estanque asignado tiene < 7 días de cobertura
- Zonas sin asignación mantienen comportamiento anterior (pool global del terreno)

## Archivos implementados

- `src/types/index.ts` — `estanque_id?: UUID` en interface `Zona`
- `src/components/mapa/zona-cultivo-panel.tsx` — selector UI
- `src/lib/utils/alertas.ts` — alertas per-estanque
- `supabase/migrations/002_zona_estanque_id.sql` — migración schema
