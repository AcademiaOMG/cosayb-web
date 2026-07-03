import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "¿Tienes dudas sobre CO$AYB? Escríbenos por email o WhatsApp. Respondemos en menos de 24 horas.",
}

export default function ContactoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
