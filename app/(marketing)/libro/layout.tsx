import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Libro de Costos",
  description:
    "La guía práctica para controlar costos, optimizar inventarios y aumentar la rentabilidad de tu operación gastronómica. Más de 300 páginas de contenido real para negocios gastronómicos colombianos.",
}

export default function LibroLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
