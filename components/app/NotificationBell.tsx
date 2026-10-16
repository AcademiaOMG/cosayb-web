"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { Bell } from "lucide-react"
import { timeAgoEs } from "@/lib/saas/format"
import { markNotificationsRead, useNotifications } from "@/lib/saas/hooks"
import { toast } from "@/lib/toast"

/** Campana de notificaciones in-app con las últimas 6 y acceso a la bandeja completa. */
export default function NotificationBell() {
  const { data } = useNotifications()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  const unread = data?.filter((n) => !n.readAt).length ?? 0
  const latest = (data ?? []).slice(0, 6)

  async function markAll() {
    try {
      await markNotificationsRead()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudieron marcar como leídas.")
    }
  }

  async function openItem(id: string, readAt: string | null) {
    setOpen(false)
    if (readAt) return
    try {
      await markNotificationsRead(id)
    } catch {
      /* no bloquea la navegación; la lista se restaura sola */
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={unread ? `Notificaciones, ${unread} sin leer` : "Notificaciones"}
        className="relative inline-flex items-center justify-center w-9 h-9 rounded-xl transition-colors"
        style={{ border: "1px solid var(--border-light)", background: "var(--bg-surface)", color: "var(--text-muted)" }}
      >
        <Bell size={18} aria-hidden="true" />
        {unread > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
            style={{ background: "var(--error)" }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notificaciones"
          className="absolute right-0 top-[calc(100%+6px)] z-50 w-80 overflow-hidden"
          style={{ background: "var(--bg-surface)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)" }}
        >
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border-light)" }}>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Notificaciones</p>
            {unread > 0 && (
              <button type="button" onClick={markAll} className="text-xs underline" style={{ color: "var(--accent)" }}>
                Marcar todas como leídas
              </button>
            )}
          </div>
          {latest.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>No tienes notificaciones.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {latest.map((n) => (
                <li key={n.id}>
                  <Link
                    href={n.href ?? "/notificaciones"}
                    onClick={() => openItem(n.id, n.readAt)}
                    className="flex gap-3 px-4 py-3 hover:bg-[var(--bg-primary)]"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                      style={{ background: n.readAt ? "transparent" : "var(--accent)" }}
                    />
                    <span className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{n.title}</span>
                      <span className="text-xs line-clamp-2" style={{ color: "var(--text-muted)" }}>{n.body}</span>
                      <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{timeAgoEs(n.createdAt)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/notificaciones"
            onClick={() => setOpen(false)}
            className="block px-4 py-3 text-center text-sm font-medium"
            style={{ borderTop: "1px solid var(--border-light)", color: "var(--accent)" }}
          >
            Ver todas
          </Link>
        </div>
      )}
    </div>
  )
}
