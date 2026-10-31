import type { Metadata } from "next"
import LegalPage, { type LegalSection } from "@/components/landing/LegalPage"

export const metadata: Metadata = {
  title: "Política de Reembolso",
  description: "Cuándo y cómo puedes pedir el reembolso de tu suscripción a CO$AYB.",
  alternates: { canonical: "/refunds" },
}

const sections: LegalSection[] = [
  {
    title: "Prueba gratuita",
    body: "Todas las cuentas nuevas tienen 10 días gratis con el plan Free, sin costo y sin tarjeta. Te recomendamos usar la prueba para confirmar que CO$AYB se ajusta a tu negocio antes de contratar un plan de pago.",
  },
  {
    title: "Reembolso del primer cobro",
    body: "Si contratas un plan de pago por primera vez y no estás satisfecho, puedes pedir el reembolso total de ese primer cobro dentro de los 7 días siguientes al pago. Solo aplica una vez por organización.",
  },
  {
    title: "Renovaciones y cambios de plan",
    body: "Los cobros de renovación mensual no son reembolsables una vez iniciado el período. Si cancelas, conservas el acceso hasta el final del período ya pagado y no se realizan nuevos cobros. En los cambios de plan solo pagas la diferencia proporcional al tiempo restante.",
  },
  {
    title: "Cobros duplicados o erróneos",
    body: "Si detectas un cobro duplicado o un valor distinto al informado, escríbenos y lo corregimos o reembolsamos sin importar la fecha, previa verificación del pago.",
  },
  {
    title: "Libros, cursos y consultoría",
    body: "Los libros digitales, cursos y servicios de consultoría se rigen por las condiciones indicadas al momento de la compra. Los libros físicos pueden devolverse dentro de los 5 días siguientes a la entrega si llegan sin uso, conforme al derecho de retracto del Estatuto del Consumidor (Ley 1480 de 2011).",
  },
  {
    title: "Cómo solicitarlo",
    body: [
      "Envía tu solicitud desde el formulario de soporte (Centro de ayuda) o escríbenos a soporte@academiaomg.com indicando el correo de tu cuenta y el número de operación del recibo.",
      "Respondemos en un máximo de 3 días hábiles. El reembolso aprobado se devuelve al mismo medio de pago y puede tardar de 5 a 10 días hábiles en reflejarse, según tu banco.",
    ],
  },
]

export default function RefundsPage() {
  return (
    <LegalPage
      title="Política de"
      highlight="Reembolso"
      updated="octubre de 2026"
      intro="Queremos que contrates CO$AYB con tranquilidad. Estas son las reglas claras sobre cancelaciones y devoluciones."
      sections={sections}
      ctaText="¿Necesitas ayuda con un cobro?"
    />
  )
}
