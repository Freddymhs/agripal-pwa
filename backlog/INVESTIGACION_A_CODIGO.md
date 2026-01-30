# Mapeo: Investigación → Código → Fases

**Objetivo:** Evitar que la investigación se desperdicie. Cada archivo YAML debe tener su correspondiente funcionalidad en la app.

---

## 🔄 MAPEO COMPLETO: Archivo YAML → Funcionalidad App → Fase

| Archivo YAML | Contenido Crítico | Funcionalidad App | Fase | Prioridad |
|---|---|---|---|---|
| **00_terreno.yaml** | Dimensiones (70×60m), parcelas 1,400 m² c/u, acceso, servicios | Mapa terreno editable, división en parcelas, cálculo área disponible | 1 | 🔴 |
| **01_clima.yaml** | Arica: 1mm lluvia, 25 km/h viento, ET0 4.5 mm/día, 18 MJ/m² radiación | Integración INIA Agromet, cálculo ET0, alerta heladas/viento | 2 | 🟡 |
| **02_suelo.yaml** | pH 7.2, franco-arenoso, **⚠️ Salinidad/boro/arsénico desconocidos** | Parser análisis INIA, tabla toleancias cultivo × suelo, advertencias críticas | 2 | 🔴 |
| **03_agua.yaml** | **20 m³/semana = cuello botella**, estacionalidad verano +40%, calidad desconocida | Motor "¿cuánta agua necesito?" por cultivo/área, alerta sequía, simulador RDC | 1 | 🔴 |
| **04_catalogo_cultivos.yaml** | 8 cultivos evaluados, requerimientos agua/pH/salinidad/boro/plagas | Base de datos cultivos + filtrador inteligente (agua, clima, suelo) | **2** | 🔴 |
| **05_seleccion_cultivo.yaml** | Ranking: Tuna/Higuera/Pitahaya recomendados, Granado/Papaya NO VIABLES | Motor recomendación automática (como Spotify: "para TI, recomendamos...") | **2** | 🔴 |
| **06_infraestructura.yaml** | Riego: estanque 20 m³, bomba solar, goteo; energía: paneles | Calculadora infraestructura (entrada: área + cultivo → salida: lista equipos) | 3 | 🟡 |
| **07_costos.yaml** | CAPEX $3.12M, OPEX $200k/mes, break-even año 4 | Simulador financiero: "¿cuánto cuesta?" + flujo caja + análisis sensibilidad | 3 | 🟡 |
| **08_calendario.yaml** | Operaciones mensuales: siembra, poda, cosecha, riego por cultivo | Calendario Gantt con alertas (ej: "esta semana → poda higuera") | 3 | 🟡 |
| **09_monitoreo_plagas.yaml** | **CRÍTICO:** Grados-día, ciclo vida plaga, SAG mosca fruta (14 brotes Arica) | Cálculo automático GD desde temperatura, alertas "aplicar insecticida", registro trampas | 4 | 🔴 |
| **10_cosecha.yaml** | Vida útil tuna 7-10 días, higo 2-3 días (muy corta), deshidratado 6-12 meses | Registro cosecha, calculadora postcosecha (deshidratado aumenta precio 2-3x) | 4 | 🟡 |
| **11_mercado.yaml** | Precios ODEPA, canales venta, contra-estación, prohibición mosca fruta | Integración ODEPA precios, simulador rentabilidad, trazabilidad SAG | 4 | 🟡 |

---

## 🚨 ERRORES DEL BACKLOG (HISTÓRICO - MAYORÍA RESUELTOS)

**Nota**: La mayoría de estos problemas fueron resueltos en FASE_10C, FASE_11C y FASE_11D. Se mantiene el texto original como referencia histórica.

### ✅ RESUELTO - Problema 1: FASE_5 (Catálogo) es "solo CRUD"
**Era:** Crear/editar cultivos con campos nombre, espaciado, etc.
**Ahora:** Catálogo completo con 25+ cultivos, restricciones agrícolas, filtrador inteligente (FASE_6 + FASE_7)

### ✅ RESUELTO - Problema 2: Catálogo sin restricciones agrícolas
**Era:** Cultivo solo tiene `espaciado_recomendado_m`
**Ahora:** CatalogoCultivo tiene pH, salinidad, boro, plagas, calendario, producción, clima, GDD. Ver MODELO_DATOS.md
**Referencia original de campos que faltaban:**
```typescript
export interface CatalogoCultivo {
  // ... actual
  agua_m3_ha_año_min: number      // ← FALTA
  agua_m3_ha_año_max: number      // ← FALTA
  ph_min: number                  // ← FALTA
  ph_max: number                  // ← FALTA
  tolerancia_salinidad: 'alta' | 'media' | 'baja'  // ← FALTA
  tolerancia_boro: 'alta' | 'media' | 'baja'      // ← FALTA
  grados_dia_base: number         // ← FALTA (para plagas)
  plagas_principales: string[]    // ← FALTA (cochinilla, mosca higo, etc)
  calendario: {                   // ← FALTA
    meses_siembra: number[]
    meses_cosecha: number[]
    meses_descanso: number[]
  }
  produccion_kg_ha: {             // ← FALTA
    año2: number
    año3: number
    año4_plena: number
  }
  precio_kg_min: number           // ← FALTA
  precio_kg_max: number           // ← FALTA
}
```

### ✅ RESUELTO - Problema 3: No hay motor de restricciones
**Era:** Seleccionar cultivo = dropdown simple
**Ahora:** FASE_6 Motor Recomendación + calidad.ts ScoreCalidad (agua/suelo/clima/riego). Referencia original:
```
Suelo: pH 7.2, salinidad?, boro?
Agua: 20 m³/semana disponibles
Clima: Arica (1mm lluvia, 25 km/h viento)

✅ VIABLE:        Tuna (1,500-4,000 m³/ha), tolera pH 6-8.5 y salinidad alta
✅ RECOMENDADO:   Higuera (1,500-2,000 m³/ha), bajo consumo
❌ NO VIABLE:     Granado (requiere 4,500-7,500 m³/ha, insuficiente agua)
⚠️ CONDICIONAL:   Mango (sensible boro, necesitas análisis INIA antes)
```

### ⚠️ PARCIAL - Problema 4: Plagas con calendario fijo, no con grados-día
**Era:** Ninguna integración de plagas
**Ahora:** riesgo-plagas.ts evalúa riesgo por temperatura + etapa crecimiento + severidad. NO usa GDD puro aún (usa temperatura mensual estimada). Referencia original:
1. Lee T° mín/máx diario desde INIA Agromet
2. Calcula GD acumulados desde inicio estación
3. Advierte: "Cochinilla va a eclosionar en 3 días, aplica ahora"
4. Para Arica: ⚠️ Mosca de fruta (14 brotes, prohibición Feb 2025)

### ✅ RESUELTO - Problema 5: No hay "motor de recomendación"
**Era:** FASE_5 es "crear cultivos", FASE_4C es "crear terrenos"
**Ahora:** FASE_6 Motor Recomendación Inteligente + /escenarios comparador multi-cultivo + /economia ROI. Referencia original:
```
Basándome en tu terreno (70×60m, pH 7.2, 20 m³/semana):
1. Tuna: 0.30 ha (bajo consumo, tolera salinidad, cochinilla controlable)
2. Higuera: 0.20 ha (dos cosechas/año, vida útil corta → deshidratar)
3. Disponible: 0.12 ha para futuro

Presupuesto estimado:
- CAPEX: $2.64M (riego + paneles + infraestructura)
- OPEX: $200k/mes
- Break-even: Año 4
```

### ✅ RESUELTO - Problema 6: Falta lógica de agua
**Era:** Terreno solo tiene `agua_disponible_m3`
**Ahora:** Terreno tiene agua_fuente, agua_confiabilidad, agua_costo, calidad (salinidad, boro, arsénico) + AguaAvanzadaTerreno completo. Ver MODELO_DATOS.md. Referencia original:
```typescript
export interface Terreno {
  // ... actual
  agua_disponible_m3: number
  agua_actual_m3: number
  // ← AGREGAR:
  agua_fuente: 'aljibe' | 'pozo' | 'riego' | 'lluvia'
  agua_confiabilidad: 'alta' | 'media' | 'baja'
  agua_costo_clp_por_m3: number
  agua_calidad_salinidad_dS_m?: number
  agua_calidad_boro_ppm?: number
  agua_calidad_arsenico_ppm?: number
  // Y métodos:
  calcularConsumoPorCultivo(cultivo, area_ha): m3_anno
  calcularSupericieBienoCapacidad(cultivos): { viable: boolean; error?: string }
  simularRDC(reducion_porcentaje): { ahorro_agua: m3_anno; impacto_produccion: string }
}
```

---

## 🔧 FASES CORREGIDAS PARA APROVECHAR INVESTIGACIÓN

### FASE_1 (ACTUAL: Mapa) → MEJORA
**Agregar:**
- Persistencia de 00_terreno.yaml en IndexedDB
- Cálculo "disponible para cultivo" = área - cercos - caminos - casa
- Simulador agua: "¿cuánta superficie puedo cultivar con 20 m³/semana?"

### FASE_2: RECOMENDACIÓN INTELIGENTE (NUEVA)
**Entrada:** 00_terreno (Arica, pH 7.2, 20 m³/semana)
**Lógica:**
1. Parsear 04_catalogo_cultivos.yaml
2. Filtrar viable: agua < 20 m³/semana, pH compatible, clima Arica
3. Rankear por rentabilidad (precio × rendimiento × seguridad)
4. Mostrar recomendación + alternativas
5. Exportar selección como 05_seleccion_cultivo.yaml

**Output:** Archivo YAML descargable "Mi plan de cultivos" con áreasrecomendadas

**Dependencias:** FASE_1 + 04_catalogo_cultivos.yaml

### FASE_3: INFRAESTRUCTURA Y COSTOS (MEJORADA)
**Entrada:** 05_seleccion_cultivo.yaml (qué plantar + dónde)
**Agregar:**
- Parsear 06_infraestructura.yaml
- Calculadora: área × cultivos → lista equipos necesarios
- Parsear 07_costos.yaml + actualizar con precios reales
- Simulador financiero: "¿en cuántos años recupero inversión?"
- **CRÍTICO:** Análisis sensibilidad = "si sube agua 50%, ¿sigue siendo viable?"

**Output:** PDF presupuesto descargable

### FASE_4: OPERACIÓN (MEJORADA)
**Agregar:**
- **08_calendario.yaml:** Alertas mensuales "esta semana → poda higuera"
- **09_monitoreo_plagas.yaml:** Cálculo grados-día automático, alertas plagas
- **10_cosecha.yaml:** Registro cosechas, vida útil alerta
- **11_mercado.yaml:** Integración ODEPA precios, simulador rentabilidad

---

## 🎯 PRIORIDAD INMEDIATA: ACTUALIZAR TIPOS

**TODO ANTES de continuar:**

1. **Agregar a `src/types/index.ts`:**
```typescript
export interface CatalogoCultivo {
  // ... actual

  // RESTRICCIONES AGRÍCOLAS
  agua_m3_ha_año_min: Metros
  agua_m3_ha_año_max: Metros
  ph_min: number
  ph_max: number
  salinidad_tolerancia_dS_m: number
  boro_tolerancia_ppm: number

  // CALENDARIO
  meses_siembra: number[]        // [3, 9] = marzo, septiembre
  meses_cosecha: number[]        // [12, 1, 2, 3] = dic-mar

  // PRODUCCIÓN
  produccion_kg_ha_año2: number
  produccion_kg_ha_año3: number
  produccion_kg_ha_año4: number

  // MERCADO
  precio_kg_min_clp: PesosCLP
  precio_kg_max_clp: PesosCLP

  // PLAGAS
  plagas: {
    nombre: string
    grados_dia_base: number
    grados_dia_ciclo: number
    grados_dia_ovicida_ventana: number  // GD óptimo aplicar insecticida
  }[]

  // OBSERVACIONES
  notas_arica?: string  // especificaciones para tu ubicación
}
```

2. **Agregar métodos a Terreno:**
```typescript
calcularAgua(cultivos_seleccionados: { cultivo: CatalogoCultivo; area_ha: number }[]): {
  agua_anual_m3: number
  agua_semanal_m3: number
  viable: boolean
  margen_m3: number
}

validarCapacidad(cultivos: {...}[]): {
  viable: boolean
  errores: string[]
  advertencias: string[]
}
```

---

## 📊 DOCUMENTO: CRÍTICO COMPLETAR ANTES DE CODIFICAR

Debes **validar con datos reales** estos campos de 04_catalogo_cultivos:

- [ ] Agua requerida mín/máx cada cultivo (valida con ODEPA/INIA)
- [ ] Tolerancia salinidad/boro cada cultivo (INIA, publicaciones técnicas)
- [ ] Calendario siembra/cosecha (INIA Agromet, Azapa histórico)
- [ ] Producción año 2/3/4 (INDAP, productores locales)
- [ ] Plagas + grados-día (INIA, SAG base datos)
- [ ] Precios min/max (ODEPA boletín, ferias Arica)

**Esto NO es especulación.** Debe estar **validado con fuentes oficiales**.

---

## ✅ CHECKLIST: INVESTIGACIÓN APROVECHADA

**Actualizado**: 2026-02-09

- [x] Crear FASE_2_RECOMENDACION con filtrador inteligente → **FASE_6 (Motor Recomendación)**
- [x] Actualizar tipos cultivo + terreno con restricciones agrícolas → **types/index.ts actualizado: pH, salinidad, boro, plagas, calendario, producción, clima**
- [x] Motor restricciones: agua × clima × suelo → cultivos viables → **FASE_6 + calidad.ts ScoreCalidad**
- [ ] Parser YAML: leer 04, 05, 06, 07 desde app → **Reemplazado por JSON estático en data/static/ + loaders TS**
- [x] Calculadora agua: "¿cuánto consumo anual cultivo X en área Y?" → **agua.ts calcularConsumoZona() + agua-calculo-anual.ts**
- [ ] Simulador RDC: "ahorro agua con riego deficitario" → **Pendiente (futuro)**
- [x] Integración INIA Agromet: temperatura, ET0, grados-día → **Parcial: ET₀ estático en evapotranspiracion-arica.json, GDD en CatalogoCultivo.grados_dia_etapas**
- [x] Sistema grados-día para plagas (cochinilla, mosca fruta) → **riesgo-plagas.ts + /plagas página (temp + etapa, no GDD puro)**
- [ ] Calendario alertas (08_calendario.yaml) → **Parcial: alertas.ts genera alertas, pero no calendario Gantt**
- [x] Integración ODEPA precios mercado (11_mercado.yaml) → **data/static/mercado/precios-arica.json + mercado.ts**
- [x] Financiero: break-even, flujo caja, análisis sensibilidad → **economia-avanzada.ts: punto equilibrio, margen, payback + roi.ts proyección 4 años**
- [ ] Trazabilidad SAG: ⚠️ Mosca fruta (14 brotes Arica, prohibición Feb 2025) → **Pendiente (futuro)**
