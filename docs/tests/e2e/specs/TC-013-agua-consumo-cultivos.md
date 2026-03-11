# TC-013 — Agua: consumo real vs cultivos plantados

## Metadata

| Campo     | Valor                                |
| --------- | ------------------------------------ |
| ID        | TC-013                               |
| Feature   | Gestión del agua — consumo calculado |
| Prioridad | Alta                                 |
| Tipo      | E2E / UI + cálculo                   |
| Creado    | 2026-03-10                           |

## Contexto

La app debe calcular cuánta agua consume el terreno diariamente basándose en las plantas activas (ET0 × Kc × espaciado²). Verificar que el número en el dashboard de agua calce con los valores agronómicos reales.

## Preconditions

- Terreno seleccionado con zonas de cultivo y plantas activas
- Estanque con capacidad configurada
- Al menos 1 entrada de agua registrada

## Steps

| #   | Acción                                                                | Resultado esperado                       |
| --- | --------------------------------------------------------------------- | ---------------------------------------- |
| 1   | Navegar a `/agua` con terreno activo                                  | Dashboard visible                        |
| 2   | Verificar "m³/semana" o consumo diario                                | Valor > 0 si hay plantas activas         |
| 3   | Comparar con cálculo manual: ET0 × Kc × espaciado² × nPlantas         | Diferencia < 10%                         |
| 4   | Verificar "días de agua restantes"                                    | `nivel_estanque / consumo_diario`        |
| 5   | Verificar que el nivel del estanque coincide con entradas registradas | Suma de `entradas_agua.datos.volumen_m3` |

## Cálculo de referencia (Arica)

```
ET0 = 4.2 mm/día
Kc naranjo plántula = 0.5  → 0.134 m³/planta/día
Kc higuera adulta = 0.7    → 0.188 m³/planta/día
6 naranjos + 6 higueras    → 1.94 m³/día
8 m³ disponibles           → ~4 días
```

## Expected Final State

- Consumo diario mostrado en UI calza con cálculo manual (±10%)
- Días restantes = nivel / consumo, redondeado conservadoramente
- Sin mensajes de error de configuración si hay estanque + plantas
