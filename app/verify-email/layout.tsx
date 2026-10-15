import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Verificar correo",
  description: "Confirma tu correo electrónico.",
  robots: { index: false, follow: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
