import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description: "Política de privacidad y tratamiento de datos personales de Academia OMG.",
  robots: { index: false, follow: false },
}

const sections = [
  {
    title: "Responsable del tratamiento",
    body: "Academia OMG, con domicilio en Colombia, es la entidad responsable del tratamiento de los datos personales recopilados a través de la plataforma CO$AYB (cosayb.co). Para cualquier consulta relacionada con privacidad, puedes escribirnos a hola@cosayb.co.",
  },
  {
    title: "Datos que recopilamos",
    body: "Recopilamos los datos que proporcionas al registrarte (nombre, correo electrónico), los datos que ingresas al usar la plataforma (ingredientes, recetas, costos) y datos de uso técnico (dirección IP, navegador, tipo de dispositivo) para mejorar el servicio.",
  },
  {
    title: "Finalidad del tratamiento",
    body: "Usamos tus datos para: (a) prestarte el servicio de CO$AYB, (b) enviarte comunicaciones relacionadas con tu cuenta, (c) mejorar la plataforma, y (d) cumplir obligaciones legales. No usaremos tus datos para publicidad de terceros sin tu consentimiento explícito.",
  },
  {
    title: "Compartición de datos",
    body: "No vendemos ni compartimos tus datos personales con terceros, salvo con proveedores de infraestructura estrictamente necesarios para operar el servicio (como servicios de base de datos en la nube) y bajo acuerdos de confidencialidad.",
  },
  {
    title: "Seguridad",
    body: "Implementamos medidas técnicas y organizativas para proteger tus datos: cifrado en tránsito (TLS), cifrado en reposo, acceso limitado al personal autorizado y copias de seguridad regulares.",
  },
  {
    title: "Tus derechos",
    body: "De acuerdo con la Ley 1581 de 2012 (Colombia), tienes derecho a conocer, actualizar, rectificar y suprimir tus datos personales. Para ejercer estos derechos, escríbenos a hola@cosayb.co con el asunto 'Derechos ARCO'.",
  },
  {
    title: "Retención de datos",
    body: "Conservamos tus datos mientras tu cuenta esté activa. Si eliminas tu cuenta, tus datos serán eliminados en un plazo de 30 días, excepto aquellos que debamos retener por obligaciones legales.",
  },
  {
    title: "Cambios a esta política",
    body: "Podemos actualizar esta política. Te notificaremos por correo electrónico o mediante un aviso en la plataforma cuando haya cambios relevantes. La fecha de última actualización aparece al pie de esta página.",
  },
]

export default function PrivacyPage() {
  return (
    <div>
      {/* ─── HERO ─────────────────────────────────────────────────── */}
      <section className="bg-[#12213A] py-16 sm:py-24 px-6 sm:px-10 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <h1
            className="font-display font-extrabold text-[#F5F0E8] leading-[1.05] mb-4"
            style={{ fontSize: "clamp(2.2rem, 5vw, 3.5rem)" }}
          >
            Política de{" "}
            <span className="text-[#7AAEFF]">Privacidad</span>
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
            En Academia OMG nos tomamos muy en serio la privacidad de nuestros usuarios. Esta política describe
            qué datos recopilamos, cómo los usamos y cuáles son tus derechos.
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
              ¿Tienes preguntas sobre esta política?
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
