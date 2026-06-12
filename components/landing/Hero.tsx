import Link from "next/link"
import { ArrowRight } from "lucide-react"

const stats = [
  { value: "30.000+", label: "recetas costeadas" },
  { value: "600+", label: "estudiantes activos" },
  { value: "6", label: "módulos integrados" },
]

export default function Hero() {
  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-center bg-[#F5F0E8]">
      {/* Full-bleed background image */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1920&q=80"
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#F5F0E8] via-[#F5F0E8]/90 to-[#F5F0E8]/20" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-6 sm:px-10 lg:px-16 py-16 sm:py-20">
        {/* Badge */}
        <div className="animate-fade-up">
          <span className="inline-block bg-[#DEEAFF] text-[#1434A4] text-xs font-body font-semibold tracking-[0.15em] uppercase px-4 py-2 rounded-full mb-6">
            Software de costos gastronómicos
          </span>
        </div>

        {/* Headline */}
        <h1
          className="font-display font-extrabold leading-[0.95] tracking-tight text-[#12213A] mb-6 max-w-3xl animate-fade-up-delay-1"
          style={{ fontSize: "clamp(2.8rem, 8vw, 6.5rem)" }}
        >
          El 80% de los restaurantes
          <br />no sabe cuánto le cuesta
          <br />cada plato. ¿Y el tuyo?
        </h1>

        {/* Subtext */}
        <p className="font-body text-base sm:text-lg text-[#4A4438] leading-relaxed max-w-lg mb-8 animate-fade-up-delay-2">
          CO$AYB calcula el costo real de cada receta, aplica tus costos fijos y te dice
          exactamente a qué precio vender para ser rentable.
        </p>

        {/* CTA row */}
        <div className="flex flex-wrap items-center gap-4 animate-fade-up-delay-3">
          <Link
            href="/login"
            className="group bg-[#1B4FD8] text-white px-6 py-3.5 rounded-lg font-body font-semibold text-sm hover:bg-[#1540B0] transition-colors flex items-center gap-2"
          >
            Probar 14 días gratis
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="#demo"
            className="border border-[#DDD6C8] text-[#12213A] px-6 py-3.5 rounded-lg font-body font-semibold text-sm hover:bg-[#EDE7DB] transition-colors"
          >
            Ver demo
          </Link>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-8 sm:gap-14 mt-10 sm:mt-14 animate-fade-up-delay-4">
          {stats.map(({ value, label }) => (
            <div key={label}>
              <div className="font-mono text-3xl sm:text-4xl font-bold text-[#1B4FD8]">{value}</div>
              <div className="font-body text-xs text-[#7A6E60] tracking-wide uppercase mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
