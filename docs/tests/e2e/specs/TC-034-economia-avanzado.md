# TC-034 — Economía Avanzada: payback, margen, costo/kg

**Feature:** Página `/economia/avanzado`
**Prioridad:** 🟡 Media
**Estado:** ✅ PASA (2026-03-11)
**Dependencias:** TC-015 verificado, terreno con cultivos y precios configurados

---

## Objetivo

Verificar que `/economia/avanzado` calcula correctamente las métricas avanzadas:
payback period, margen neto, costo por kg producido, comparativa por cultivo.

---

## Precondiciones

- Terreno activo con al menos 1 zona de cultivo con plantas
- Precios configurados en catálogo (`precio_kg_min`, `precio_kg_max`)
- Costo de agua configurado (`costo_por_m3` o `costo_recarga_clp`)

---

## Pasos

### Fase 1 — Carga de la página

1. Navegar a `/economia/avanzado`
2. **Verificar:** página carga sin errores, sin NaN, sin valores negativos inesperados
3. **Verificar:** el terreno activo es el correcto (mismo que en contexto)

### Fase 2 — Payback period

1. Verificar que el payback period es coherente con la inversión inicial y el ROI anual
2. Fórmula esperada: `inversion_total / ingreso_neto_anual` (años)
3. **Verificar:** valor en rango plausible (1–30 años para cultivos perennes)

### Fase 3 — Margen neto

1. Verificar margen neto por cultivo: `(ingreso - costos_totales) / ingreso * 100`
2. **Verificar:** valores negativos se muestran en rojo o con indicador de alerta
3. **Verificar:** la suma de costos incluye agua, insumos, y mano de obra (si aplica)

### Fase 4 — Costo por kg

1. Verificar costo por kg producido por cultivo
2. Fórmula: `costos_totales / produccion_anual_kg`
3. **Verificar:** coherente con el precio mínimo de mercado (si costo > precio_min → alerta)

### Fase 5 — Sin NaN ni Infinity

1. Con un terreno con zonas sin área explícita (legacy), verificar que ningún valor es NaN
2. Con producción = 0, verificar que no aparece `Infinity` como costo/kg
3. **Verificar:** guards defensivos activos en todos los cálculos

---

## Criterios de Éxito

- [ ] Página carga sin errores de consola
- [ ] Payback period coherente y sin NaN
- [ ] Margen neto con indicador visual para valores negativos
- [ ] Costo/kg calculado sin Infinity cuando producción = 0
- [ ] Todos los valores numéricos muestran `—` si no hay datos suficientes
