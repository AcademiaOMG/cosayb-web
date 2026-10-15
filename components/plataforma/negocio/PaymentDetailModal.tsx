"use client"

import Link from "next/link"
import useSWR from "swr"
import Badge from "@/components/ui/Badge"
import ErrorState from "@/components/ui/ErrorState"
import LoadingBlock from "@/components/ui/LoadingBlock"
import Modal from "@/components/ui/Modal"
import { Field } from "./ListControls"
import { PAYMENT_STATUS_ES, failureReasonLabel, methodWithCard, negocioApi, paymentKindLabel, subscriptionStatus } from "@/lib/plataforma/negocio"
import { STATUS_LABELS, planLabel } from "@/lib/saas/billing"
import { fmtDate, formatCOP } from "@/lib/saas/format"
import type { PlanId } from "@/lib/saas/types"

export default function PaymentDetailModal({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { data, error, isLoading, mutate } = useSWR(id ? ["negocio-pago", id] : null, () => negocioApi.pago(id!), { revalidateOnFocus: false })
  const p = data?.payment
  const st = p ? (PAYMENT_STATUS_ES[p.status] ?? { label: p.status, tone: "muted" as const }) : null
  return (
    <Modal open={!!id} onClose={onClose} title="Detalle del pago" wide>
      {error ? (
        <ErrorState title="No pudimos abrir el pago" onRetry={() => mutate()} />
      ) : isLoading || !data || !p || !st ? (
        <LoadingBlock label="Cargando el pago…" />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <Badge variant={st.tone}>{st.label}</Badge>
            <span className="text-lg font-bold console-title">{formatCOP(p.amount)}</span>
          </div>

          {p.status === "FAILED" && (
            <div role="note" className="rounded-xl p-3 text-sm" style={{ background: "#FEF3C7", color: "#92400E" }}>
              <p className="font-semibold">Motivo del rechazo</p>
              <p>{failureReasonLabel(p.failureReason)}</p>
              <p className="text-xs mt-1">
                Ayuda al cliente a pagar con otra tarjeta o método desde su sección de facturación. El sistema reintenta automáticamente el cobro.
              </p>
            </div>
          )}

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Negocio">
              {data.organization ? (
                <Link href={`/plataforma/organizaciones/${data.organization.id}`} className="console-accent underline">{data.organization.name}</Link>
              ) : (
                "Negocio eliminado"
              )}
            </Field>
            <Field label="Cliente">{data.subscription ? `${data.subscription.userName} · ${data.subscription.userEmail}` : "—"}</Field>
            <Field label="Concepto">{paymentKindLabel(p.kind)}{p.attempt > 1 ? ` · intento ${p.attempt}` : ""}</Field>
            <Field label="Método de pago">{methodWithCard(p.method, p.cardLast4)}</Field>
            <Field label="Fecha">{fmtDate(p.createdAt)}</Field>
            {data.subscription && (
              <Field label="Suscripción">
                <Link href={`/plataforma/suscripciones?abrir=${data.subscription.id}`} className="console-accent underline">
                  Plan {planLabel(data.subscription.plan as PlanId)} · {STATUS_LABELS[subscriptionStatus(data.subscription.status)]}
                </Link>
              </Field>
            )}
          </dl>

          <section aria-labelledby="pago-recibo" className="flex flex-col gap-2">
            <h3 id="pago-recibo" className="text-sm font-bold console-title">Recibo</h3>
            {data.invoice ? (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Número">{data.invoice.invoiceNo}{data.invoice.status === "VOID" ? " (anulado)" : ""}</Field>
                <Field label="Emitido">{fmtDate(data.invoice.issuedAt)}</Field>
                <Field label="Descripción">{data.invoice.description}</Field>
                <Field label="Periodo cubierto">{fmtDate(data.invoice.periodStart, "short")} – {fmtDate(data.invoice.periodEnd, "short")}</Field>
                <Field label="Subtotal">{formatCOP(data.invoice.subtotal)}</Field>
                <Field label="Impuestos">{formatCOP(data.invoice.tax)}</Field>
                <Field label="Total">{formatCOP(data.invoice.total)}</Field>
              </dl>
            ) : (
              <p className="text-sm console-muted">
                {p.status === "APPROVED" ? "Este pago no tiene recibo asociado." : "Solo los pagos aprobados generan recibo."}
              </p>
            )}
          </section>
        </div>
      )}
    </Modal>
  )
}
