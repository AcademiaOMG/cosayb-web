import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description: "Accede a tu cuenta de CO$AYB con tu correo y contraseña o con Google.",
  alternates: { canonical: "/login" },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
