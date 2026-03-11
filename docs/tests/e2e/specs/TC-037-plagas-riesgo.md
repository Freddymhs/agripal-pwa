# TC-037 — Plagas: Predicción de riesgo por cultivo

**Feature:** Página `/plagas`
**Prioridad:** 🟡 Media
**Estado:** ✅ PASA (2026-03-11)
**Dependencias:** Terreno activo con cultivos plantados, datos de clima estáticos

---

## Objetivo

Verificar que la página `/plagas` calcula y muestra correctamente el riesgo
de plagas por cultivo/zona, con niveles de riesgo coherentes con el clima
y la etapa de crecimiento del cultivo.

---

## Pasos

### Fase 1 — Carga

1. Navegar a `/plagas` con terreno activo y cultivos plantados
2. **Verificar:** página carga sin errores
3. **Verificar:** lista de riesgos de plaga por zona/cultivo

### Fase 2 — Niveles de riesgo

1. **Verificar:** cada cultivo muestra nivel de riesgo (bajo/medio/alto)
2. **Verificar:** el nivel de riesgo es coherente con:
   - Etapa de crecimiento (plántulas más vulnerables)
   - Temperatura (Arica: ~18°C promedio)
   - Humedad (baja en zona desértica)

### Fase 3 — Detalle de plaga

1. Click en una alerta de plaga
2. **Verificar:** detalle con nombre de plaga, síntomas, y tratamiento recomendado
3. **Verificar:** datos estáticos del catálogo de plagas regionales

### Fase 4 — Sin cultivos

1. Con zona vacía (sin plantas), **verificar:** estado vacío correcto
2. **Verificar:** no aparecen alertas de plaga para zonas sin cultivos

---

## Criterios de Éxito

- [ ] Página carga sin errores
- [ ] Riesgos calculados por zona/cultivo
- [ ] Niveles coherentes con clima de Arica (desértico)
- [ ] Detalle de plaga disponible al hacer click
- [ ] Sin errores con zonas vacías
