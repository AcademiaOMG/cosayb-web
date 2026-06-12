import Link from "next/link"
import { Check } from "lucide-react"

const plans = [
  {
    name: "Free",
    price: "$0",
    period: " / 14 días de prueba",
    features: ["Calculadoras básicas", "Hasta 30 ingredientes", "Sin guardar datos"],
    cta: "Empezar gratis",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$30.000",
    period: " COP / mes",
    features: ["Todo ilimitado", "Exportación PDF", "Banco de recetas base", "Soporte prioritario"],
    cta: "Activar Pro",
    highlighted: true,
  },
  {
    name: "Academia",
    price: "$50.000",
    period: " COP / mes",
    features: ["Todo de Pro", "Acceso a cursos", "Certificación incluida", "Consultoría mensual"],
    cta: "Activar Academia",
    highlighted: false,
  },
]

export default function Pricing() {
  return (
    <section id="precios" className="bg-[#F5F0E8] py-20 sm:py-28 px-6 sm:px-10 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2
            className="font-display font-bold text-[#12213A] mb-4"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
          >
            Empieza gratis. Escala cuando estés listo.
          </h2>
          <p className="font-body text-[#7A6E60]">Sin sorpresas. Sin letras pequeñas.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-5xl mx-auto">
          {plans.map(({ name, price, period, features, cta, highlighted }) => (
            <div
              key={name}
              className={`relative rounded-2xl p-8 flex flex-col ${
                highlighted
                  ? "bg-[#12213A] border-2 border-[#1B4FD8]"
                  : "bg-[#FDFAF6] border border-[#DDD6C8]"
              }`}
            >
              {highlighted && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#1B4FD8] text-white text-xs font-semibold px-4 py-1 rounded-full whitespace-nowrap">
                  Más popular
                </span>
              )}

              <div className="mb-6">
                <div
                  className={`font-body font-bold text-sm uppercase tracking-wide mb-2 ${
                    highlighted ? "text-[#8FA0BC]" : "text-[#7A6E60]"
                  }`}
                >
                  {name}
                </div>
                <div className="flex items-baseline gap-1 flex-wrap">
                  <span
                    className={`font-mono text-4xl font-bold ${
                      highlighted ? "text-[#F5F0E8]" : "text-[#12213A]"
                    }`}
                  >
                    {price}
                  </span>
                  <span
                    className={`font-body text-sm ${highlighted ? "text-[#8FA0BC]" : "text-[#7A6E60]"}`}
                  >
                    {period}
                  </span>
                </div>
              </div>

              <ul className="flex flex-col gap-3 mb-6 flex-1">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check size={16} className="text-[#1B4FD8] shrink-0" />
                    <span
                      className={`font-body text-sm ${
                        highlighted ? "text-[#F5F0E8]" : "text-[#4A4438]"
                      }`}
                    >
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href="/login"
                className={`w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center transition-colors ${
                  highlighted
                    ? "bg-[#1B4FD8] text-white hover:bg-[#1540B0]"
                    : "border border-[#DDD6C8] text-[#12213A] hover:bg-[#EDE7DB]"
                }`}
              >
                {cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
