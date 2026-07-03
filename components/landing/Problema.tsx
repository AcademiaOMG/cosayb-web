import { TrendingUp, Clock, AlertCircle } from "lucide-react"

const painPoints = [
  {
    Icon: TrendingUp,
    stat: "48%",
    label: "Costo de materia prima promedio",
    context: "La industria recomienda máximo 32%",
    accentColor: "#1B4FD8",
    iconBg: "rgba(27,79,216,0.10)",
    iconColor: "#1B4FD8",
  },
  {
    Icon: Clock,
    stat: "8 h",
    label: "Al mes en hojas de cálculo",
    context: "Tiempo que podrías dedicar a tu cocina",
    accentColor: "#12213A",
    iconBg: "rgba(18,33,58,0.10)",
    iconColor: "#12213A",
  },
  {
    Icon: AlertCircle,
    stat: "1 de 3",
    label: "Restaurantes pierde dinero sin saberlo",
    context: "Por no conocer el costo real de sus platos",
    accentColor: "#3A5070",
    iconBg: "rgba(58,80,112,0.10)",
    iconColor: "#3A5070",
  },
]

export default function Problema() {
  return (
    <section className="bg-[#F5F0E8] py-14 sm:py-20">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">

        {/* Pull quote */}
        <div className="text-center mb-10 sm:mb-14">
          <p className="font-body text-xs font-semibold tracking-[0.2em] uppercase text-[#7A6E60] mb-6">
            El problema real
          </p>
          <h2
            className="font-display font-extrabold text-[#12213A] leading-[1.08] tracking-tight max-w-4xl mx-auto mb-6"
            style={{ fontSize: "clamp(2.2rem, 5.5vw, 4rem)" }}
          >
            &ldquo;Trabajan duro.
            <br />
            El restaurante se ve lleno.
            <br />
            <span className="text-[#3A5070]">A fin de mes no queda nada.&rdquo;</span>
          </h2>
          <p className="font-body text-lg text-[#4A4438] max-w-2xl mx-auto leading-relaxed">
            No es falta de esfuerzo. Es falta de herramientas precisas para saber cuánto cuesta realmente cada plato.
          </p>
        </div>

        {/* Pain point cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {painPoints.map(({ Icon, stat, label, context, accentColor, iconBg, iconColor }) => (
            <div
              key={stat}
              className="card-hover rounded-2xl p-8 flex flex-col gap-6 bg-white border border-[#DDD6C8]"
            >
              {/* Icon */}
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: iconBg }}
              >
                <Icon size={20} style={{ color: iconColor }} />
              </div>

              {/* Stat */}
              <div>
                <div
                  className="font-display font-extrabold leading-none mb-2"
                  style={{
                    fontSize: "clamp(2.8rem, 6vw, 3.75rem)",
                    color: accentColor,
                  }}
                >
                  {stat}
                </div>
                <p className="font-body font-semibold text-[#12213A] text-base mb-2 leading-snug">
                  {label}
                </p>
                <p className="font-body text-sm text-[#7A6E60] leading-relaxed">
                  {context}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom hook */}
        <div className="text-center mt-16">
          <p className="font-body text-[#4A4438] text-lg">
            CO$AYB es la herramienta que cierra esa brecha.{" "}
            <span className="text-[#12213A] font-semibold">Sin fórmulas complicadas.</span>
          </p>
        </div>

      </div>
    </section>
  )
}
