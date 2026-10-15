import type { NextConfig } from "next";

// Rutas privadas o transaccionales: no deben aparecer en buscadores
const NOINDEX_SOURCES = [
  "/dashboard/:path*",
  "/inventario/:path*",
  "/recetas/:path*",
  "/valoracion/:path*",
  "/factor-rendimiento/:path*",
  "/punto-equilibrio/:path*",
  "/menu/:path*",
  "/precios-mercado/:path*",
  "/configuracion/:path*",
  "/cuenta/:path*",
  "/soporte/:path*",
  "/notificaciones/:path*",
  "/plataforma/:path*",
  "/checkout/:path*",
  "/order/:path*",
  "/subscription/:path*",
  "/onboarding/:path*",
  "/accept-invitation/:path*",
];

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      // Foto de perfil de Google (login social vía Better Auth)
      { protocol: "https", hostname: "*.googleusercontent.com" },
    ],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      ...NOINDEX_SOURCES.map((source) => ({
        source,
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      })),
    ];
  },
};

export default nextConfig;
