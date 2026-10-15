"use client"

import Link from "next/link"
import useSWR from "swr"
import Badge from "@/components/ui/Badge"
import ErrorState from "@/components/ui/ErrorState"
import LoadingBlock from "@/components/ui/LoadingBlock"
import Modal from "@/components/ui/Modal"
import { SubscriptionStatusBadge } from "@/components/saas/StatusBadge"
import { Field } from "./ListControls"
import {
  PAYMENT_STATUS_ES, failureReasonLabel, methodWithCard, negocioApi, paymentKindLabel, retryText, subscriptionStatus,
} from "@/lib/plataforma/negocio"
import { planLabel } from "@/lib/saas/billing"
import { fmtDate, formatCOP } from "@/lib/saas/format"
import type { PlanId } from "@/lib/saas/types"

export default function SubscriptionDetailModal({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { data, error, isLoading, mutate } = useSWR(id ? ["negocio-sub", id] : null, () => negocioApi.suscripcion(id!), { revalidateOnFocus: false })
  const s = data?.subscription
  return (
    <Modal open={!!id} onClose={onClose} title="Detalle de la suscripción" wide>
      {error ? (
        <ErrorState title="No pudimos abrir la suscripción" onRetry={() => mutate()} />
      ) : isLoading || !data || !s ? (
        <LoadingBlock label="Cargando la suscripción…" />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <SubscriptionStatusBadge status={subscriptionStatus(s.status)} />
            {s.cancelAtPeriodEnd && <Badge variant="warning">Se cancela al terminar el periodo</Badge>}
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Negocio">
              <Link href={`/plataforma/organizaciones/${data.organization.id}`} className="console-accent underline">{data.organization.name}</Link>
            </Field>
            <Field label="Cliente">{data.customer.name} · {data.customer.email}</Field>
            <Field label="Plan">{planLabel(s.plan as PlanId)}</Field>
            <Field label="Importe mensual">{formatCOP(s.amount)}</Field>
            <Field label="Método de pago">{methodWithCard(s.paymentMethod, s.cardLast4)}</Field>
            <Field label="Periodo actual">
              {fmtDate(s.currentPeriodStart, "short")} – {fmtDate(s.currentPeriodEnd, "short")}
            </Field>
            <Field label="Suscrita desde">{fmtDate(s.createdAt)}</Field>
            {s.cancelledAt && <Field label="Cancelada el">{fmtDate(s.cancelledAt)}</Field>}
            {s.status === "PAST_DUE" && <Field label="Cobro pendiente">{retryText(s.failedAttempts, s.nextRetryAt)}</Field>}
          </dl>

          <section aria-labelledby="sub-cobros" className="flex flex-col gap-2">
            <h3 id="sub-cobros" className="text-sm font-bold console-title">Historial de cobros e intentos</h3>
            {data.payments.length === 0 ? (
              <p className="text-sm console-muted">Todavía no hay cobros registrados.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {data.payments.map((p) => {
                  const st = PAYMENT_STATUS_ES[p.status] ?? { label: p.status, tone: "muted" as const }
                  return (
                    <li key={p.id} className="console-row px-3 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <div className="flex-1 min-w-[180px]">
                        <p className="text-sm font-medium console-title">
                          {paymentKindLabel(p.kind)}{p.attempt > 1 ? ` · intento ${p.attempt}` : ""}
                        </p>
                        <p className="text-xs console-muted">{fmtDate(p.createdAt, "short")} · {methodWithCard(p.method, p.cardLast4)}</p>
                        {p.status === "FAILED" && <p className="text-xs" style={{ color: "#B45309" }}>{failureReasonLabel(p.failureReason)}</p>}
                      </div>
                      <span className="text-sm font-medium console-title">{formatCOP(p.amount)}</span>
                      <Badge variant={st.tone}>{st.label}</Badge>
                      <Link href={`/plataforma/pagos?abrir=${p.id}`} className="text-xs console-accent underline">Ver pago</Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <section aria-labelledby="sub-recibos" className="flex flex-col gap-2">
            <h3 id="sub-recibos" className="text-sm font-bold console-title">Recibos emitidos</h3>
            {data.invoices.length === 0 ? (
              <p className="text-sm console-muted">Aún no se ha emitido ningún recibo.</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {data.invoices.map((i) => (
                  <li key={i.id} className="text-sm console-title">
                    Recibo {i.invoiceNo} · {formatCOP(i.total)} · {fmtDate(i.issuedAt, "short")}
                    {i.status === "VOID" && <span className="console-muted"> · anulado</span>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </Modal>
  )
}
