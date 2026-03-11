# TC-020 — Mapa stress: terreno grande con 2000+ plantas

## Metadata

| Campo     | Valor                                            |
| --------- | ------------------------------------------------ |
| ID        | TC-020                                           |
| Feature   | Mapa PixiJS — renderizado y selección de plantas |
| Prioridad | Alta                                             |
| Tipo      | E2E / stress / UI                                |
| Creado    | 2026-03-10                                       |

## Contexto

Verificar que la app soporta terrenos con más de 2000 plantas distribuidas en múltiples zonas de cultivo sin crash, sin NaN en consumo y con selección individual funcional.

Terreno de referencia: **Don Rodrigo — Sandbox 200×200** (200×200m)

- 4 zonas cultivo: Guayabas Norte (520), Limoneros (225), Olivar (320), Pitahaya Sur (1200)
- 4 zonas infraestructura: Estanque, Casa y Bodega, Camino Central, Ampliación Futura
- Total: **2265 plantas**

## Steps

| #   | Acción                                                               | Resultado esperado                                                                       |
| --- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 1   | Seleccionar terreno 200×200m con 2265 plantas                        | App carga sin error boundary. Mapa renderiza todas las zonas                             |
| 2   | Verificar info bar                                                   | `2265 plantas` visible. `consume X m³/sem` es número válido (no NaN ni Infinity)         |
| 3   | Activar modo **Plantas**                                             | Botón "Plantas" resaltado. Tooltip "Shift+arrastrar" visible. Sin crash                  |
| 4   | Click en una planta de zona Limoneros (zona pequeña, 225 plantas)    | Panel lateral muestra "Planta" con estado, etapa, posición, Kc, opciones. Sin crash      |
| 5   | Click en una planta de zona Pitahaya Sur (zona grande, 1200 plantas) | Panel lateral aparece correctamente. Sin error boundary                                  |
| 6   | Click en área vacía (zona gris sin plantas) en modo Plantas          | Panel NO cambia. Sin crash                                                               |
| 7   | Activar Shift+drag sobre zona Limoneros completa                     | Plantas en rectángulo quedan seleccionadas. Panel muestra "Selección Múltiple" con count |
| 8   | Presionar ESC                                                        | Selección múltiple limpia. Panel vuelve a info general                                   |

## Criterios de aceptación

- Ningún paso dispara el error boundary "Error en Inicio"
- `consume X m³/sem` en info bar es siempre un número finito > 0
- Click en planta individual abre panel con datos coherentes (posición en metros, etapa válida, Kc > 0)
- El mapa sigue respondiendo a interacciones después del stress load (no se congela)

## Bugs encontrados y corregidos en esta sesión

### BUG-STRESS-01 — Crash al seleccionar planta con datos corruptos

**Síntoma:** Click en planta → error boundary "Error en Inicio" inmediato
**Root cause:** `ETAPA_INFO[planta.etapa_actual].emoji` lanzaba TypeError cuando `etapa_actual` tenía valor no reconocido (ej: `"plantula"` sin acento vs `"plántula"` correcto)
**Fix:** `src/components/plantas/planta-info.tsx` — fallback defensivo: si `etapa_actual` no existe en `ETAPA_INFO`, usar `ETAPA.ADULTA`

### BUG-STRESS-02 — TypeError en posición si x/y es null

**Síntoma:** `planta.x.toFixed(1)` crasheaba si planta tenía `x: null`
**Fix:** `src/components/plantas/planta-info.tsx` — `(planta.x ?? 0).toFixed(1)`

## Notes

- Plantas insertadas directamente por IDB (stress test manual) pueden tener datos corruptos que el flujo normal de la app nunca genera. Los fixes son defensivos para tolerar IDB corruption.
- El primer carga puede tardar más de 5 segundos con 2000+ plantas debido al sistema de sync procesando la cola.
