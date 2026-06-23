import { NextRequest, NextResponse } from "next/server";

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/onboarding",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Permitir recursos internos de Next.js
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  // Permitir rutas públicas
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  try {
    // Verificar sesión mediante Better Auth
    const sessionResponse = await fetch(
      `${req.nextUrl.origin}/api/auth/get-session`,
      {
        headers: {
          cookie: req.headers.get("cookie") ?? "",
        },
      }
    );

    if (!sessionResponse.ok) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const session = await sessionResponse.json();

    if (!session?.user) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error("[Middleware] Error verificando sesión:", error);
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
