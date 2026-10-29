"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Award, BookOpen, GraduationCap, ShieldCheck } from "lucide-react"
import { authClient } from "@/lib/auth"
import { buildLoginUrl } from "@/lib/authRedirect"

const NAV = [
  { href: "/cursos", label: "Cursos", icon: BookOpen },
  { href: "/mis-cursos", label: "Mis cursos", icon: GraduationCap, auth: true },
  { href: "/verificar", label: "Verificar certificado", short: "Verificar", icon: ShieldCheck },
] as const

/** Cabecera común del aprendizaje. No exige organización: cualquier usuario con sesión puede estudiar. */
export default function LearnShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session } = authClient.useSession()

  return (
    <div className="app-theme-neutral min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <header className="sticky top-0 z-30" style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border-light)" }}>
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 sm:gap-4">
          <Link href="/cursos" className="flex items-center gap-2 font-display text-base font-bold" style={{ color: "var(--text-primary)" }}>
            <Award size={20} aria-hidden="true" style={{ color: "var(--accent)" }} />
            <span className="hidden sm:inline">Academia OMG</span>
          </Link>
          <nav aria-label="Aprendizaje" className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
            {NAV.filter((n) => !("auth" in n) || session).map((n) => {
              const active = pathname === n.href || pathname.startsWith(`${n.href}/`)
              const Icon = n.icon
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium"
                  style={{ background: active ? "var(--accent-light)" : "transparent", color: active ? "var(--accent-text)" : "var(--text-secondary)" }}
                >
                  <Icon size={16} aria-hidden="true" />
                  <span className="sm:hidden">{"short" in n ? n.short : n.label}</span>
                  <span className="hidden sm:inline">{n.label}</span>
                </Link>
              )
            })}
          </nav>
          {session ? (
            <Link href="/dashboard" className="shrink-0 text-sm underline" style={{ color: "var(--text-muted)" }}>
              Mi cuenta
            </Link>
          ) : (
            <Link href={buildLoginUrl(pathname)} className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold" style={{ background: "var(--accent)", color: "#fff" }}>
              Ingresar
            </Link>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">{children}</main>
    </div>
  )
}
