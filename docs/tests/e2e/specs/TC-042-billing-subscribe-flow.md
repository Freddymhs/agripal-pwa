# TC-042 — Billing: Flujo de suscripcion completo

**Feature:** Sistema de billing con MercadoPago
**Prioridad:** 🔴 Critica
**Estado:** ⏳ Pendiente
**Dependencias:** Usuario autenticado con trial expirado, pnpm dev corriendo, MP sandbox keys

---

## Objetivo

Verificar el flujo completo desde trial expirado hasta suscripcion activa via MercadoPago sandbox.

---

## Precondiciones

- Usuario autenticado en `http://localhost:3000`
- Trial expirado (o suscripcion inactiva en DB)
- Variables de entorno configuradas: `NEXT_PUBLIC_MP_PUBLIC_KEY`, `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`
- MercadoPago en modo sandbox

---

## Pasos

### Fase 1 — Deteccion de trial expirado

1. Navegar a `/` (homepage de la app)
2. **Verificar:** middleware redirige a `/billing/subscribe`
3. **Verificar:** se muestra la card de suscripcion con precio $9.990 CLP/mes
4. **Verificar:** se muestran las 5 features del plan
5. **Verificar:** el boton dice "Suscribirme Ahora"

### Fase 2 — Crear checkout

1. Click en "Suscribirme Ahora"
2. **Verificar:** boton cambia a "Preparando..."
3. **Verificar:** aparece el widget de MercadoPago Wallet
4. **Verificar en Network:** POST `/api/billing/checkout` retorna 200 con `preferenceId`

### Fase 3 — Pago en sandbox

1. Click en el boton de MercadoPago Wallet
2. Completar pago con tarjeta de prueba de MP sandbox
3. **Verificar:** redirige a `/billing/success`
4. **Verificar:** se muestra spinner "Verificando tu pago..."
5. **Verificar:** despues de unos segundos, muestra "Pago confirmado"
6. Click en "Ir a la app"
7. **Verificar:** se accede a la app normalmente (no redirige a billing)

### Fase 4 — Verificar en /billing/manage

1. Navegar a `/billing/manage`
2. **Verificar:** estado muestra "Activa" con dot verde
3. **Verificar:** proxima facturacion muestra fecha ~1 mes adelante
4. **Verificar:** historial de pagos muestra el pago reciente como "Aprobado"

---

## Criterios de exito

- [ ] Trial expirado → redirect a subscribe
- [ ] Checkout crea preference correctamente
- [ ] Pago sandbox completa sin errores
- [ ] Success page detecta pago aprobado
- [ ] App accesible post-pago
- [ ] Manage muestra estado correcto

---

## Herramienta

Chrome DevTools MCP: `navigate_page`, `click`, `fill`, `take_screenshot`, `list_network_requests`
