# 06: Clima Impactando Riego

**Status**: Completada
**Prioridad**: Media
**Dependencias**: FASE_5B (clima básico ya existe), 02-estanques-funcionales

---

## Problema

- Existe `/clima` pero los datos climáticos no impactan los cálculos de riego
- La humedad, temperatura y sequedad deberían modificar la cantidad de agua necesaria
- No se considera la camanchaca (neblina costera) como fuente de agua en Arica
- El cambio de goteo manual a automático debería basarse en variantes climáticas

## Solución

### 6.1 Factores climáticos en cálculo de riego

Actualmente solo se usa `FACTORES_TEMPORADA` (estacional). Agregar:

```typescript
interface FactorClimatico {
  temperatura_media_c: number;
  humedad_relativa_pct: number;
  evapotranspiracion_mm_dia: number; // ETo
  factor_ajuste: number; // multiplicador sobre consumo base
}
```

La evapotranspiración (ETo) es la métrica estándar para ajustar riego:

- ETo alta (>6 mm/día) → más agua
- ETo baja (<3 mm/día) → menos agua
- Humedad alta → reduce necesidad de riego

### 6.2 Camanchaca como fuente

En Arica, la camanchaca (neblina) aporta agua en madrugadas. Esto es relevante para:

- Reducir consumo de estanque en época de camanchaca
- Captura de agua con atrapanieblas (infraestructura futura)

Datos estáticos: meses con camanchaca, mm/día estimado por zona

### 6.3 Recomendación de sistema de riego

Basado en clima + cultivo, recomendar:

- Goteo manual: zonas secas, pocas plantas, bajo presupuesto
- Goteo eléctrico: variantes de clima requieren ajuste frecuente
- Aspersión: cultivos que toleran mojado foliar

### 6.4 Datos estáticos

`data/static/clima/` ya existe. Agregar:

- `evapotranspiracion-arica.json` — ETo mensual promedio
- `camanchaca-arica.json` — meses y aporte estimado

## Datos estáticos disponibles

- `data/static/clima/` — ya existe con datos climáticos
- `FACTORES_TEMPORADA` — ya existe
- `PlantClima` en CatalogoCultivo — temp_min, temp_max, tolerancia_heladas

## Archivos a crear/modificar

- `data/static/clima/evapotranspiracion-arica.json`
- `src/lib/utils/agua.ts` — integrar ETo en cálculo de consumo
- `src/app/clima/page.tsx` — mostrar impacto en riego
