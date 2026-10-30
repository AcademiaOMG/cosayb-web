"use client"

import { Suspense } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ADMIN_NAV, isNavActive } from "@/lib/lms/roles"

/** Secciones en móvil/tablet (en escritorio las muestra el menú lateral del área). */
export default function AdministracionLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div className="flex flex-col gap-5">
      <nav className="l-no-print -mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:hidden" aria-label="Secciones de administración">
        {ADMIN_NAV.map((n) => {
          const on = isNavActive(pathname, n.href)
          return (
            <Link key={n.href} href={n.href} aria-current={on ? "page" : undefined} className="shrink-0 rounded-full px-4 py-2 text-sm font-extrabold transition-colors" style={{ background: on ? "var(--l-brand)" : "var(--l-tint-bg)", color: on ? "#fff" : "var(--l-tint-ink)" }}>
              {n.label}
            </Link>
          )
        })}
      </nav>
      <Suspense fallback={null}>{children}</Suspense>
    </div>
  )
}
