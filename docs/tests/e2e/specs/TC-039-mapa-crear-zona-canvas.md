# TC-039 — Mapa: Crear zona vía canvas drag (modo crear_zona)

**Feature:** Mapa PixiJS — modo `crear_zona`
**Prioridad:** 🔴 Crítica
**Estado:** ✅ PASA (2026-03-11)
**Dependencias:** Terreno activo en el mapa, pnpm dev corriendo

---

## Objetivo

Verificar que el flujo de creación de zonas vía drag en el canvas PixiJS
funciona correctamente: dibujar rectángulo, asignar nombre y tipo, guardar en IDB.

---

## Notas técnicas

El canvas PixiJS usa eventos nativos DOM (`addEventListener`).
Para simular drag en tests automatizados se requiere:

- `MouseEvent('mousedown', {clientX, clientY})`
- `MouseEvent('mousemove', {clientX: clientX+dx, clientY: clientY+dy})`
- `MouseEvent('mouseup', {clientX: clientX+dx, clientY: clientY+dy})`

Las coordenadas se calculan desde `canvas.getBoundingClientRect()`:

- `screenX = rect.left + (terrenoX * scale) + offsetX`
- `screenY = rect.top + (terrenoY * scale) + offsetY`

---

## Pasos

### Fase 1 — Activar modo crear_zona

1. Navegar al mapa con terreno activo
2. Entrar a modo ZONAS (toolbar)
3. Click en botón "Nueva Zona" o equivalente
4. **Verificar:** cursor cambia a modo dibujo
5. **Verificar:** el modo activo es `crear_zona`

### Fase 2 — Dibujar zona por drag

1. Posicionarse en una esquina del terreno (ej: terreno pos 10,10)
2. Disparar `mousedown` en coordenadas screen correspondientes
3. Mover mouse a pos terreno 40,40 (drag de 30m×30m)
4. Disparar `mouseup`
5. **Verificar:** rectángulo de preview aparece durante el drag
6. **Verificar:** formulario de zona aparece post-drag (nombre, tipo)

### Fase 3 — Configurar y guardar zona

1. En el formulario:
   - Nombre: "Zona TC-039"
   - Tipo: "cultivo"
2. Guardar
3. **Verificar:** la zona aparece renderizada en el mapa
4. **Verificar IDB:** registro en tabla `zonas` con coordenadas y dimensiones correctas
5. **Verificar:** `ancho ≈ 30m`, `alto ≈ 30m` (tolerancia ±1m según scale)

### Fase 4 — Zona con nombre existente

1. Intentar crear segunda zona con mismo nombre
2. **Verificar:** advertencia o nombre autosufix (según comportamiento esperado)

### Fase 5 — Zona fuera de límites del terreno

1. Intentar drag que sobrepase los límites del terreno
2. **Verificar:** la zona se recorta al límite o se rechaza con mensaje

---

## Criterios de Éxito

- [ ] Modo crear_zona se activa desde toolbar
- [ ] Drag genera rectángulo de preview
- [ ] Formulario de configuración aparece post-drag
- [ ] Zona guardada en IDB con coordenadas correctas
- [ ] La zona aparece renderizada en el mapa inmediatamente
- [ ] Zonas fuera de límites manejadas sin crash
