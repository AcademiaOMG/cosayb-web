"use client"

import Button from "@/components/ui/Button"
import { useUpgradeModal } from "@/components/app/settings/UpgradeModalProvider"

export interface QuotaBannerProps {
  used: number
  limit: number
}

/**
 * Aviso de cupo del plan Free. Con cupo de sobra el contador no aporta
 * nada, así que solo aparece cuando el límite empieza a importar
 * (quedan 10 o menos).
 */
export default function QuotaBanner({ used, limit }: QuotaBannerProps) {
  const { open: openUpgrade } = useUpgradeModal()
  const remaining = Math.max(limit - used, 0)
  const isCritical = used >= limit - 2
  const isWarning = used >= limit - 10

  if (!isWarning) return null

  const pct = Math.min((used / limit) * 100, 100)
  const tone = isCritical
    ? { bg: "#FEF2F2", bar: "#B42020", text: "#991B1B" }
    : { bg: "#FFFBEB", bar: "#D97706", text: "#92400E" }

  const message =
    remaining === 0
      ? `Llegaste al límite de ${limit} ingredientes propios`
      : `Te ${remaining === 1 ? "queda" : "quedan"} ${remaining} ingrediente${remaining === 1 ? "" : "s"} propio${remaining === 1 ? "" : "s"}`

  return (
    <div
      className="flex items-center gap-4 px-4 py-3"
      style={{ background: tone.bg, borderRadius: "var(--radius-md)" }}
      role="status"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="text-sm font-semibold leading-snug" style={{ color: tone.text }}>
          {message}
        </span>
        <div
          className="h-1 w-full overflow-hidden rounded-full"
          style={{ background: "rgba(0,0,0,0.07)" }}
          aria-hidden="true"
        >
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: tone.bar }} />
        </div>
      </div>
      <Button size="sm" variant="primary" className="shrink-0" onClick={() => openUpgrade()}>
        Mejorar plan
      </Button>
    </div>
  )
}
