"use client"

import { useMemo } from "react"
import { Package, TrendingDown, TrendingUp, Layers } from "lucide-react"
import type { Ingredient } from "@/types/ingredient"

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
}

function StatCard({ icon, label, value, sub }: StatCardProps) {
  return (
    <div
      className="flex items-center gap-4 rounded-2xl px-5 py-4 min-w-0"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-light)",
        boxShadow: "0 1px 3px rgba(18,33,58,0.04)",
      }}
    >
      <div
        className="shrink-0 flex items-center justify-center rounded-xl w-10 h-10"
        style={{ background: "var(--accent-light)", color: "var(--accent-text)" }}
      >
        {icon}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</span>
        <span className="text-lg font-semibold font-mono leading-tight truncate" style={{ color: "var(--text-primary)" }}>
          {value}
        </span>
        {sub && (
          <span className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{sub}</span>
        )}
      </div>
    </div>
  )
}

interface Props {
  ingredients: Ingredient[]
}

export default function InventoryStats({ ingredients }: Props) {
  const stats = useMemo(() => {
    const own = ingredients.filter((i) => i.userId !== null)
    const withPrice = own.filter((i) => parseFloat(i.costPerGram) > 0)

    const avgPerGram = withPrice.length
      ? withPrice.reduce((acc, i) => acc + parseFloat(i.costPerGram), 0) / withPrice.length
      : 0

    const sorted = [...withPrice].sort((a, b) => parseFloat(a.costPerGram) - parseFloat(b.costPerGram))
    const cheapest = sorted[0] ?? null
    const priciest = sorted[sorted.length - 1] ?? null

    return { own, avgPerGram, cheapest, priciest }
  }, [ingredients])

  if (ingredients.length === 0) return null

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        icon={<Package size={18} />}
        label="Ingredientes propios"
        value={String(stats.own.length)}
        sub={`${ingredients.length} en total con banco`}
      />
      <StatCard
        icon={<Layers size={18} />}
        label="Costo promedio"
        value={`$${stats.avgPerGram.toFixed(4)}/g`}
        sub="Promedio de tus ingredientes"
      />
      <StatCard
        icon={<TrendingDown size={18} />}
        label="Más económico"
        value={stats.cheapest ? `$${parseFloat(stats.cheapest.costPerGram).toFixed(4)}/g` : "—"}
        sub={stats.cheapest?.name ?? ""}
      />
      <StatCard
        icon={<TrendingUp size={18} />}
        label="Más costoso"
        value={stats.priciest ? `$${parseFloat(stats.priciest.costPerGram).toFixed(4)}/g` : "—"}
        sub={stats.priciest?.name ?? ""}
      />
    </div>
  )
}
