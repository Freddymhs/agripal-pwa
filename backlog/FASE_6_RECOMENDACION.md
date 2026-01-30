# FASE 6: Motor de Recomendación Inteligente

**Status**: ✅ COMPLETADO
**Prioridad**: 🔴 Alta
**Dependencias**: FASE_5D
**Estimación**: 8-10 horas

---

## Objetivo

Crear un motor de recomendación que analiza el terreno (ubicación, agua, suelo) y sugiere automáticamente qué cultivos plantar, basado en la investigación agrícola validada.

**Input:** Terreno (Arica, 70×60m, pH 7.2, 20 m³/semana)
**Output:** "Para TI recomendamos: Tuna (0.3 ha) + Higuera (0.2 ha)" con justificación

---

## Lógica de Restricciones

### Restricción 1: Agua Disponible
```
agua_necesaria_anual = cultivo.agua_m3_ha_año_min × area_ha

¿Es viable?
agua_necesaria_anual ≤ terreno.agua_disponible_m3 × 1.1  (margen 10%)

Ejemplo Arica:
- Disponible: 20 m³/semana = 1,040 m³/año
- Tuna (0.3 ha): 1,500 m³/ha × 0.3 = 450 m³/año ✅
- Higuera (0.2 ha): 1,500 m³/ha × 0.2 = 300 m³/año ✅
- Total: 750 m³/año < 1,040 m³/año ✅

Si suma > disponible:
❌ "Granado (0.1 ha) requiere 750 m³/año pero tienes 1,040. A los 0.15 ha ya no cabe."
```

### Restricción 2: pH Suelo
```
¿Es viable?
terreno.suelo_ph >= cultivo.ph_min AND terreno.suelo_ph <= cultivo.ph_max

Arica: pH 7.2
- Tuna: pH 6-8.5 ✅ (7.2 cae en rango)
- Higuera: pH 6-8 ✅
- Papaya: pH 6.5-7 ❌ (7.2 demasiado alto)

Si desconocido:
⚠️ "pH desconocido. Análisis INIA obligatorio antes de invertir $3.12M"
```

### Restricción 3: Salinidad Agua
```
¿Es viable?
terreno.agua_calidad_salinidad_dS_m <= cultivo.salinidad_tolerancia_dS_m

Arica: Río Lluta > 2 dS/m
- Tuna: Tolera hasta 6 dS/m ✅
- Higuera: Tolera hasta 4 dS/m ✅
- Mango: Tolera hasta 2 dS/m ❌ (agua local tóxica)

Si desconocido:
⚠️ "Salinidad agua desconocida. Río Lluta históricamente > 2 dS/m. Análisis INIA crítico."
```

### Restricción 4: Boro en Agua
```
¿Es viable?
terreno.agua_calidad_boro_ppm <= cultivo.boro_tolerancia_ppm

Arica: Río Lluta > 11 ppm (tóxico)
- Tuna: Tolera hasta 3 ppm ❌ (agua local destruye cultivo)
- Higuera: Tolera hasta 2 ppm ❌
- Aloe vera: Tolera hasta 10 ppm ⚠️ (marginal)

Solución: Tratamiento agua (caro, $500k/año)

Si desconocido:
🚨 "CRÍTICO: Boro en agua desconocido. Si > 2 ppm, necesitas filtración ($500k)"
```

### Restricción 5: Riesgo Zona (Plagas)
```
¿Es viable?
cultivo.riesgo != 'alto' OR cultivo tiene control viable

Arica: 14 brotes mosca de fruta (Dic 2024)
- Tuna, Higuera, Pitahaya: Hospederas mosca fruta ⚠️
- Acción: Monitoreo SAG obligatorio, prohibición venta Feb 2025 si brote
```

---

## Ranking Automático

Después de pasar restricciones, rankear por:

1. **Prioridad "agua":** Menor consumo (seguridad sequía)
   ```
   Score = 100 - agua_m3_ha_año_max

   Tuna (1,500-4,000): Score ~96
   Higuera (1,500-2,000): Score ~98
   Pitahaya (2,000-3,500): Score ~96
   Granado (4,500-7,500): Score ~92
   ```

2. **Prioridad "rentabilidad":** Mejor ROI/m³
   ```
   Score = (precio_kg_max × produccion_año4) / agua_m3_ha_año_min

   Pitahaya: (5,000 × 15,000) / 2,000 = 37,500 ⭐⭐⭐ PREMIUM
   Tuna: (1,200 × 2,000) / 1,500 = 1,600
   Higuera: (1,400 × 6,000) / 1,500 = 5,600
   ```

3. **Prioridad "seguridad":** Cultivos fáciles, bajo riesgo
   ```
   Score = (riesgoScore × 100) + (tierScore × 30)

   Tuna: bajo riesgo + tier 1 = SEGURO
   Higuera: bajo riesgo + tier 1 = SEGURO
   Pitahaya: medio riesgo + tier 2 = MEDIO
   ```

---

## Interfaz de Usuario

### Pantalla 1: Recomendación
```
┌─────────────────────────────────────────────────────────┐
│ 🌾 RECOMENDACIONES PARA TU TERRENO                      │
│                                                         │
│ Ubicación: Arica (70m × 60m, pH 7.2, 20 m³/semana)    │
│                                                         │
│ VIABLES (3 cultivos):                                   │
│                                                         │
│ 1. ⭐⭐⭐ TUNA  (Bajo consumo, tolera salinidad)        │
│    Área: 0.30 ha                                        │
│    Agua: 450 m³/año (margen: 590 m³)                   │
│    Precio: $800-1,200/kg                                │
│    Riesgo: BAJO                                         │
│    [ℹ️ Ver más]                                         │
│                                                         │
│ 2. ⭐⭐⭐ HIGUERA (Dos cosechas, mercado establecido)   │
│    Área: 0.20 ha                                        │
│    Agua: 300 m³/año (margen: 290 m³)                   │
│    Precio: $1,400/kg (breva)                            │
│    Riesgo: BAJO                                         │
│    [ℹ️ Ver más]                                         │
│                                                         │
│ 3. ⭐⭐ PITAHAYA (Premium, alto precio)                │
│    Área: 0.10 ha (limitado por agua)                    │
│    Agua: 200 m³/año (margen: 90 m³)                    │
│    Precio: $4,000-6,000/kg                              │
│    Riesgo: MEDIO                                        │
│    [ℹ️ Ver más]                                         │
│                                                         │
│ NO VIABLES (4 cultivos):                                │
│ • Granado: agua insuficiente (4,500 m³/ha > disponible) │
│ • Papaya: pH demasiado alto + boro crítico             │
│ • Mango: salinidad agua tóxica para este cultivo       │
│ • Aloe vera: sensible heladas, requiere contrato       │
│                                                         │
│ ⚠️ ADVERTENCIAS:                                        │
│ • Boro en agua desconocido (análisis INIA obligatorio)  │
│ • Mosca de fruta: 14 brotes en Arica (prohibición Feb) │
│                                                         │
│ [📋 Mi Plan Recomendado] [💾 Descargar YAML]            │
└─────────────────────────────────────────────────────────┘
```

### Pantalla 2: Detalle Cultivo
```
┌─────────────────────────────────────────────────────────┐
│ TUNA (Opuntia ficus-indica)                            │
│                                                         │
│ ✅ VIABLE para tu terreno                              │
│                                                         │
│ REQUERIMIENTOS:                                         │
│ • Agua: 1,500-4,000 m³/ha/año (bajo consumo)           │
│ • pH: 6-8.5 (tu suelo pH 7.2 ✅)                       │
│ • Salinidad: tolera hasta 6 dS/m ✅                    │
│ • Boro: tolera hasta 3 ppm ⚠️ (agua Arica > 11ppm)     │
│                                                         │
│ CALENDARIO (Arica):                                     │
│ • Siembra: Marzo-Abril, Septiembre-Octubre             │
│ • Floración: Septiembre-Noviembre                       │
│ • Cosecha: Diciembre-Marzo                              │
│ • Poda: Julio-Agosto                                    │
│                                                         │
│ PRODUCCIÓN:                                             │
│ • Año 2: 100-300 kg (inicio)                            │
│ • Año 3: 500-1,000 kg (crecimiento)                    │
│ • Año 4+: 1,500-2,500 kg (plena)                       │
│                                                         │
│ PRECIO MERCADO (Dic 2024):                              │
│ • Feria: $800-1,200/kg                                  │
│ • Mayorista: $600-900/kg                                │
│                                                         │
│ PLAGAS PRINCIPALES:                                     │
│ • Cochinilla: grados-día base 10°C, ciclo 400-500 GD   │
│   Control: Aceite mineral, insecticida (aplicar mes 8-9)│
│                                                         │
│ RENTABILIDAD (0.3 ha):                                  │
│ Año 4 producción: 450-750 kg/año                        │
│ Precio: $400-900k CLP/año (a precio mín)              │
│ Margen neto: ~$150-300k CLP/año (después OPEX)        │
│                                                         │
│ RIESGOS:                                                │
│ ⚠️ Boro agua: necesitas validar < 2 ppm                │
│ ⚠️ Mosca fruta: hospedero (monitoreo obligatorio)      │
│ ⚠️ Cochinilla: plagas comunes (manejo activo)          │
│                                                         │
│ [✅ Incluir en Mi Plan]  [🔙 Atrás]                    │
└─────────────────────────────────────────────────────────┘
```

### Pantalla 3: Mi Plan Recomendado
```
┌─────────────────────────────────────────────────────────┐
│ 📋 MI PLAN RECOMENDADO                                  │
│                                                         │
│ SELECCIÓN:                                              │
│ ✅ Tuna: 0.30 ha (agua: 450 m³/año)                    │
│ ✅ Higuera: 0.20 ha (agua: 300 m³/año)                 │
│ ⭕ Disponible: 0.12 ha (agua: 90 m³/año)              │
│                                                         │
│ AGUA:                                                   │
│ Total necesario: 750 m³/año                             │
│ Disponible: 1,040 m³/año                                │
│ Margen: 290 m³/año (28%)                                │
│                                                         │
│ ESTACIONALIDAD:                                         │
│ Verano (dic-mar): 900 m³ (+20% sobre promedio)        │
│ Invierno (jun-ago): 400 m³ (-40% sobre promedio)      │
│                                                         │
│ ⚠️ RIESGO VERANO: Necesitas 900 m³ pero tienes        │
│    1,040. Margen muy ajustado. Considerar:             │
│    • Hidrogel (reduce riego 20-30%)                    │
│    • Riego deficitario RDC (ahorra 20-60%)            │
│    • Mulch (reduce evaporación 30%)                    │
│                                                         │
│ [💾 Descargar plan.yaml]  [🚀 Ir a Infraestructura]  │
└─────────────────────────────────────────────────────────┘
```

---

## Tareas de Implementación

### 2.1 - Actualizar Tipos TypeScript ✅ HECHO
**Archivo**: `src/types/index.ts`
**Cambios:**
- [x] Agregar `PlantCalendar`, `PlantProduction`, `PlantPlague` interfaces
- [x] Expandir `CatalogoCultivo` con restricciones agrícolas
- [x] Expandir `Terreno` con agua_calidad y suelo_info
**Status**: ✅ COMPLETADO

### 2.2 - Crear Motor de Restricciones ✅ HECHO
**Archivo**: `src/lib/validations/cultivo-restricciones.ts`
**Funciones:**
- [x] `validarCultivoEnTerreno()` - chequea todas las restricciones
- [x] `filtrarCultivosViables()` - separa viables de no viables
- [x] `rankearCultivosViables()` - ordena por agua/rentabilidad/seguridad
- [x] `calcularAguaPorCultivo()` - suma consumo total
- [x] `simularConsumoEstacional()` - muestra mes a mes
**Status**: ✅ COMPLETADO

### 2.3 - Datos de Cultivos Arica ✅ HECHO
**Archivo**: `src/lib/data/cultivos-arica.ts`
**Tarea:**
- [x] Crear archivo TypeScript con 8 cultivos evaluados (Tuna, Higuera, Pitahaya, etc.)
- [x] Completar campos obligatorios de investigación
- [x] Validar contra fuentes INIA/ODEPA
**Status**: ✅ COMPLETADO

### 2.4 - Hook useRecomendacion ✅ HECHO
**Archivo**: `src/hooks/useRecomendacion.ts`
**Interfaz:**
```typescript
interface UseRecomendacion {
  recomendacion: {
    cultivos_viables: CultivoRecomendado[]
    cultivos_noViables: { cultivo: CatalogoCultivo; razon: string }[]
    agua_total_anual: number
    riesgos_criticos: string[]
    advertencias: string[]
  } | null
  loading: boolean
  error: Error | null
  calcularRecomendacion: (terreno: Terreno) => Promise<void>
}
```
**Tareas:**
- [x] Implementar hook que usa `filtrarCultivosViables()`
- [x] Calcular ranking automático
- [x] Hacer async (validar contra APIs INIA si es necesario)
**Status**: ✅ COMPLETADO

### 2.5 - Componente RecomendacionPanel ✅ HECHO
**Archivo**: `src/components/recomendacion/recomendacion-panel.tsx`
**Interfaz:**
```typescript
interface RecomendacionPanelProps {
  terreno: Terreno
  areaHa?: number
}
```
**Tareas:**
- [x] Panel que muestra cultivos viables en cards
- [x] Tabs: Viables, No Viables, Mi Plan
- [x] Mi Plan Recomendado (checkboxes, agua total)
- [x] Advertencias y riesgos críticos
- [x] Gráfico consumo estacional
**Status**: ✅ COMPLETADO

### 2.6 - Integración en Página Principal ✅ HECHO
**Archivo**: `src/app/page.tsx`
**Tareas:**
- [x] Agregar tab/sección "Recomendación" después de seleccionar terreno
- [x] Mostrar RecomendacionPanel si terreno activo
- [x] Tabs en sidebar: Terreno | Recomendación
**Status**: ✅ COMPLETADO

---

## Criterios de Aceptación

- [x] Puedo ver cultivos viables/no viables para mi terreno
- [x] El motor detecta restricción de agua correctamente
- [x] El motor detecta restricción de pH correctamente
- [x] El motor advierte si salinidad/boro desconocidos
- [x] Ranking ordena por agua/rentabilidad/seguridad
- [x] Puedo ver detalle cultivo (agua, score)
- [x] Puedo seleccionar cultivos para "mi plan"
- [x] Sistema calcula agua total necesaria correctamente
- [x] Alertas aparecen si agua insuficiente (margen crítico)
- [ ] Puedo descargar plan como YAML (futuro)

---

## Datos Críticos de Investigación Utilizados

- **04_catalogo_cultivos.yaml**: Definición de 8 cultivos, restricciones
- **05_seleccion_cultivo.yaml**: Ranking recomendado para Arica
- **03_agua.yaml**: Limite 20 m³/semana, estacionalidad verano +40%
- **02_suelo.yaml**: pH 7.2, salinidad/boro/arsénico desconocidos
- **09_monitoreo_plagas.yaml**: Plagas por cultivo, grados-día

---

## Siguiente Fase

**FASE_3_INFRAESTRUCTURA** - Basado en cultivos seleccionados, calcula qué construir (estanque, bomba, goteo)
