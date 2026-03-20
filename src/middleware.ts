import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";
import { ROUTES } from "@/lib/constants/routes";
import {
  ESTADO_SUSCRIPCION,
  ESTADOS_SUSCRIPCION_PERMITIDOS,
} from "@/lib/constants/billing";

const PUBLIC_ROUTES = new Set<string>([
  ROUTES.LANDING,
  ROUTES.AUTH_LOGIN,
  ROUTES.AUTH_REGISTRO,
  ROUTES.AUTH_RECUPERAR,
  ROUTES.AUTH_NUEVA_PASSWORD,
  ROUTES.NORTE_CHILE,
  ROUTES.TARAPACA,
  ROUTES.ARICA,
  ROUTES.COMPARATIVA,
]);

const SUB_COOKIE_PREFIX = "agriplan-sub-";
const SUB_COOKIE_MAX_AGE = 300; // 5 minutos

const ALLOWED_SUB_STATES = ESTADOS_SUSCRIPCION_PERMITIDOS;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic =
    PUBLIC_ROUTES.has(pathname) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".");

  if (isPublic) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const supabase = createSupabaseMiddlewareClient(request, response);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    const loginUrl = new URL(ROUTES.AUTH_LOGIN, request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Billing pages: autenticado pero sin verificar suscripcion
  const isBillingPage = pathname.startsWith("/billing");
  if (isBillingPage) {
    return response;
  }

  // Check cookie cache primero — per-user para evitar leak entre sesiones
  const cookieName = `${SUB_COOKIE_PREFIX}${session.user.id.slice(0, 8)}`;
  const cachedStatus = request.cookies.get(cookieName)?.value;
  if (cachedStatus && ALLOWED_SUB_STATES.has(cachedStatus)) {
    return response;
  }

  // Cookie expirada o no existe — consultar DB con fecha
  const { data: suscripcion } = await supabase
    .from("suscripciones")
    .select("estado, trial_end, current_period_end")
    .eq("usuario_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const estado = suscripcion?.estado ?? "";
  const endDate =
    estado === ESTADO_SUSCRIPCION.TRIALING
      ? suscripcion?.trial_end
      : suscripcion?.current_period_end;
  const isNotExpired = endDate ? new Date(endDate) > new Date() : false;
  const isActiveSubscription = ALLOWED_SUB_STATES.has(estado) && isNotExpired;

  if (isActiveSubscription) {
    // Cachear en cookie per-user para evitar queries repetidas
    response.cookies.set(cookieName, estado, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SUB_COOKIE_MAX_AGE,
      path: "/",
    });
    return response;
  }

  // Sin suscripcion activa — redirigir a billing
  return NextResponse.redirect(new URL(ROUTES.BILLING_SUBSCRIBE, request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
