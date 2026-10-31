"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronDown, LogOut, Repeat } from "lucide-react"
import { authClient } from "@/lib/auth"
import { AREA_HOME, AREA_LABEL, areasFor, type Area } from "@/lib/lms/roles"
import type { LmsAccess } from "@/lib/lms/types"
import { Avatar } from "@/components/lms/ui"

/**
 * Menú de la persona: nombre, un único enlace discreto «Cambiar a área de …» por cada OTRA área que realmente tenga
 * (navega al área completa, no mezcla menús) y cerrar sesión.
 */
export default function UserMenu({ area, name, email, access }: { area: Area; name: string; email?: string; access: LmsAccess | undefined }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const others = areasFor(access).filter((a) => a !== area)

  useEffect(() => {
    if (!open) return
    const away = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false) }
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    document.addEventListener("mousedown", away)
    document.addEventListener("keydown", esc)
    return () => {
      document.removeEventListener("mousedown", away)
      document.removeEventListener("keydown", esc)
    }
  }, [open])

  return (
    <div ref={root} className="relative">
      <button type="button" className="flex items-center gap-2 rounded-2xl py-1 pl-1 pr-2 hover:bg-[var(--l-bg)]" aria-haspopup="menu" aria-expanded={open} aria-label={`Menú de ${name || "tu cuenta"}`} onClick={() => setOpen((o) => !o)}>
        <Avatar name={name || "U"} size={34} />
        <span className="hidden max-w-[150px] truncate text-sm font-bold sm:inline">{name}</span>
        <ChevronDown size={15} aria-hidden="true" className="hidden sm:block" style={{ color: "var(--l-muted)" }} />
      </button>
      {open && (
        <div role="menu" className="l-menu" style={{ minWidth: 240 }} onClick={() => setOpen(false)}>
          <div className="px-3 pb-2 pt-1">
            <p className="break-words text-sm font-extrabold">{name || "Tu cuenta"}</p>
            {email && <p className="break-all text-xs font-semibold" style={{ color: "var(--l-muted)" }}>{email}</p>}
            <p className="mt-1 text-[11px] font-extrabold uppercase tracking-wide" style={{ color: "var(--l-muted)" }}>Área de {AREA_LABEL[area].toLowerCase()}</p>
          </div>
          {others.map((a) => (
            <Link key={a} role="menuitem" href={AREA_HOME[a]}><Repeat size={15} aria-hidden="true" /> Cambiar a área de {AREA_LABEL[a].toLowerCase()}</Link>
          ))}
          <button type="button" role="menuitem" onClick={() => void authClient.signOut().then(() => router.push("/login"))}><LogOut size={15} aria-hidden="true" /> Cerrar sesión</button>
        </div>
      )}
    </div>
  )
}
