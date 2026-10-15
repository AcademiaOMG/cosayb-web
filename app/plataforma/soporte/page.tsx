"use client"

import { useState } from "react"
import useSWR from "swr"
import ErrorState from "@/components/ui/ErrorState"
import { TicketStatusBadge } from "@/components/saas/StatusBadge"
import { fmtDate } from "@/lib/saas/format"
import { saas, saasErrorMessage } from "@/lib/saas/services"
import { TICKET_CATEGORIES } from "@/lib/saas/support"
import type { TicketStatus } from "@/lib/saas/types"
import { toast } from "@/lib/toast"

const FILTERS: { id: TicketStatus | "all"; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "open", label: "Abiertos" },
  { id: "pending", label: "En curso" },
  { id: "closed", label: "Cerrados" },
]

export default function SoportePlataformaPage() {
  const [status, setStatus] = useState<TicketStatus | "all">("open")
  const { data, error, isLoading, mutate } = useSWR(["platform-tickets", status], () => saas.platform.tickets(status), {
    revalidateOnFocus: false,
  })

  async function change(id: string, next: TicketStatus) {
    try {
      await saas.platform.setTicketStatus(id, next)
      await mutate()
      toast.success("Ticket actualizado")
    } catch (err) {
      toast.error("No se pudo actualizar", { description: saasErrorMessage(err) })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold console-title">Soporte</h1>
        <p className="text-sm console-muted mt-1">Solicitudes de clientes y visitantes</p>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={status === f.id}
            onClick={() => setStatus(f.id)}
            className="rounded-full px-4 py-1.5 text-sm font-medium"
            style={{
              background: status === f.id ? "var(--accent)" : "var(--bg-surface)",
              color: status === f.id ? "#fff" : "var(--text-secondary)",
              border: "1px solid var(--border-light)",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error ? (
        <ErrorState title="No pudimos cargar los tickets" onRetry={() => mutate()} />
      ) : isLoading && !data ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => <div key={i} className="animate-pulse console-row" style={{ height: 90 }} />)}
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {(data ?? []).map((t) => (
            <li key={t.id} className="console-card flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-medium console-muted">
                  {t.number} · {TICKET_CATEGORIES.find((c) => c.id === t.category)?.label} · {fmtDate(t.createdAt, "short")}
                </p>
                <TicketStatusBadge status={t.status} />
              </div>
              <p className="text-sm font-semibold console-title">{t.subject}</p>
              <p className="text-sm console-muted">{t.message}</p>
              <p className="text-xs console-muted">
                {t.name} · <a className="console-accent underline" href={`mailto:${t.email}?subject=${encodeURIComponent(`Re: ${t.subject} (${t.number})`)}`}>{t.email}</a>
                {t.organizationName ? ` · ${t.organizationName}` : ""}
              </p>
              <div className="flex gap-2 pt-1">
                {t.status !== "pending" && t.status !== "closed" && (
                  <button type="button" onClick={() => change(t.id, "pending")} className="text-xs font-medium underline console-accent">Marcar en curso</button>
                )}
                {t.status !== "closed" ? (
                  <button type="button" onClick={() => change(t.id, "closed")} className="text-xs font-medium underline console-accent">Cerrar</button>
                ) : (
                  <button type="button" onClick={() => change(t.id, "open")} className="text-xs font-medium underline console-accent">Reabrir</button>
                )}
              </div>
            </li>
          ))}
          {data && data.length === 0 && <p className="text-sm text-center py-10 console-muted">No hay tickets en esta vista.</p>}
        </ul>
      )}
    </div>
  )
}
