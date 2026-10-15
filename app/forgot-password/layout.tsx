import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Recuperar contraseña",
  description: "Solicita un enlace para crear una nueva contraseña.",
  robots: { index: false, follow: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
