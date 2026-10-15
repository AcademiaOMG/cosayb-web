import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

export interface StatCardProps {
  /** Qué se mide, en español («Negocios activos»). */
  label: string
  /** Cifra o texto principal ya formateado. */
  value: ReactNode
  /** Aclaración corta debajo («+3 este mes»). */
  hint?: ReactNode
  icon?: LucideIcon
  /** Si se indica, toda la tarjeta es un enlace. */
  href?: string
}

/** Tarjeta de indicador (vidrio sutil). Úsala dentro de una grilla: `grid gap-4 sm:grid-cols-2 xl:grid-cols-4`. */
export default function StatCard({ label, value, hint, icon: Icon, href }: StatCardProps) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>{label}</span>
        {Icon && (
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)]"
            style={{ background: "var(--accent-light)", color: "var(--accent)" }}
          >
            <Icon size={16} />
          </span>
        )}
      </div>
      <p className="font-display text-3xl font-bold leading-none" style={{ color: "var(--text-primary)" }}>{value}</p>
      {hint && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{hint}</p>}
    </>
  )
  const cls = "glass flex flex-col gap-3 p-5"
  if (href) {
    return (
      <Link href={href} className={`${cls} plat-focus transition-transform hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]`}>
        {body}
      </Link>
    )
  }
  return <div className={cls}>{body}</div>
}
