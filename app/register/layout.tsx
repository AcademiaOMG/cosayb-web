import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Crear cuenta",
  description: "Crea tu cuenta de CO$AYB y prueba 14 días gratis, sin tarjeta.",
  alternates: { canonical: "/register" },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
