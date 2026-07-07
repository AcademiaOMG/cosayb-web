"use client"

import useSWR from "swr"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Badge from "@/components/ui/Badge"
import { useUpgradeModal } from "@/components/app/settings/UpgradeModalProvider"
import { getCurrentPlan } from "@/lib/api"
import type { Plan } from "@/types/domain"
import {
  CreditCard, Clock, CheckCircle2, ArrowUpRight, Crown, GraduationCap, Zap,
} from "lucide-react"

const PLAN_CONFIG: Record<Plan, { label: string; bg: string; color: string; icon: typeof Zap }> = {
  free: { label: "Free", bg: "var(--bg-secondary)", color: "var(--text-muted)", icon: Zap },
  pro: { label: "Pro", bg: "var(--accent-light)", color: "var(--accent-text)", icon: Crown },
  academia: { label: "Academia", bg: "#FEF3C7", color: "#92400E", icon: GraduationCap },
}

export default function MembresiaPage() {
  const { open: openUpgradeModal } = useUpgradeModal()
  const { data: plan } = useSWR(
    "current-plan",
    () => getCurrentPlan().then((r) => r.data),
    { revalidateOnFocus: false }
  )

  const displayPlan: Plan = (plan?.membership as Plan) ?? "free"
  const planConfig = PLAN_CONFIG[displayPlan]
  const PlanIcon = planConfig.icon
  const includedFeatures = plan?.features.filter((f) => f.enabled) ?? []

  return (
    <div className="flex flex-col gap-5">
      <Card className="transition-shadow hover:shadow-[0_4px_16px_rgba(18,33,58,0.08)]">
        <div className="flex items-center gap-3 mb-5">
          <CreditCard size={18} style={{ color: "var(--accent)" }} />
          <p className="text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>
            SUSCRIPCIÓN
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div
            className="flex items-center justify-between p-4 rounded-xl"
            style={{ background: planConfig.bg, border: `1px solid ${planConfig.color}30` }}
          >
            <div className="flex items-center gap-3">
              <PlanIcon size={20} style={{ color: planConfig.color }} />
              <div>
                <p className="text-sm font-bold" style={{ color: planConfig.color }}>
                  Plan {planConfig.label}
                </p>
                {plan && (
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {plan.planInfo.priceLabel}
                    {plan.planInfo.price > 0 && <span className="ml-1">/mes</span>}
                  </p>
                )}
              </div>
            </div>
            <Badge variant={displayPlan === "free" ? "muted" : "accent"}>
              {displayPlan === "free" ? "Actual" : "Activo"}
            </Badge>
          </div>

          {plan?.isTrialing && plan.daysLeft > 0 && (
            <div
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: "var(--accent-light)", border: "1px solid var(--accent)" }}
            >
              <Clock size={16} style={{ color: "var(--accent)" }} />
              <div className="flex-1">
                <p className="text-sm" style={{ color: "var(--accent-text)" }}>
                  Tu prueba Pro termina en <strong>{plan.daysLeft} días</strong>
                </p>
                <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border-light)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(5, (plan.daysLeft / 14) * 100)}%`,
                      background: "var(--accent)",
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
              FUNCIONES INCLUIDAS
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {includedFeatures.map((f) => (
                <div
                  key={f.key}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                  style={{ background: "var(--bg-primary)", border: "1px solid var(--border-light)" }}
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "#ECFDF5" }}
                  >
                    <CheckCircle2 size={12} style={{ color: "#16A34A" }} />
                  </div>
                  <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                    {f.label}
                    {f.limit != null && (
                      <span className="ml-1" style={{ color: "var(--text-muted)" }}>
                        (hasta {f.limit})
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="primary" onClick={() => openUpgradeModal()} className="flex items-center gap-2">
              <ArrowUpRight size={14} />
              {displayPlan === "free" ? "Mejorar plan" : "Cambiar plan"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
