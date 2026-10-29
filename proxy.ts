import { NextRequest, NextResponse } from "next/server";
import { buildLoginUrl } from "@/lib/authRedirect";

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/verify-email-sent",
  "/planes",
  "/refunds",
  "/ayuda",
  "/onboarding",
  "/nosotros",
  "/contacto",
  "/capacitacion",
  "/consultoria",
  "/libro",
  "/blog",
  "/privacy",
  "/terms",
  "/cookies",
];

// Rutas protegidas del área de app — solo estas redirigen a /login
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/inventario",
  "/recetas",
  "/valoracion",
  "/factor-rendimiento",
  "/punto-equilibrio",
  "/menu",
  "/precios-mercado",
  "/ajustes",
  "/configuracion",
  "/cuenta",
  "/soporte",
  "/notificaciones",
  "/mis-cursos",
  "/aprender",
  "/evaluacion",
  "/certificados",
  "/inicio",
  "/evaluaciones",
];

const SESSION_COOKIE_NAMES = [
  "__Secure-better-auth.session_token",
  "better-auth.session_token",
];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Recursos internos de Next.js, archivos estáticos y rutas de auth siempre pasan
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/favicon.ico") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    /\.(png|jpg|jpeg|webp|svg|gif|ico|css|js)$/.test(pathname)
  ) {
    return undefined;
  }

  // Rutas públicas — siempre accesibles
  if (
    PUBLIC_ROUTES.includes(pathname) ||
    pathname.startsWith("/accept-invitation") ||
    pathname === "/cursos" || pathname.startsWith("/cursos/") ||
    pathname === "/verificar" || pathname.startsWith("/verificar/")
  ) {
    return undefined;
  }

  // Ruta conocida protegida — verificar sesión
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname === prefix || pathname.startsWith(prefix + "/")
  );

  if (isProtected) {
    const hasSession = SESSION_COOKIE_NAMES.some((name) =>
      req.cookies.has(name)
    );

    if (!hasSession) {
      // Conserva la ruta pedida: tras autenticarse vuelve ahí (deep link), no a un paso intermedio
      return NextResponse.redirect(
        new URL(buildLoginUrl(pathname, req.nextUrl.search), req.url),
      );
    }
  }

  // Ruta desconocida (no pública, no protegida) — dejar que Next.js maneje el 404
  const res = NextResponse.next();
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  res.headers.set("Pragma", "no-cache");
  return res;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images/|robots.txt|sitemap.xml|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.webp$|.*\\.svg$|.*\\.gif$|.*\\.ico$|.*\\.css$|.*\\.js$).*)",
  ],
};
