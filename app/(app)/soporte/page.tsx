"use client"

import Link from "next/link"
import { LifeBuoy, MessageSquare } from "lucide-react"
import PageHeader from "@/components/ui/PageHeader"
import Card from "@/components/ui/Card"
import EmptyState from "@/components/ui/EmptyState"
import ErrorState from "@/components/ui/ErrorState"
import LoadingBlock from "@/components/ui/LoadingBlock"
import SupportForm from "@/components/saas/SupportForm"
import { TicketStatusBadge } from "@/components/saas/StatusBadge"
import { fmtDate } from "@/lib/saas/format"
import { useMyTickets } from "@/lib/saas/hooks"
import { TICKET_CATEGORIES } from "@/lib/saas/support"

export default function SoportePage() {
  const { data: tickets, error, mutate } = useMyTickets()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Ayuda y soporte" subtitle="Escríbenos y te respondemos en máximo 1 día hábil" />

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6 items-start">
        <Card>
          <div className="flex items-center gap-3 mb-5">
            <MessageSquare size={18} style={{ color: "var(--accent)" }} aria-hidden="true" />
            <p className="text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>NUEVA SOLICITUD</p>
          </div>
          <SupportForm variant="app" />
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <div className="flex items-center gap-3 mb-3">
              <LifeBuoy size={18} style={{ color: "var(--accent)" }} aria-hidden="true" />
              <p className="text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>AUTOAYUDA</p>
            </div>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Muchas dudas tienen respuesta inmediata en el{" "}
              <Link href="/ayuda" className="underline" style={{ color: "var(--accent)" }}>centro de ayuda</Link>.
            </p>
          </Card>

          <section aria-labelledby="mis-solicitudes" className="flex flex-col gap-3">
            <h2 id="mis-solicitudes" className="text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>
              MIS SOLICITUDES
            </h2>
            {error ? (
              <ErrorState title="No pudimos cargar tus solicitudes" onRetry={() => mutate()} />
            ) : !tickets ? (
              <LoadingBlock className="py-8" />
            ) : tickets.length === 0 ? (
              <EmptyState title="Aún no has enviado solicitudes" description="Cuando escribas a soporte, el seguimiento aparecerá aquí." />
            ) : (
              <ul className="flex flex-col gap-2">
                {tickets.map((t) => (
                  <li key={t.id} className="flex flex-col gap-1 p-4 rounded-xl" style={{ background: "var(--bg-surface)", boxShadow: "var(--shadow-sm)" }}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{t.number}</span>
                      <TicketStatusBadge status={t.status} />
                    </div>
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{t.subject}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {TICKET_CATEGORIES.find((c) => c.id === t.category)?.label} · {fmtDate(t.createdAt, "short")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
