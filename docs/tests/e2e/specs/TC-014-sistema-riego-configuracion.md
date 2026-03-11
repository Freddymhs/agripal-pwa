# TC-014 — Sistema de Riego: configuración por zona

## Metadata

| Campo     | Valor                                          |
| --------- | ---------------------------------------------- |
| ID        | TC-014                                         |
| Feature   | Sistema de riego — configuración goteo/horario |
| Prioridad | Alta                                           |
| Tipo      | E2E / UI                                       |
| Creado    | 2026-03-10                                     |

## Contexto

Cada zona de cultivo puede tener un sistema de riego configurado (tipo, horario, duración). Al configurarlo, el consumo debe calcularse automáticamente. Verificar el flujo completo.

## Preconditions

- Zona de cultivo con plantas activas
- Navegar al mapa → seleccionar zona

## Steps

| #   | Acción                                              | Resultado esperado             |
| --- | --------------------------------------------------- | ------------------------------ |
| 1   | Mapa → click zona "Cultivo Norte"                   | Panel lateral con info de zona |
| 2   | "Plantas en esta zona" muestra n plantas            | Contador correcto              |
| 3   | Click "Configurar Riego"                            | Modal de configuración         |
| 4   | Seleccionar tipo: **goteo**                         | Opciones de goteo visibles     |
| 5   | Horario: 06:00, duración: **4 horas/día**           | Configuración guardada         |
| 6   | Verificar consumo calculado por el sistema          | ~X m³/día según Kc + ET0       |
| 7   | Verificar dashboard agua actualiza "días restantes" | Refleja riego configurado      |

## Expected Final State

- Riego configurado con tipo goteo
- Consumo diario calculado y mostrado en la zona
- Dashboard de agua muestra días restantes actualizado

## Notes

- Si el sistema de riego muestra "⚠️ Sistema de riego no configurado" después de configurar → bug de UI
- El consumo debe coincidir con TC-013 (mismo cálculo, diferente vista)
