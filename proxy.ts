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

// Nombres de cookie de sesión que usa better-auth según el entorno:
//   HTTPS producción (Vercel) → "__Secure-better-auth.session_token"
//   HTTP  desarrollo local    → "better-auth.session_token"
const SESSION_COOKIE_NAMES = [
  "__Secure-better-auth.session_token",
  "better-auth.session_token",
];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Recursos internos de Next.js y rutas de auth siempre pasan
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  // Rutas públicas siempre pasan
  if (
    PUBLIC_ROUTES.includes(pathname) ||
    pathname.startsWith("/accept-invitation")
  ) {
    return NextResponse.next();
  }

  // Verificación de sesión: lectura de cookie — sincrónica, sin fetch, sin llamadas externas
  const hasSession = SESSION_COOKIE_NAMES.some((name) =>
    req.cookies.has(name)
  );

  if (!hasSession) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Rutas autenticadas: prohibir caché del navegador/proxies.
  // Sin esto, el HTML "logueado" queda en caché de disco y reaparece con el
  // botón atrás después de cerrar sesión.
  const res = NextResponse.next();
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  res.headers.set("Pragma", "no-cache");
  return res;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
