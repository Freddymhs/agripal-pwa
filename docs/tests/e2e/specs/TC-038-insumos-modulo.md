# TC-038 — Insumos: Módulo completo y compatibilidad química

**Feature:** Página `/insumos` (FASE_21)
**Prioridad:** 🟡 Media
**Estado:** ✅ PASA (2026-03-11)
**Dependencias:** FASE_21 implementada, terreno activo

---

## Objetivo

Verificar que el módulo de insumos permite registrar fertilizantes, pesticidas
y otros insumos, calcular dosis por zona, y detectar incompatibilidades químicas.

---

## Pasos

### Fase 1 — Lista de insumos

1. Navegar a `/insumos`
2. **Verificar:** lista de insumos del catálogo (fertilizantes, pesticidas, correctores de pH)
3. **Verificar:** filtros por tipo de insumo funcionan

### Fase 2 — Agregar insumo a zona

1. Seleccionar un insumo del catálogo
2. Asignar a una zona de cultivo con dosis
3. Guardar
4. **Verificar IDB:** registro creado en tabla `insumos_aplicados` o equivalente

### Fase 3 — Cálculo de dosis

1. Para zona con área conocida, verificar que la dosis total = dosis_por_m2 × area
2. **Verificar:** el cálculo usa `resolverAreaZona()` (no `zona.area_m2` directo)
3. **Verificar:** sin NaN para zonas legacy

### Fase 4 — Compatibilidad química

1. Agregar dos insumos incompatibles a la misma zona en el mismo período
2. **Verificar:** alerta de incompatibilidad visible
3. **Verificar:** el par de insumos incompatibles está en el catálogo de incompatibilidades

### Fase 5 — Historial

1. **Verificar:** historial de insumos aplicados por zona con fecha
2. **Verificar:** los insumos aparecen en el cálculo de costos de `/economia`

---

## Criterios de Éxito

- [ ] Lista de insumos con filtros funcionales
- [ ] Agregar insumo persiste en IDB
- [ ] Dosis calculada correctamente (sin NaN para zonas legacy)
- [ ] Incompatibilidades químicas detectadas
- [ ] Historial visible por zona
- [ ] Costos de insumos reflejados en /economia
