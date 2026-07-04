import { CheckCircle, ArrowRight } from "lucide-react"
import Link from "next/link"

const features = [
  "Costo de materia prima calculado automáticamente",
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

export default function AppMockup() {
  return (
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
  )
}
