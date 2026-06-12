"use client"

import { useEffect } from "react"
import type React from "react"
import { X } from "lucide-react"

export interface ModalProps {
  isOpen?: boolean
  open?: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export default function Modal({ isOpen, open, onClose, title, children, footer }: ModalProps) {
  const visible = typeof open === "boolean" ? open : !!isOpen

  useEffect(() => {
    if (!visible) return
    const handleKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    document.addEventListener("keydown", handleKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleKey)
      document.body.style.overflow = ""
    }
  }, [visible, onClose])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(18, 33, 58, 0.5)" }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-md rounded-2xl p-6 flex flex-col gap-4"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-light)",
          boxShadow: "0 16px 48px rgba(18, 33, 58, 0.16)",
        }}
      >
        <div className="flex items-center justify-between">
          {title && (
            <h2
              id="modal-title"
              className="text-lg font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {title}
            </h2>
          )}
          <button
            onClick={onClose}
            className="ml-auto rounded-lg p-1.5 transition-colors"
            style={{ color: "var(--text-muted)" }}
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1">{children}</div>
        {footer && (
          <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--border-light)" }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
