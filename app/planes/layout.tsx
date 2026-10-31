import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Planes y precios",
  description:
    "Compara los planes Free, Pro y Academia de CO$AYB. 10 días gratis sin tarjeta, pagos en COP con tarjeta, PSE o Nequi y cancelación cuando quieras.",
  alternates: { canonical: "/planes" },
}

export default function PlanesLayout({ children }: { children: React.ReactNode }) {
  return children
}
