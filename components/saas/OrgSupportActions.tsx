"use client"

import { useState } from "react"
import useSWR, { mutate as globalMutate } from "swr"
import { Gift } from "lucide-react"
import { useConfirm } from "@/components/ui/ConfirmDialog"
import ErrorState from "@/components/ui/ErrorState"
import { InvoiceStatusBadge, PaymentStatusBadge, SubscriptionStatusBadge } from "@/components/saas/StatusBadge"
import { planLabel } from "@/lib/saas/billing"
import { fmtDate, formatCOP } from "@/lib/saas/format"
import { saas, saasErrorMessage } from "@/lib/saas/services"
import type { PlanId } from "@/lib/saas/types"
import { toast } from "@/lib/toast"

const PLANS: PlanId[] = ["free", "pro", "academia"]

/**
 * Cambio de plan por soporte (cortesía): fija el plan sin cobro y deja justificación
 * en la auditoría. El API exige una justificación de al menos 5 caracteres.
 */
export default function OrgSupportActions({
  orgId,
  name,
  plan,
  onDone,
}: {
  orgId: string
  name: string
  plan: PlanId
  onDone?: () => void
}) {
  const confirm = useConfirm()
  const [target, setTarget] = useState<PlanId>(plan === "free" ? "pro" : "free")
  const [justification, setJustification] = useState("")
  const [busy, setBusy] = useState(false)
  const valid = justification.trim().length >= 5 && target !== plan

  async function apply() {
    if (!valid) return
    const ok = await confirm({
      title: "Cambiar plan por soporte",
      itemName: name,
      description: `Pasará de ${planLabel(plan)} a ${planLabel(target)} sin cobro. Queda registrado en auditoría con tu justificación.`,
      confirmLabel: "Cambiar plan",
      variant: "default",
    })
    if (!ok) return
    setBusy(true)
    try {
      await saas.platform.setOrgPlan(orgId, { plan: target, justification: justification.trim() }, { name, plan })
      toast.success(`Plan cambiado a ${planLabel(target)}`)
      setJustification("")
      await globalMutate(["platform-org-billing", orgId])
      onDone?.()
    } catch (err) {
      toast.error("No se pudo cambiar el plan", { description: saasErrorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="console-card flex flex-col gap-4">
      <p className="text-[11px] font-bold tracking-widest console-muted">ACCIONES DE SOPORTE</p>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs console-muted">
          Nuevo plan
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value as PlanId)}
            className="console-input text-sm"
            style={{ height: 38, paddingInline: 10 }}
          >
            {PLANS.filter((p) => p !== plan).map((p) => (
              <option key={p} value={p}>{planLabel(p)}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs console-muted flex-1 min-w-[220px]">
          Justificación (mínimo 5 caracteres)
          <input
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Ej.: cortesía por falla en el cobro"
            className="console-input text-sm"
            style={{ height: 38, paddingInline: 10 }}
          />
        </label>
        <button
          type="button"
          onClick={apply}
          disabled={!valid || busy}
          className="inline-flex items-center gap-2 rounded-xl px-3 text-sm font-medium disabled:opacity-50"
          style={{ height: 38, background: "var(--accent-light)", color: "var(--accent)" }}
        >
          <Gift size={14} aria-hidden="true" /> Cambiar plan
        </button>
      </div>
      <p className="text-xs console-muted">
        Cierra la suscripción viva y fija el plan; notifica al propietario. Para suspender la organización usa el control de esta página.
      </p>
    </div>
  )
}

/** Suscripciones, facturas y pagos de la organización (consola de plataforma). */
export function OrgBillingCard({ orgId }: { orgId: string }) {
  const { data, error, mutate } = useSWR(["platform-org-billing", orgId], () => saas.platform.orgBilling(orgId), {
    revalidateOnFocus: false,
  })

  return (
    <div className="console-card flex flex-col gap-4">
      <p className="text-[11px] font-bold tracking-widest console-muted">FACTURACIÓN</p>
      {error ? (
        <ErrorState title="No pudimos cargar la facturación" onRetry={() => mutate()} />
      ) : !data ? (
        <div className="h-16 animate-pulse rounded-xl" style={{ background: "var(--bg-secondary)" }} />
      ) : (
        <>
          <Block title="Suscripciones" empty="Sin suscripciones de pago.">
            {data.subscriptions.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="console-title">{planLabel(s.plan)} · {formatCOP(s.amount)}</span>
                <span className="flex items-center gap-2">
                  <span className="text-xs console-muted">
                    {s.currentPeriodEnd ? `${s.cancelAtPeriodEnd ? "termina" : "renueva"} ${fmtDate(s.currentPeriodEnd, "short")}` : ""}
                  </span>
                  <SubscriptionStatusBadge status={s.status} />
                </span>
              </li>
            ))}
          </Block>
          <Block title="Facturas" empty="Sin facturas.">
            {data.invoices.slice(0, 5).map((i) => (
              <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="console-title">{i.number} · {formatCOP(i.total)}</span>
                <span className="flex items-center gap-2">
                  <span className="text-xs console-muted">{fmtDate(i.issuedAt, "short")}</span>
                  <InvoiceStatusBadge status={i.status} />
                </span>
              </li>
            ))}
          </Block>
          <Block title="Pagos" empty="Sin pagos.">
            {data.payments.slice(0, 5).map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="console-title">{p.invoiceNumber} · {formatCOP(p.amount)}</span>
                <span className="flex items-center gap-2">
                  <span className="text-xs console-muted">{fmtDate(p.createdAt, "short")}</span>
                  <PaymentStatusBadge status={p.status} />
                </span>
              </li>
            ))}
          </Block>
        </>
      )}
    </div>
  )
}

function Block({ title, empty, children }: { title: string; empty: string; children: React.ReactNode[] }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold console-muted">{title}</p>
      {children.length === 0 ? <p className="text-sm console-muted">{empty}</p> : <ul className="flex flex-col gap-2">{children}</ul>}
    </div>
  )
}
