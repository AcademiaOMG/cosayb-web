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

export const metadata: Metadata = {
  title: "CO$AYB — Software de Costos Gastronómicos",
  description:
    "Gestiona los costos de tu cocina con precisión. Recetas, ingredientes, menús y punto de equilibrio en un solo lugar.",
  openGraph: {
    title: "CO$AYB — Software de Costos Gastronómicos",
    description:
      "Gestiona los costos de tu cocina con precisión. Recetas, ingredientes, menús y punto de equilibrio en un solo lugar.",
    images: [{ url: "/og-image.png" }],
  },
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
