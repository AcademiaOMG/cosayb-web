import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Capacitación | CO$AYB",
  description:
    "Programas de capacitación especializada para restaurantes: control de costos, inventarios, recetas y rentabilidad. Desarrollado por Academia OMG.",
}

export default function CapacitacionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
