# FASE FUTURO: Módulos Agronómicos Pendientes

**Status**: ⏳ PARCIALMENTE COMPLETADA — puntos 1, 4 y 5 implementados en FASE_20
**Prioridad**: 🟡 MEDIA
**Dependencias**: catálogo de cultivos estable en Supabase
**Fuente de datos**: Notion "PROYECTO ARICA — Índice de Conocimiento Agrícola" (investigación 2026-03-08)

> **Progreso al 2026-03-08** (FASE_20):
>
> - ✅ **Punto 1 — NPK por etapa**: `nutricion_por_etapa` implementado en tipos + alertas (`fertilizacion_etapa`)
> - ✅ **Punto 4 — Alelopatía**: `alelopatia_riesgo` en alertas, `AlelopatiaCultivo` en tipos
> - ✅ **Punto 5 — Vecería**: `veceria_riesgo` en alertas, `VeceriaCultivo` en tipos
> - ⏳ **Punto 2 — Poda y raleo**: pendiente (datos investigados, falta UI + alertas)
> - ⏳ **Punto 3 — Vida útil poscosecha**: pendiente
> - ⏳ **Punto 6 — Propagación**: pendiente (va al Portal, no a la PWA)

---

## Contexto

Estos módulos tienen la data investigada y validada para Arica. No requieren API externa —
el conocimiento es agronómico estático que va embebido en el catálogo o en archivos de datos propios.
Implementar cuando el core de la app esté estable.

---

## 1. NPK por Etapa Fenológica

**Qué es:** Dosis de Nitrógeno/Fósforo/Potasio recomendadas por etapa de crecimiento y por cultivo.
**Datos disponibles:** 12 cultivos (mango, aguacate, maracuyá, guayaba, granada, papaya, cítricos, olivo, lúcuma, higo, tuna + más).
**Nota Arica:** suelo alcalino pH 7.5–8.5 → aplicar vía fertirriego fraccionado (no en suelo directo).

**Dónde va:**

- Columnas nuevas en `catalogo_base` por cultivo y etapa, o tabla separada `npk_cultivos`
- PWA: panel de cultivo activo → pestaña "Fertilización" → dosis recomendada según etapa actual

**Por qué es valioso:** el agricultor sabe cuándo regar pero no cuánto fertilizar. Sin esto, fertiliza a ojo o no fertiliza.

---

## 2. Poda y Raleo por Especie

**Qué es:** Tipo de poda, timing, técnica y por qué es crítica para cada frutal.
**Nota Arica:** sin estación fría definida, las podas deben reemplazar las señales estacionales naturales.
**Datos disponibles:** todos los frutales investigados (mango, aguacate, guayaba, granada, higo, tuna, olivo, cítricos, etc.)

**Dónde va:**

- Campo `poda_info` en `catalogo_base` (JSONB) con `{ timing, tipo, tecnica, notas_arica }`
- PWA: alerta/recordatorio en el momento correcto del año según fenología del cultivo

**Por qué es valioso:** sin poda de renovación, la planta "sube" toda la producción a las puntas y el rendimiento baja.

---

## 3. Vida Útil Poscosecha (sin refrigeración, 30°C)

**Qué es:** Días que aguanta cada cultivo cosechado sin cadena de frío.
**Relevante para Arica:** el agricultor individual opera sin cadena de frío → necesita saber el margen real para vender.
**Datos disponibles:** tuna (9–15 días), granada (2+ semanas), y más.

**Dónde va:**

- Campo `dias_sin_frio` en `catalogo_base`
- PWA: panel de cosecha → aviso "Tu cosecha tiene X días sin refrigeración"
- Conectar con clima real cuando esté disponible (a más calor, menos días)

---

## 4. Alelopatía entre Cultivos

**Qué es:** Distancias mínimas entre especies que se perjudican entre sí (incompatibilidad de raíces, exudados, etc.)
**Datos disponibles:** pares incompatibles entre los 14 cultivos investigados.

**Dónde va:**

- Tabla `alelopatia_cultivos` con pares (cultivo_a, cultivo_b, distancia_min_m, motivo)
- PWA: validación en el mapa al plantar — aviso si dos zonas incompatibles están demasiado cerca

**Por qué es valioso:** el agricultor planta sin saber que el mango y algunos cultivos se inhiben mutuamente.

---

## 5. Vecería y Alternancia Productiva

**Qué es:** Cultivos que alternan años de alta y baja producción naturalmente (aguacate, olivo, mango).
**Nota Arica:** sin estacionalidad natural, la vecería puede ser más pronunciada porque no hay señales ambientales que la regulen.

**Dónde va:**

- Campo `tiene_veceria: boolean` + `manejo_veceria: string` en `catalogo_base`
- PWA: alerta en año de baja esperada → "Este cultivo puede producir menos este año (vecería)"

---

## 6. Propagación por Especie

**Qué es:** Método (semilla/injerto/plantín), timing, dificultad y viveros disponibles en norte Chile.
**Datos disponibles:** todos los cultivos + portainjertos recomendados para Arica.

**Dónde va:** informativo en el Portal (vitrina pública), no en la PWA operativa.

- Si hay viveros identificados con nombre y contacto → tabla `directorio_viveros` en Supabase

---

## Orden sugerido de implementación

1. **Vida útil poscosecha** — campo simple, alto impacto inmediato, sin migración compleja
2. **NPK por etapa** — requiere tabla nueva pero los datos ya están investigados
3. **Alelopatía** — requiere integración con el mapa (más complejo)
4. **Poda y raleo** — requiere sistema de alertas por calendario
5. **Vecería** — campo simple pero necesita historial de cosechas para ser útil
6. **Propagación** — va al Portal, no bloquea nada de la PWA

---

## 7. Poda y Raleo — UI Pendiente ⚠️ IMPORTANTE

**Estado:** tipos `PodaCultivo` ya existen en código. Datos investigados y disponibles. **Solo falta la UI.**

**Qué hace falta:**
- Mostrar información de poda en la ficha del cultivo activo (cuándo podar, cómo, por qué)
- Alerta contextual en el momento correcto: "Tu olivo lleva X meses desde última poda — es momento de poda de producción"
- Conectar con `calcularEtapaActual()` para timing correcto

**Archivos:** tipos en `src/types/`, datos en seed. UI en ficha de cultivo + `src/lib/utils/alertas.ts`.

---

## 8. Vida Útil Poscosecha — Conectar al Flujo ⚠️ IMPORTANTE

**Estado:** campo `vida_util_dias` ya existe en seed. **Falta conectarlo a `/cosechas`.**

**Qué hace falta:**
- Al registrar una cosecha → mostrar "Tienes X días para vender/procesar antes que se arruine"
- Alerta `cosecha_vida_util` cuando se acerca el vencimiento según fecha de cosecha registrada
- Considerar temperatura: a más calor, menos días (conectar con `clima_actual` si está disponible)

**Archivos:** `src/app/(app)/cosechas/`, `src/lib/utils/alertas.ts`.

---

## 9. Fenología Calibrada (Días-Grado Acumulados) — FUTURA

**Qué es:** Hoy las etapas del cultivo usan días fijos desde la siembra. Con fenología calibrada, las etapas avanzan según temperatura acumulada real — más preciso y correcto agronómicamente.

**Fórmula:** `GDD = Σ((Tmax + Tmin) / 2 - T_base)` acumulado desde fecha de siembra.

**Por qué importa:** dos plantaciones del mismo cultivo en distintas temperaturas no evolucionan igual. Un olivo en Arica (18°C promedio) florece diferente que uno en el sur (12°C promedio). Con días fijos eso se pierde.

**Qué se necesita:**
- Columna `t_base_celsius` en `catalogo_base` por cultivo (ej: tomate = 10°C, olivo = 7°C)
- Función acumuladora en DAL que lea `temp_max` + `temp_min` diarios desde `clima_actual`
- Reemplazar `calcularEtapaActual()` con versión GDD-aware (o hacerlo paralelo como mejora opt-in)

**Datos disponibles:** API ya guarda `temp_max` y `temp_min` diarios en `clima_actual` ✅

**Prioridad:** Media — no bloquea nada actual. Implementar después de cerrar las fases de lanzamiento.

---

## 10. Exportación Formato SAG / INDAP — OPCIONAL

**Qué es:** Generar reportes en formato estructurado (CSV/Excel) según plantillas de organismos oficiales chilenos, además del PDF actual.

**Por qué podría importar:** técnicos INDAP y asesores SAG necesitan entregar documentación formal. Si AgriPlan genera ese archivo, se convierte en herramienta oficial del flujo de trabajo del técnico.

**Estado:** sin investigar qué columnas/formato pide SAG/INDAP exactamente. Antes de implementar: conseguir una plantilla oficial real.

**Prioridad:** Baja-opcional — no implementar hasta tener la plantilla oficial. Puede descartarse si no hay demanda real.

---

## Orden sugerido de implementación (actualizado)

1. **Vida útil poscosecha** — datos listos, campo existe, solo conectar UI ⚠️
2. **Poda y raleo** — tipos listos, datos listos, solo UI ⚠️
3. **Fenología calibrada** — requiere columna nueva + función GDD, datos de temperatura ya disponibles
4. **Exportación SAG/INDAP** — solo si se consigue plantilla oficial real
5. **NPK por etapa** — ya implementado en alertas (FASE_20) ✅
6. **Alelopatía** — ya implementado en alertas (FASE_20) ✅
7. **Vecería** — ya implementado en alertas (FASE_20) ✅
8. **Propagación** — va al Portal ✅
