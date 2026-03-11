# TC-040 — Mapa: Plantar en grilla batch, selección múltiple y mover plantas

**Feature:** Mapa PixiJS — modo plantar batch, Shift+drag selección, mover grupo
**Prioridad:** 🟡 Media
**Estado:** ✅ PASA (2026-03-11)
**Dependencias:** TC-026 verificado, zona de cultivo disponible con espacio libre

---

## Objetivo

Verificar las operaciones avanzadas del mapa sobre plantas:
batch planting (llenar grilla automáticamente), selección múltiple con Shift+drag,
y mover un grupo de plantas seleccionadas.

---

## Parte A — Plantar en grilla (batch)

### Pasos

1. Entrar a modo PLANTAR en una zona de cultivo con espacio libre
2. En el panel de siembra, seleccionar cultivo y activar "Plantar en grilla" o "Llenar zona"
3. **Verificar:** preview de la grilla aparece en el canvas
4. Confirmar plantado
5. **Verificar IDB:** N plantas creadas con posiciones alineadas al grid
6. **Verificar:** espaciado respeta `cultivo.espaciado_recomendado_m`
7. **Verificar:** no se crean plantas fuera del bounding box de la zona

### Criterios

- [ ] Grilla respeta espaciado del cultivo
- [ ] Plantas creadas en IDB con posiciones correctas
- [ ] Sin plantas fuera de la zona
- [ ] Sin duplicados en la misma posición de grilla

---

## Parte B — Selección múltiple (Shift+drag)

### Pasos

1. Con plantas en el mapa, activar modo selección (si existe)
2. Mantener Shift y hacer drag sobre un área con varias plantas
3. **Verificar:** plantas dentro del área quedan seleccionadas (highlight visual)
4. **Verificar:** contador de selección correcto ("X plantas seleccionadas")

### Criterios

- [ ] Shift+drag selecciona múltiples plantas
- [ ] Indicador visual de selección en cada planta
- [ ] Counter de plantas seleccionadas visible

---

## Parte C — Mover grupo seleccionado

### Pasos

1. Con grupo seleccionado (de Parte B)
2. Drag del grupo a nueva posición dentro de la zona
3. **Verificar:** todas las plantas se mueven manteniendo su disposición relativa
4. **Verificar IDB:** posiciones `x,y` de cada planta actualizadas
5. **Verificar:** si la nueva posición queda fuera de la zona → plantas regresan o se recortan

### Criterios

- [ ] Grupo se mueve manteniendo disposición relativa
- [ ] IDB actualizado con nuevas coordenadas
- [ ] Movimiento fuera de zona manejado sin crash
