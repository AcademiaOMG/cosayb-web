import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Artículos, recursos y novedades sobre costos de alimentos, gestión gastronómica y rentabilidad para restaurantes. Academia OMG.",
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
