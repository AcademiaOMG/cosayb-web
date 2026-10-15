import type { MetadataRoute } from "next"

const siteUrl =
  process.env.NEXT_PUBLIC_FRONTEND_URL?.startsWith("http://localhost")
    ? "https://cosayb.co"
    : (process.env.NEXT_PUBLIC_FRONTEND_URL ?? "https://cosayb.co")

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/onboarding",
          "/plataforma",
          "/checkout",
          "/order",
          "/subscription",
          "/dashboard",
          "/cuenta",
          "/configuracion",
          "/reset-password",
          "/verify-email",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
