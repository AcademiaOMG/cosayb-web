import Link from "next/link"
import { ArrowRight, ChevronDown } from "lucide-react"

const stats = [
  { value: "30.000+", label: "Recetas costeadas" },
  { value: "600+", label: "Cocineros activos" },
  { value: "6", label: "Módulos integrados" },
]

export default function Hero() {
  return (
    <section className="relative overflow-hidden w-full" style={{ minHeight: "100vh" }}>
      {/* ── Background image ── */}
      <div className="absolute inset-0 z-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/fondo-principal.webp"
          alt=""
          className="w-full h-full object-cover object-center"
        />

        {/* Overlay 1: oscuro semitransparente para contraste general */}
        <div className="absolute inset-0" style={{ background: "rgba(10, 18, 40, 0.42)" }} />

        {/* Overlay 2: degradado izquierda→derecha — oculta más en zona del texto */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(10,18,40,0.82) 0%, rgba(10,18,40,0.55) 40%, rgba(10,18,40,0.10) 75%, transparent 100%)",
          }}
        />

        {/* Overlay 3: degradado inferior — ancla el contenido al suelo */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(10,18,40,0.60) 0%, transparent 40%)",
          }}
        />

        {/* Overlay 4: viñeta sutil en las esquinas */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 60%, rgba(10,18,40,0.35) 100%)",
          }}
        />
      </div>

      {/* ── Decorative glow (azul) ── */}
      <div
        className="absolute top-0 right-0 w-[700px] h-[700px] rounded-full opacity-10 pointer-events-none z-0"
        style={{
          background: "radial-gradient(circle, #1B4FD8 0%, transparent 70%)",
          transform: "translate(30%, -30%)",
        }}
      />

      {/* ── Content ── */}
      <div
        className="relative z-10 max-w-7xl mx-auto w-full px-6 sm:px-10 lg:px-16 pb-10 flex flex-col justify-center"
        style={{ minHeight: "100vh", paddingTop: "clamp(5rem, 12vw, 7rem)" }}
      >
        <div className="max-w-3xl">
          {/* Badge */}

          {/* Headline */}
          <h1
            className="font-display font-extrabold leading-[0.92] tracking-tight text-[#F5F0E8] mb-7 animate-fade-up-delay-1"
            style={{ fontSize: "clamp(2.5rem, 9vw, 6rem)" }}
          >
            El 80% de los
            <br />
            restaurantes
            <br />
            no sabe
            <br />
            <span className="text-[#7AAEFF]">cuánto le cuesta</span>
            <br />
            cada plato.
          </h1>

          {/* Value prop */}
          <p className="font-body text-lg sm:text-sm text-[#C8D5E8] leading-relaxed max-w-lg mb-10 animate-fade-up-delay-2">
            CO$AYB calcula el <strong className="text-[#F5F0E8] font-semibold">costo real de cada receta</strong>, aplica
            tus costos fijos y te dice exactamente a qué precio vender para ser rentable.
          </p>

          {/* CTA row */}
          <div className="flex flex-wrap items-center gap-4 mb-16 animate-fade-up-delay-3">
            <Link href="/login" className="btn-spx btn-spx-accent px-8 py-4">
              Probar 14 días gratis
              <ArrowRight size={18} className="btn-arrow" />
            </Link>
            <Link href="#como-funciona" className="btn-spx btn-spx-light px-8 py-4">
              Ver cómo funciona
              <ChevronDown size={16} className="btn-arrow" />
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-10 sm:gap-16 animate-fade-up-delay-4">
            {stats.map(({ value, label }) => (
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
  )
}
