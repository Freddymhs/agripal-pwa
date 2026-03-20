import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { paymentClient } from "@/lib/mercadopago/client";
import { logger } from "@/lib/logger";
import { getCurrentTimestamp } from "@/lib/utils";
import {
  MP_ESTADO_MAP,
  BILLING,
  ESTADO_PAGO,
  ESTADO_SUSCRIPCION,
} from "@/lib/constants/billing";

interface WebhookBody {
  type: string;
  data: { id: string | number };
}

interface PaymentMetadata {
  user_id: string;
  plan_id: string;
}

function verifyWebhookSignature(request: Request, body: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) {
    logger.error("billing.webhook", {
      message: "MP_WEBHOOK_SECRET not configured — rejecting webhook",
    });
    return false;
  }

  const xSignature = request.headers.get("x-signature");
  const xRequestId = request.headers.get("x-request-id");

  if (!xSignature || !xRequestId) {
    return false;
  }

  const parts = Object.fromEntries(
    xSignature.split(",").map((part) => {
      const [key, value] = part.trim().split("=");
      return [key, value];
    }),
  );

  const ts = parts["ts"];
  const hash = parts["v1"];
  if (!ts || !hash) return false;

  const parsedBody = JSON.parse(body) as WebhookBody;
  const dataId = parsedBody.data?.id ?? "";

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const computedHash = createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  return timingSafeEqual(Buffer.from(computedHash), Buffer.from(hash));
}

async function handlePayment(paymentId: string) {
  const payment = await paymentClient.get({ id: paymentId });
  const metadata = payment.metadata as PaymentMetadata;

  if (!metadata?.user_id || !metadata?.plan_id) {
    logger.error("billing.webhook", {
      message: "Missing user_id or plan_id in payment metadata",
      paymentId,
    });
    return;
  }

  const estado = MP_ESTADO_MAP[payment.status ?? ""] ?? ESTADO_PAGO.PENDING;

  const { data: existingPago } = await supabaseAdmin
    .from("pagos")
    .select("id")
    .eq("mp_payment_id", paymentId)
    .single();

  if (existingPago) {
    await supabaseAdmin
      .from("pagos")
      .update({ estado, updated_at: getCurrentTimestamp() })
      .eq("id", existingPago.id);
  } else {
    await supabaseAdmin.from("pagos").insert({
      usuario_id: metadata.user_id,
      monto: payment.transaction_amount ?? 0,
      moneda: payment.currency_id ?? BILLING.MONEDA,
      estado,
      mp_payment_id: paymentId,
      mp_merchant_order_id: payment.order?.id?.toString(),
      descripcion: payment.description ?? "",
      metadata: payment.metadata,
    });
  }

  if (payment.status === "approved") {
    const nowISO = getCurrentTimestamp();
    const periodEndDate = new Date(nowISO);
    periodEndDate.setMonth(periodEndDate.getMonth() + BILLING.RENEWAL_MONTHS);
    const periodEndISO = periodEndDate.toISOString();

    const suscripcionData = {
      estado: ESTADO_SUSCRIPCION.ACTIVE,
      current_period_start: nowISO,
      current_period_end: periodEndISO,
      cancel_at_period_end: false,
      updated_at: nowISO,
    };

    // UPSERT: evita race condition si llegan dos webhooks simultaneos
    const { data: suscripcionActual } = await supabaseAdmin
      .from("suscripciones")
      .select("id")
      .eq("usuario_id", metadata.user_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (suscripcionActual) {
      await supabaseAdmin
        .from("suscripciones")
        .update(suscripcionData)
        .eq("id", suscripcionActual.id);
    } else {
      await supabaseAdmin.from("suscripciones").insert({
        usuario_id: metadata.user_id,
        plan_id: metadata.plan_id,
        ...suscripcionData,
      });
    }

    logger.info("billing.payment_approved", {
      userId: metadata.user_id,
      paymentId,
    });
  }
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();

    if (!verifyWebhookSignature(request, rawBody)) {
      logger.warn("billing.webhook", { message: "Invalid signature" });
      return NextResponse.json({ error: "Firma invalida" }, { status: 401 });
    }

    const body = JSON.parse(rawBody) as WebhookBody;

    logger.info("billing.webhook", { type: body.type, id: body.data?.id });

    if (body.type === "payment") {
      await handlePayment(body.data.id.toString());
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("billing.webhook", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
