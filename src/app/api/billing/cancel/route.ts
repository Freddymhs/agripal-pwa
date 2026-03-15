import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { getCurrentTimestamp } from "@/lib/utils";
import { ESTADO_SUSCRIPCION } from "@/lib/constants/billing";

export async function POST() {
  try {
    const supabase = await createRouteHandlerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { data: suscripcion } = await supabase
      .from("suscripciones")
      .select("id, current_period_end, trial_end, estado")
      .eq("usuario_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!suscripcion) {
      return NextResponse.json(
        { error: "No hay suscripcion" },
        { status: 404 },
      );
    }

    const { error } = await supabase
      .from("suscripciones")
      .update({
        cancel_at_period_end: true,
        canceled_at: getCurrentTimestamp(),
      })
      .eq("id", suscripcion.id);

    if (error) {
      logger.error("billing.cancel", { message: error.message });
      return NextResponse.json({ error: "Error al cancelar" }, { status: 500 });
    }

    const activeUntil =
      suscripcion.estado === ESTADO_SUSCRIPCION.TRIALING
        ? suscripcion.trial_end
        : suscripcion.current_period_end;

    logger.info("billing.cancel", { userId: user.id, subId: suscripcion.id });

    return NextResponse.json({ success: true, activeUntil });
  } catch (error) {
    logger.error("billing.cancel", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json({ error: "Error al cancelar" }, { status: 500 });
  }
}
