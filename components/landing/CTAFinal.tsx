import Link from "next/link"
import { ArrowRight } from "lucide-react"

export default function CTAFinal() {
  return (
    <section
      className="relative overflow-hidden py-16 sm:py-24 px-6 sm:px-10"
      style={{ background: "linear-gradient(135deg, #0D1829 0%, #12213A 50%, #0D1829 100%)" }}
    >
      {/* Decorative blobs */}
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

      {/* Grid texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 bg-[#1B4FD8]/20 border border-[#1B4FD8]/30 rounded-full px-4 py-2 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[#7AAEFF] animate-pulse" />
          <span className="font-body text-xs font-semibold text-[#7AAEFF] tracking-[0.12em] uppercase">
            14 días gratis · Sin tarjeta de crédito
          </span>
        </div>

        {/* Headline */}
        <h2
          className="font-display font-extrabold text-[#F5F0E8] leading-[1.0] tracking-tight mb-6"
          style={{ fontSize: "clamp(3rem, 8vw, 6rem)" }}
        >
          Empieza hoy.
          <br />
          <span className="text-[#7AAEFF]">Tu primera receta,</span>
          <br />
          gratis.
        </h2>

        {/* Subtext */}
        <p className="font-body text-xl text-[#8FA0BC] leading-relaxed mb-12 max-w-xl mx-auto">
          Sin compromiso. Sin tarjeta. 14 días para descubrir exactamente cuánto le cuesta cada plato a tu cocina.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
          <Link href="/login" className="btn-spx btn-spx-light px-8 py-4">
            Crear mi cuenta gratis
            <ArrowRight size={20} className="btn-arrow" />
          </Link>
          <Link href="#precios" className="btn-spx btn-spx-light px-8 py-4">
            Ver planes
            <ArrowRight size={16} className="btn-arrow" />
          </Link>
        </div>

        {/* Trust row */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {[
            "✓ Sin tarjeta de crédito",
            "✓ Cancela cuando quieras",
            "✓ Datos 100% seguros",
          ].map((item) => (
            <span key={item} className="font-body text-xs text-[#4A6080]">
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
