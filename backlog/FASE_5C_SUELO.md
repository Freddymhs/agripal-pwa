# FASE 5C: Panel de Análisis de Suelo

**Status**: ✅ COMPLETADA
**Prioridad**: 🟡 Media
**Dependencias**: FASE_5
**Fuente**: `mi primera investigacion/3-modelo_ordenado/2_recursos_base/02_suelo.yaml`

---

## Objetivo

Permitir al usuario ingresar datos de análisis de suelo (después de hacerlo en laboratorio INIA). El sistema mostrará si los valores están dentro de umbrales aceptables y alertará sobre problemas críticos (salinidad alta, boro tóxico, etc.).

**IMPORTANTE**: Sin análisis de suelo, el usuario puede perder toda su inversión plantando en suelo no apto.

---

## Datos de Suelo

### 1. Análisis Físico
```typescript
analisis_fisico?: {
  ph?: number                     // 7.2 (ligeramente alcalino)
  textura?: 'arenosa' | 'franco-arenosa' | 'franco' | 'franco-arcillosa' | 'arcillosa'
  drenaje?: 'rapido' | 'bueno' | 'moderado' | 'lento'
  profundidad_efectiva_cm?: number  // mínimo 60cm para frutales
  materia_organica_pct?: number     // % MO
}
```

### 2. Análisis Químico (CRÍTICO)
```typescript
analisis_quimico?: {
  analisis_realizado?: boolean
  fecha_analisis?: string
  laboratorio?: string            // "INIA La Platina"

  // CRÍTICOS para zona norte
  salinidad_dS_m?: number         // >4 = muy salino
  boro_mg_l?: number              // >2 = tóxico
  arsenico_mg_l?: number          // >0.05 = riesgo salud

  // Nutrientes
  nitrogeno_ppm?: number
  fosforo_ppm?: number
  potasio_ppm?: number
  calcio_ppm?: number
  magnesio_ppm?: number
}
```

### 3. Umbrales Críticos (constantes)
```typescript
export const UMBRALES_SUELO = {
  salinidad_max_dS_m: 4,          // >4 = suelo muy salino
  boro_max_mg_l: 2,               // >2 = tóxico para mayoría frutales
  arsenico_max_mg_l: 0.05,        // >0.05 = riesgo salud
  ph_min: 5.5,
  ph_max: 8.5,
  profundidad_min_frutales_cm: 60,
}
```

---

## Tareas

### Tarea 1: Agregar Campos Suelo a Terreno
**Archivo**: `src/types/index.ts`

Agregar `suelo?: SueloAnalisis` a interface Terreno.

### Tarea 2: Crear Constantes Umbrales
**Archivo**: `src/lib/data/umbrales-suelo.ts`

```typescript
export const UMBRALES_SUELO = {
  salinidad: { max: 4, unidad: 'dS/m', alerta: 'Suelo muy salino' },
  boro: { max: 2, unidad: 'mg/L', alerta: 'Tóxico para frutales' },
  arsenico: { max: 0.05, unidad: 'mg/L', alerta: 'Riesgo para salud' },
  ph: { min: 5.5, max: 8.5, alerta: 'pH fuera de rango' },
}

export function evaluarSuelo(suelo: SueloAnalisis): EvaluacionSuelo {
  const problemas: string[] = []
  const advertencias: string[] = []

  if (suelo.salinidad_dS_m && suelo.salinidad_dS_m > UMBRALES_SUELO.salinidad.max) {
    problemas.push(`Salinidad ${suelo.salinidad_dS_m} dS/m > ${UMBRALES_SUELO.salinidad.max} (MUY ALTO)`)
  }
  // ... más validaciones

  return { viable: problemas.length === 0, problemas, advertencias }
}
```

### Tarea 3: Crear Formulario Análisis Suelo
**Archivo**: `src/components/suelo/formulario-suelo.tsx`

Formulario con secciones:
1. **Análisis Físico**: pH, textura, drenaje, profundidad, MO%
2. **Análisis Químico**: salinidad, boro, arsénico, nutrientes
3. **Metadata**: fecha análisis, laboratorio

Con validación visual en tiempo real:
- 🟢 Verde = OK
- 🟡 Amarillo = Advertencia
- 🔴 Rojo = CRÍTICO

### Tarea 4: Crear Panel Resultados Suelo
**Archivo**: `src/components/suelo/panel-suelo.tsx`

Muestra:
- Estado general: ✅ Apto / ⚠️ Limitado / ❌ No apto
- Tabla de valores vs umbrales
- Gráfico de barras (valor vs máximo permitido)
- Recomendaciones si hay problemas

### Tarea 5: Crear Checklist Antes de Invertir
**Archivo**: `src/components/suelo/checklist-suelo.tsx`

```
CHECKLIST ANTES DE INVERTIR EN CULTIVOS:

[ ] Análisis de suelo realizado (INIA ~$75,000 CLP)
[ ] Salinidad < 4 dS/m
[ ] Boro < 2 mg/L
[ ] Arsénico < 0.05 mg/L
[ ] Profundidad > 60cm para frutales
[ ] pH entre 5.5 - 8.5

⚠️ Si alguno falla, consultar agrónomo antes de plantar
```

### Tarea 6: Crear Modal/Página Suelo
**Archivo**: `src/app/suelo/page.tsx` o modal

Página dedicada con:
- Formulario para ingresar datos
- Panel de resultados
- Checklist
- Tips de mejoras (si hay problemas)

### Tarea 7: Plan B Suelo Problemático
**Archivo**: `src/components/suelo/plan-b-suelo.tsx`

Si se detectan problemas, mostrar opciones:
- **Suelo muy salino**: Lavado de sales, yeso agrícola, cultivos halófitos
- **Boro alto**: Filtración agua, buscar fuente alternativa
- **Arsénico alto**: Proyecto no viable para agricultura alimentaria

---

## Criterios de Aceptación

- [x] Formulario permite ingresar todos los datos de análisis
- [x] Validación visual en tiempo real (colores)
- [x] Umbrales críticos claramente indicados
- [x] Checklist antes de invertir funcional
- [x] Alerta si valores exceden umbrales
- [x] Plan B visible si hay problemas
- [x] Datos guardados en terreno (IndexedDB)
- [x] Accesible desde página /suelo o modal

---

## Notas

- Prioridad MEDIA pero CRÍTICO para éxito del proyecto
- Sin análisis de suelo real, TODO es especulativo
- INIA La Platina: análisis completo ~$75,000 CLP
- URL: https://www.inia.cl/laboratorios/
- Zona norte tiene riesgo ALTO de salinidad, boro, arsénico

---

## Siguiente Fase

**FASE_5D_AGUA_AVANZADA** - Proveedores, calidad agua, contingencias
