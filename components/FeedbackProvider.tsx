"use client"

import ToastProvider from "@/components/ui/Toast"
import ConfirmProvider from "@/components/ui/ConfirmDialog"

/**
 * Notificaciones (`toast.*`) y confirmaciones (`useConfirm()`) globales.
 * Se monta UNA sola vez en app/layout.tsx. Ver docs/design-system.md.
 */
export default function FeedbackProvider() {
  return (
    <>
      <ConfirmProvider />
      <ToastProvider />
    </>
  )
}
