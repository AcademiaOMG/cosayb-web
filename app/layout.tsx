import type { Metadata } from "next"
import { Barlow, Barlow_Condensed, Inter, JetBrains_Mono, Manrope, Cormorant_Garamond } from "next/font/google"
import SWRProvider from "@/components/SWRProvider"
import "./globals.css"

const barlowCondensed = Barlow_Condensed({
  weight: ["700", "800"],
  subsets: ["latin"],
  variable: "--font-barlow-condensed",
  display: "swap",
})

// Tipografías del kit de calculadora física (números y teclas / etiquetas impresas)
const calcBarlow = Barlow({
  weight: ["500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-calc-barlow",
  display: "swap",
})

const calcCondensed = Barlow_Condensed({
  weight: ["600", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-calc-condensed",
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

// App autenticada — tipografía única (títulos, cuerpo y cifras), ver el
// override de --font-display/--font-body/--font-mono en .app-theme-neutral
// dentro de globals.css.
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
})

// Segunda tipografía, solo para el banner de insight de Inicio (acento
// editorial en itálica) — no es parte del sistema de tokens general.
const cormorantGaramond = Cormorant_Garamond({
  style: ["italic"],
  weight: ["500", "600"],
  subsets: ["latin"],
  variable: "--font-cormorant",
  display: "swap",
})

const siteUrl =
  process.env.NEXT_PUBLIC_FRONTEND_URL?.startsWith("http://localhost")
    ? "https://cosayb.co"
    : (process.env.NEXT_PUBLIC_FRONTEND_URL ?? "https://cosayb.co")

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Academia OMG — Costos de Alimentos y Bebidas para Negocios Gastronómicos",
    template: "%s | Academia OMG",
  },
  description:
    "Calcula el costo real de cada receta, aplica tus costos fijos y conoce el precio exacto de venta para ser rentable. Para negocios gastronómicos en Colombia: restaurantes, cafeterías, hoteles, catering y más.",
  keywords: [
    "software costos restaurante colombia",
    "costeo de recetas",
    "costo de alimentos y bebidas",
    "punto de equilibrio restaurante",
    "valoración A&B",
    "ficha técnica recetas",
    "precio de venta platos",
    "gestión de negocios gastronómicos",
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
    siteName: "Academia OMG",
    title: "Academia OMG — Costos de Alimentos y Bebidas para Negocios Gastronómicos",
    description:
      "Calcula el costo real de cada receta, aplica tus costos fijos y conoce el precio exacto de venta para ser rentable. Para negocios gastronómicos en Colombia.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CO$AYB — Software de Costos de Alimentos y Bebidas para Negocios Gastronómicos en Colombia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CO$AYB — Software de Costos de Alimentos y Bebidas",
    description:
      "Calcula el costo real de cada receta y conoce el precio exacto de venta. Para negocios gastronómicos en Colombia.",
    images: ["/og-image.png"],
    creator: "@academiaomg",
    site: "@academiaomg",
  },
  icons: {
    icon: [
      { url: "/logo-white.png", type: "image/png", sizes: "32x32" },
      { url: "/logo-white.png", type: "image/png", sizes: "16x16" },
      { url: "/logo-white.png", type: "image/png", sizes: "any" },
    ],
    apple: "/logo.png",
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
      className={`${barlowCondensed.variable} ${calcBarlow.variable} ${calcCondensed.variable} ${inter.variable} ${jetbrainsMono.variable} ${manrope.variable} ${cormorantGaramond.variable}`}
    >
      <body>
        <SWRProvider>{children}</SWRProvider>
      </body>
    </html>
  )
}
