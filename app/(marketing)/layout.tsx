import type { Metadata } from "next"
import Nav from "@/components/landing/Nav"
import Footer from "@/components/landing/Footer"
import TransitionWrapper from "./TransitionWrapper"

const siteUrl =
  process.env.NEXT_PUBLIC_FRONTEND_URL?.startsWith("http://localhost")
    ? "https://cosayb.co"
    : (process.env.NEXT_PUBLIC_FRONTEND_URL ?? "https://cosayb.co")

export const metadata: Metadata = {
  title: "Academia OMG — Costos de Alimentos y Bebidas para Restaurantes",
  description:
    "El 80% de los restaurantes no sabe cuánto le cuesta cada plato. CO$AYB calcula el costo real de cada receta, aplica costos fijos y te dice exactamente a qué precio vender para ser rentable.",
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: "Academia OMG — Costos de Alimentos y Bebidas para Restaurantes",
    description:
      "Calcula el costo real de cada receta, aplica tus costos fijos y conoce el precio exacto de venta para ser rentable. Prueba gratis 14 días.",
    url: siteUrl,
  },
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ background: "var(--bg-primary)" }}
    >
      <Nav />
      <main className="flex-1">
        <TransitionWrapper>{children}</TransitionWrapper>
      </main>
      <Footer />
    </div>
  )
}
