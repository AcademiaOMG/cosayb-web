"use client"

import Link from "next/link"
import { ShieldOff, Store } from "lucide-react"
import { authClient } from "@/lib/auth"
import { Card } from "@/components/lms/ui"

/**
 * Aviso para quien tiene el acceso a la academia desactivado. Reemplaza el contenido del LMS: el servidor ya responde
 * 403 a todas sus peticiones, esto solo lo explica con claridad. Si tiene un negocio, su costeo sigue disponible.
 */
export default function DisabledNotice({ hasBusiness }: { hasBusiness: boolean }) {
  return (
    <Card className="mx-auto mt-10 flex max-w-xl flex-col items-center gap-4 p-8 text-center">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "var(--l-amber-bg)", color: "var(--l-amber-ink)" }}>
        <ShieldOff size={26} aria-hidden="true" />
      </span>
      <h1 className="text-2xl font-extrabold">Tu acceso a la academia está desactivado</h1>
      <p className="text-sm font-semibold" style={{ color: "var(--l-muted)" }}>
        Un administrador desactivó tu cuenta de la academia. Si crees que es un error, escribe a quien administra tu academia para que la reactive.
        {hasBusiness ? " Tu negocio en CO$AYB no se ve afectado." : ""}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {hasBusiness && (
          <Link href="/dashboard" className="l-btn l-btn-primary l-btn-sm"><Store size={16} aria-hidden="true" /> Ir a mi negocio</Link>
        )}
        <button type="button" className="l-btn l-btn-ghost l-btn-sm" onClick={() => void authClient.signOut().then(() => window.location.assign("/login"))}>Cerrar sesión</button>
      </div>
    </Card>
  )
}
