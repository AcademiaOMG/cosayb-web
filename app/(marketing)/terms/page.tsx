import type { Metadata } from "next"
import LegalPage, { type LegalSection } from "@/components/landing/LegalPage"

export const metadata: Metadata = {
  title: "Términos y Condiciones",
  description: "Términos y condiciones de uso, planes, facturación y cancelación del servicio CO$AYB de Academia OMG.",
  alternates: { canonical: "/terms" },
}

const sections: LegalSection[] = [
  {
    title: "Aceptación de los términos",
    body: "Al registrarte y usar CO$AYB, aceptas estos Términos y Condiciones en su totalidad. Si no estás de acuerdo con alguna parte, te pedimos que no uses el servicio. Debes ser mayor de edad y tener capacidad legal para contratar.",
  },
  {
    title: "Descripción del servicio",
    body: "CO$AYB es una plataforma SaaS (Software as a Service) que permite calcular costos de recetas, gestionar inventarios de ingredientes y analizar rentabilidad de menús. El servicio se presta a través de internet desde la plataforma web cosayb.co.",
  },
  {
    title: "Cuenta de usuario",
    body: "Para usar CO$AYB debes crear una cuenta con información verídica y verificar tu correo electrónico. Eres responsable de mantener la confidencialidad de tu contraseña y de todas las actividades realizadas desde tu cuenta. Debes notificarnos inmediatamente cualquier acceso no autorizado. Puedes cerrar tus sesiones activas desde Mi cuenta > Seguridad.",
  },
  {
    title: "Organizaciones y equipo",
    body: "Cada negocio funciona como una organización. El propietario es responsable de las personas que invita, de los roles que les asigna y de la suscripción de la organización. Los límites de usuarios dependen del plan contratado.",
  },
  {
    title: "Planes, precios y facturación",
    body: [
      "CO$AYB ofrece un período de prueba gratuita de 14 días y planes de pago mensuales (Pro y Academia). Los valores vigentes, en pesos colombianos (COP), se muestran en la página de planes antes de contratar.",
      "La suscripción se renueva automáticamente cada mes hasta que la canceles. Recibirás el recibo de cada cobro en Configuración > Facturación. Los cambios de plan se aplican de inmediato y el valor se ajusta de forma proporcional al tiempo restante del periodo.",
    ],
  },
  {
    title: "Pagos fallidos",
    body: "Si un cobro no se puede procesar, tu suscripción pasa a estado «pago pendiente» y te avisaremos dentro de la plataforma. Tienes 5 días para actualizar tu método de pago; si el pago no se regulariza, tu organización pasará al plan Free y conservarás tus datos con las limitaciones de ese plan.",
  },
  {
    title: "Cancelación y reembolsos",
    body: "Puedes cancelar tu suscripción en cualquier momento desde Configuración > Facturación. La cancelación será efectiva al finalizar el período de facturación en curso y seguirás usando el plan hasta entonces. Los reembolsos se rigen por la Política de reembolso.",
  },
  {
    title: "Propiedad intelectual y tus datos",
    body: "El código, diseño, marca CO$AYB y el banco de ingredientes son propiedad de Academia OMG. Los datos que tú ingresas (recetas, ingredientes personalizados, costos) son de tu propiedad: puedes exportarlos en cualquier momento desde Mi cuenta y eliminarlos al cerrar tu cuenta.",
  },
  {
    title: "Uso aceptable",
    body: "Te comprometes a no usar CO$AYB para actividades ilegales, no intentar acceder a cuentas de otros usuarios, no realizar ingeniería inversa sobre el software, y no usar el servicio de forma que afecte su disponibilidad para otros usuarios. Podemos suspender cuentas que incumplan estas reglas.",
  },
  {
    title: "Disponibilidad y soporte",
    body: "Trabajamos para mantener el servicio disponible, pero no garantizamos que funcione sin interrupciones. El soporte se presta por el formulario del Centro de ayuda y por correo; el plan Pro y Academia tienen atención prioritaria.",
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
    <LegalPage
      title="Términos y"
      highlight="Condiciones"
      updated="octubre de 2026"
      intro="Al acceder y usar la plataforma CO$AYB, aceptas los siguientes términos y condiciones. Léelos cuidadosamente antes de crear tu cuenta."
      sections={sections}
      ctaText="¿Tienes preguntas sobre estos términos?"
    />
  )
}
