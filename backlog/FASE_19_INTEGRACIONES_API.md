# FASE 19: Integraciones API Externas (Clima + Precios)

**Status**: ⏳ PENDIENTE
**Prioridad**: 🟢 BAJA
**Dependencias**: FASE_12 (IndexedDB caché para offline)
**Estimación**: 3-4 horas
**Última revisión**: 2026-03-01

---

## Estado Real del Código (auditado 2026-03-01)

La app usa datos estáticos locales. Las integraciones reemplazan/actualizan esos datos con información en tiempo real cuando hay conexión, con fallback al estático cuando no hay red.

| Datos estáticos actuales                      | Archivo                                           | Estado              |
| --------------------------------------------- | ------------------------------------------------- | ------------------- |
| Clima Arica (temp, viento, humedad)           | `data/static/clima/arica.json`                    | ✅ Funciona offline |
| ET0 mensual Arica                             | `data/static/clima/evapotranspiracion-arica.json` | ✅ Funciona offline |
| Precios de mercado CLP/kg                     | `data/static/mercado/precios-arica.json`          | ✅ Funciona offline |
| Loader climate: `src/lib/data/clima-arica.ts` | ✅ Existe                                         | Carga JSON estático |
| Loader precios: `src/lib/data/mercado.ts`     | ✅ Existe                                         | Carga JSON estático |

---

## Objetivo

Actualizar datos de clima y precios con fuentes reales cuando hay internet, manteniendo el fallback a datos estáticos para modo offline.

**Principio**: las APIs son una mejora progresiva — la app funciona igual sin ellas.

---

## API 1: Open-Meteo (Clima real)

- **URL**: https://open-meteo.com
- **Costo**: Gratis, sin API key
- **Datos**: Forecast 16 días, temperatura, precipitación, ET0 FAO-56, radiación solar
- **Impacto en la app**: mejora cálculos de GDD (plagas), consumo hídrico real, alertas de helada

### Endpoint a usar

```
GET https://api.open-meteo.com/v1/forecast
  ?latitude=-18.4783
  &longitude=-70.3126
  &daily=temperature_2m_max,temperature_2m_min,et0_fao_evapotranspiration,precipitation_sum
  &timezone=America%2FSantiago
  &forecast_days=16
```

### Estrategia de integración

```typescript
// src/lib/data/clima-arica.ts — modificar
export async function getClimaActual(): Promise<ClimaData> {
  try {
    const cached = await db.cache.get("clima_open_meteo");
    // Usar caché si tiene menos de 6 horas
    if (cached && Date.now() - cached.updated < 6 * 60 * 60 * 1000) {
      return cached.data as ClimaData;
    }
    const response = await fetch("https://api.open-meteo.com/v1/forecast?...");
    const raw = await response.json();
    const data = mapOpenMeteoToClimaData(raw);
    await db.cache.put({ key: "clima_open_meteo", data, updated: Date.now() });
    return data;
  } catch {
    // Fallback a datos estáticos — funciona siempre offline
    return CLIMA_ARICA_ESTATICO;
  }
}
```

### Tabla `cache` en IndexedDB

Agregar a `src/lib/db/index.ts` si no existe:

```typescript
cache: Table<{ key: string; data: unknown; updated: number }>;
// stores: cache: 'key'
```

---

## API 2: ODEPA Precios de Mercado

- **URL**: https://datos.odepa.gob.cl
- **Costo**: Gratis, sin API key
- **Datos**: Precios mayoristas frutas/hortalizas Chile, actualización diaria
- **Impacto en la app**: ROI más preciso, alertas de precio bajo en `/economia`

### Estrategia de integración

```typescript
// src/lib/data/mercado.ts — modificar
export async function getPreciosMercado(): Promise<PreciosMercado> {
  try {
    const cached = await db.cache.get("precios_odepa");
    // Actualizar una vez al día máximo
    if (cached && Date.now() - cached.updated < 24 * 60 * 60 * 1000) {
      return cached.data as PreciosMercado;
    }
    const response = await fetch("https://datos.odepa.gob.cl/api/...");
    const raw = await response.json();
    const data = mapOdepaToPrecios(raw);
    await db.cache.put({ key: "precios_odepa", data, updated: Date.now() });
    return data;
  } catch {
    return PRECIOS_ARICA_ESTATICO;
  }
}
```

---

## Archivos a modificar

| Archivo                       | Cambio                                |
| ----------------------------- | ------------------------------------- |
| `src/lib/data/clima-arica.ts` | Agregar fetch Open-Meteo con fallback |
| `src/lib/data/mercado.ts`     | Agregar fetch ODEPA con fallback      |
| `src/lib/db/index.ts`         | Agregar tabla `cache` si no existe    |
| `src/lib/data/index.ts`       | Exportar nuevas funciones async       |

---

## Notas de implementación

- Las funciones pasan de síncronas a async — verificar que los componentes que las usan manejen el loading
- Los mappers (`mapOpenMeteoToClimaData`, `mapOdepaToPrecios`) adaptan el formato de la API al formato interno de la app
- ODEPA puede no tener datos de todas las frutas de Arica — mantener fallback por cultivo individual
- Open-Meteo: coordenadas de Arica (-18.4783, -70.3126)
- No bloquear el render con estos fetches — cargar en background y actualizar cuando lleguen
