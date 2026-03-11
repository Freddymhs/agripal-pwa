# TC-032 — Terrenos: CRUD completo vía UI

**Feature:** Gestión de proyectos y terrenos desde `/terrenos`
**Prioridad:** 🔴 Crítica
**Estado:** ✅ PASA (2026-03-11)
**Dependencias:** Usuario autenticado, pnpm dev corriendo

---

## Objetivo

Verificar que el flujo completo de creación, edición y eliminación de proyectos
y terrenos funciona desde la UI (sin scripts IDB), incluyendo la sincronización
con Supabase cuando el sync está activo.

---

## Precondiciones

- Usuario autenticado en `http://localhost:3000`
- Sin proyectos previos (o con proyectos conocidos para verificar aislamiento)

---

## Pasos

### Fase 1 — Crear proyecto

1. Navegar a `/terrenos`
2. Verificar que aparece el estado vacío "No tienes proyectos"
3. Click en "Nuevo Proyecto"
4. Completar formulario: nombre "Test TC-032", descripción "proyecto de prueba"
5. Guardar
6. **Verificar:** el proyecto aparece en la lista
7. **Verificar IDB:** `proyectos` table tiene el nuevo registro con `usuario_id` correcto

### Fase 2 — Crear terreno dentro del proyecto

1. Seleccionar el proyecto "Test TC-032"
2. Click en "Nuevo Terreno"
3. Completar: nombre "Terreno A", ancho 50m, alto 100m
4. Guardar
5. **Verificar:** el terreno aparece en la lista del proyecto
6. **Verificar IDB:** `terrenos` table tiene el registro con `proyecto_id` correcto

### Fase 3 — Editar terreno

1. Click en el terreno "Terreno A" → opción "Editar"
2. Cambiar nombre a "Terreno A (editado)"
3. Guardar
4. **Verificar:** el nombre actualizado aparece en la lista
5. **Verificar IDB:** el campo `nombre` fue actualizado

### Fase 4 — Eliminar terreno

1. Click en el terreno → opción "Eliminar"
2. Confirmar eliminación en el modal
3. **Verificar:** el terreno desaparece de la lista
4. **Verificar IDB:** el registro fue eliminado (no soft-delete)

### Fase 5 — Eliminar proyecto

1. En la lista de proyectos, eliminar "Test TC-032"
2. Confirmar
3. **Verificar:** el proyecto desaparece
4. **Verificar IDB:** proyecto eliminado, terrenos asociados eliminados en cascada

### Fase 6 — Sync (si está activo)

1. Verificar en Supabase que los cambios se sincronizaron correctamente
2. Verificar que la eliminación llegó como `DELETE` a Supabase

---

## Criterios de Éxito

- [ ] Proyecto creado y visible en lista
- [ ] Terreno creado con dimensiones correctas
- [ ] Edición persiste correctamente
- [ ] Eliminación limpia IDB sin residuos
- [ ] Eliminación de proyecto limpia terrenos en cascada
- [ ] Sin errores de consola durante el flujo
