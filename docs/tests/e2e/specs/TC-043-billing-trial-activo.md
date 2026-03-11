# TC-043 — Billing: Trial activo permite acceso

**Feature:** Billing Guard con trial de 6 meses
**Prioridad:** 🔴 Critica
**Estado:** ⏳ Pendiente
**Dependencias:** Usuario autenticado con trial activo

---

## Objetivo

Verificar que un usuario con trial activo puede acceder a la app sin restricciones y que las paginas de billing muestran el estado correcto.

---

## Precondiciones

- Usuario recien registrado (trial automatico de 180 dias)
- `pnpm dev` corriendo

---

## Pasos

### Fase 1 — Acceso a la app

1. Navegar a `/`
2. **Verificar:** NO redirige a billing
3. **Verificar:** la app carga normalmente
4. Navegar a `/terrenos`, `/agua`, `/economia`
5. **Verificar:** todas las rutas protegidas son accesibles

### Fase 2 — Subscribe page detecta trial

1. Navegar a `/billing/subscribe`
2. **Verificar:** NO muestra la card de suscripcion
3. **Verificar:** muestra mensaje "Trial activo"
4. **Verificar:** muestra dias restantes (ej: "Quedan 179 dias")
5. **Verificar:** boton "Ir a la app" presente
6. **Verificar:** boton "Gestionar" presente

### Fase 3 — Manage page muestra trial

1. Navegar a `/billing/manage`
2. **Verificar:** estado muestra "Trial (X dias restantes)" con dot verde
3. **Verificar:** muestra fecha de finalizacion del trial
4. **Verificar:** boton "Cancelar suscripcion" disponible

---

## Criterios de exito

- [ ] Trial activo no bloquea ninguna ruta
- [ ] Subscribe page detecta trial y no permite doble pago
- [ ] Manage page muestra info de trial correctamente
- [ ] Dias restantes calculados correctamente

---

## Herramienta

Chrome DevTools MCP: `navigate_page`, `take_screenshot`, `evaluate_script`
