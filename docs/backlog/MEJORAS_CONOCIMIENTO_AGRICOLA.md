# Mejoras de Conocimiento Agrícola

**Origen**: Cruce de investigación Notion ("Índice de Conocimiento Agrícola") vs datos y funcionalidades existentes de la PWA.
**Fecha**: 2026-03-08
**Tipo**: Mejoras incrementales al producto existente — NO son fases nuevas.

> **Estado al 2026-03-21:**
>
> - ✅ **1. NPK por Etapa** — `nutricion_por_etapa[]` en tipos + alerta `fertilizacion_etapa` (FASE_20)
> - ✅ **2. Compatibilidad Química** — matriz insumos, alerta `incompatibilidad_quimica` (FASE_21)
> - ⏳ **3. Poda por Especie** — tipos `PodaCultivo` existen, falta UI en ficha del cultivo
> - ✅ **4. Vecería** — `VeceriaCultivo` en tipos + alerta `veceria_riesgo` (FASE_20)
> - ✅ **5. Alelopatía** — `AlelopatiaCultivo` en tipos + alerta `alelopatia_riesgo` (FASE_20)
> - ⏳ **6. Vida Útil Poscosecha** — campo `vida_util_dias` existe en seed, falta integración con /cosechas
> - ✅ **7. Micronutrientes Suelo Alcalino** — quelatos Fe/Zn/Mn en enmiendas.json + alerta `deficiencia_micronutrientes` (FASE_20)
> - ⏳ **8. Propagación** — pendiente (va al Portal, no a la PWA)

---

## 1. NPK por Etapa Fenológica

**Qué es**: Las necesidades de Nitrógeno, Fósforo y Potasio varían según la etapa de crecimiento de cada especie frutal. Hoy la app tiene datos NPK anuales (`nutricion.n_kg_ha_año`) pero no los desglosa por etapa.

**Datos disponibles**: Notion tiene NPK por etapa para 12 frutales (olivo, higuera, tuna, pitahaya, guayaba, dátil, maracuyá, uva, cítricos, arándano, lúcuma, granada).

**Integración propuesta**:

- Agregar campo `nutricion_por_etapa[]` en cada cultivo de `arica.json` con: etapa, NPK recomendado, timing.
- Conectar con el hook de etapa actual (`calcularEtapaActual()` de FASE_11C) para generar **alertas de fertilización** contextuales.
- UI: mostrar en la ficha del cultivo + alerta tipo "Tu olivo está en floración → aplicar 60% N+P+K ahora".

**Archivos afectados**:

- `data/static/cultivos/arica.json` — agregar datos
- `src/lib/utils/alertas.ts` — nuevo tipo de alerta `fertilizacion_etapa`
- `src/app/alertas/` — mostrar en UI

**Prioridad**: Alta — valor directo para el agricultor.

---

## 2. Compatibilidad Química de Insumos

**Qué es**: Ciertos fertilizantes y pesticidas no se pueden mezclar (ej: calcio + fosfatos precipitan y tapan goteros). Dato crítico para operación diaria.

**Datos disponibles**: Notion tiene matriz de compatibilidad con ~15 combinaciones documentadas.

**Integración propuesta**:

- Nuevo JSON: `data/static/insumos/compatibilidad.json` con matriz de compatibilidad.
- Módulo donde el usuario registra qué insumos usa → sistema valida combinaciones.
- Alertas de incompatibilidad: "No mezclar X con Y → precipitación en sistema de riego".

**Archivos nuevos**:

- `data/static/insumos/compatibilidad.json`
- `src/lib/data/compatibilidad-insumos.ts` (loader)

**Archivos afectados**:

- `src/lib/utils/alertas.ts` — nuevo tipo `incompatibilidad_quimica`

**Prioridad**: Alta — previene daño al sistema de riego y pérdida económica.

---

## 3. Poda por Especie y Etapa

**Qué es**: Tipo de poda (formación, producción, saneamiento), timing correcto, y técnica específica por especie frutal.

**Datos disponibles**: Notion tiene guías de poda para 10+ frutales con timing mensual.

**Integración propuesta**:

- Agregar campo `poda[]` en cada cultivo de `arica.json` con: tipo, meses, descripcion.
- Conectar con etapa fenológica actual → contenido informativo contextual.
- UI: sección informativa en ficha del cultivo, similar a cómo se muestra la fenología actual.

**Archivos afectados**:

- `data/static/cultivos/arica.json` — agregar datos de poda
- UI de ficha del cultivo (catálogo)

**Prioridad**: Media — informativo, no genera alertas críticas.

---

## 4. Vecería (Alternancia Productiva)

**Qué es**: Árboles frutales alternan años de alta y baja producción. Se maneja con raleo (eliminar frutos jóvenes para equilibrar carga).

**Cultivos afectados**: Olivo (marcada), cítricos, higuera.

**Integración propuesta**:

- Campo `veceria: { susceptibilidad: "alta"|"media"|"baja", manejo: "..." }` en cultivos afectados.
- Conectar con el módulo de cosechas (FASE_16) para tracking de producción anual.
- Si se detecta año alto → alerta predictiva: "Ralear frutos para evitar vecería el próximo año".

**Archivos afectados**:

- `data/static/cultivos/arica.json` — agregar datos
- FASE_16 (cosechas, pendiente) debería considerar este dato

**Prioridad**: Media — requiere FASE_16 implementada para tener datos de producción histórica.

---

## 5. Alelopatía (Interacciones entre Plantas)

**Qué es**: Compuestos químicos liberados por ciertas plantas que afectan a vecinas. Define distancias mínimas y combinaciones a evitar.

**Datos disponibles**: Notion documenta interacciones negativas (ej: nogal → juglona tóxica para solanáceas) y positivas.

**Integración propuesta**:

- Campo `alelopatia: { negativa: [...], positiva: [...], distancia_minima_m: N }` por cultivo.
- Validación en mapa: al plantar cerca de una especie incompatible → alerta espacial.
- Complementa la alerta existente `espaciado_incorrecto` de FASE_9.

**Archivos afectados**:

- `data/static/cultivos/arica.json` — agregar datos
- `src/lib/utils/alertas.ts` — nuevo tipo `alelopatia_riesgo`
- Lógica de validación de plantación en mapa

**Prioridad**: Media — valor preventivo alto pero requiere más lógica de mapa.

---

## 6. Vida Útil Poscosecha a 30°C

**Qué es**: Días que dura el fruto a temperatura ambiente (~30°C en Arica) sin refrigeración. Crítico para operador solo que no puede vender el mismo día.

**Datos disponibles**: Ya existe `produccion.vida_util_dias` en `arica.json`. Algunos valores necesitan verificación contra Notion.

**Integración propuesta**:

- Verificar y ajustar `vida_util_dias` con datos de Notion (vida a 30°C sin cadena de frío).
- Conectar con FASE_16 (cosechas): al registrar cosecha → "Tienes X días para vender/procesar".
- Alerta tipo `cosecha_vida_util` cuando se acerca el vencimiento.

**Archivos afectados**:

- `data/static/cultivos/arica.json` — verificar/ajustar valores
- FASE_16 (cosechas, pendiente) — workflow cosecha→bodega→venta

**Prioridad**: Alta — impacto directo en logística del agricultor solo.

---

## 7. Micronutrientes para Suelo Alcalino

**Qué es**: En suelos con pH >7.5 (típico de Azapa), Fe, Zn, Mn se fijan y no están disponibles para las plantas. Requieren quelatos o aplicación foliar.

**Datos disponibles**: Notion documenta deficiencias típicas y correctores específicos.

**Integración propuesta**:

- Verificar si `data/static/suelo/enmiendas.json` ya cubre quelatos de Fe/Zn/Mn → si no, agregar.
- Conectar con el análisis de suelo: si pH >7.5 → alerta de micronutrientes.
- Complementa el score de calidad existente (`calcularFactorSuelo()`).

**Archivos afectados**:

- `data/static/suelo/enmiendas.json` — verificar/agregar
- `src/lib/utils/alertas.ts` — alerta `deficiencia_micronutrientes`

**Prioridad**: Media-Alta — dato técnico importante para manejo correcto.

---

## 8. Propagación por Especie

**Qué es**: Métodos de propagación (semilla, esqueje, injerto, acodo) por especie con timing y dificultad.

**Integración propuesta**:

- Contenido informativo en ficha del cultivo, no genera alertas.
- Baja prioridad para la PWA; más relevante como contenido del Portal o API.
- Podría agregarse como campo `propagacion: { metodo, dificultad, timing }` en `arica.json` para futuro.

**Prioridad**: Baja — informativo, no operativo.

---

## Correcciones de Datos Aplicadas (2026-03-08)

Las siguientes correcciones fueron reinvestigadas y confirmadas antes de aplicarse:

### Olivo en `arica.json`

- `horas_frio_requeridas`: 300 → **70** (umbral 10°C, no 7°C — cv. Azapa)
- Agregado campo `horas_frio_umbral_c: 10` para distinguir del umbral estándar de 7°C
- `notas_arica`: actualizado para reflejar que solo variedad Azapa está probada; Arbequina experimental; Picual/Frantoio no viables
- `viabilidad_proyecto` y `tier` se mantienen (olivo ES el cultivo histórico de Azapa)

### Olivo en `variedades/arica.json`

- Eliminadas Picual y Frantoio (no viables sin frío)
- Arbequina: marcada como `viable_arica: "experimental"` con notas de riesgo
- Agregada variedad **Azapa** como opción principal con datos completos

### Higuera en `arica.json`

- `horas_frio_requeridas`: 200 → **0** (zero-chill para cosecha principal)
- `notas_arica`: actualizado — brevas solo con dormancia parcial, cosecha principal garantizada

### Lúcuma en `arica.json`

- `salinidad_tolerancia_dS_m`: 2 → **4** (valor moderado; 2 era demasiado conservador para condiciones de Azapa)
- `tolerancia_salinidad`: "media" → "moderada"

**Fuentes de verificación**:

- INIA Chile: fenología olivo cv. Azapa
- Universidad de Tarapacá: requerimientos de frío olivo Azapa
- Slow Food Foundation: Arca del Gusto — Aceituna de Azapa
- International Journal of Fruit Science: Arbequina zero-chill studies
- FAO Paper 56: Kc y requerimientos hídricos
- SciELO Chile: salinidad valles Lluta y Azapa
