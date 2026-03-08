# 03: Consumo de Agua por Zona de Cultivo

**Status**: Completada
**Prioridad**: Alta
**Dependencias**: 02-estanques-funcionales

---

## Problema

Al seleccionar una zona de cultivo con plantas, no se muestra:

- Cuánta agua consumen las plantas de esta zona por semana
- Si falta o sobra agua respecto al estanque conectado
- Porcentaje de cobertura de agua

El usuario no puede tomar decisiones de riego sin esta información.

## Solución

### 3.1 Info de agua en panel de zona de cultivo

Al seleccionar zona de cultivo, agregar sección "Agua" que muestre:

- **Consumo semanal estimado**: calculado de (plantas × agua_m3_ha_año / 52 semanas × factor_temporada)
- **Estanque conectado**: cuál estanque riega esta zona (o "sin estanque")
- **Estado**: Suficiente / Ajustado / Déficit
- **Días restantes**: "Con agua actual, cubre X días para esta zona"

### 3.2 Cálculo

```
consumo_zona_semanal_m3 = (n_plantas × espaciado² × agua_m3_ha_año) / (10000 × 52) × factor_temporada
```

Donde:

- `n_plantas`: plantas vivas en la zona
- `espaciado²`: área que ocupa cada planta en m²
- `agua_m3_ha_año`: del catálogo del cultivo
- `factor_temporada`: FACTORES_TEMPORADA[temporada_actual]

### 3.3 Vista de estanque → zonas

Al seleccionar un estanque, mostrar tabla:

| Zona       | Cultivo | Plantas | Consumo/sem | % del total |
| ---------- | ------- | ------- | ----------- | ----------- |
| Zona Norte | Olivo   | 500     | 12.3 m³     | 45%         |
| Zona Sur   | Tuna    | 300     | 8.1 m³      | 30%         |
| **Total**  |         | **800** | **27.4 m³** | **100%**    |

## Datos estáticos disponibles

- `CatalogoCultivo.agua_m3_ha_año_min/max` — ya existe
- `FACTORES_TEMPORADA` — ya existe
- `calcularConsumoTerreno()` en `src/lib/utils/agua.ts` — ya existe pero es global, no por zona

## Archivos a modificar

- `src/lib/utils/agua.ts` — agregar `calcularConsumoZona(zona, plantas, cultivos)`
- `src/components/mapa/editor-zona.tsx` — agregar sección de agua cuando tipo=cultivo
- `src/components/mapa/estanque-panel.tsx` — tabla de consumo por zona conectada
