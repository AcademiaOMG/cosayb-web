"use client"

import { useState } from "react"
import useSWR from "swr"
import Modal from "@/components/ui/Modal"
import Button from "@/components/ui/Button"
import LoadingBlock from "@/components/ui/LoadingBlock"
import { planLabel } from "@/lib/saas/billing"
import { fmtDate, formatCOP } from "@/lib/saas/format"
import { refreshBilling } from "@/lib/saas/hooks"
import { saas, saasErrorMessage } from "@/lib/saas/services"
import type { PlanId } from "@/lib/saas/types"
import { SaasError } from "@/lib/saas/types"
import { toast } from "@/lib/toast"

/** Confirmación de upgrade/downgrade con el resumen de cobro y fecha efectiva. */
export default function PlanChangeModal({
  target,
  onClose,
  onNeedPaymentMethod,
}: {
  target: PlanId | null
  onClose: () => void
  onNeedPaymentMethod: () => void
}) {
  const [saving, setSaving] = useState(false)
  const { data: preview, error } = useSWR(
    target ? ["saas/preview", target] : null,
    ([, plan]) => saas.billing.preview(plan as PlanId),
    { revalidateOnFocus: false, shouldRetryOnError: false },
  )
  const loadError = error ? saasErrorMessage(error) : null

  async function confirm() {
    if (!target || !preview) return
    if (preview.requiresPaymentMethod) {
      onClose()
      onNeedPaymentMethod()
      return
    }
    setSaving(true)
    try {
      await saas.billing.changePlan(target)
      await refreshBilling()
      toast.success(preview.immediate ? `Ahora tienes el plan ${planLabel(target)}` : "Cambio programado", {
        description: preview.immediate ? undefined : `Se aplicará el ${fmtDate(preview.effectiveAt)}.`,
      })
      onClose()
    } catch (err) {
      if (err instanceof SaasError && err.code === "NO_PAYMENT_METHOD") {
        onClose()
        onNeedPaymentMethod()
        return
      }
      toast.error("No se pudo cambiar el plan", { description: saasErrorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  const title = target ? `Cambiar al plan ${planLabel(target)}` : "Cambiar de plan"

  return (
    <Modal
      open={!!target}
      onClose={onClose}
      title={title}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={confirm} loading={saving} disabled={!preview}>
            {preview?.requiresPaymentMethod ? "Agregar método de pago" : preview?.immediate ? "Confirmar y pagar" : "Programar cambio"}
          </Button>
        </div>
      }
    >
      {loadError ? (
        <p role="alert" className="text-sm" style={{ color: "var(--error)" }}>{loadError}</p>
      ) : !preview ? (
        <LoadingBlock label="Calculando…" className="py-8" />
      ) : (
        <div className="flex flex-col gap-4">
          <dl className="flex flex-col gap-2 text-sm">
            <Row k="Plan actual" v={planLabel(preview.from)} />
            <Row k="Plan nuevo" v={`${planLabel(preview.to)} · ${formatCOP(preview.newMonthly)}/mes`} />
            <Row k={preview.immediate ? "Se cobra hoy" : "Cobro hoy"} v={formatCOP(preview.chargeNow)} strong />
            <Row k="Aplica" v={preview.immediate ? "De inmediato" : fmtDate(preview.effectiveAt)} />
          </dl>
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
            {preview.kind === "upgrade"
              ? "Pagas el valor completo del nuevo plan y tu periodo de 30 días empieza hoy."
              : "Conservas tu plan actual hasta el final del periodo ya pagado. No hay cobro adicional."}{" "}
            Pago simulado: no se realiza ningún cobro real.
          </p>
        </div>
      )}
    </Modal>
  )
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt style={{ color: "var(--text-muted)" }}>{k}</dt>
      <dd className={strong ? "font-bold" : "font-medium"} style={{ color: "var(--text-primary)" }}>{v}</dd>
    </div>
  )
}
