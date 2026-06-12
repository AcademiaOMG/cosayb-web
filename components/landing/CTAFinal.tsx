import Link from "next/link"
import { ArrowRight } from "lucide-react"

export default function CTAFinal() {
  return (
    <section className="bg-[#12213A] py-24 sm:py-32 px-6 sm:px-10 text-center">
      <div className="max-w-7xl mx-auto">
        <h2
          className="font-display font-extrabold text-[#F5F0E8] leading-[1.05] tracking-tight mb-4"
          style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}
        >
          Empieza hoy.
          <br />Tu primera receta, gratis.
        </h2>
        <p className="font-body text-[#8FA0BC] text-lg mb-10">
          Sin tarjeta de crédito. Sin compromiso. 14 días para convencerte.
        </p>
        <Link
          href="/login"
          className="group bg-[#1B4FD8] text-white px-10 py-4 rounded-xl font-body font-semibold text-base hover:bg-[#1540B0] transition-colors flex items-center gap-2 mx-auto w-fit"
        >
          Crear mi cuenta gratis
          <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </section>
  )
}
