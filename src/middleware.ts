import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";
import { ROUTES } from "@/lib/constants/routes";

const PUBLIC_ROUTES = new Set<string>([
  ROUTES.LANDING,
  ROUTES.AUTH_LOGIN,
  ROUTES.AUTH_REGISTRO,
  ROUTES.AUTH_RECUPERAR,
  ROUTES.AUTH_NUEVA_PASSWORD,
]);

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

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
