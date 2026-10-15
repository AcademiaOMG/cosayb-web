import type { Metadata } from "next"
import Nav from "@/components/landing/Nav"
import Footer from "@/components/landing/Footer"
import TransitionWrapper from "./TransitionWrapper"

const siteUrl =
  process.env.NEXT_PUBLIC_FRONTEND_URL?.startsWith("http://localhost")
    ? "https://cosayb.co"
    : (process.env.NEXT_PUBLIC_FRONTEND_URL ?? "https://cosayb.co")

export const metadata: Metadata = {
  title: "Academia OMG — Costos de Alimentos y Bebidas para Negocios Gastronómicos",
  description:
    "El 80% de los negocios gastronómicos no sabe cuánto le cuesta cada plato. CO$AYB calcula el costo real de cada receta, aplica costos fijos y te dice exactamente a qué precio vender para ser rentable.",
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: "Academia OMG — Costos de Alimentos y Bebidas para Negocios Gastronómicos",
    description:
      "Calcula el costo real de cada receta, aplica tus costos fijos y conoce el precio exacto de venta para ser rentable. Prueba gratis 14 días.",
    url: siteUrl,
  },
}

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "Academia OMG",
      url: siteUrl,
      logo: `${siteUrl}/logo.png`,
      email: "hola@cosayb.co",
      sameAs: [
        "https://facebook.com/academiaomg",
        "https://instagram.com/academiaomg",
        "https://youtube.com/@academiaomg",
        "https://linkedin.com/company/academiaomg",
      ],
    },
    {
      "@type": "SoftwareApplication",
      name: "CO$AYB",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      inLanguage: "es-CO",
      url: siteUrl,
      offers: [
        { "@type": "Offer", name: "Free", price: "0", priceCurrency: "COP" },
        { "@type": "Offer", name: "Pro", price: "30000", priceCurrency: "COP" },
        { "@type": "Offer", name: "Academia", price: "50000", priceCurrency: "COP" },
      ],
    },
  ],
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main id="contenido" tabIndex={-1} className="flex-1 outline-none">
        <TransitionWrapper>{children}</TransitionWrapper>
      </main>
      <Footer />
    </div>
  )
}
