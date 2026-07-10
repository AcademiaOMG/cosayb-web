"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  CheckCircle,
  Check,
  Zap,
  Plus,
  Minus,
  GraduationCap,
  BookOpen,
  Laptop,
  FileText,
  Users,
  Newspaper,
  Package,
  Scale,
  ChefHat,
  UtensilsCrossed,
  TrendingUp,
  BarChart2,
} from "lucide-react"

/* ─── HERO DATA ────────────────────────────────────────────── */

const heroStats = [
  { value: "2.500+", label: "Proyectos creados" },
  { value: "30.000+", label: "Recetas costeadas" },
  { value: "200+", label: "Cursos" },
  { value: "600+", label: "Cocineros" },
]

/* ─── LO QUE HACEMOS DATA ─────────────────────────────────── */

const servicios = [
  {
    icon: GraduationCap,
    title: "Capacitación",
    description: "Programas prácticos en costos gastronómicos, inventarios, factor de rendimiento y más. Aprende a controlar y optimizar los costos de tu negocio.",
    href: "/capacitacion",
    featured: true,
  },
  {
    icon: BookOpen,
    title: "Libro de Costos A&B",
    description: "Guía completa para entender el flujo de costos, el cálculo de precios y la rentabilidad. Casos reales de restaurantes colombianos.",
    href: "/libro",
    featured: false,
  },
  {
    icon: Laptop,
    title: "CO$AYB",
    description: "Software de costos que calcula el costo real de cada receta, aplica costos fijos y te dice exactamente a qué precio vender para ser rentable.",
    href: "/login",
    featured: true,
  },
  {
    icon: FileText,
    title: "Plantillas Profesionales",
    description: "Herramientas listas para usar en hojas de cálculo y documentos que te ayudan a organizar y gestionar tu operación gastronómica.",
    href: "#",
    featured: false,
  },
  {
    icon: Users,
    title: "Consultorías Personalizadas",
    description: "Acompañamiento directo para evaluar tu operación, identificar oportunidades de mejora y optimizar la rentabilidad de tu restaurante.",
    href: "/consultoria",
    featured: true,
  },
  {
    icon: Newspaper,
    title: "Comunidad y Actualizaciones",
    description: "Accede a contenido exclusivo, artículos, recursos y las últimas novedades en gestión de costos gastronómicos.",
    href: "/blog",
    featured: false,
  },
]

/* ─── MODULOS DATA ─────────────────────────────────────────── */

const modules: {
  icon: React.ElementType
  name: string
  description: string
  featured?: boolean
}[] = [
  {
    icon: Package,
    name: "Inventario",
    description: "Actualiza automáticamente el costo de todas tus recetas cuando cambian los precios de tus ingredientes. Olvídate de recalcular una por una.",
    featured: true,
  },
  {
    icon: Scale,
    name: "Factor de Rendimiento",
    description: "Conoce cuánto cuesta realmente cada ingrediente después de la limpieza, merma y desperdicio para calcular tus costos con precisión.",
  },
  {
    icon: ChefHat,
    name: "Recetas",
    description: "Crea recetas profesionales con cantidades exactas y conoce al instante el costo real de cada preparación antes de venderla.",
    featured: true,
  },
  {
    icon: UtensilsCrossed,
    name: "Menú",
    description: "Diseña la carta de tu restaurante utilizando más de 150 recetas actualizadas y establece precios rentables antes de imprimir un solo menú.",
  },
  {
    icon: TrendingUp,
    name: "Calculadora de Costos",
    description: "Tu calculadora inteligente de costos. Obtén el precio de venta sugerido, la utilidad y el margen ideal en segundos, sin Excel, sin fórmulas y sin cálculos complicados.",
    featured: true,
  },
  {
    icon: BarChart2,
    name: "Punto de Equilibrio",
    description: "Descubre cuántos platos tienes que vender para cubrir costos fijos y no perder dinero.",
  },
]

/* ─── SOLUCION COMPLETA DATA ───────────────────────────────── */

const solucionFeatures = [
  "Precios de mercado colombiano actualizados",
  "Cálculo automático del costo real por ingrediente",
  "Recetas con sub-recetas anidadas y mermas",
  "Menú con análisis de rentabilidad por plato",
  "Exportación de reportes a PDF",
  "Soporte prioritario y acompañamiento",
]

/* ─── APP MOCKUP DATA ──────────────────────────────────────── */

const features = [
  "Costo de materia prima calculado automáticamente CON PRECIO REAL",
  "Indicadores MUY BUENO / ACEPTABLE / REVISAR según la industria",
  "Exporta el análisis completo a PDF en un clic",
]

const rows = [
  { label: "Costo materia prima", value: "$ 954", sub: null },
  {
    label: "% Materia prima",
    value: "28.6%",
    badge: { text: "MUY BUENO", color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  },
  { label: "% Costos fijos", value: "15%", sub: null },
  { label: "Ganancia neta estimada", value: "56.4%", sub: null },
]

/* ─── VOCES COMUNIDAD DATA ─────────────────────────────────── */

const testimonios = [
  {
    name: "Roberto Cortés",
    role: "Propietario",
    company: "Restaurante La Brasserie",
    quote: "Transformaron nuestra cocina rentable. Hoy sé exactamente cuánto gano en cada plato. Las capacitaciones de Academia OMG cambiaron mi perspectiva del negocio.",
    initials: "RC",
  },
  {
    name: "Ana Carolina Moreno",
    role: "Chef Ejecutiva",
    company: "Café Aroma",
    quote: "Tenía un gran gusto por cocinar pero no sabía controlar mis costos. Con CO$AYB aprendí a precio real y mis márgenes mejoraron un 20% en tres meses.",
    initials: "AM",
  },
  {
    name: "Carlos Sánchez",
    role: "Director Gastronómico",
    company: "Grupo Sabores",
    quote: "El acompañamiento personalizado de Academia OMG nos permitió reducir mermas y optimizar la compra de insumos. Una inversión que se paga sola.",
    initials: "CS",
  },
]

/* ─── PRICING DATA ─────────────────────────────────────────── */

const plans = [
  {
    name: "Free",
    tagline: "Para explorar",
    price: "$0",
    period: "14 días de prueba",
    features: [
      "Calculadoras básicas",
      "Hasta 30 ingredientes",
      "Sin guardar datos",
      "Soporte por email",
    ],
    cta: "Empezar gratis",
    highlighted: false,
    badge: null,
  },
  {
    name: "Pro",
    tagline: "Para profesionales",
    price: "$30.000",
    usdPrice: "$9",
    period: "COP / mes",
    features: [
      "Todo ilimitado",
      "Exportación PDF",
      "Banco de recetas base (+1.000)",
      "Factor de rendimiento completo",
      "Soporte prioritario",
    ],
    cta: "Activar Pro",
    highlighted: true,
    badge: "Más popular",
  },
  {
    name: "Academia",
    tagline: "Para aprender y escalar",
    price: "$50.000",
    usdPrice: "$14",
    period: "COP / mes",
    features: [
      "Todo de Pro",
      "Acceso completo a cursos",
      "Certificación incluida",
      "Consultoría mensual 1:1",
    ],
    cta: "Activar Academia",
    highlighted: false,
    badge: null,
  },
]

/* ─── FAQ DATA ─────────────────────────────────────────────── */

const faqs = [
  {
    q: "¿Necesito instalar algo?",
    a: "No. CO$AYB es 100% web. Funciona desde cualquier navegador moderno sin descargas, sin instalaciones y sin configuraciones técnicas. Solo crea tu cuenta y empieza.",
  },
  {
    q: "¿Puedo cancelar cuando quiera?",
    a: "Sí, completamente. No hay contratos de permanencia ni penalizaciones. Puedes cancelar tu suscripción en cualquier momento desde tu perfil y dejarás de ser cobrado el siguiente ciclo.",
  },
  {
    q: "¿Cómo funciona la prueba gratuita?",
    a: "Tienes 14 días de acceso completo sin tarjeta de crédito. Al terminar el período, puedes elegir un plan de pago para continuar o simplemente no hacer nada y tu cuenta pasará al modo gratuito limitado.",
  },
  {
    q: "¿Mis datos están seguros?",
    a: "Sí. Todos los datos se almacenan en servidores con cifrado en tránsito y en reposo. Nunca compartimos tu información con terceros. Puedes exportar o eliminar tu información en cualquier momento.",
  },
  {
    q: "¿Puedo usar CO$AYB desde el celular?",
    a: "Sí. La plataforma está diseñada para ser completamente responsiva. Funciona desde smartphones y tablets sin necesidad de una app adicional. Todos los módulos están disponibles en móvil.",
  },
  {
    q: "¿Incluye ingredientes con precios colombianos?",
    a: "Sí. CO$AYB incluye un banco de más de 1.000 ingredientes con precios de referencia del mercado colombiano. Puedes usarlos directamente o ajustar los precios según tu región y proveedor.",
  },
  {
    q: "¿Qué pasa si cambio el precio de un ingrediente?",
    a: "El cambio se propaga automáticamente a todas las recetas y menús que usan ese ingrediente. Los costos se actualizan en tiempo real sin que tengas que recalcular nada manualmente.",
  },
]

/* ─── FAQ ITEM (client sub-component) ──────────────────────── */

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className="border-b transition-colors duration-200"
      style={{ borderColor: open ? "rgba(27,79,216,0.25)" : "#DDD6C8" }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-6 py-5 text-left"
        aria-expanded={open}
      >
        <span
          className="font-body font-semibold text-base transition-colors duration-200"
          style={{ color: open ? "#1B4FD8" : "#12213A" }}
        >
          {q}
        </span>
        <span
          className="shrink-0 w-7 h-7 rounded flex items-center justify-center transition-all duration-200"
          style={{
            background: open ? "rgba(27,79,216,0.08)" : "rgba(18,33,58,0.04)",
            border: `1px solid ${open ? "rgba(27,79,216,0.25)" : "rgba(18,33,58,0.12)"}`,
          }}
        >
          {open ? (
            <Minus size={14} className="text-[#1B4FD8]" />
          ) : (
            <Plus size={14} className="text-[#4A4438]" />
          )}
        </span>
      </button>

      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: open ? "200px" : "0px", opacity: open ? 1 : 0 }}
      >
        <p className="font-body text-sm text-[#4A4438] leading-relaxed pb-5 pr-12">
          {a}
        </p>
      </div>
    </div>
  )
}

/* ─── MAIN PAGE ────────────────────────────────────────────── */

export default function LandingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": "https://cosayb.co/#software",
        name: "CO$AYB",
        alternateName: "Software de Costos de Alimentos y Bebidas",
        description:
          "Software SaaS para restaurantes en Colombia que calcula el costo real de cada receta, aplica costos fijos y sugiere el precio de venta correcto para ser rentable.",
        url: "https://cosayb.co",
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
          url: "https://cosayb.co",
        },
      },
      {
        "@type": "WebSite",
        "@id": "https://cosayb.co/#website",
        url: "https://cosayb.co",
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative overflow-hidden w-full" style={{ minHeight: "100vh" }}>
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/fondo-principal.webp"
            alt=""
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0" style={{ background: "rgba(10, 18, 40, 0.42)" }} />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, rgba(10,18,40,0.82) 0%, rgba(10,18,40,0.55) 40%, rgba(10,18,40,0.10) 75%, transparent 100%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgba(10,18,40,0.60) 0%, transparent 40%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 60%, rgba(10,18,40,0.35) 100%)",
            }}
          />
        </div>

        <div
          className="absolute top-0 right-0 w-[700px] h-[700px] rounded-full opacity-10 pointer-events-none z-0"
          style={{
            background: "radial-gradient(circle, #1B4FD8 0%, transparent 70%)",
            transform: "translate(30%, -30%)",
          }}
        />

        <div
          className="relative z-10 max-w-7xl mx-auto w-full px-6 sm:px-10 lg:px-16 pb-10 flex flex-col justify-center"
          style={{ minHeight: "100vh", paddingTop: "clamp(5rem, 12vw, 7rem)" }}
        >
          <div className="max-w-3xl">
            <h1
              className="font-display font-extrabold leading-[0.92] tracking-tight text-[#F5F0E8] mb-7 animate-fade-up-delay-1"
              style={{ fontSize: "clamp(2.5rem, 9vw, 6rem)" }}
            >
              Costos de
              <br />
              Alimentos{" "}
              <span className="text-[#7AAEFF]">&amp; Bebidas</span>
            </h1>

            <p className="font-body text-lg text-[#C8D5E8] leading-relaxed max-w-lg mb-10 animate-fade-up-delay-2">
              <strong className="text-[#F5F0E8] font-semibold">
                Aprende a controlar, analizar y optimizar
              </strong>{" "}
              los costos de tu negocio gastronómico. Herramientas prácticas, capacitación especializada
              y una plataforma diseñada para aumentar la rentabilidad de tu cocina.
            </p>

            <div className="flex flex-wrap items-center gap-4 mb-16 animate-fade-up-delay-3">
              <Link href="/capacitacion" className="btn-spx btn-spx-accent-solid">
                Cursos
                <ArrowRight size={18} className="btn-arrow" />
              </Link>
              <Link href="/libro" className="btn-spx btn-spx-light">
                Libro de Costos
                <ArrowRight size={16} className="btn-arrow" />
              </Link>
            </div>

            <div className="flex flex-wrap gap-10 sm:gap-16 animate-fade-up-delay-4">
              {heroStats.map(({ value, label }) => (
                <div key={label} className="flex flex-col">
                  <div className="font-display font-extrabold text-[#7AAEFF]" style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}>
                    {value}
                  </div>
                  <div className="font-body text-xs text-[#8FA0BC] tracking-wide uppercase mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ LO QUE HACEMOS ═══════════════ */}
      <section className="bg-[#F5F0E8] py-10 sm:py-16 px-6 sm:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2
              className="font-display font-extrabold text-[#12213A] mb-4"
              style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
            >
              Lo que hacemos ...
            </h2>
            <p className="font-body text-lg text-[#7A6E60] max-w-2xl mx-auto">
              Facilitamos la gestión eficiente del negocio gastronómico con herramientas que fortalecen el aprendizaje, la productividad y la rentabilidad.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {servicios.map(({ icon: Icon, title, description, href, featured }) => (
              <Link
                key={title}
                href={href}
                className={`card-hover group relative rounded-2xl p-7 flex flex-col gap-5 no-underline ${
                  featured
                    ? "bg-[#12213A] border border-[#1B4FD8]/30"
                    : "bg-white border border-[#DDD6C8]"
                }`}
                style={featured ? { boxShadow: "0 4px 20px rgba(27,79,216,0.15)" } : {}}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  featured ? "bg-[#1B4FD8]/20" : "bg-[#DEEAFF]"
                }`}>
                  <Icon size={22} className={featured ? "text-[#7AAEFF]" : "text-[#1B4FD8]"} />
                </div>
                <div className="flex-1">
                  <h3 className={`font-body font-bold text-base mb-2 transition-colors ${
                    featured ? "text-[#F5F0E8] group-hover:text-[#7AAEFF]" : "text-[#12213A] group-hover:text-[#1B4FD8]"
                  }`}>
                    {title}
                  </h3>
                  <p className={`font-body text-sm leading-relaxed ${
                    featured ? "text-[#8FA0BC]" : "text-[#4A4438]"
                  }`}>
                    {description}
                  </p>
                </div>
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                  featured ? "text-[#7AAEFF]" : "text-[#1B4FD8]"
                }`}>
                  Conocer más
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/capacitacion" className="btn-spx btn-spx-dark">
              Cursos
              <ArrowRight size={16} className="btn-arrow" />
            </Link>
            <Link href="/libro" className="btn-spx btn-spx-accent">
              Libro de Costos
              <ArrowRight size={16} className="btn-arrow" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════ SOLUCION COMPLETA ═══════════════ */}
      <section className="bg-[#12213A] py-10 sm:py-16 px-6 sm:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span
                className="inline-block text-xs font-body font-semibold tracking-[0.15em] uppercase px-4 py-2 rounded-full mb-6 text-[#7AAEFF]"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
              >
                Solución integral
              </span>
              <h2
                className="font-display font-extrabold text-[#F5F0E8] leading-[1.05] mb-6"
                style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
              >
                La Solución Completa
                <br />
                para Costos de
                <br />
                <span className="text-[#7AAEFF]">Alimentos y Bebidas</span>
              </h2>
              <p className="font-body text-base text-[#8FA0BC] leading-relaxed mb-8">
                En Academia OMG ofrecemos una solución integral que combina capacitación especializada,
                herramientas tecnológicas y acompañamiento personalizado. Nuestro objetivo es que cada
                restaurante, chef y emprendedor gastronómico tome decisiones de negocio con números reales,
                optimice sus costos y aumente la rentabilidad de su operación.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div
                className="rounded-2xl p-6"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <h3 className="font-body font-bold text-[#F5F0E8] text-base mb-4">Incluye:</h3>
                <ul className="flex flex-col gap-3">
                  {solucionFeatures.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <CheckCircle size={18} className="text-[#7AAEFF] shrink-0 mt-0.5" />
                      <span className="font-body text-sm text-[#C8D5E8]">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ MODULOS ═══════════════ */}
      <section id="modulos" className="bg-[#EDE7DB] py-14 sm:py-20 px-6 sm:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
            <div>
              <span className="inline-block bg-[#DEEAFF] text-[#1434A4] text-xs font-body font-semibold tracking-[0.15em] uppercase px-4 py-2 rounded-full mb-5">
                Plataforma completa
              </span>
              <h2
                className="font-display font-extrabold text-[#12213A] mb-3"
                style={{ fontSize: "clamp(2.2rem, 5.5vw, 4rem)" }}
              >
                Todo lo que necesita tu cocina
                <br />
                para ser rentable
              </h2>
              <p className="font-body text-lg text-[#7A6E60]">Seis módulos integrados. Un solo sistema.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {modules.map(({ icon: Icon, name, description, featured }) => (
              <div
                key={name}
                className={`card-hover relative rounded-2xl p-7 flex flex-col gap-5 ${
                  featured
                    ? "bg-[#12213A] border border-[#1B4FD8]/30"
                    : "bg-[#FDFAF6] border border-[#DDD6C8] hover:border-[#1B4FD8]/40"
                }`}
                style={
                  featured
                    ? { boxShadow: "0 4px 20px rgba(27,79,216,0.15)" }
                    : {}
                }
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    featured ? "bg-[#1B4FD8]/20" : "bg-[#DEEAFF]"
                  }`}
                >
                  <Icon size={22} className={featured ? "text-[#7AAEFF]" : "text-[#1B4FD8]"} />
                </div>

                <div className="flex-1">
                  <h3
                    className={`font-body font-bold text-base mb-2 ${
                      featured ? "text-[#F5F0E8]" : "text-[#12213A]"
                    }`}
                  >
                    {name}
                  </h3>
                  <p
                    className={`font-body text-sm leading-relaxed ${
                      featured ? "text-[#8FA0BC]" : "text-[#4A4438]"
                    }`}
                  >
                    {description}
                  </p>
                </div>

                <span
                  className={`inline-block self-start text-[11px] font-semibold px-3 py-1 rounded-full ${
                    featured
                      ? "bg-[#1B4FD8]/30 text-[#7AAEFF]"
                      : "bg-[#DEEAFF] text-[#1434A4]"
                  }`}
                >
                  Incluido en Pro
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      

      {/* ═══════════════ APP MOCKUP ═══════════════ */}
      <section id="demo" className="bg-[#12213A] py-14 sm:py-20 px-6 sm:px-10 lg:px-16">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 xl:gap-24 items-center">
        {/* Left column */}
        <div className="order-2 lg:order-1">
          <span
            className="inline-block text-xs font-body font-semibold tracking-[0.15em] uppercase px-4 py-2 rounded-full mb-6 text-[#8FA0BC]"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            Así se ve en acción
          </span>
          <h2
            className="font-display font-extrabold text-[#F5F0E8] mb-5"
            style={{ fontSize: "clamp(2.2rem, 5.5vw, 4rem)" }}
          >
            Del costo real al
            <br />
            <span className="text-[#7AAEFF]">precio correcto</span>
            <br />
            en segundos
          </h2>
          <p className="font-body text-[#8FA0BC] text-lg leading-relaxed mb-10">
            Ingresa tus ingredientes, construye tu receta y CO$AYB te entrega el precio de venta sugerido al instante.
          </p>

          <ul className="flex flex-col gap-5 mb-10">
            {features.map((item) => (
              <li key={item} className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-[#1B4FD8]/20 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle size={14} className="text-[#7AAEFF]" />
                </div>
                <span className="font-body text-base text-[#B0C4DE] leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>

          <Link href="/login" className="btn-spx btn-spx-light">
            Probar ahora gratis
            <ArrowRight size={16} className="btn-arrow" />
          </Link>
        </div>

        {/* Right column — App UI mock */}
        <div className="order-1 lg:order-2">
          {/* Outer glow */}
          <div
            className="relative rounded-2xl"
            style={{
              boxShadow: "0 0 0 1px rgba(255,255,255,0.06), 0 32px 80px rgba(0,0,0,0.45), 0 0 60px rgba(27,79,216,0.15)",
            }}
          >
            {/* Title bar */}
            <div
              className="flex items-center gap-2 px-4 py-3 rounded-t-2xl"
              style={{ background: "#141E2D", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
              </div>
              <span className="font-mono text-xs text-[#4A6080] ml-2">CO$AYB — Valoración</span>
            </div>

            {/* Card content */}
            <div className="p-6 sm:p-8" style={{ background: "#1A2535" }}>
              {/* Header row */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="font-body text-xs text-[#4A6080] mb-0.5">Receta analizada</div>
                  <div className="font-body font-semibold text-[#F5F0E8] text-base">Pollo Roll</div>
                </div>
                <span className="bg-[#1B4FD8] text-white text-xs px-3 py-1 rounded-full font-body font-semibold">
                  Plan Pro
                </span>
              </div>

              {/* Data rows */}
              <div className="flex flex-col gap-0 rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                {rows.map(({ label, value, badge }, idx) => (
                  <div
                    key={label}
                    className="flex justify-between items-center px-5 py-4"
                    style={{
                      background: idx % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
                      borderBottom: idx < rows.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                    }}
                  >
                    <span className="font-body text-sm text-[#8FA0BC]">{label}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#F5F0E8] text-sm">{value}</span>
                      {badge && (
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ color: badge.color, background: badge.bg }}
                        >
                          {badge.text}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Precio sugerido */}
              <div
                className="flex justify-between items-center mt-5 p-5 rounded-xl"
                style={{
                  background: "rgba(27,79,216,0.12)",
                  border: "1px solid rgba(27,79,216,0.25)",
                }}
              >
                <div>
                  <div className="font-body text-xs text-[#7AAEFF] mb-1 font-semibold uppercase tracking-wide">
                    Precio sugerido de venta
                  </div>
                  <div className="font-mono font-extrabold text-[#F5F0E8]" style={{ fontSize: "2rem" }}>
                    $ 3.339
                  </div>
                </div>
                <button className="btn-spx btn-spx-light">
                  Exportar PDF
                </button>
              </div>
            </div>
            <div className="rounded-b-2xl" style={{ background: "#141E2D", borderTop: "1px solid rgba(255,255,255,0.04)", padding: "10px 24px" }}>
              <span className="font-body text-xs text-[#4A6080]">Última actualización: hace 2 minutos · Auto-guardado ✓</span>
            </div>
          </div>
        </div>
      </div>
    </section>

      {/* ═══════════════ CAPACITACION PREVIEW ═══════════════ */}
      <section className="relative overflow-hidden py-10 sm:py-16 px-6 sm:px-10 lg:px-16">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/imagen-hero-capacitacion.webp"
          alt="Capacitación especializada"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-[#0A1520]/70" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0A1520] to-transparent" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h2
            className="font-display font-extrabold text-[#F5F0E8] leading-[1.05] mb-6"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
          >
            Capacitación
            <br />
            <span className="text-[#7AAEFF]">Especializada</span>
          </h2>

          <p className="font-body text-lg text-[#8FA0BC] leading-relaxed mb-10 max-w-2xl mx-auto">
            Aprende a controlar, analizar y optimizar los costos para una gestión gastronómica rentable.
            Programas prácticos diseñados por profesionales con más de una década de experiencia.
          </p>

          <Link href="/capacitacion" className="btn-spx btn-spx-light">
            Ver más
            <ArrowRight size={16} className="btn-arrow" />
          </Link>
        </div>
      </section>

      {/* ═══════════════ VOCES COMUNIDAD ═══════════════ */}
      <section className="bg-[#F5F0E8] py-10 sm:py-16 px-6 sm:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2
              className="font-display font-extrabold text-[#12213A] mb-4"
              style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}
            >
              Voces de nuestra comunidad
            </h2>
            <p className="font-body text-lg text-[#7A6E60] max-w-2xl mx-auto">
              La experiencia de nuestros alumnos y usuarios refleja el impacto real de nuestra capacitación
              en la gestión eficiente de alimentos y bebidas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonios.map(({ name, role, company, quote, initials }) => (
              <div
                key={name}
                className="bg-white border border-[#DDD6C8] rounded-2xl p-7 flex flex-col gap-5"
              >
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="#F59E0B" stroke="none">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>

                <p className="font-body text-sm text-[#4A4438] leading-relaxed flex-1">
                  &ldquo;{quote}&rdquo;
                </p>

                <div className="flex items-center gap-3 pt-4" style={{ borderTop: "1px solid #EDE7DB" }}>
                  <div className="w-10 h-10 rounded-full bg-[#12213A] flex items-center justify-center text-[#F5F0E8] font-body font-bold text-xs">
                    {initials}
                  </div>
                  <div>
                    <div className="font-body font-bold text-sm text-[#12213A]">{name}</div>
                    <div className="font-body text-xs text-[#7A6E60]">{role} · {company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <div className="flex items-center justify-center gap-2">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} width="18" height="18" viewBox="0 0 24 24" fill="#F59E0B" stroke="none">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <span className="font-body font-bold text-sm text-[#12213A]">4.9/5</span>
            </div>
            <p className="font-body text-xs text-[#7A6E60] mt-1">Basado en 600+ usuarios activos</p>
          </div>
        </div>
      </section>

      {/* ═══════════════ PRICING ═══════════════ */}
      <section id="precios" className="bg-[#12213A] py-10 sm:py-16 px-6 sm:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <span className="inline-block text-xs font-body font-semibold tracking-[0.15em] uppercase px-4 py-2 rounded-full mb-5 text-[#7AAEFF]"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
              Precios
            </span>
            <h2
              className="font-display font-extrabold text-[#F5F0E8] mb-4"
              style={{ fontSize: "clamp(2.2rem, 5.5vw, 4rem)" }}
            >
              Empieza gratis.
              <br />
              Escala cuando estés listo.
            </h2>
            <p className="font-body text-lg text-[#8FA0BC]">
              Sin sorpresas. Sin letras pequeñas.{" "}
              <span className="font-semibold text-[#F5F0E8]">Cancela cuando quieras.</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
            {plans.map(({ name, tagline, price, usdPrice, period, features, cta, highlighted, badge }) => (
              <div
                key={name}
                className={`relative rounded-2xl flex flex-col overflow-hidden transition-all duration-300 card-hover ${
                  highlighted
                    ? "ring-2 ring-[#1B4FD8]"
                    : "border border-white/[0.06]"
                }`}
                style={
                  highlighted
                    ? {
                        boxShadow: "0 8px 40px rgba(27,79,216,0.2), 0 0 0 2px rgba(27,79,216,1)",
                      }
                    : {}
                }
              >
                {badge && (
                  <div className="flex items-center justify-center gap-1.5 bg-[#1B4FD8] py-2 px-4">
                    <Zap size={12} className="text-white" />
                    <span className="font-body text-xs font-bold text-white tracking-wide">{badge}</span>
                  </div>
                )}

                <div
                  className={`flex flex-col flex-1 p-8 ${
                    highlighted ? "bg-[#0D1829]" : "bg-white/[0.03]"
                  }`}
                >
                  <div className="mb-6">
                    <div
                      className={`font-body font-bold text-xs uppercase tracking-widest mb-1 ${
                        highlighted ? "text-[#7AAEFF]" : "text-[#7AAEFF]/80"
                      }`}
                    >
                      {name}
                    </div>
                    <p className="font-body text-sm text-[#8FA0BC]">{tagline}</p>
                  </div>

                  <div className="mb-7">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span
                        className="font-mono font-extrabold leading-none text-[#F5F0E8]"
                        style={{ fontSize: "clamp(2.2rem, 5vw, 2.75rem)" }}
                      >
                        {price}
                      </span>
                      {usdPrice && (
                        <span className="font-mono text-sm text-[#8FA0BC]">
                          USD {usdPrice}
                        </span>
                      )}
                    </div>
                    <span className="font-body text-sm mt-1 block text-[#8FA0BC]">{period}</span>
                  </div>

                  <div
                    className="w-full h-px mb-7"
                    style={{ background: highlighted ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.06)" }}
                  />

                  <ul className="flex flex-col gap-3.5 mb-8 flex-1">
                    {features.map((f) => (
                      <li key={f} className="flex items-start gap-3">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                            highlighted ? "bg-[#1B4FD8]/30" : "bg-[#7AAEFF]/10"
                          }`}
                        >
                          <Check size={11} className="text-[#7AAEFF]" />
                        </div>
                        <span className="font-body text-sm leading-relaxed text-[#B0C4DE]">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/login"
                    className={`w-full ${
                      highlighted ? "btn-spx btn-spx-accent" : "btn-spx btn-spx-light"
                    }`}
                  >
                    {cta}
                    <ArrowRight size={14} className="btn-arrow" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center font-body text-sm text-[#8FA0BC] mt-8">
            ¿Tienes dudas?{" "}
            <a href="mailto:hola@cosayb.co" className="text-[#7AAEFF] hover:underline font-semibold">
              Escríbenos →
            </a>
          </p>
        </div>
      </section>

      {/* ═══════════════ FAQ ═══════════════ */}
      <section id="faq" className="bg-[#F5F0E8] py-10 sm:py-16 px-6 sm:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-[1fr_1.6fr] gap-16 items-start">
            <div className="lg:sticky lg:top-28">
              <span className="inline-block bg-[#DEEAFF] text-[#1434A4] text-xs font-body font-semibold tracking-[0.15em] uppercase px-4 py-2 rounded-full mb-5">
                Preguntas frecuentes
              </span>
              <h2
                className="font-display font-extrabold text-[#12213A] leading-[1.05] mb-4"
                style={{ fontSize: "clamp(2.2rem, 5.5vw, 3.5rem)" }}
              >
                Resolvemos
                <br />
                tus dudas
              </h2>
              <p className="font-body text-[#7A6E60] text-base leading-relaxed mb-8 max-w-sm">
                Si tienes una pregunta que no aparece aquí, escríbenos y te respondemos en menos de 24 horas.
              </p>
              <Link
                href="/contacto"
                className="btn-spx btn-spx-dark"
              >
                Ir a Contacto
              </Link>
            </div>

            <div>
              {faqs.map((item) => (
                <FaqItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ CTA FINAL ═══════════════ */}
      <section
        className="relative overflow-hidden py-10 sm:py-16 px-6 sm:px-10"
        style={{ background: "linear-gradient(135deg, #0D1829 0%, #12213A 50%, #0D1829 100%)" }}
      >
        <div
          className="absolute top-0 left-1/4 w-96 h-96 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(27,79,216,0.18) 0%, transparent 70%)",
            transform: "translate(-50%, -50%)",
          }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(27,79,216,0.12) 0%, transparent 70%)",
            transform: "translate(50%, 50%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h2
            className="font-display font-extrabold text-[#F5F0E8] leading-[1.0] tracking-tight mb-6"
            style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)" }}
          >
            Construyamos
            <br />
            <span className="text-[#7AAEFF]">grandes ideas</span>
          </h2>

          <p className="font-body text-lg text-[#8FA0BC] leading-relaxed mb-12 max-w-xl mx-auto">
            Si tienes un proyecto de capacitación, consultoría o desarrollo gastronómico en mente,
            cuéntanos. Estamos listos para ayudarte a hacerlo realidad.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/contacto" className="btn-spx btn-spx-light">
              Contáctenos ahora
              <ArrowRight size={20} className="btn-arrow" />
            </Link>
            <Link href="/capacitacion" className="btn-spx btn-spx-light">
              Ver cursos
              <ArrowRight size={16} className="btn-arrow" />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
