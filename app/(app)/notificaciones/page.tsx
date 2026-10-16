"use client"

import Link from "next/link"
import { useState } from "react"
import { Bell, CheckCheck, CreditCard, LifeBuoy, Settings, Users } from "lucide-react"
import PageHeader from "@/components/ui/PageHeader"
import Button from "@/components/ui/Button"
import EmptyState from "@/components/ui/EmptyState"
import ErrorState from "@/components/ui/ErrorState"
import LoadingBlock from "@/components/ui/LoadingBlock"
import { timeAgoEs } from "@/lib/saas/format"
import { markNotificationsRead, useNotifications } from "@/lib/saas/hooks"
import type { NotificationKind } from "@/lib/saas/types"
import { toast } from "@/lib/toast"

const ICONS: Record<NotificationKind, typeof Bell> = {
  billing: CreditCard,
  team: Users,
  system: Settings,
  support: LifeBuoy,
}

export default function NotificacionesPage() {
  const { data, error, mutate } = useNotifications()
  const [busy, setBusy] = useState(false)
  const unread = data?.filter((n) => !n.readAt).length ?? 0

  async function markAll() {
    setBusy(true)
    try {
      await markNotificationsRead()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudieron marcar como leídas.")
    } finally {
      setBusy(false)
    }
  }

  async function markOne(id: string) {
    try {
      await markNotificationsRead(id)
    } catch {
      /* no bloquea la navegación */
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <PageHeader
        title="Notificaciones"
        subtitle={unread ? `${unread} sin leer` : "Estás al día"}
        action={
          unread > 0 ? (
            <Button variant="ghost" size="sm" onClick={markAll} loading={busy}>
              <CheckCheck size={14} aria-hidden="true" /> Marcar todas
            </Button>
          ) : undefined
        }
      />

      {error ? (
        <ErrorState title="No pudimos cargar tus notificaciones" onRetry={() => mutate()} />
      ) : !data ? (
        <LoadingBlock />
      ) : data.length === 0 ? (
        <EmptyState
          icon={<Bell size={28} />}
          title="No tienes notificaciones"
          description="Aquí verás avisos de pagos, equipo y soporte."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {data.map((n) => {
            const Icon = ICONS[n.kind]
            const body = (
              <>
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: "var(--accent-light)", color: "var(--accent)" }}
                >
                  <Icon size={16} aria-hidden="true" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {n.title}
                    {!n.readAt && <span className="sr-only">(sin leer)</span>}
                    {!n.readAt && <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: "var(--accent)" }} />}
                  </span>
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{n.body}</span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{timeAgoEs(n.createdAt)}</span>
                </span>
              </>
            )
            const cls = "flex gap-3 p-4 rounded-xl"
            const style = { background: "var(--bg-surface)", boxShadow: "var(--shadow-sm)", opacity: n.readAt ? 0.8 : 1 }
            return (
              <li key={n.id}>
                {n.href ? (
                  <Link href={n.href} onClick={() => markOne(n.id)} className={cls} style={style}>{body}</Link>
                ) : (
                  <button type="button" onClick={() => markOne(n.id)} className={`${cls} w-full text-left`} style={style}>{body}</button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
