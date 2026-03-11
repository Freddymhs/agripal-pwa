import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/server";
import { preferenceClient } from "@/lib/mercadopago/client";
import { logger } from "@/lib/logger";
import { BILLING } from "@/lib/constants/billing";

export async function POST() {
  try {
    const supabase = await createRouteHandlerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Verificar que no tenga suscripcion activa
    const { data: existingSub } = await supabase
      .from("suscripciones")
      .select("estado, current_period_end, trial_end")
      .eq("usuario_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (existingSub) {
      const endDate =
        existingSub.estado === "trialing"
          ? existingSub.trial_end
          : existingSub.current_period_end;
      const isStillActive =
        endDate &&
        new Date(endDate) > new Date() &&
        ["active", "trialing"].includes(existingSub.estado);

      if (isStillActive) {
        return NextResponse.json(
          { error: "Ya tienes una suscripcion activa" },
          { status: 409 },
        );
      }
    }

    const { data: plan } = await supabase
      .from("planes")
      .select("*")
      .eq("activo", true)
      .limit(1)
      .single();

    if (!plan) {
      return NextResponse.json(
        { error: "Plan no encontrado" },
        { status: 404 },
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const preference = await preferenceClient.create({
      body: {
        items: [
          {
            id: plan.id,
            title: plan.nombre,
            description: plan.descripcion ?? "",
            quantity: 1,
            unit_price: plan.precio,
            currency_id: BILLING.MONEDA,
          },
        ],
        payer: {
          email: user.email!,
        },
        back_urls: {
          success: `${appUrl}/billing/success`,
          failure: `${appUrl}/billing/failure`,
          pending: `${appUrl}/billing/subscribe`,
        },
        auto_return: "approved",
        notification_url: `${appUrl}/api/webhooks/mercadopago`,
        metadata: {
          user_id: user.id,
          plan_id: plan.id,
        },
      },
    });

    const { data: pago, error: pagoError } = await supabase
      .from("pagos")
      .insert({
        usuario_id: user.id,
        monto: plan.precio,
        moneda: BILLING.MONEDA,
        estado: "pending",
        mp_preference_id: preference.id,
        descripcion: plan.nombre,
      })
      .select("id")
      .single();

    if (pagoError || !pago) {
      logger.error("billing.checkout", {
        message: pagoError?.message ?? "Failed to create pago record",
      });
      return NextResponse.json(
        { error: "Error al registrar pago" },
        { status: 500 },
      );
    }

    logger.info("billing.checkout.created", {
      userId: user.id,
      pagoId: pago.id,
      preferenceId: preference.id,
    });

    return NextResponse.json({
      preferenceId: preference.id,
      initPoint: preference.init_point,
      pagoId: pago.id,
    });
  } catch (error) {
    logger.error("billing.checkout", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Error al crear checkout" },
      { status: 500 },
    );
  }
}
