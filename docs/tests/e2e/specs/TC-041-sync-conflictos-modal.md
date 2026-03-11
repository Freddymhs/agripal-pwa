# TC-041 — Sync: Conflictos y modal de resolución

**Feature:** Sync engine — detección de conflictos, modal de resolución
**Prioridad:** 🟡 Media
**Estado:** ✅ PASA (2026-03-11)
**Dependencias:** TC-004 verificado, sync activo, 2 sesiones simultáneas o modificación directa en Supabase

---

## Objetivo

Verificar que cuando se detecta un conflicto de sincronización (modificación del mismo
registro tanto en IDB local como en Supabase remoto), el sistema lo detecta y presenta
al usuario el modal de resolución con ambas versiones.

---

## Notas técnicas

Un conflicto se produce cuando:

1. Usuario edita terreno A en local (sin sync)
2. La misma fila fue modificada en Supabase directamente (otra sesión o REST)
3. Al reconectar, el pull recibe una versión con `updated_at` diferente
4. El engine no puede hacer auto-merge → llama al modal de resolución

---

## Pasos

### Fase 1 — Preparar conflicto

1. Desconectar red (modo offline en DevTools)
2. En IDB via script: actualizar `terreno.nombre = "Versión Local"` con `updated_at = now`
3. Via REST API de Supabase: actualizar el mismo terreno con `nombre = "Versión Remota"`
4. Reconectar red

### Fase 2 — Detección del conflicto

1. El engine de sync inicia pull
2. **Verificar:** el conflicto es detectado (log en consola o estado `conflicto` en sync_queue)
3. **Verificar:** modal de resolución aparece (o notificación de conflicto en UI)

### Fase 3 — Modal de resolución

1. El modal muestra ambas versiones:
   - **Local:** "Versión Local"
   - **Remota:** "Versión Remota"
2. **Verificar:** timestamps de ambas versiones son visibles
3. **Verificar:** botones "Usar local" y "Usar remota" están disponibles

### Fase 4 — Resolver: Usar local

1. Click en "Usar local"
2. **Verificar:** IDB mantiene "Versión Local"
3. **Verificar:** Supabase es actualizado con "Versión Local"
4. **Verificar:** item de sync_queue marcado como completado

### Fase 5 — Resolver: Usar remota

1. (Reset al estado de conflicto) Click en "Usar remota"
2. **Verificar:** IDB actualizado con "Versión Remota"
3. **Verificar:** Supabase mantiene "Versión Remota"

### Fase 6 — Sin modal implementado

Si el modal de resolución no existe aún:

1. **Verificar:** el comportamiento de fallback (last-write-wins o remote-wins)
2. Documentar el comportamiento actual para diseñar el modal
3. **Verificar:** sin crash, sin datos corruptos

---

## Criterios de Éxito

- [ ] Conflicto detectado al reconciliar cambios
- [ ] Modal muestra ambas versiones con timestamps
- [ ] "Usar local" sincroniza versión local a Supabase
- [ ] "Usar remota" actualiza IDB con versión remota
- [ ] Item de sync_queue limpio post-resolución
- [ ] Sin datos corruptos en ningún caso
