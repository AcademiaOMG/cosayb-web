import type { Metadata } from "next"
import { Barlow_Condensed, Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"

const barlowCondensed = Barlow_Condensed({
  weight: ["700", "800"],
  subsets: ["latin"],
  variable: "--font-barlow-condensed",
  display: "swap",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
})

const siteUrl =
  process.env.NEXT_PUBLIC_FRONTEND_URL?.startsWith("http://localhost")
    ? "https://cosayb.co"
    : (process.env.NEXT_PUBLIC_FRONTEND_URL ?? "https://cosayb.co")

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "CO$AYB — Software de Costos de Alimentos y Bebidas",
    template: "%s | CO$AYB",
  },
  description:
    "Calcula el costo real de cada receta, aplica tus costos fijos y conoce el precio exacto de venta para ser rentable. Para restaurantes y cocinas profesionales en Colombia.",
  keywords: [
    "software costos restaurante colombia",
    "costeo de recetas",
    "costo de alimentos y bebidas",
    "punto de equilibrio restaurante",
    "valoración A&B",
    "ficha técnica recetas",
    "precio de venta platos",
    "gestión cocina profesional",
    "inventario ingredientes",
    "factor de rendimiento mermas",
    "academia costos gastronomia",
  ],
  authors: [{ name: "Academia OMG", url: siteUrl }],
  creator: "Academia OMG",
  publisher: "Academia OMG",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "es_CO",
    url: siteUrl,
    siteName: "CO$AYB",
    title: "CO$AYB — Software de Costos de Alimentos y Bebidas",
    description:
      "Calcula el costo real de cada receta, aplica tus costos fijos y conoce el precio exacto de venta para ser rentable. Para restaurantes en Colombia.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CO$AYB — Software de Costos Gastronómicos para Restaurantes en Colombia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CO$AYB — Software de Costos de Alimentos y Bebidas",
    description:
      "Calcula el costo real de cada receta y conoce el precio exacto de venta. Para restaurantes en Colombia.",
    images: ["/og-image.png"],
    creator: "@academiaomg",
    site: "@academiaomg",
  },
  alternates: {
    canonical: siteUrl,
  },
  category: "software",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="es"
      className={`${barlowCondensed.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body>{children}</body>
    </html>
  )
}
