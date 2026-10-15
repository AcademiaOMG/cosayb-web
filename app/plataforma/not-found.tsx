import Link from "next/link"
import { Compass } from "lucide-react"

export default function PlataformaNotFound() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-lg)" }}
    >
      <Compass size={28} aria-hidden="true" style={{ color: "var(--text-muted)" }} />
      <h1 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>No encontramos esta página</h1>
      <p className="max-w-sm text-sm" style={{ color: "var(--text-muted)" }}>
        Puede que el enlace esté desactualizado o que el elemento ya no exista.
      </p>
      <Link href="/plataforma" className="plat-link rounded text-sm font-medium" style={{ color: "var(--accent-text)" }}>
        Ir al inicio de la plataforma
      </Link>
    </div>
  )
}
