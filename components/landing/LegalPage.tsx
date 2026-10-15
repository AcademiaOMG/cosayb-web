import Link from "next/link"
import { ArrowRight } from "lucide-react"

export interface LegalSection {
  title: string
  /** Un párrafo o varios. */
  body: string | string[]
}

export interface LegalPageProps {
  /** Parte normal del título. */
  title: string
  /** Parte resaltada del título. */
  highlight: string
  updated: string
  intro?: string
  sections: LegalSection[]
  ctaText: string
}

/** Plantilla común de las páginas legales (términos, privacidad, reembolso, cookies). */
export default function LegalPage({ title, highlight, updated, intro, sections, ctaText }: LegalPageProps) {
  return (
    <div>
      <section className="bg-[#12213A] py-16 sm:py-24 px-6 sm:px-10 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <h1
            className="font-display font-extrabold text-[#F5F0E8] leading-[1.05] mb-4"
            style={{ fontSize: "clamp(2.2rem, 5vw, 3.5rem)" }}
          >
            {title} <span className="text-[#7AAEFF]">{highlight}</span>
          </h1>
          <p className="font-body text-lg text-[#8FA0BC]">Última actualización: {updated}</p>
        </div>
      </section>

      <section className="bg-[#F5F0E8] py-10 sm:py-16 px-6 sm:px-10 lg:px-16">
        <div className="max-w-4xl mx-auto">
          {intro && (
            <p className="font-body text-base text-[#4A4438] leading-relaxed mb-10 max-w-3xl">{intro}</p>
          )}
          <div className="flex flex-col gap-6">
            {sections.map(({ title: t, body }, i) => (
              <div key={t} className="bg-white rounded-2xl p-6 sm:p-8 border border-[#DDD6C8]">
                <div className="flex items-start gap-4">
                  <span className="shrink-0 w-8 h-8 rounded-lg bg-[#DEEAFF] flex items-center justify-center font-body font-bold text-sm text-[#1B4FD8]">
                    {i + 1}
                  </span>
                  <div className="flex flex-col gap-2">
                    <h2 className="font-body font-bold text-[#12213A] text-lg">{t}</h2>
                    {(Array.isArray(body) ? body : [body]).map((p) => (
                      <p key={p} className="font-body text-sm text-[#4A4438] leading-relaxed">{p}</p>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-[#DDD6C8]">
            <p className="font-body text-sm text-[#7A6E60] mb-4">{ctaText}</p>
            <Link href="/contacto" className="btn-spx btn-spx-dark">
              Contáctanos
              <ArrowRight size={16} className="btn-arrow" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
