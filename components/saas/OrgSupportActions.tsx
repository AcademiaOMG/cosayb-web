"use client"

import { useState } from "react"
import { CalendarPlus, HandCoins } from "lucide-react"
import { useConfirm } from "@/components/ui/ConfirmDialog"
import { saas, saasErrorMessage } from "@/lib/saas/services"
import type { OrgSupportAction, PlanId } from "@/lib/saas/types"
import { toast } from "@/lib/toast"

/** Acciones de soporte de facturación sobre una organización (consola de plataforma). */
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
  const [days, setDays] = useState("7")
  const [busy, setBusy] = useState<string | null>(null)

  async function run(key: string, action: OrgSupportAction, ok: string) {
    setBusy(key)
    try {
      await saas.platform.orgAction(orgId, action, { name, plan })
      toast.success(ok)
      onDone?.()
    } catch (err) {
      toast.error("No se pudo completar la acción", { description: saasErrorMessage(err) })
    } finally {
      setBusy(null)
    }
  }

  async function extend() {
    const n = Number(days)
    if (!Number.isInteger(n) || n < 1 || n > 90) {
      toast.warning("Indica entre 1 y 90 días.")
      return
    }
    const okc = await confirm({
      title: "Extender prueba",
      itemName: name,
      description: `Se añadirán ${n} días a la prueba de esta organización. Queda registrado en auditoría.`,
      confirmLabel: "Extender",
      variant: "default",
    })
    if (okc) await run("extend", { type: "extend_trial", days: n }, `Prueba extendida ${n} días`)
  }

  async function markPaid() {
    const okc = await confirm({
      title: "Marcar pago como recibido",
      itemName: name,
      description: "Regulariza la suscripción con pago pendiente (por ejemplo, tras un pago manual).",
      confirmLabel: "Marcar pagado",
      variant: "default",
    })
    if (okc) await run("paid", { type: "mark_paid" }, "Pago registrado")
  }

  return (
    <div className="console-card flex flex-col gap-4">
      <p className="text-[11px] font-bold tracking-widest console-muted">ACCIONES DE SOPORTE</p>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs console-muted">
          Días de prueba a añadir
          <input
            type="number"
            min={1}
            max={90}
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="console-input text-sm"
            style={{ height: 38, width: 120, paddingInline: 10 }}
          />
        </label>
        <button
          type="button"
          onClick={extend}
          disabled={busy !== null}
          className="inline-flex items-center gap-2 rounded-xl px-3 text-sm font-medium disabled:opacity-50"
          style={{ height: 38, background: "var(--accent-light)", color: "var(--accent)" }}
        >
          <CalendarPlus size={14} aria-hidden="true" /> Extender prueba
        </button>
        <button
          type="button"
          onClick={markPaid}
          disabled={busy !== null}
          className="inline-flex items-center gap-2 rounded-xl px-3 text-sm font-medium disabled:opacity-50"
          style={{ height: 38, background: "var(--bg-secondary)", color: "var(--text-primary)" }}
        >
          <HandCoins size={14} aria-hidden="true" /> Marcar pago recibido
        </button>
      </div>
      <p className="text-xs console-muted">
        Para cambiar el plan o suspender usa los controles de esta página. Todas las acciones quedan en la auditoría.
      </p>
    </div>
  )
}
