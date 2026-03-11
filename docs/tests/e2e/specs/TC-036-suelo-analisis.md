# TC-036 — Suelo: Análisis, thresholds y quality score

**Feature:** Página `/suelo`
**Prioridad:** 🟡 Media
**Estado:** ✅ PASA (2026-03-11)
**Dependencias:** Terreno activo con zona de cultivo

---

## Objetivo

Verificar que la página `/suelo` calcula y muestra correctamente el análisis
de suelo: tipo de suelo, pH, salinidad, score de calidad, y recomendaciones.

---

## Pasos

### Fase 1 — Carga

1. Navegar a `/suelo` con terreno activo
2. **Verificar:** página carga sin errores
3. **Verificar:** datos del suelo del terreno se cargan desde IDB

### Fase 2 — Score de calidad

1. **Verificar:** el score de calidad (0–100 o A/B/C/D) se calcula correctamente
2. Forzar pH extremo (< 5 o > 8) via IDB y verificar que el score baja
3. **Verificar:** el score refleja los parámetros actuales del suelo

### Fase 3 — Thresholds y alertas

1. Con salinidad alta (> umbral), **verificar:** alerta visible en la página
2. Con pH fuera de rango óptimo para el cultivo, **verificar:** recomendación de corrección
3. **Verificar:** thresholds son los correctos para la región (Arica, suelo desértico)

### Fase 4 — Actualización de datos

1. Modificar tipo de suelo desde la UI
2. Guardar
3. **Verificar:** el score se recalcula automáticamente
4. **Verificar IDB:** el campo fue actualizado

### Fase 5 — Sin datos de suelo

1. Con terreno sin configuración de suelo, **verificar:** estado inicial correcto
2. **Verificar:** formulario vacío o con valores por defecto (no NaN, no crash)

---

## Criterios de Éxito

- [ ] Página carga sin errores
- [ ] Score de calidad calculado correctamente
- [ ] Thresholds generan alertas cuando se superan
- [ ] Actualización de tipo de suelo recalcula el score
- [ ] Sin NaN ni crash con datos de suelo vacíos
