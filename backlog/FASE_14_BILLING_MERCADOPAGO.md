# FASE 14: Sistema de Billing con MercadoPago

**Status**: ⏳ PENDIENTE
**Prioridad**: 🔴 ALTA
**Dependencias**: FASE_13
**Estimación**: 8-10 horas
**Última revisión**: 2026-03-01 (auditado + correcciones críticas al plan)

## Estado Real del Código (auditado 2026-03-01)

| Aspecto                            | Estado                                         |
| ---------------------------------- | ---------------------------------------------- |
| `mercadopago` SDK instalado        | ❌ NO                                          |
| `@mercadopago/sdk-react` instalado | ❌ NO                                          |
| `src/app/billing/`                 | ❌ NO existe                                   |
| `src/app/api/`                     | ❌ NO existe (ningún Route Handler creado aún) |
| `src/hooks/use-subscription.ts`    | ❌ NO existe                                   |
| `supabase/migrations/billing`      | ❌ NO existe                                   |

**Resumen**: 0% implementado. Depende completamente de FASE_12 (Supabase DB) y FASE_13 (Auth real).

## Correcciones Críticas al Plan Original

### 1. El middleware usa librería deprecated

El plan original usa `createMiddlewareClient` de `@supabase/auth-helpers-nextjs`.
**Corrección**: usar `createServerClient` de `@supabase/ssr` (ver patrón en FASE_13).

### 2. El guard de billing va en `proxy.ts`, no en `middleware.ts`

Next.js 16 usa `proxy.ts` con `export function proxy()`.
El guard de billing debe extender el `proxy.ts` existente, no crear un nuevo `middleware.ts`.

### 3. `supabaseAdmin` no existe aún

El webhook usa `supabaseAdmin` de `src/lib/supabase/client.ts`.
Este cliente con `SERVICE_ROLE_KEY` se crea en FASE_12. Requerido para que el webhook funcione sin RLS.

### 4. `console.log/error` directo — prohibido en producción

El código del webhook usa `console.log/error` directamente.
**Corrección**: usar el logger centralizado del proyecto (`src/lib/logger.ts`).

### 5. `estado: payment.status as any` — prohibido

**Corrección**: mapear explícitamente los estados de MercadoPago al enum `estado_pago`.

### 6. `supabaseAdmin` — para qué sirve

El webhook de MercadoPago corre en el servidor sin sesión de usuario. Para actualizar la suscripción de un usuario necesita escribir en Supabase saltándose el RLS. Para eso existe `supabaseAdmin` (usa `SERVICE_ROLE_KEY`). Se agrega a `src/lib/supabase/client.ts` en esta fase:

```typescript
// Solo para uso server-side (Route Handlers) — NUNCA en código del browser
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);
```

---

## Objetivo

Implementar sistema de suscripciones mensuales con MercadoPago para convertir AgriPlan en un SaaS.

**Características:**

1. Suscripción mensual de **9,990 CLP** (~$10 USD)
2. **Trial de 20 días gratis** al registrarse
3. Verificación de pago activo en cada sesión
4. Bloqueo de app si no hay suscripción válida
5. Gestión de suscripciones (cancelar, renovar)
6. Webhooks de MercadoPago para notificaciones
7. Historial de pagos

---

## Contexto de Negocio

### Modelo de Monetización

**Plan Único:**

- **Precio:** 9,990 CLP/mes (Chile)
- **Equivalente:** ~$10 USD / ~$10.000 CLP
- **Facturación:** Mensual recurrente
- **Trial:** 20 días gratis (automático al registrarse, sin tarjeta)
- **Alcance del plan:** Todo ilimitado — sin cuotas de terrenos, zonas, plantas ni almacenamiento

### Flujo de Usuario

```
┌─────────────────┐
│  Nuevo Usuario  │
└────────┬────────┘
         │
    ┌────▼────┐
    │ Registro│
    └────┬────┘
         │
    ┌────▼──────────────┐
    │ Trial 20 días     │ (automático, sin tarjeta)
    └────┬──────────────┘
         │
    ┌────▼──────────────┐
    │ Pagar Suscripción │
    └────┬──────────────┘
         │
    ┌────▼──────────────┐
    │ App Desbloqueada  │
    └───────────────────┘
```

**Estados de suscripción:**

- `trialing` - Periodo de prueba activo
- `active` - Pago activo, app desbloqueada
- `past_due` - Pago rechazado, gracia de 3 días
- `canceled` - Cancelada por usuario
- `inactive` - Expirada, app bloqueada

---

## Arquitectura

```
┌─────────────────────────┐
│  Usuario (Frontend)     │
└──────────┬──────────────┘
           │
      ┌────▼─────┐
      │ Checkout │
      └────┬─────┘
           │
      ┌────▼──────────────────┐
      │ API Route             │
      │ /api/billing/checkout │
      └────┬──────────────────┘
           │
      ┌────▼──────────────────┐
      │ MercadoPago SDK       │
      │ (crear preferencia)   │
      └────┬──────────────────┘
           │
      ┌────▼──────────────────┐
      │ MercadoPago Checkout  │
      │ (usuario paga)        │
      └────┬──────────────────┘
           │
      ┌────▼──────────────────┐
      │ Webhook               │
      │ /api/webhooks/mp      │
      └────┬──────────────────┘
           │
      ┌────▼──────────────────┐
      │ Actualizar DB         │
      │ (marcar activa)       │
      └───────────────────────┘
```

---

## Modelo de Datos

### Tablas Nuevas

**Archivo**: `supabase/migrations/20260204_billing_schema.sql` (crear)

```sql
-- ============================================
-- PLANES
-- ============================================
CREATE TABLE planes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  precio FLOAT NOT NULL,
  moneda TEXT NOT NULL DEFAULT 'CLP',
  intervalo TEXT NOT NULL DEFAULT 'monthly',
  descripcion TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plan por defecto
INSERT INTO planes (nombre, precio, moneda, intervalo, descripcion) VALUES
('Plan Mensual', 9990, 'CLP', 'monthly', 'Acceso completo a AgriPlan');

-- ============================================
-- SUSCRIPCIONES
-- ============================================
CREATE TYPE estado_suscripcion AS ENUM (
  'trialing',
  'active',
  'past_due',
  'canceled',
  'inactive'
);

CREATE TABLE suscripciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES planes(id),
  estado estado_suscripcion DEFAULT 'inactive',

  -- Periodo actual
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,

  -- Trial
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,

  -- MercadoPago
  mp_subscription_id TEXT UNIQUE,
  mp_preapproval_id TEXT,

  -- Control
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX suscripciones_usuario_id_idx ON suscripciones(usuario_id);
CREATE INDEX suscripciones_estado_idx ON suscripciones(estado);

-- ============================================
-- PAGOS
-- ============================================
CREATE TYPE estado_pago AS ENUM (
  'pending',
  'approved',
  'authorized',
  'in_process',
  'in_mediation',
  'rejected',
  'cancelled',
  'refunded',
  'charged_back'
);

CREATE TABLE pagos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  suscripcion_id UUID REFERENCES suscripciones(id),

  -- Montos
  monto FLOAT NOT NULL,
  moneda TEXT NOT NULL DEFAULT 'CLP',

  -- Estado
  estado estado_pago DEFAULT 'pending',

  -- MercadoPago
  mp_payment_id TEXT UNIQUE,
  mp_preference_id TEXT,
  mp_merchant_order_id TEXT,

  -- Metadata
  descripcion TEXT,
  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX pagos_usuario_id_idx ON pagos(usuario_id);
CREATE INDEX pagos_suscripcion_id_idx ON pagos(suscripcion_id);
CREATE INDEX pagos_estado_idx ON pagos(estado);
CREATE INDEX pagos_mp_payment_id_idx ON pagos(mp_payment_id);

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_suscripciones_updated_at BEFORE UPDATE ON suscripciones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pagos_updated_at BEFORE UPDATE ON pagos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS
-- ============================================
ALTER TABLE suscripciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven solo sus suscripciones"
  ON suscripciones FOR SELECT
  USING (usuario_id = auth.uid());

CREATE POLICY "Usuarios ven solo sus pagos"
  ON pagos FOR SELECT
  USING (usuario_id = auth.uid());
```

---

## Tareas

### Tarea 1: Configurar MercadoPago

**Pasos:**

1. **Crear cuenta en MercadoPago:**
   - https://www.mercadopago.cl/
   - Completar verificación

2. **Obtener credenciales:**
   - Developer → Tus integraciones → Crear aplicación
   - Copiar:
     - `Public Key` (client-side)
     - `Access Token` (server-side)

3. **Configurar Webhooks:**
   - URL: `https://tudominio.com/api/webhooks/mercadopago`
   - Eventos:
     - `payment` (todos)
     - `subscription_preapproval` (todos)

**Archivo**: `.env.local` (agregar)

```env
# MercadoPago
NEXT_PUBLIC_MP_PUBLIC_KEY=APP_USR-xxx-xxx
MP_ACCESS_TOKEN=APP_USR-xxx-xxx
MP_WEBHOOK_SECRET=xxx
```

**Instalar SDK:**

```bash
pnpm add mercadopago
```

---

### Tarea 2: Crear Utilidades de MercadoPago

**Archivo**: `src/lib/mercadopago/client.ts` (crear)

```typescript
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

if (!process.env.MP_ACCESS_TOKEN) {
  throw new Error("MP_ACCESS_TOKEN no configurado");
}

export const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

export const preferenceClient = new Preference(mpClient);
export const paymentClient = new Payment(mpClient);
```

---

### Tarea 3: API Route - Crear Checkout

**Archivo**: `src/app/api/billing/checkout/route.ts` (crear)

```typescript
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { preferenceClient } from "@/lib/mercadopago/client";

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { data: plan } = await supabase
      .from("planes")
      .select()
      .eq("activo", true)
      .single();

    if (!plan) {
      return NextResponse.json(
        { error: "Plan no encontrado" },
        { status: 404 },
      );
    }

    const preference = await preferenceClient.create({
      body: {
        items: [
          {
            id: plan.id,
            title: plan.nombre,
            description: plan.descripcion || "",
            quantity: 1,
            unit_price: plan.precio,
            currency_id: "CLP",
          },
        ],
        payer: {
          email: user.email!,
        },
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success`,
          failure: `${process.env.NEXT_PUBLIC_APP_URL}/billing/failure`,
          pending: `${process.env.NEXT_PUBLIC_APP_URL}/billing/pending`,
        },
        auto_return: "approved",
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
        metadata: {
          user_id: user.id,
          plan_id: plan.id,
        },
      },
    });

    const { data: pago } = await supabase
      .from("pagos")
      .insert({
        usuario_id: user.id,
        monto: plan.precio,
        moneda: "CLP",
        estado: "pending",
        mp_preference_id: preference.id,
        descripcion: plan.nombre,
      })
      .select()
      .single();

    return NextResponse.json({
      preferenceId: preference.id,
      initPoint: preference.init_point,
      pagoId: pago.id,
    });
  } catch (error) {
    logger.error("billing.checkout", error);
    return NextResponse.json(
      { error: "Error al crear checkout" },
      { status: 500 },
    );
  }
}
```

---

### Tarea 4: API Route - Webhook MercadoPago

**Archivo**: `src/app/api/webhooks/mercadopago/route.ts` (crear)

```typescript
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/client";
import { paymentClient } from "@/lib/mercadopago/client";
import { logger } from "@/lib/logger";

// Mapeo explícito de estados MercadoPago → enum estado_pago
const MP_ESTADO_MAP: Record<string, string> = {
  pending: "pending",
  approved: "approved",
  authorized: "authorized",
  in_process: "in_process",
  in_mediation: "in_mediation",
  rejected: "rejected",
  cancelled: "cancelled",
  refunded: "refunded",
  charged_back: "charged_back",
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    logger.info("billing.webhook", { type: body.type, id: body.data?.id });

    if (body.type === "payment") {
      const paymentId = body.data.id;

      const payment = await paymentClient.get({ id: paymentId });

      const { data: pago } = await supabaseAdmin
        .from("pagos")
        .select()
        .eq("mp_payment_id", paymentId.toString())
        .single();

      if (!pago) {
        const metadata = payment.metadata as {
          user_id: string;
          plan_id: string;
        };

        await supabaseAdmin.from("pagos").insert({
          usuario_id: metadata.user_id,
          monto: payment.transaction_amount || 0,
          moneda: payment.currency_id || "CLP",
          estado: MP_ESTADO_MAP[payment.status ?? ""] ?? "pending",
          mp_payment_id: paymentId.toString(),
          mp_merchant_order_id: payment.order?.id?.toString(),
          descripcion: payment.description || "",
          metadata: payment.metadata,
        });
      } else {
        await supabaseAdmin
          .from("pagos")
          .update({
            estado: MP_ESTADO_MAP[payment.status ?? ""] ?? "pending",
            updated_at: new Date().toISOString(),
          })
          .eq("id", pago.id);
      }

      if (payment.status === "approved") {
        const metadata = payment.metadata as {
          user_id: string;
          plan_id: string;
        };

        const { data: suscripcionActual } = await supabaseAdmin
          .from("suscripciones")
          .select()
          .eq("usuario_id", metadata.user_id)
          .single();

        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        if (!suscripcionActual) {
          await supabaseAdmin.from("suscripciones").insert({
            usuario_id: metadata.user_id,
            plan_id: metadata.plan_id,
            estado: "active",
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
            mp_payment_id: paymentId.toString(),
          });
        } else {
          await supabaseAdmin
            .from("suscripciones")
            .update({
              estado: "active",
              current_period_start: now.toISOString(),
              current_period_end: periodEnd.toISOString(),
              updated_at: now.toISOString(),
            })
            .eq("id", suscripcionActual.id);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("billing.webhook", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
```

---

### Tarea 5: Hook useSubscription

**Archivo**: `src/hooks/use-subscription.ts` (crear)

```typescript
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuthContext } from "@/components/providers/AuthProvider";

interface Subscription {
  id: string;
  plan_id: string;
  estado: "trialing" | "active" | "past_due" | "canceled" | "inactive";
  current_period_end: string;
  trial_end?: string;
}

interface UseSubscription {
  subscription: Subscription | null;
  loading: boolean;
  isActive: boolean;
  isTrialing: boolean;
  daysRemaining: number;
  needsPayment: boolean;
}

export function useSubscription(): UseSubscription {
  const { usuario } = useAuthContext();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!usuario) {
      setLoading(false);
      return;
    }

    const fetchSubscription = async () => {
      const { data } = await supabase
        .from("suscripciones")
        .select()
        .eq("usuario_id", usuario.id)
        .single();

      setSubscription(data);
      setLoading(false);
    };

    fetchSubscription();

    const channel = supabase
      .channel("subscription-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "suscripciones",
          filter: `usuario_id=eq.${usuario.id}`,
        },
        (payload) => {
          setSubscription(payload.new as Subscription);
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [usuario]);

  const isActive = subscription?.estado === "active";
  const isTrialing = subscription?.estado === "trialing";

  const daysRemaining = subscription?.current_period_end
    ? Math.ceil(
        (new Date(subscription.current_period_end).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      )
    : 0;

  const needsPayment = !isActive && !isTrialing;

  return {
    subscription,
    loading,
    isActive,
    isTrialing,
    daysRemaining,
    needsPayment,
  };
}
```

---

### Tarea 6: Extender `proxy.ts` con verificación de suscripción

**Archivo**: `src/proxy.ts` (modificar — extender el guard existente de FASE_13)

> Next.js 16 usa `proxy.ts` con `export function proxy()`. No crear `middleware.ts`.
> La librería correcta es `@supabase/ssr`, no `auth-helpers-nextjs` (deprecated).

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";
import { ROUTES } from "@/lib/constants/routes";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next({ request });

  const isBillingPage = pathname.startsWith("/billing");
  const isAuthPage = pathname.startsWith("/auth");
  const isAppPage = pathname.startsWith("/app");

  // Solo actuar en rutas protegidas
  if (!isAppPage && !isBillingPage) {
    return response;
  }

  const supabase = createSupabaseMiddlewareClient(request, response);

  // getSession() lee cookies locales — funciona offline (ver decisión en FASE_13)
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (!user) {
    const loginUrl = new URL(ROUTES.AUTH_LOGIN, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verificar suscripción activa (solo en /app, no en /billing)
  if (isAppPage) {
    const { data: suscripcion } = await supabase
      .from("suscripciones")
      .select("estado, current_period_end")
      .eq("usuario_id", user.id)
      .single();

    const isActive =
      suscripcion?.estado === "active" || suscripcion?.estado === "trialing";

    if (!isActive) {
      return NextResponse.redirect(new URL("/billing/subscribe", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/app/:path*", "/billing/:path*"],
};
```

---

### Tarea 7: Página de Suscripción

**Archivo**: `src/app/billing/subscribe/page.tsx` (crear)

```typescript
'use client'

import { useState } from 'react'
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react'
import { useAuthContext } from '@/components/providers/AuthProvider'
import { logger } from '@/lib/logger'

if (process.env.NEXT_PUBLIC_MP_PUBLIC_KEY) {
  initMercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY)
}

export default function SubscribePage() {
  const { usuario } = useAuthContext()
  const [preferenceId, setPreferenceId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.preferenceId) {
        setPreferenceId(data.preferenceId)
      }
    } catch (error) {
      logger.error("billing.subscribe", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Activa AgriPlan
          </h1>
          <p className="text-gray-600">
            Suscripción mensual para acceder a todas las funcionalidades
          </p>
        </div>

        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">
              $9,990
              <span className="text-lg text-gray-500 font-normal"> CLP/mes</span>
            </div>
            <p className="text-sm text-gray-600">Facturación mensual</p>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm text-gray-700">
                Planificación ilimitada de terrenos
              </span>
            </div>
            <div className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm text-gray-700">
                Recomendaciones inteligentes de cultivos
              </span>
            </div>
            <div className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm text-gray-700">
                Gestión de agua y alertas
              </span>
            </div>
            <div className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm text-gray-700">
                Sincronización multi-dispositivo
              </span>
            </div>
            <div className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm text-gray-700">Soporte prioritario</span>
            </div>
          </div>
        </div>

        {!preferenceId ? (
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className={`w-full py-4 rounded-lg font-semibold text-white text-lg ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Preparando...' : 'Suscribirme Ahora'}
          </button>
        ) : (
          <div className="mt-4">
            <Wallet
              initialization={{ preferenceId }}
              customization={{
                texts: {
                  valueProp: 'smart_option',
                },
              }}
            />
          </div>
        )}

        <p className="text-xs text-gray-500 text-center mt-4">
          Pago seguro con MercadoPago. Cancela cuando quieras.
        </p>
      </div>
    </div>
  )
}
```

---

### Tarea 8: Página de Gestión de Suscripción

**Archivo**: `src/app/billing/manage/page.tsx` (crear)

```typescript
'use client'

import { useSubscription } from '@/hooks/use-subscription'
import { useAuthContext } from '@/components/providers/AuthProvider'

export default function ManageBillingPage() {
  const { usuario } = useAuthContext()
  const { subscription, loading, isActive, daysRemaining } = useSubscription()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Gestionar Suscripción</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Estado Actual</h2>

          {isActive ? (
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="font-medium text-green-700">Activa</span>
              </div>
              <p className="text-sm text-gray-600">
                Tu suscripción está activa. Renueva en {daysRemaining} días.
              </p>
            </div>
          ) : (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <span className="font-medium text-red-700">Inactiva</span>
              </div>
              <p className="text-sm text-gray-600">
                Tu suscripción está inactiva. Renueva para seguir usando AgriPlan.
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Plan Actual</h2>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-medium">Plan Mensual</div>
              <div className="text-sm text-gray-500">$9,990 CLP/mes</div>
            </div>
          </div>

          {subscription?.current_period_end && (
            <p className="text-sm text-gray-600 mb-4">
              Próxima facturación:{' '}
              {new Date(subscription.current_period_end).toLocaleDateString('es-CL')}
            </p>
          )}

          <button
            onClick={() => {}}
            className="text-red-600 hover:text-red-700 text-sm font-medium"
          >
            Cancelar suscripción
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

### Tarea 9: Componente Subscription Badge

**Archivo**: `src/components/billing/SubscriptionBadge.tsx` (crear)

```typescript
'use client'

import { useSubscription } from '@/hooks/use-subscription'
import Link from 'next/link'

export function SubscriptionBadge() {
  const { isActive, isTrialing, daysRemaining, loading } = useSubscription()

  if (loading) return null

  if (isActive) {
    return (
      <Link
        href="/billing/manage"
        className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm hover:bg-green-100"
      >
        <div className="w-2 h-2 bg-green-500 rounded-full" />
        <span>Activa</span>
      </Link>
    )
  }

  if (isTrialing) {
    return (
      <Link
        href="/billing/subscribe"
        className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm hover:bg-blue-100"
      >
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        <span>Trial ({daysRemaining}d)</span>
      </Link>
    )
  }

  return (
    <Link
      href="/billing/subscribe"
      className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-sm hover:bg-red-100"
    >
      <div className="w-2 h-2 bg-red-500 rounded-full" />
      <span>Inactiva</span>
    </Link>
  )
}
```

---

## Criterios de Aceptación

### Infraestructura

- [ ] Cuenta de MercadoPago configurada
- [ ] Webhooks funcionando correctamente
- [ ] Schema de billing en Supabase

### Flujo de Pago

- [ ] Crear checkout genera preferencia de MercadoPago
- [ ] Botón de pago redirige a MercadoPago
- [ ] Pago aprobado activa suscripción
- [ ] Webhook actualiza estado en DB

### Middleware

- [ ] Usuarios sin suscripción activa son redirigidos a /billing/subscribe
- [ ] Usuarios con trial pueden usar la app
- [ ] Usuarios con suscripción activa tienen acceso completo

### UI

- [ ] Página de suscripción muestra precio y beneficios
- [ ] Badge de estado de suscripción en header
- [ ] Página de gestión muestra detalles y permite cancelar
- [ ] Historial de pagos visible

---

## Tests Manuales

1. **Test Nuevo Usuario:**
   - Registrarse
   - Ser redirigido a /billing/subscribe
   - Completar pago
   - Verificar acceso a app

2. **Test Webhook:**
   - Hacer pago de prueba
   - Verificar que webhook actualiza DB
   - Verificar que suscripción pasa a 'active'

3. **Test Middleware:**
   - Expirar suscripción manualmente en DB
   - Intentar acceder a /
   - Verificar redirect a /billing/subscribe

4. **Test Cancelación:**
   - Cancelar suscripción
   - Verificar que sigue activa hasta fin de periodo
   - Verificar bloqueo después de expiración

---

## Consideraciones de Producción

### Seguridad

- [ ] Validar webhook signature de MercadoPago
- [ ] Rate limiting en endpoints de billing
- [ ] Logs de todas las transacciones
- [ ] Alertas de pagos rechazados

### UX

- [ ] Email de confirmación de pago
- [ ] Email de recordatorio antes de expiración
- [ ] Gracia de 3 días para pagos rechazados
- [ ] Opción de exportar datos antes de cancelar

### Legal

- [ ] Términos y condiciones de servicio
- [ ] Política de privacidad
- [ ] Política de reembolsos
- [ ] Facturación electrónica (SII Chile)

---

## Notas de Implementación

- **Trial de 20 días**: Al registrarse en FASE_13, crear suscripción con `estado = 'trialing'`, `trial_start = NOW()`, `trial_end = NOW() + 20 days`. No requiere tarjeta. Al expirar, `proxy.ts` redirige a `/billing/subscribe`.
- **Webhook signature**: Validar header `x-signature` de MercadoPago usando `MP_WEBHOOK_SECRET` antes de procesar cualquier evento. Sin esto, cualquier request puede falsificar pagos.
- **RLS billing**: Las tablas `suscripciones` y `pagos` tienen RLS para SELECT del usuario. Solo el webhook (via `supabaseAdmin`) puede hacer INSERT/UPDATE — los usuarios no pueden modificar su propio estado de suscripción.
- **Offline + suscripción**: `proxy.ts` usa `getSession()` (cookies locales) para auth, pero la verificación de suscripción requiere red. Si el usuario está offline y la cookie de sesión es válida, se le da paso — la verificación de suscripción se hace en background al reconectar.
- **Logger**: Usar `src/lib/logger.ts` en todos los Route Handlers. Prohibido `console.log/error`.
- **`as any` prohibido**: Usar `MP_ESTADO_MAP` para mapear estados de MercadoPago al enum `estado_pago`.

## Siguiente Fase

**FASE_16** — Registro de Cosechas (UI)
