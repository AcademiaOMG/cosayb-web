"use client"

import { usePathname } from "next/navigation"
import { Lock } from "lucide-react"
import { buildLoginUrl } from "@/lib/authRedirect"
import { EmptyState, LinkButton } from "./ui"

export default function SignInRequired({ message = "Inicia sesión para ver este contenido." }: { message?: string }) {
  const pathname = usePathname()
  return (
    <EmptyState
      art={
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-3xl" style={{ background: "var(--l-tint-bg)", color: "var(--l-tint)" }}>
          <Lock size={28} aria-hidden="true" />
        </span>
      }
      title="Necesitas iniciar sesión"
      description={message}
      action={<LinkButton href={buildLoginUrl(pathname)}>Iniciar sesión</LinkButton>}
    />
  )
}
