import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Consultoría",
  description:
    "Consultoría especializada en costos de alimentos y bebidas para restaurantes. Diagnóstico, acompañamiento y planes de mejora personalizados por Academia OMG.",
}

export default function ConsultoriaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
