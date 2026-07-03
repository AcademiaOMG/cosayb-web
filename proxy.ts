import { NextRequest, NextResponse } from "next/server";

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/onboarding",
  "/nosotros",
  "/contacto",
  "/libro",
  "/privacy",
  "/terms",
  "/cookies",
];

const SESSION_COOKIE_NAMES = [
  "__Secure-better-auth.session_token",
  "better-auth.session_token",
];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/api/auth")
  ) {
    return undefined;
  }

  if (
    PUBLIC_ROUTES.includes(pathname) ||
    pathname.startsWith("/accept-invitation")
  ) {
    return undefined;
  }

  const hasSession = SESSION_COOKIE_NAMES.some((name) =>
    req.cookies.has(name)
  );

  if (!hasSession) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const res = NextResponse.next();
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  res.headers.set("Pragma", "no-cache");
  return res;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
