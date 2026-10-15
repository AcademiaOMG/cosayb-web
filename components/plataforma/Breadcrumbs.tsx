"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { breadcrumbsFor } from "@/lib/plataforma/nav"

/** Migas de pan de la ruta actual. En móvil solo se muestra la última (la página actual). */
export default function Breadcrumbs() {
  const crumbs = breadcrumbsFor(usePathname())
  return (
    <nav aria-label="Ruta de navegación" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1.5 text-sm">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1
          return (
            <li key={`${c.label}-${i}`} className={`flex min-w-0 items-center gap-1.5 ${last ? "" : "hidden sm:flex"}`}>
              {c.href && !last ? (
                <Link href={c.href} className="plat-link truncate rounded" style={{ color: "var(--text-muted)" }}>
                  {c.label}
                </Link>
              ) : (
                <span
                  className={`truncate ${last ? "font-display text-lg font-bold" : ""}`}
                  style={{ color: last ? "var(--text-primary)" : "var(--text-muted)" }}
                  aria-current={last ? "page" : undefined}
                >
                  {c.label}
                </span>
              )}
              {!last && <ChevronRight size={14} aria-hidden="true" className="shrink-0" style={{ color: "var(--text-muted)" }} />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
