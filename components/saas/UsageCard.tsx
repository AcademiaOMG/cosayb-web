"use client"

import Link from "next/link"
import useSWR from "swr"
import { Gauge } from "lucide-react"
import Card from "@/components/ui/Card"
import { getPlanUsage } from "@/lib/saas/account"

/** Uso del plan frente a sus límites (GET /billing/usage). Se oculta si el API aún no lo expone. */
export default function UsageCard() {
  const { data } = useSWR("billing/usage", () => getPlanUsage(), { revalidateOnFocus: false, shouldRetryOnError: false })
  const items = (data?.items ?? []).filter((i) => i.limit !== 0)
  if (!data || items.length === 0) return null

  return (
    <Card>
      <div className="flex items-center gap-3 mb-5">
        <Gauge size={18} style={{ color: "var(--accent)" }} aria-hidden="true" />
        <p className="text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>USO DEL PLAN</p>
      </div>
      <ul className="flex flex-col gap-4">
        {items.map((i) => {
          const pct = i.limit == null ? 0 : Math.min(100, i.percent ?? Math.round((i.current / i.limit) * 100))
          return (
            <li key={i.feature} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: "var(--text-primary)" }}>{i.label}</span>
                <span style={{ color: i.atLimit ? "var(--error)" : "var(--text-muted)" }}>
                  {i.current} / {i.limit == null ? "ilimitado" : i.limit}
                </span>
              </div>
              {i.limit != null && (
                <div
                  role="progressbar"
                  aria-label={i.label}
                  aria-valuemin={0}
                  aria-valuemax={i.limit}
                  aria-valuenow={Math.min(i.current, i.limit)}
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ background: "var(--border-light)" }}
                >
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: i.atLimit ? "var(--error)" : pct >= 80 ? "var(--warning)" : "var(--accent)" }} />
                </div>
              )}
            </li>
          )
        })}
      </ul>
      {items.some((i) => i.atLimit) && (
        <p className="mt-4 text-sm" style={{ color: "var(--text-secondary)" }}>
          Llegaste al límite de algún recurso. <Link href="/planes" className="underline" style={{ color: "var(--accent)" }}>Mejora tu plan</Link> para seguir creciendo.
        </p>
      )}
    </Card>
  )
}
