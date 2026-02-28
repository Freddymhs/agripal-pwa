import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_KEYS } from "@/lib/constants/storage";
import { ROUTES } from "@/lib/constants/routes";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/app")) {
    const hasToken = request.cookies.has(COOKIE_KEYS.TOKEN);

    if (!hasToken) {
      const loginUrl = new URL(ROUTES.AUTH_LOGIN, request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*"],
};
