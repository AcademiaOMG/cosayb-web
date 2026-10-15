"use client"

import { useId, useState, useSyncExternalStore } from "react"
import Modal from "./Modal"
import Button from "./Button"
import {
  confirmDialog,
  settleConfirm,
  subscribeConfirm,
  getActiveConfirm,
  type ConfirmOptions,
  type ConfirmRequest,
} from "@/lib/confirm"

export type { ConfirmOptions }

/**
 * Confirmación promesa-based. Solo para acciones destructivas o sensibles
 * (eliminar, descartar cambios, cerrar sesión si corresponde), nunca para
 * confirmar un guardado.
 *
 *   const confirm = useConfirm()
 *   const ok = await confirm({ title: "Eliminar receta", itemName: r.name, variant: "danger" })
 */
export function useConfirm(): (options: ConfirmOptions) => Promise<boolean> {
  return confirmDialog
}

const noop = () => null

/** Host ÚNICO del diálogo: montar una sola vez en app/layout.tsx. */
export default function ConfirmProvider() {
  const active = useSyncExternalStore(subscribeConfirm, getActiveConfirm, noop)
  // Conserva el último contenido para que la animación de salida no muestre un modal vacío
  const [shown, setShown] = useState<ConfirmRequest | null>(active)
  if (active && active !== shown) setShown(active)

  const danger = shown?.variant === "danger"
  const descId = `confirm-desc-${useId()}`

  return (
    <div className="app-theme-neutral" style={{ background: "transparent" }}>
      <Modal
        open={!!active}
        onClose={() => settleConfirm(false)}
        title={shown?.title}
        describedBy={shown?.description ? descId : undefined}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" data-autofocus onClick={() => settleConfirm(false)}>
              {shown?.cancelLabel ?? "Cancelar"}
            </Button>
            <Button variant={danger ? "danger" : "primary"} onClick={() => settleConfirm(true)}>
              {shown?.confirmLabel ?? (danger ? "Eliminar" : "Confirmar")}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-3 text-sm" style={{ color: "var(--text-secondary)" }}>
          {shown?.itemName && (
            <p
              className="rounded-lg px-3 py-2 font-medium break-words"
              style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}
            >
              {shown.itemName}
            </p>
          )}
          {shown?.description && <p id={descId}>{shown.description}</p>}
        </div>
      </Modal>
    </div>
  )
}
