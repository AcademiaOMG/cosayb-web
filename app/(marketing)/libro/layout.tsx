import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Libro de Costos | CO$AYB",
  description:
    "La guía práctica para controlar costos, optimizar inventarios y aumentar la rentabilidad de restaurantes. Más de 300 páginas de contenido real para cocinas colombianas.",
}

export default function LibroLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
