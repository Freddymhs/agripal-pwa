# Futuro: Integraciones con APIs Externas

**Prioridad:** Post-SaaS (requiere backend)
**Dependencias:** FASE_12 (Supabase) + FASE_13 (Auth Real)
**Feedback relacionado:** Ninguno directo

---

## Estado Actual del Codebase

**Datos climaticos:** Resueltos con datos estaticos locales (offline-first):

- `data/static/clima/arica.json` - CLIMA_ARICA (temperaturas, viento, humedad, radiacion)
- `data/static/clima/evapotranspiracion-arica.json` - ET0 mensual Arica
- Usados en: `calidad.ts`, `riesgo-plagas.ts`, `agua.ts`

**Datos de mercado:** Resueltos con datos estaticos:

- `data/static/mercado/precios-arica.json` - Precios min/max CLP/kg por cultivo
- Usados en: `roi.ts`, `economia-avanzada.ts`, `comparador-cultivos.ts`

**Lo que falta es ACTUALIZAR estos datos en tiempo real**, no reemplazarlos.

---

## APIs Identificadas (para futuro)

### 1. Clima - Open-Meteo (GRATIS, sin API key)

- URL: https://open-meteo.com
- Datos: Forecast 16 dias, historico, ET0 FAO-56
- Uso: Reemplazar ET0 estatico con datos reales diarios

### 2. Clima - INIA Agromet (GRATIS)

- URL: https://agrometeorologia.cl
- Datos: T aire/suelo, humedad, radiacion, viento, ET0, grados-dia
- Uso: Calculos GDD en tiempo real (mejoraria `/plagas`)

### 3. Precios - ODEPA (GRATIS)

- URL: https://datos.odepa.gob.cl
- Datos: Precios mayoristas frutas/hortalizas, actualizacion diaria
- Uso: Actualizar `precios-arica.json` automaticamente

---

## Estrategia de Integracion

La arquitectura actual facilita la integracion:

1. Los loaders en `src/lib/data/*.ts` son el punto de entrada
2. Se puede agregar fetch API con fallback a JSON estatico
3. IndexedDB puede cachear respuestas API para offline

```typescript
// Ejemplo: loader con fallback
export async function getET0Mensual(): Promise<ET0Data> {
  try {
    const response = await fetch("https://api.open-meteo.com/...");
    const data = await response.json();
    await db.cache.put({ key: "et0", data, updated: Date.now() });
    return data;
  } catch {
    // Fallback a datos estaticos
    return ET0_ARICA_ESTATICO;
  }
}
```

---

## Datos de Sensores IoT (futuro lejano)

- Humedad del suelo, temperatura local, pH agua
- Hardware: ESP32, LoRa
- Requiere: backend MQTT o similar
