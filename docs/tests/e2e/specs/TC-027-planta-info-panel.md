# TC-027 — Panel de info de planta: etapa, Kc, días restantes y estado

## Metadata

| Campo     | Valor                                     |
| --------- | ----------------------------------------- |
| ID        | TC-027                                    |
| Feature   | PlantaInfo — detalle por planta           |
| Prioridad | Alta                                      |
| Tipo      | E2E / Browser (UI + cálculos agronómicos) |
| Ejecutor  | AI Agent (Chrome DevTools MCP)            |

## Contexto

Al hacer click en una planta en el mapa, se abre el panel `PlantaInfo` con:

- Etapa actual (plántula / joven / adulta / madura / cosechando)
- Coeficiente Kc de la etapa
- Días en la etapa actual y días restantes hasta la siguiente
- Estado de salud (activa / estresada / enferma / muerta)
- Consumo de agua estimado para esa planta

Este panel es crítico porque le dice al agricultor en qué etapa está su cultivo y cuánta agua necesita.

## Precondiciones

- Zona de cultivo con al menos 1 planta activa
- Planta con `fecha_plantacion` conocida (para verificar cálculo de etapa)
- Datos de Kc disponibles en `src/lib/data/kc-cultivos.ts`

## Pasos

| #   | Acción                                            | Resultado esperado                                      |
| --- | ------------------------------------------------- | ------------------------------------------------------- |
| 1   | Navegar a `/app`                                  | Mapa cargado                                            |
| 2   | Activar modo `🌱 Plantas`                         | Plantas visibles en el canvas                           |
| 3   | Click en una planta individual                    | Panel lateral `PlantaInfo` abre                         |
| 4   | Verificar campo "Cultivo"                         | Nombre del cultivo legible (no UUID)                    |
| 5   | Verificar campo "Etapa"                           | Una de: plántula / joven / adulta / madura / cosechando |
| 6   | Verificar campo "Kc"                              | Valor numérico entre 0.3 y 1.3 según etapa              |
| 7   | Verificar "Días en etapa"                         | Número ≥ 0 (desde `fecha_plantacion`)                   |
| 8   | Verificar "Días restantes"                        | Número > 0 o "Última etapa"                             |
| 9   | Verificar consumo estimado                        | Valor en litros o m³, > 0                               |
| 10  | Verificar que no hay crash con datos de la planta | Panel estable                                           |

## Verificación numérica (Limón, plántula, Arica)

```
Fecha plantación: registrada en IDB como planta.datos.fecha_plantacion o planta.created_at
Días desde plantación: calcular (hoy - fecha_plantacion) en días
Etapa según días:
  - plántula: 0–90 días
  - joven: 91–365 días
  - adulta: 366–1460 días (3 años)
  - madura: 1461+ días
Kc Limón plántula: ~0.5
ET0 Arica: ~4.2 mm/día
Consumo/planta: 4.2 mm/día × Kc 0.5 × espaciado² m²
```

```js
// Verificar en consola
const db = window.__agriplanDb__;
const plantas = await db.plantas.toArray();
const p = plantas[0];
console.log({
  id: p.id,
  tipo_cultivo_id: p.tipo_cultivo_id,
  estado: p.estado,
  etapa_actual: p.etapa_actual,
  fecha_plantacion: p.datos?.fecha_plantacion || p.created_at,
  diasDesdePlantacion: Math.floor(
    (Date.now() - new Date(p.datos?.fecha_plantacion || p.created_at)) /
      86400000,
  ),
});
```

## Criterios de éxito

- [ ] Panel abre al hacer click en planta (no requiere doble click)
- [ ] Nombre del cultivo legible (no UUID crudo)
- [ ] Etapa calculada correctamente según `fecha_plantacion` y duración de etapas
- [ ] Kc corresponde a la etapa actual según `kc-cultivos.ts`
- [ ] "Días restantes" = duración_etapa - días_en_etapa, ≥ 0
- [ ] Consumo estimado > 0 si planta está activa
- [ ] Panel no crashea con `etapa_actual` sin acento (ej. "plantula" → se normaliza)
- [ ] Panel no crashea con `x` / `y` null en la planta (TC-021 cubierto)

## Casos límite

- Planta con estado `muerta` → panel muestra badge "Muerta" sin consumo
- Planta sin `fecha_plantacion` → usa `created_at` como fallback
- Planta con cultivo eliminado del catálogo → muestra "Cultivo no encontrado" sin crash
- Click rápido en otra planta → panel cambia a la nueva planta

## Estado

⬜ Pendiente ejecución
