# FASE 5B: Panel de Clima

**Status**: ✅ COMPLETADA
**Prioridad**: 🟢 Baja
**Dependencias**: FASE_5
**Fuente**: `mi primera investigacion/3-modelo_ordenado/2_recursos_base/01_clima.yaml`

---

## Objetivo

Mostrar datos climáticos de la zona en un panel informativo. Por ahora serán datos estáticos (JSON) específicos de Arica. A futuro podrían obtenerse de APIs (Open-Meteo, NASA POWER, INIA RedAgroclima).

---

## Datos Climáticos a Mostrar

### 1. Lluvia

```typescript
lluvia: {
  anual_mm: number            // 1 mm (Arica casi no llueve)
  max_24h_mm: number          // 10 mm eventos excepcionales
  meses_lluviosos: string[]   // ["ene", "feb"]
  meses_secos: string[]       // resto del año
}
```

### 2. Temperatura

```typescript
temperatura: {
  minima_historica_c: number; // 11°C
  maxima_verano_c: number; // 32°C
  horas_frio_aprox: number; // 40 (muy baja vernalización)
}
```

### 3. Heladas

```typescript
heladas: {
  anuales: number             // 0 en costa
  meses_riesgo: string[]      // [] vacío para Arica costa
  plantas_sensibles: string[] // ["papaya", "mango", "pitahaya"]
}
```

### 4. Viento

```typescript
viento: {
  max_kmh: number             // 25
  direccion_predominante: string  // "S-SW"
  meses_fuerte: string[]      // ["ago", "sep"]
}
```

### 5. Humedad y Radiación

```typescript
humedad_radiacion: {
  humedad_relativa_pct: number; // 70%
  radiacion_mj_m2_dia: number; // 18 MJ/m²/día
}
```

### 6. Evapotranspiración

```typescript
evapotranspiracion: {
  et0_mm_dia: number; // 4.5 mm/día
  nota: string; // Para ajustar riegos
}
```

### 7. Estacionalidad

```typescript
estacionalidad: {
  verano: { meses: string[], caracteristica: string, factor_agua: number }
  otono: { meses: string[], caracteristica: string, factor_agua: number }
  invierno: { meses: string[], caracteristica: string, factor_agua: number }
  primavera: { meses: string[], caracteristica: string, factor_agua: number }
}
```

---

## Tareas

### Tarea 1: Crear Datos Estáticos Clima Arica

**Archivo**: `src/lib/data/clima-arica.ts`

```typescript
export const CLIMA_ARICA = {
  region: "Arica y Parinacota",
  zona: "costa",

  lluvia: {
    anual_mm: 1,
    max_24h_mm: 10,
    meses_lluviosos: ["ene", "feb"],
  },

  temperatura: {
    minima_historica_c: 11,
    maxima_verano_c: 32,
    horas_frio_aprox: 40,
  },

  // ... resto de datos

  fuentes: [
    "DMC / Red AgroMet",
    "INIA RedAgroclima",
    "NASA POWER",
    "Open-Meteo",
  ],
};
```

### Tarea 2: Crear Panel Clima

**Archivo**: `src/components/clima/panel-clima.tsx`

Panel con secciones colapsables mostrando:

- 🌧️ Lluvia
- 🌡️ Temperatura
- ❄️ Heladas
- 💨 Viento
- 💧 Humedad
- ☀️ Radiación
- 📅 Estacionalidad

### Tarea 3: Crear Página /clima

**Archivo**: `src/app/clima/page.tsx`

Página dedicada con toda la información climática.

### Tarea 4: Widget Clima en Sidebar

**Archivo**: `src/components/clima/widget-clima.tsx`

Mini-widget que muestra:

- Temporada actual
- Factor de agua actual (ej: "Verano: 1.4×")
- ET0 del día

---

## Criterios de Aceptación

- [x] Datos estáticos de Arica cargados en JSON/TS
- [x] Panel clima muestra todas las secciones
- [x] Widget compacto para sidebar
- [x] Indica fuentes de datos
- [x] Página /clima accesible desde navegación
- [x] Temporada actual se calcula automáticamente

---

## Notas

- Prioridad BAJA porque son datos informativos estáticos
- A futuro: integrar API Open-Meteo para datos en tiempo real
- A futuro: permitir que usuario seleccione zona (Arica costa, Azapa, Lluta)
- Los factores de estacionalidad YA se usan en FASE_6 (agua)

---

## Fuentes de Datos (para futuro)

| Fuente            | Datos                     | API             |
| ----------------- | ------------------------- | --------------- |
| Open-Meteo        | Pronóstico, ET0           | Gratis, sin key |
| NASA POWER        | Radiación, temp histórica | Gratis          |
| INIA RedAgroclima | Datos regionales Chile    | Web scraping    |
| DMC Chile         | Series históricas         | Manual          |

---

## Siguiente Fase

**FASE_5C_SUELO** - Panel de análisis de suelo
