"use client"

import { useState } from "react"
import { X, Zap } from "lucide-react"
import Button from "@/components/ui/Button"

export interface UpgradePromptProps {
  feature?: string
}

export default function UpgradePrompt({ feature }: UpgradePromptProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div
      className="flex items-start gap-4 rounded-xl p-4"
      style={{
        background: "var(--accent-light)",
        border: "1px solid var(--accent)",
      }}
      role="alert"
    >
      <Zap size={20} style={{ color: "var(--accent)", flexShrink: 0, marginTop: 2 }} />
      <div className="flex-1 flex flex-col gap-2">
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          {feature
            ? `${feature} requiere el plan Pro`
            : "Has alcanzado el límite del plan Free"}
        </p>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Actualiza a Pro para desbloquear ingredientes, recetas y menús ilimitados.
        </p>
        <div className="flex items-center gap-2 mt-1">
          <Button size="sm" variant="primary">
            Actualizar a Pro
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setDismissed(true)}>
            Ahora no
          </Button>
        </div>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="rounded-lg p-1 shrink-0"
        style={{ color: "var(--accent-text)" }}
        aria-label="Descartar"
      >
        <X size={16} />
      </button>
    </div>
  )
}
