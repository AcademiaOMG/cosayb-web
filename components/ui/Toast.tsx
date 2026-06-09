"use client"

import { useEffect } from "react"
import { CheckCircle, XCircle, X } from "lucide-react"

export interface ToastProps {
  type: "success" | "error"
  message: string
  onClose: () => void
  duration?: number
}

export default function Toast({
  type,
  message,
  onClose,
  duration = 4000,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [onClose, duration])

  return (
    <div
      role="alert"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium shadow-lg"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-light)",
        color: "var(--text-primary)",
        boxShadow: "0 8px 24px rgba(18, 33, 58, 0.12)",
        maxWidth: 360,
      }}
    >
      {type === "success" ? (
        <CheckCircle size={18} style={{ color: "#059669", flexShrink: 0 }} />
      ) : (
        <XCircle size={18} style={{ color: "#B42020", flexShrink: 0 }} />
      )}
      <span className="flex-1">{message}</span>
      <button
        onClick={onClose}
        className="rounded p-0.5"
        style={{ color: "var(--text-muted)" }}
        aria-label="Cerrar notificación"
      >
        <X size={14} />
      </button>
    </div>
  )
}
