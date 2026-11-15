import type { Metadata } from "next"
import {
  Barlow,
  Barlow_Condensed,
  Inter,
  JetBrains_Mono,
  Manrope,
  Cormorant_Garamond,
  Poppins,
  DM_Sans,
  Nunito,
  Lato,
  Montserrat,
  Source_Sans_3,
} from "next/font/google"
import SWRProvider from "@/components/SWRProvider"
import FeedbackProvider from "@/components/FeedbackProvider"
import CookieBanner from "@/components/legal/CookieBanner"
import MonitoringInit from "@/components/MonitoringInit"
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

// Tipografías curadas de marca blanca (lib/branding/fonts.ts). Manrope e Inter
// ya están cargadas arriba y se exponen como --font-brand-manrope/inter con un
// alias en globals.css. Las otras seis usan `preload: false`: next/font solo
// emite el @font-face (con unicode-range) y el navegador descarga el archivo
// ÚNICAMENTE cuando algún elemento resuelve su familia, es decir, solo la
// fuente que el negocio eligió. Con preload activo se pedirían las 8 en cada
// página. Costo: sin <link rel=preload>, la fuente elegida aparece tras el
// primer render (display: swap), una mejora menor frente a bajar 6 fuentes.
const brandPoppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-brand-poppins",
  display: "swap",
  preload: false,
})
const brandDmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-brand-dm-sans",
  display: "swap",
  preload: false,
})
const brandNunito = Nunito({
  subsets: ["latin"],
  variable: "--font-brand-nunito",
  display: "swap",
  preload: false,
})
const brandLato = Lato({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-brand-lato",
  display: "swap",
  preload: false,
})
const brandMontserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-brand-montserrat",
  display: "swap",
  preload: false,
})
const brandSourceSans3 = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-brand-source-sans-3",
  display: "swap",
  preload: false,
})

const brandFontVars = [
  brandPoppins,
  brandDmSans,
  brandNunito,
  brandLato,
  brandMontserrat,
  brandSourceSans3,
]
  .map((f) => f.variable)
  .join(" ")

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
  },
  twitter: {
    card: "summary_large_image",
    title: "CO$AYB — Software de Costos de Alimentos y Bebidas",
    description:
      "Calcula el costo real de cada receta y conoce el precio exacto de venta. Para negocios gastronómicos en Colombia.",
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
      className={`${barlowCondensed.variable} ${calcBarlow.variable} ${calcCondensed.variable} ${inter.variable} ${jetbrainsMono.variable} ${manrope.variable} ${cormorantGaramond.variable} ${brandFontVars}`}
    >
      <body>
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[#12213A] focus:shadow-lg"
        >
          Saltar al contenido
        </a>
        <SWRProvider>{children}</SWRProvider>
        {/* Notificaciones y confirmaciones globales (único punto de montaje) */}
        <FeedbackProvider />
        <CookieBanner />
        <MonitoringInit />
      </body>
    </html>
  )
}
