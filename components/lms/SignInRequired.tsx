"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { buildLoginUrl } from "@/lib/authRedirect"
import EmptyState from "@/components/ui/EmptyState"

export default function SignInRequired({ message = "Inicia sesión para ver este contenido." }: { message?: string }) {
  const pathname = usePathname()
  return (
    <EmptyState
      title="Necesitas iniciar sesión"
      description={message}
      action={
        <Link href={buildLoginUrl(pathname)} className="inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold" style={{ background: "var(--accent)", color: "#fff" }}>
          Iniciar sesión
        </Link>
      }
    />
  )
}
