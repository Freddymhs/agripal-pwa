# TC-035 — Alertas: Página completa y gestión

**Feature:** Página `/alertas`
**Prioridad:** 🟡 Media
**Estado:** ✅ PASA (2026-03-11)
**Dependencias:** TC-016 verificado, terreno con alertas generadas

---

## Objetivo

Verificar que la página `/alertas` muestra correctamente todas las alertas
activas del terreno, permite marcarlas como leídas, y que las alertas de
diferentes tipos tienen el formato visual correcto.

---

## Precondiciones

- Terreno activo con alertas generadas (agua_critica, replanta_pendiente, lavado_salino)
- Para forzar alertas: configurar nivel de agua bajo, zona con plantas vencidas

---

## Pasos

### Fase 1 — Carga y lista

1. Navegar a `/alertas`
2. **Verificar:** lista de alertas carga correctamente
3. **Verificar:** cada alerta muestra tipo, mensaje, zona afectada y fecha
4. **Verificar:** alertas críticas (agua_critica) destacadas visualmente

### Fase 2 — Tipos de alerta

1. **agua_critica:** nivel < umbral → aparece con ícono agua + días restantes
2. **replanta_pendiente:** planta madura → aparece con nombre de cultivo
3. **lavado_salino:** zona > 30 días → aparece con nombre de zona
4. **riesgo_encharcamiento:** si aplica según configuración de riego
5. **Verificar:** cada tipo tiene ícono/color diferenciado

### Fase 3 — Marcar como leída

1. Click en "Marcar como leída" en una alerta
2. **Verificar:** la alerta desaparece de la lista activa (o va a sección "leídas")
3. **Verificar IDB:** el campo `leida` fue actualizado a `true`

### Fase 4 — Sin alertas

1. Con terreno sin condiciones de alerta, verificar estado vacío
2. **Verificar:** mensaje "No hay alertas activas" o similar
3. **Verificar:** no crash, no lista vacía con errores

### Fase 5 — Sync de alertas

1. Con sync activo, crear una alerta y verificar que llega a Supabase
2. **Verificar:** tabla `alertas` en Supabase tiene el registro

---

## Criterios de Éxito

- [ ] Lista de alertas carga sin errores
- [ ] Tipos de alerta diferenciados visualmente
- [ ] Marcar como leída actualiza IDB
- [ ] Estado vacío sin errores ni crash
- [ ] Formato correcto de fecha y zona en cada alerta
