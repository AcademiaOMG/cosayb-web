import type { Metadata } from "next"
import Hero from "@/components/landing/Hero"
import Problema from "@/components/landing/Problema"
import ComoFunciona from "@/components/landing/ComoFunciona"
import Modulos from "@/components/landing/Modulos"
import AppMockup from "@/components/landing/AppMockup"
import Pricing from "@/components/landing/Pricing"
import CTAFinal from "@/components/landing/CTAFinal"

const siteUrl =
  process.env.NEXT_PUBLIC_FRONTEND_URL?.startsWith("http://localhost")
    ? "https://cosayb.co"
    : (process.env.NEXT_PUBLIC_FRONTEND_URL ?? "https://cosayb.co")

export const metadata: Metadata = {
  title: "CO$AYB — Software de Costos de Alimentos y Bebidas para Restaurantes",
  description:
    "El 80% de los restaurantes no sabe cuánto le cuesta cada plato. CO$AYB calcula el costo real de cada receta, aplica costos fijos y te dice exactamente a qué precio vender para ser rentable.",
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: "CO$AYB — Software de Costos de Alimentos y Bebidas para Restaurantes",
    description:
      "Calcula el costo real de cada receta, aplica tus costos fijos y conoce el precio exacto de venta para ser rentable. Prueba gratis 14 días.",
    url: siteUrl,
  },
}

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": `${siteUrl}/#software`,
      name: "CO$AYB",
      alternateName: "Software de Costos de Alimentos y Bebidas",
      description:
        "Software SaaS para restaurantes en Colombia que calcula el costo real de cada receta, aplica costos fijos y sugiere el precio de venta correcto para ser rentable.",
      url: siteUrl,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: [
        {
          "@type": "Offer",
          name: "Free",
          price: "0",
          priceCurrency: "COP",
          description: "14 días de prueba con calculadoras básicas",
        },
        {
          "@type": "Offer",
          name: "Pro",
          price: "30000",
          priceCurrency: "COP",
          billingIncrement: "P1M",
          description: "Acceso ilimitado, exportación PDF, banco de recetas base y soporte prioritario",
        },
        {
          "@type": "Offer",
          name: "Academia",
          price: "50000",
          priceCurrency: "COP",
          billingIncrement: "P1M",
          description: "Todo de Pro más cursos, certificación y consultoría mensual",
        },
      ],
      featureList: [
        "Inventario de ingredientes con más de 1.000 insumos base",
        "Factor de rendimiento y mermas",
        "Recetas con subrecetas anidadas",
        "Menú con análisis de rentabilidad",
        "Valoración A&B con precio sugerido de venta",
        "Cálculo de punto de equilibrio",
      ],
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.9",
        reviewCount: "600",
      },
      publisher: {
        "@type": "Organization",
        name: "Academia OMG",
        url: siteUrl,
      },
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "CO$AYB",
      description: "Software de Costos de Alimentos y Bebidas para cocinas profesionales colombianas",
      publisher: {
        "@type": "Organization",
        name: "Academia OMG",
      },
      inLanguage: "es-CO",
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "¿Qué es CO$AYB?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "CO$AYB es un software SaaS para restaurantes y cocinas profesionales en Colombia que calcula el costo real de cada receta, aplica costos fijos y te indica el precio exacto de venta para ser rentable.",
          },
        },
        {
          "@type": "Question",
          name: "¿Cuánto cuesta CO$AYB?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "CO$AYB tiene un plan gratuito de 14 días. El plan Pro cuesta $30.000 COP/mes con acceso ilimitado. El plan Academia cuesta $50.000 COP/mes e incluye cursos y certificación.",
          },
        },
        {
          "@type": "Question",
          name: "¿Incluye ingredientes colombianos?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Sí. CO$AYB incluye una base de más de 1.000 ingredientes con precios del mercado colombiano que puedes importar directamente o personalizar.",
          },
        },
      ],
    },
  ],
}

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero />
      <Problema />
      <ComoFunciona />
      <Modulos />
      <AppMockup />
      <Pricing />
      <CTAFinal />
    </>
  )
}
