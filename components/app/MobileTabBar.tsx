"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { MoreHorizontal, X } from "lucide-react"
import { useNavItems } from "@/hooks/useNavItems"
import {
  ACCOUNT_ITEM,
  CONFIG_ITEM,
  MOBILE_PRIMARY_HREFS,
  isNavActive,
  type NavItem,
} from "@/lib/navigation"

// Navegación principal en móvil (< lg): barra inferior fija con las 4
// secciones más usadas + «Más», que abre una hoja con el resto (módulos
// restantes, Configuración y Mi cuenta). Los ítems salen de lib/navigation.ts
// (misma fuente que Sidebar) y respetan permisos y módulos bloqueados.
// El botón «¿Cómo funciona?» NO vive aquí: lo renderiza cada página en su
// encabezado (ver PageHeader).

export const MOBILE_BAR_HEIGHT = 64 // px, sin safe-area

interface LinkEntry {
  href: string
  label: string
  shortLabel: string
  icon: NavItem["icon"]
}

export default function MobileTabBar() {
  const pathname = usePathname()
  const { groups, showConfig } = useNavItems()
  // La hoja guarda la ruta en la que se abrió: al navegar queda cerrada sin efectos
  const [openedAt, setOpenedAt] = useState<string | null>(null)
  const moreOpen = openedAt === pathname
  const moreBtnRef = useRef<HTMLButtonElement>(null)

  const { primary, more } = useMemo(() => {
    const all: LinkEntry[] = groups
      .flatMap((g) => g.items)
      .map((i) => ({ href: i.href, label: i.label, shortLabel: i.shortLabel ?? i.label, icon: i.icon }))
    const primary = MOBILE_PRIMARY_HREFS.map((h) => all.find((i) => i.href === h)).filter(
      (i): i is LinkEntry => !!i,
    )
    const rest = all.filter((i) => !primary.includes(i))
    const extras: LinkEntry[] = [...(showConfig ? [CONFIG_ITEM] : []), ACCOUNT_ITEM].map((i) => ({
      href: i.href,
      label: i.label,
      shortLabel: i.shortLabel,
      icon: i.icon,
    }))
    return { primary, more: [...rest, ...extras] }
  }, [groups, showConfig])

  const moreActive = more.some((i) => isNavActive(pathname, i.href))

  const closeMore = useCallback(() => {
    setOpenedAt(null)
    moreBtnRef.current?.focus()
  }, [])

  return (
    <>
      <nav
        className="glass-strong fixed bottom-0 left-0 right-0 z-30 lg:hidden"
        style={{
          paddingBottom: "env(safe-area-inset-bottom)",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        }}
        aria-label="Navegación principal"
      >
        <ul className="flex items-stretch justify-around px-1" style={{ height: MOBILE_BAR_HEIGHT }}>
          {primary.map((item) => (
            <li key={item.href} className="flex-1 min-w-0">
              <TabLink item={item} active={isNavActive(pathname, item.href)} />
            </li>
          ))}
          <li className="flex-1 min-w-0">
            <button
              ref={moreBtnRef}
              type="button"
              onClick={() => setOpenedAt(moreOpen ? null : pathname)}
              aria-haspopup="dialog"
              aria-expanded={moreOpen}
              aria-controls="mobile-more-sheet"
              className="mtb-item"
              data-active={moreActive || moreOpen ? "true" : undefined}
            >
              <MoreHorizontal size={22} aria-hidden="true" />
              <span className="mtb-label">Más</span>
            </button>
          </li>
        </ul>
      </nav>

      {moreOpen && <MoreSheet items={more} pathname={pathname} onClose={closeMore} />}

      <style>{`
        .mtb-item {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 2px; width: 100%; height: 100%; min-height: 48px; min-width: 44px;
          border: none; background: transparent; cursor: pointer;
          color: var(--text-secondary); border-radius: 14px;
          transition: color 150ms, background-color 150ms;
        }
        .mtb-item[data-active="true"] { color: var(--accent); font-weight: 700; }
        .mtb-item:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
        .mtb-label { font-size: 10.5px; line-height: 1.1; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 0 2px; }
        .mtb-sheet-panel { animation: mtb-up 200ms ease-out; }
        .mtb-sheet-backdrop { animation: mtb-fade 200ms ease-out; }
        @keyframes mtb-up { from { transform: translateY(24px); opacity: 0 } to { transform: none; opacity: 1 } }
        @keyframes mtb-fade { from { opacity: 0 } to { opacity: 1 } }
        @media (prefers-reduced-motion: reduce) {
          .mtb-item { transition: none; }
          .mtb-sheet-panel, .mtb-sheet-backdrop { animation: none; }
        }
      `}</style>
    </>
  )
}

function TabLink({ item, active }: { item: LinkEntry; active: boolean }) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      aria-label={item.label}
      className="mtb-item"
      data-active={active ? "true" : undefined}
    >
      <Icon size={22} aria-hidden="true" />
      <span className="mtb-label" aria-hidden="true">{item.shortLabel}</span>
    </Link>
  )
}

function MoreSheet({ items, pathname, onClose }: { items: LinkEntry[]; pathname: string; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const panel = panelRef.current
    panel?.querySelector<HTMLElement>("a, button")?.focus()

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== "Tab" || !panel) return
      const focusables = panel.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener("keydown", onKey)
    // Bloquea el scroll del fondo (<main> es el contenedor que se desplaza) mientras la hoja está abierta
    const mainEl = document.querySelector<HTMLElement>("main")
    const prevOverflowY = mainEl?.style.overflowY ?? ""
    if (mainEl) mainEl.style.overflowY = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      if (mainEl) mainEl.style.overflowY = prevOverflowY
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <div
        className="mtb-sheet-backdrop absolute inset-0"
        style={{ background: "rgba(18,33,58,0.45)" }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        id="mobile-more-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Más secciones"
        className="mtb-sheet-panel absolute left-0 right-0 bottom-0 overflow-y-auto overscroll-contain"
        style={{
          background: "var(--bg-surface)",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          maxHeight: "80dvh",
          paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h2 className="font-display text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            Más secciones
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="inline-flex items-center justify-center rounded-full"
            style={{ width: 44, height: 44, color: "var(--text-secondary)", background: "transparent", border: "none", cursor: "pointer" }}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <ul className="flex flex-col gap-1 px-3">
          {items.map((item) => {
            const Icon = item.icon
            const active = isNavActive(pathname, item.href)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 rounded-xl text-sm font-medium"
                  style={{
                    minHeight: 48,
                    background: active ? "var(--accent)" : "transparent",
                    color: active ? "#fff" : "var(--text-primary)",
                  }}
                >
                  <Icon size={20} aria-hidden="true" />
                  <span className="min-w-0 truncate">{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
