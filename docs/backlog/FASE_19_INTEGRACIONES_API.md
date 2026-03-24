# FASE 19: Integraciones API Externas (Clima + Precios)

**Status**: ✅ COMPLETADA — 2026-03-21
**Prioridad**: 🔴 CRÍTICA
**Dependencias**: `agriplan-api-nestjs` FASE_0 + FASE_2 + FASE_3
**Última revisión**: 2026-03-21

> **Nota de implementación**: La tabla se llama `precios_actual` (no `precios_mercado`).
> El ROI refactor fue completado en commit `1fa7e6d` — usa `cultivo_base_id` como puente
> hacia `precios_actual.cultivo_id`. La API actualiza ambas tablas via cron cada 6h.

---

## Arquitectura

```
API NestJS (cron)
  → Open-Meteo     → UPDATE clima_actual    en Supabase
  → ODEPA          → UPDATE precios_mercado en Supabase

PWA (sin cambios en DAL/hooks)
  → lee clima_actual        (ya lo hace hoy)
  → lee precios_mercado   (tabla nueva — ver abajo)
```

La PWA no habla con APIs externas. Solo lee Supabase como siempre.
La API NestJS es el único motor que consume fuentes externas y mantiene Supabase actualizado.

---

## PARTE A: Clima

### Tabla existente: `clima_actual`

Cada fila = una región (Arica Pampa 1086m, Iquique, Antofagasta, etc.).
El usuario elige su región desde la UI → `proyectos.clima_actual_id`.
La API actualiza cada fila leyendo las coordenadas `datos.coordenadas.lat/lon` que ya están en el JSONB.
**Agnóstico por diseño**: funciona para todas las regiones sin hardcodear nada.

### Campos que actualiza la API (Open-Meteo):

| Campo en JSONB `datos`               | Fuente Open-Meteo             |
| ------------------------------------ | ----------------------------- |
| `evapotranspiracion.et0_mm_dia`      | ET0 promedio período          |
| `evapotranspiracion_detalle.mensual` | ET0 diario → agrupado por mes |
| `temperatura.maxima_verano_c`        | `temperature_2m_max`          |
| `temperatura.minima_historica_c`     | `temperature_2m_min`          |
| `temperatura.promedio_anual_c`       | Promedio calculado            |
| `lluvia.anual_mm`                    | `precipitation_sum` acumulado |
| `actualizado_en`                     | Timestamp de la actualización |
| `fuente_real`                        | `"open-meteo"`                |

### Campos que NO toca la API (calibrados manualmente):

- `estacionalidad.*.factor_agua` — coeficientes agronómicos investigados
- `heladas.plantas_sensibles` — catálogo, no meteorología
- `viento.direccion_predominante` — estadístico histórico
- `fuentes` — referencias bibliográficas

### Endpoint Open-Meteo a usar:

```
GET https://api.open-meteo.com/v1/forecast
  ?latitude={lat}
  &longitude={lon}
  &daily=temperature_2m_max,temperature_2m_min,et0_fao_evapotranspiration,precipitation_sum
  &timezone=America%2FSantiago
  &forecast_days=16
```

### Cron en API NestJS:

- Frecuencia: cada 1 hora
- Lee todas las filas de `clima_actual` con coordenadas definidas
- Para cada fila → fetch Open-Meteo → UPDATE JSONB

### Cambios en PWA: ninguno

`useDatosBase` ya carga `clima_actual` completo. Los campos nuevos (`actualizado_en`, etc.) aparecen automáticamente en el objeto deserializado.

Opcional de bajo costo: mostrar `datos.actualizado_en` en la UI de `/datos/clima`.

---

## PARTE B: Precios

### Problema con la arquitectura actual

El ROI usa `catalogo_cultivos.precio_kg_min_clp` y `precio_kg_max_clp` — campos embebidos en el catálogo per-proyecto. Esto es un anti-pattern: el precio de mercado no debería vivir en el catálogo del usuario porque:

- El catálogo es personal/editable por el usuario
- Los precios de mercado son compartidos y cambian frecuentemente
- Si el precio está en el catálogo, actualizar precios reales requiere tocar datos del usuario

### Arquitectura correcta: tabla `precios_mercado` (nueva, compartida)

```sql
CREATE TABLE precios_mercado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cultivo_id TEXT NOT NULL,       -- mismo ID que catalogo_base
  region TEXT NOT NULL,           -- "arica", "iquique", "antofagasta"
  nombre_odepa TEXT,              -- nombre exacto en ODEPA para hacer match
  precio_min_clp INTEGER,
  precio_max_clp INTEGER,
  precio_actual_clp INTEGER,
  tendencia TEXT,                 -- "alza" | "estable" | "baja"
  actualizado_en TIMESTAMPTZ,
  fuente TEXT DEFAULT 'seed',     -- "seed" | "odepa"
  UNIQUE (cultivo_id, region)
);
```

- RLS: solo lectura para usuarios autenticados
- API escribe con `service_role`
- Seed inicial: los precios actuales de `precios_base` migran aquí

### Campo `nombre_odepa`

ODEPA puede llamar "Durazno conservero" a lo que en el catálogo es "Durazno".
El campo `nombre_odepa` es el mapeo manual entre catálogo y ODEPA.

- Si `nombre_odepa` está definido → la API hace match y actualiza el precio
- Si `nombre_odepa` es NULL → el cultivo no tiene precio ODEPA asignado
- La PWA debe mostrar alerta en la página de catálogo para cultivos sin `nombre_odepa`

### Refactor del ROI (necesario)

`calcularPrecioKgPromedio()` actualmente lee del catálogo:

```typescript
// ANTES (anti-pattern)
return (cultivo.precio_kg_min_clp + cultivo.precio_kg_max_clp) / 2;

// DESPUÉS
// recibe precio como parámetro externo desde precios_mercado
```

El hook que llama al ROI debe:

1. Cargar `precios_mercado` filtrado por región del proyecto
2. Pasar el precio correspondiente a cada cultivo al calcular el ROI

### Migración SQL necesaria:

```sql
-- 1. Crear tabla precios_mercado
-- 2. Migrar datos de precios_base a precios_mercado (con region = 'arica' por defecto)
-- 3. Eliminar tabla precios_base (ya reemplazada)
-- 4. Quitar precio_kg_min_clp y precio_kg_max_clp de catalogo_base y catalogo_cultivos
```

> ⚠️ Este refactor es un cambio significativo. Requiere actualizar:
>
> - `src/types/index.ts` — interfaz `CatalogoCultivo`
> - `src/lib/utils/helpers-cultivo.ts` — `calcularPrecioKgPromedio()`
> - `src/lib/utils/roi.ts` — firma de `calcularROI()`
> - `src/lib/dal/base-data.ts` — agregar query a `precios_mercado`
> - `src/hooks/use-datos-base.ts` — exponer precios por región
> - Todos los componentes que usan ROI

### Cron en API NestJS:

- Frecuencia: cada 6 horas
- Fetch ODEPA CKAN para cada región activa
- Para cada precio recibido → buscar en `precios_mercado` por `nombre_odepa` → UPDATE
- Si ODEPA falla → mantener datos anteriores (no sobreescribir)

---

## Orden de implementación recomendado

1. **API NestJS FASE_0** — setup base (ScheduleModule, SupabaseAdminModule)
2. **API NestJS FASE_2** — módulo clima (cron → Open-Meteo → UPDATE `clima_actual`)
3. **Refactor PWA precios** — crear `precios_mercado`, refactorizar ROI (puede ser FASE independiente)
4. **API NestJS FASE_3** — módulo precios (cron → ODEPA → UPDATE `precios_mercado`)

El clima se puede implementar y desplegar sin esperar el refactor de precios.

---

## Verificación

### Clima:

1. `GET /api/v1/clima?lat=-18.3660&lon=-70.0450` → responde con datos Open-Meteo
2. Supabase: `SELECT datos->>'actualizado_en' FROM clima_actual WHERE region LIKE '%arica%'`
3. PWA `/datos/clima` → muestra `actualizado_en` en la UI

### Precios:

1. `GET /api/v1/precios?region=arica` → responde con precios ODEPA
2. Supabase: `SELECT precio_actual_clp, fuente FROM precios_mercado WHERE region = 'arica'`
3. PWA `/economia` → ROI usa precio de `precios_mercado`, no del catálogo

---

## Estado de tablas

| Tabla                       | Hoy             | Post-FASE_19                                    |
| --------------------------- | --------------- | ----------------------------------------------- |
| `clima_actual`              | ✅ Existe, seed | ✅ Existe, actualizada por API                  |
| `precios_base`              | ✅ Existe, seed | ❌ Reemplazada por `precios_mercado`            |
| `precios_mercado`           | ❌ No existe    | ✅ Tabla nueva, fuente única de precios         |
| `catalogo_base.precio_kg_*` | ✅ Existe       | ❌ Eliminado (precio sale de `precios_mercado`) |
