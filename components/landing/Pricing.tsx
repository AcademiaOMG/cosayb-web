import Link from "next/link"
import { Check, ArrowRight, Zap } from "lucide-react"

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

export default function Pricing() {
  return (
    <section id="precios" className="bg-[#12213A] py-14 sm:py-20 px-6 sm:px-10 lg:px-16">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
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

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
          {plans.map(({ name, tagline, price, period, features, cta, highlighted, badge }) => (
            <div
              key={name}
              className={`relative rounded-2xl flex flex-col overflow-hidden transition-all duration-300 ${
                highlighted
                  ? "ring-2 ring-[#1B4FD8]"
                  : "card-hover border border-white/[0.06]"
              }`}
              style={
                highlighted
                  ? {
                      boxShadow: "0 8px 40px rgba(27,79,216,0.2), 0 0 0 2px rgba(27,79,216,1)",
                    }
                  : {}
              }
            >
              {/* Badge */}
              {badge && (
                <div className="flex items-center justify-center gap-1.5 bg-[#1B4FD8] py-2 px-4">
                  <Zap size={12} className="text-white" />
                  <span className="font-body text-xs font-bold text-white tracking-wide">{badge}</span>
                </div>
              )}

              {/* Card body */}
              <div
                className={`flex flex-col flex-1 p-8 ${
                  highlighted ? "bg-[#0D1829]" : "bg-white/[0.03]"
                }`}
              >
                {/* Plan name + tagline */}
                <div className="mb-6">
                  <div
                    className={`font-body font-bold text-xs uppercase tracking-widest mb-1 ${
                      highlighted ? "text-[#7AAEFF]" : "text-[#7AAEFF]/80"
                    }`}
                  >
                    {name}
                  </div>
                  <p
                    className={`font-body text-sm ${
                      highlighted ? "text-[#8FA0BC]" : "text-[#8FA0BC]"
                    }`}
                  >
                    {tagline}
                  </p>
                </div>

                {/* Price */}
                <div className="mb-7">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span
                      className={`font-mono font-extrabold leading-none ${
                        highlighted ? "text-[#F5F0E8]" : "text-[#F5F0E8]"
                      }`}
                      style={{ fontSize: "clamp(2.2rem, 5vw, 2.75rem)" }}
                    >
                      {price}
                    </span>
                  </div>
                  <span
                    className={`font-body text-sm mt-1 block ${
                      highlighted ? "text-[#8FA0BC]" : "text-[#8FA0BC]"
                    }`}
                  >
                    {period}
                  </span>
                </div>

                {/* Divider */}
                <div
                  className="w-full h-px mb-7"
                  style={{ background: highlighted ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.06)" }}
                />

                {/* Features */}
                <ul className="flex flex-col gap-3.5 mb-8 flex-1">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          highlighted ? "bg-[#1B4FD8]/30" : "bg-[#7AAEFF]/10"
                        }`}
                      >
                        <Check size={11} className={highlighted ? "text-[#7AAEFF]" : "text-[#7AAEFF]"} />
                      </div>
                      <span
                        className={`font-body text-sm leading-relaxed ${
                          highlighted ? "text-[#B0C4DE]" : "text-[#B0C4DE]"
                        }`}
                      >
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
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

        {/* Footnote */}
        <p className="text-center font-body text-sm text-[#8FA0BC] mt-8">
          ¿Tienes dudas?{" "}
          <a href="mailto:hola@cosayb.co" className="text-[#7AAEFF] hover:underline font-semibold">
            Escríbenos →
          </a>
        </p>
      </div>
    </section>
  )
}
