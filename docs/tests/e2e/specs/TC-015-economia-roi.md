# TC-015 — Economía: ROI y punto de equilibrio

## Metadata

| Campo     | Valor                                           |
| --------- | ----------------------------------------------- |
| ID        | TC-015                                          |
| Feature   | Economía — ROI, inversión, ingresos proyectados |
| Prioridad | Alta                                            |
| Tipo      | E2E / UI + cálculo                              |
| Creado    | 2026-03-10                                      |

## Contexto

La página `/economia` debe mostrar el ROI del cultivo, inversión total, ingresos proyectados y punto de equilibrio. Los números deben tener lógica real para Arica (Marcos entiende "$X en mes Y", NO "ROI 45%").

## Preconditions

- Terreno con plantas activas (naranjos + higueras)
- Al menos 1 entrada de agua registrada (costo)
- Cultivos con precios de mercado en catálogo

## Steps

| #   | Acción                                              | Resultado esperado                                  |
| --- | --------------------------------------------------- | --------------------------------------------------- |
| 1   | Navegar a `/economia`                               | Panel de economía visible                           |
| 2   | Verificar "Inversión total"                         | Suma plantas + agua + otros insumos                 |
| 3   | Verificar inversión plantas                         | 6 naranjos × $8.000 + 6 higueras × $6.000 = $84.000 |
| 4   | Verificar costo agua registrada                     | $4.800 (entrada TC012)                              |
| 5   | Verificar ingresos proyectados                      | Precio mercado × kg estimado × nPlantas             |
| 6   | Verificar "mes de equilibrio"                       | En pesos, no como % abstracto                       |
| 7   | Verificar que cambiar cultivos actualiza el cálculo | Dinámica en tiempo real                             |

## Cálculo de referencia

```
Inversión plantas:    $84.000 CLP
Costo agua registrado: $4.800 CLP
Total invertido:      $88.800+ CLP

Higuera madura: ~15 kg/árbol/año × $1.500/kg = $22.500/árbol
6 higueras: $135.000/año (año 2-3)
→ Punto de equilibrio plantas+agua: ~8 meses producción
```

## Expected Final State

- Números en CLP, no en abstracciones
- "Punto de equilibrio" en mes X, no en porcentaje
- Cambiar # plantas actualiza ROI en tiempo real

## Gaps esperados

- Si el catálogo no tiene precio de naranjo/higuera → mostrar advertencia
- Si no hay cosecha registrada → ingresos son proyección (marcarlo así)
