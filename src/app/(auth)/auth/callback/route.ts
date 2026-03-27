import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/server";
import { ROUTES } from "@/lib/constants/routes";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const redirectUrl = new URL(ROUTES.AUTH_NUEVA_PASSWORD, url.origin);

  if (!code) {
    redirectUrl.searchParams.set("error", "missing_code");
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const supabase = await createRouteHandlerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      logger.error("Error exchangeCodeForSession en auth callback", {
        error: { message: error.message },
      });
      redirectUrl.searchParams.set("error", "exchange_failed");
    }
  } catch (error) {
    logger.error("Error inesperado en auth callback", { error });
    redirectUrl.searchParams.set("error", "callback_error");
  }

  return NextResponse.redirect(redirectUrl);
}
