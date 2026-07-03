import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description: "Política de privacidad y tratamiento de datos personales de CO$AYB.",
  robots: { index: false, follow: false },
}

const sections = [
  {
    title: "1. Responsable del tratamiento",
    body: "Academia OMG, con domicilio en Colombia, es la entidad responsable del tratamiento de los datos personales recopilados a través de la plataforma CO$AYB (cosayb.co). Para cualquier consulta relacionada con privacidad, puedes escribirnos a hola@cosayb.co.",
  },
  {
    title: "2. Datos que recopilamos",
    body: "Recopilamos los datos que proporcionas al registrarte (nombre, correo electrónico), los datos que ingresas al usar la plataforma (ingredientes, recetas, costos) y datos de uso técnico (dirección IP, navegador, tipo de dispositivo) para mejorar el servicio.",
  },
  {
    title: "3. Finalidad del tratamiento",
    body: "Usamos tus datos para: (a) prestarte el servicio de CO$AYB, (b) enviarte comunicaciones relacionadas con tu cuenta, (c) mejorar la plataforma, y (d) cumplir obligaciones legales. No usaremos tus datos para publicidad de terceros sin tu consentimiento explícito.",
  },
  {
    title: "4. Compartición de datos",
    body: "No vendemos ni compartimos tus datos personales con terceros, salvo con proveedores de infraestructura estrictamente necesarios para operar el servicio (como servicios de base de datos en la nube) y bajo acuerdos de confidencialidad.",
  },
  {
    title: "5. Seguridad",
    body: "Implementamos medidas técnicas y organizativas para proteger tus datos: cifrado en tránsito (TLS), cifrado en reposo, acceso limitado al personal autorizado y copias de seguridad regulares.",
  },
  {
    title: "6. Tus derechos",
    body: "De acuerdo con la Ley 1581 de 2012 (Colombia), tienes derecho a conocer, actualizar, rectificar y suprimir tus datos personales. Para ejercer estos derechos, escríbenos a hola@cosayb.co con el asunto 'Derechos ARCO'.",
  },
  {
    title: "7. Retención de datos",
    body: "Conservamos tus datos mientras tu cuenta esté activa. Si eliminas tu cuenta, tus datos serán eliminados en un plazo de 30 días, excepto aquellos que debamos retener por obligaciones legales.",
  },
  {
    title: "8. Cambios a esta política",
    body: "Podemos actualizar esta política. Te notificaremos por correo electrónico o mediante un aviso en la plataforma cuando haya cambios relevantes. La fecha de última actualización aparece al pie de esta página.",
  },
]

export default function PrivacyPage() {
  return (
    <section className="bg-[#F5F0E8] py-20 sm:py-28 px-6 sm:px-10 lg:px-16">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/"
            className="font-body text-xs text-[#7A6E60] hover:text-[#12213A] transition-colors mb-6 inline-block"
          >
            ← Volver al inicio
          </Link>
          <h1
            className="font-display font-extrabold text-[#12213A] leading-tight mb-3"
            style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}
          >
            Política de Privacidad
          </h1>
          <p className="font-body text-sm text-[#7A6E60]">
            Última actualización: julio de 2026
          </p>
        </div>

        <p className="font-body text-base text-[#4A4438] leading-relaxed mb-10">
          En CO$AYB nos tomamos muy en serio la privacidad de nuestros usuarios. Esta política describe
          qué datos recopilamos, cómo los usamos y cuáles son tus derechos.
        </p>

        {/* Sections */}
        <div className="flex flex-col gap-8">
          {sections.map(({ title, body }) => (
            <div key={title}>
              <h2 className="font-body font-bold text-[#12213A] text-lg mb-3">{title}</h2>
              <p className="font-body text-base text-[#4A4438] leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-12 pt-8 border-t border-[#DDD6C8]">
          <p className="font-body text-sm text-[#7A6E60]">
            ¿Tienes preguntas sobre esta política?{" "}
            <Link href="/contacto" className="text-[#1B4FD8] hover:underline font-semibold">
              Contáctanos →
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}
