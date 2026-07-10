import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Términos y Condiciones",
  description: "Términos y condiciones de uso del servicio de Academia OMG.",
  robots: { index: false, follow: false },
}

const sections = [
  {
    title: "Aceptación de los términos",
    body: "Al registrarte y usar CO$AYB, aceptas estos Términos y Condiciones en su totalidad. Si no estás de acuerdo con alguna parte, te pedimos que no uses el servicio.",
  },
  {
    title: "Descripción del servicio",
    body: "CO$AYB es una plataforma SaaS (Software as a Service) que permite calcular costos de recetas, gestionar inventarios de ingredientes y analizar rentabilidad de menús. El servicio se presta a través de internet desde la plataforma web cosayb.co.",
  },
  {
    title: "Cuenta de usuario",
    body: "Para usar CO$AYB debes crear una cuenta con información verídica. Eres responsable de mantener la confidencialidad de tu contraseña y de todas las actividades realizadas desde tu cuenta. Debes notificarnos inmediatamente cualquier acceso no autorizado.",
  },
  {
    title: "Planes y pagos",
    body: "CO$AYB ofrece un período de prueba gratuita de 14 días. Después, el uso continuo del servicio requiere un plan de pago. Los precios y características de cada plan están descritos en la página de precios. Los pagos son mensuales y se procesan de forma automática.",
  },
  {
    title: "Política de cancelación",
    body: "Puedes cancelar tu suscripción en cualquier momento desde tu perfil. La cancelación será efectiva al finalizar el período de facturación en curso. No realizamos reembolsos por períodos ya facturados.",
  },
  {
    title: "Propiedad intelectual",
    body: "El código, diseño, marca CO$AYB y el banco de ingredientes son propiedad de Academia OMG. Los datos que tú ingresas (recetas, ingredientes personalizados, costos) son de tu propiedad y puedes exportarlos en cualquier momento.",
  },
  {
    title: "Uso aceptable",
    body: "Te comprometes a no usar CO$AYB para actividades ilegales, no intentar acceder a cuentas de otros usuarios, no realizar ingeniería inversa sobre el software, y no usar el servicio de forma que afecte su disponibilidad para otros usuarios.",
  },
  {
    title: "Limitación de responsabilidad",
    body: "CO$AYB proporciona información de costos basada en los datos que tú ingresas. Las decisiones de negocio basadas en esa información son de tu entera responsabilidad. No garantizamos resultados financieros específicos.",
  },
  {
    title: "Modificaciones",
    body: "Podemos modificar estos términos en cualquier momento. Te notificaremos por correo con al menos 15 días de anticipación ante cambios relevantes. El uso continuado del servicio después de la notificación implica aceptación de los nuevos términos.",
  },
  {
    title: "Ley aplicable",
    body: "Estos términos se rigen por la legislación colombiana. Cualquier disputa será sometida a los tribunales competentes de Colombia.",
  },
]

export default function TermsPage() {
  return (
    <div>
      {/* ─── HERO ─────────────────────────────────────────────────── */}
      <section className="bg-[#12213A] py-16 sm:py-24 px-6 sm:px-10 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <h1
            className="font-display font-extrabold text-[#F5F0E8] leading-[1.05] mb-4"
            style={{ fontSize: "clamp(2.2rem, 5vw, 3.5rem)" }}
          >
            Términos y{" "}
            <span className="text-[#7AAEFF]">Condiciones</span>
          </h1>
          <p className="font-body text-lg text-[#8FA0BC]">
            Última actualización: julio de 2026
          </p>
        </div>
      </section>

      {/* ─── CONTENT ──────────────────────────────────────────────── */}
      <section className="bg-[#F5F0E8] py-10 sm:py-16 px-6 sm:px-10 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <p className="font-body text-base text-[#4A4438] leading-relaxed mb-10 max-w-3xl">
            Al acceder y usar la plataforma CO$AYB, aceptas los siguientes términos y condiciones.
            Léelos cuidadosamente antes de crear tu cuenta.
          </p>

          <div className="flex flex-col gap-6">
            {sections.map(({ title, body }, i) => (
              <div
                key={title}
                className="bg-white rounded-2xl p-6 sm:p-8 border border-[#DDD6C8]"
              >
                <div className="flex items-start gap-4">
                  <span className="shrink-0 w-8 h-8 rounded-lg bg-[#DEEAFF] flex items-center justify-center font-body font-bold text-sm text-[#1B4FD8]">
                    {i + 1}
                  </span>
                  <div>
                    <h2 className="font-body font-bold text-[#12213A] text-lg mb-2">{title}</h2>
                    <p className="font-body text-sm text-[#4A4438] leading-relaxed">{body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer CTA */}
          <div className="mt-12 pt-8 border-t border-[#DDD6C8]">
            <p className="font-body text-sm text-[#7A6E60] mb-4">
              ¿Tienes preguntas sobre estos términos?
            </p>
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
