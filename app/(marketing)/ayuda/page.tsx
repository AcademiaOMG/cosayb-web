import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import HelpCenter from "@/components/saas/HelpCenter"
import { FAQ } from "@/lib/help/faq"

export const metadata: Metadata = {
  title: "Centro de ayuda",
  description:
    "Respuestas sobre tu cuenta, planes y pagos, costos y recetas, equipo y datos en CO$AYB. Busca por tema o escríbenos.",
  alternates: { canonical: "/ayuda" },
}

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((e) => ({
    "@type": "Question",
    name: e.q,
    acceptedAnswer: { "@type": "Answer", text: e.a },
  })),
}

export default function AyudaPage() {
  return (
    <div>
      <section className="bg-[#12213A] py-16 sm:py-24 px-6 sm:px-10 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <h1
            className="font-display font-extrabold text-[#F5F0E8] leading-[1.05] mb-4"
            style={{ fontSize: "clamp(2.2rem, 5vw, 3.5rem)" }}
          >
            Centro de <span className="text-[#7AAEFF]">ayuda</span>
          </h1>
          <p className="font-body text-lg text-[#8FA0BC]">Encuentra respuestas rápidas o escríbenos si no las ves aquí.</p>
        </div>
      </section>

      <section className="bg-[#F5F0E8] py-10 sm:py-16 px-6 sm:px-10 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <HelpCenter />

          <div className="mt-12 pt-8 border-t border-[#DDD6C8]">
            <p className="font-body text-sm text-[#7A6E60] mb-4">¿No encontraste lo que buscabas?</p>
            <Link href="/contacto" className="btn-spx btn-spx-dark">
              Escribir a soporte
              <ArrowRight size={16} className="btn-arrow" />
            </Link>
          </div>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
    </div>
  )
}
