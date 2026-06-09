import { NextRequest, NextResponse } from "next/server"

const APP_ROUTES = [
  "/inventario",
  "/recetas",
  "/menu",
  "/valoracion",
  "/factor-rendimiento",
  "/punto-equilibrio",
]

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get("host") ?? ""

  const isAppSubdomain =
    hostname.startsWith("app.") || hostname.startsWith("app-")

  const isAppRoute = APP_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )

  // Root "/" on app subdomain → redirect to /inventario
  if (pathname === "/" && isAppSubdomain) {
    return NextResponse.redirect(new URL("/inventario", request.url))
  }

  if (!isAppRoute) return NextResponse.next()

  // Check session cookie set by better-auth
  const sessionCookie =
    request.cookies.get("better-auth.session_token") ??
    request.cookies.get("__session")

  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check if the user completed onboarding
  const orgCookie = request.cookies.get("cosayb.org_id")

  if (!orgCookie) {
    return NextResponse.redirect(new URL("/onboarding", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/",
    "/inventario/:path*",
    "/recetas/:path*",
    "/menu/:path*",
    "/valoracion/:path*",
    "/factor-rendimiento/:path*",
    "/punto-equilibrio/:path*",
  ],
}
