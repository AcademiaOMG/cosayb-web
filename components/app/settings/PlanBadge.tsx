import type { Plan } from "@/types/domain"

const config: Record<Plan, { label: string; bg: string; color: string }> = {
  free: { label: "Free", bg: "var(--bg-secondary)", color: "var(--text-muted)" },
  pro: { label: "Pro", bg: "var(--accent-light)", color: "var(--accent-text)" },
  academia: { label: "Academia", bg: "#FEF3C7", color: "#92400E" },
}

export default function PlanBadge({ plan }: { plan: Plan }) {
  const { label, bg, color } = config[plan]
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold"
      style={{ background: bg, color }}
    >
      {label}
    </span>
  )
}
