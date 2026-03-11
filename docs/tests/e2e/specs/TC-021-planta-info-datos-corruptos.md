# TC-021 — PlantaInfo: datos corruptos en IDB no crashean el panel

## Metadata

| Campo     | Valor                              |
| --------- | ---------------------------------- |
| ID        | TC-021                             |
| Feature   | PlantaInfo — renderizado defensivo |
| Prioridad | Alta                               |
| Tipo      | Unit / regresión                   |
| Creado    | 2026-03-10                         |

## Contexto

Plantas insertadas directamente en IndexedDB (stress tests, migración manual o corrupción de datos) pueden tener campos con valores que el flujo normal de la app nunca genera:

- `etapa_actual: "plantula"` (sin acento) — no existe como clave en `ETAPA_INFO`
- `etapa_actual: null` o `undefined`
- `x: null` / `y: null`

Antes del fix, cualquiera de estos valores lanzaba un `TypeError` en el render de `PlantaInfo` y disparaba el error boundary "Error en Inicio".

**Componente afectado:** `src/components/plantas/planta-info.tsx`

## Steps

| #   | Acción                                                                                 | Resultado esperado                                                             |
| --- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 1   | Renderizar `<PlantaInfo>` con planta que tiene `etapa_actual: "plantula"` (sin acento) | Componente renderiza sin error. Muestra etapa fallback `ETAPA.ADULTA` (Adulta) |
| 2   | Renderizar `<PlantaInfo>` con planta que tiene `etapa_actual: null`                    | Componente renderiza sin error. Muestra etapa fallback `ETAPA.ADULTA`          |
| 3   | Renderizar `<PlantaInfo>` con planta que tiene `etapa_actual: undefined`               | Componente renderiza sin error. Muestra etapa fallback `ETAPA.ADULTA`          |
| 4   | Renderizar `<PlantaInfo>` con planta que tiene `x: null, y: null`                      | Posición muestra `(0.0m, 0.0m)` sin error. Sin crash en `.toFixed(1)`          |
| 5   | Renderizar `<PlantaInfo>` con planta completamente válida                              | Comportamiento normal sin cambios. Etapa y posición correctas                  |

## Criterios de aceptación

- `ETAPA_INFO[etapaActual]` nunca lanza `TypeError` en render, incluso con valor desconocido
- Fallback de etapa es `ETAPA.ADULTA` (no `undefined`, no crash)
- `(planta.x ?? 0).toFixed(1)` nunca lanza `TypeError`
- El componente renderiza el panel completo (estado, etapa, Kc, posición, botones) para cualquier combinación de campos corruptos
- No regresión: plantas con datos válidos siguen mostrando sus valores reales

## Implementación del fix

**`src/components/plantas/planta-info.tsx`**

```typescript
// Fallback defensivo: valores corruptos en IDB (e.g. sin acento) no deben crashear el render.
const etapaActual: EtapaCrecimiento =
  planta.etapa_actual && ETAPA_INFO[planta.etapa_actual]
    ? planta.etapa_actual
    : ETAPA.ADULTA;
```

```tsx
{(planta.x ?? 0).toFixed(1)}m, {(planta.y ?? 0).toFixed(1)}m)
```

## Notes

- `ETAPA_INFO` tiene claves con acento (`"plántula"`, `"jóven"`). Stress tests que insertan plantas via IDB directo pueden usar versiones sin acento.
- El flujo normal de la app (formularios de plantación) siempre usa los valores del enum `ETAPA`, que son las claves correctas. El fix es defensivo para tolerancia a datos externos.
- Kc también se beneficia del fallback: `getKc(cultivo.nombre, ETAPA.ADULTA)` devuelve un valor válido en lugar de potencialmente buscar una clave inexistente.
