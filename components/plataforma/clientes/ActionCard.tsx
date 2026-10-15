"use client"

import { useState } from "react"
import Button from "@/components/ui/Button"
import { useConfirm } from "@/components/ui/ConfirmDialog"
import { friendlyError } from "@/lib/errorMessage"
import { toast } from "@/lib/toast"

export const MIN_REASON = 5

/**
 * Acción sensible con motivo obligatorio y confirmación. El motivo queda en la auditoría.
 * `children` permite añadir campos propios de la acción (por ejemplo, los días).
 */
export default function ActionCard({
  title, description, confirmTitle, confirmText, confirmLabel, danger, disabled, successMessage, onRun, children,
}: {
  title: string
  description: string
  confirmTitle: string
  confirmText: string
  confirmLabel: string
  danger?: boolean
  /** Bloquea el botón (por ejemplo, si falta un campo propio) */
  disabled?: boolean
  successMessage: string
  onRun: (reason: string) => Promise<unknown>
  children?: React.ReactNode
}) {
  const confirm = useConfirm()
  const [reason, setReason] = useState("")
  const [busy, setBusy] = useState(false)
  const valid = reason.trim().length >= MIN_REASON && !disabled

  async function run() {
    if (!valid) return
    const ok = await confirm({ title: confirmTitle, description: confirmText, confirmLabel, variant: danger ? "danger" : "default" })
    if (!ok) return
    setBusy(true)
    try {
      await onRun(reason.trim())
      toast.success(successMessage)
      setReason("")
    } catch (e) {
      toast.error("No se pudo completar la acción", { description: friendlyError(e, "Inténtalo de nuevo.") })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="console-card flex flex-col gap-3">
      <div>
        <p className="text-sm font-semibold console-title">{title}</p>
        <p className="text-xs console-muted mt-0.5">{description}</p>
      </div>
      {children}
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs console-muted flex-1 min-w-[220px]">
          Motivo (queda registrado en la auditoría)
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Escribe por qué haces este cambio"
            className="console-input text-sm"
            style={{ height: 38, paddingInline: 10 }}
          />
        </label>
        <Button variant={danger ? "danger" : "primary"} size="md" disabled={!valid} loading={busy} onClick={run}>
          {confirmLabel}
        </Button>
      </div>
    </div>
  )
}
