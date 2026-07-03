"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import Modal from "@/components/ui/Modal"
import Button from "@/components/ui/Button"
import { Check, X, Zap, Crown, GraduationCap, Clock, CheckCircle2 } from "lucide-react"
import { useUpgradeModal } from "./UpgradeModalProvider"
import { getCurrentPlan } from "@/lib/api"
import { PLAN_DETAILS, FEATURE_LABELS, PLAN_FEATURES, ALL_FEATURES, type Plan } from "@/config/features"

const PLAN_ICONS: Record<Plan, typeof Zap> = {
  free: Zap,
  pro: Crown,
  academia: GraduationCap,
}

const PLAN_ORDER: Plan[] = ["free", "pro", "academia"]

function getNextPlan(current: Plan): Plan {
  const idx = PLAN_ORDER.indexOf(current)
  return PLAN_ORDER[Math.min(idx + 1, PLAN_ORDER.length - 1)]
}

export default function UpgradeModal() {
  const { isOpen, highlightFeature, close } = useUpgradeModal()

  const { data: planData } = useSWR(
    isOpen ? "current-plan" : null,
    () => getCurrentPlan().then((r) => r.data),
    { revalidateOnFocus: false }
  )

  const currentPlan: Plan = (planData?.membership as Plan) ?? "free"
  const [selectedPlan, setSelectedPlan] = useState<Plan>("pro")
  const [prevOpen, setPrevOpen] = useState(false)

  if (isOpen && !prevOpen) {
    setPrevOpen(true)
    setSelectedPlan(getNextPlan(currentPlan))
  }
  if (!isOpen && prevOpen) {
    setPrevOpen(false)
  }

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  if (!isOpen) return null

  const isCurrentPlan = selectedPlan === currentPlan
  const isDowngrade = PLAN_ORDER.indexOf(selectedPlan) < PLAN_ORDER.indexOf(currentPlan)

  return (
    <Modal isOpen={isOpen} onClose={close} title="Mejora tu plan">
      <div className="flex flex-col gap-5">
        {/* Header contextual */}
        {planData?.isTrialing && planData.daysLeft > 0 ? (
          <div className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: "var(--accent-light)", border: "1px solid var(--accent)" }}>
            <Clock size={16} style={{ color: "var(--accent)" }} />
            <p className="text-sm" style={{ color: "var(--accent-text)" }}>
              Tienes una prueba activa del plan <strong>Pro</strong> con{" "}
              <strong>{planData.daysLeft} días</strong> restantes.
            </p>
          </div>
        ) : (
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Desbloquea todas las herramientas para llevar tu restaurante al siguiente nivel.
          </p>
        )}

        {/* Planes */}
        <div className="grid grid-cols-3 gap-3">
          {PLAN_ORDER.map((planKey) => {
            const info = PLAN_DETAILS[planKey]
            const Icon = PLAN_ICONS[planKey]
            const isSelected = selectedPlan === planKey
            const isActual = planKey === currentPlan

            return (
              <button
                key={planKey}
                onClick={() => setSelectedPlan(planKey)}
                className="relative flex flex-col gap-3 p-4 rounded-xl text-left transition-all"
                style={{
                  background: isSelected ? info.bg : "var(--bg-primary)",
                  border: `2px solid ${isSelected ? info.color : "var(--border-light)"}`,
                }}
              >
                {/* Badge "Tu plan actual" */}
                {isActual && (
                  <div className="absolute -top-2.5 left-3 px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{ background: "var(--accent)", color: "#fff" }}>
                    Tu plan
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Icon size={18} style={{ color: info.color }} />
                  <span className="text-sm font-bold" style={{ color: info.color }}>
                    {info.name}
                  </span>
                </div>
                <div>
                  <span className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                    {info.priceLabel}
                  </span>
                  {planKey !== "free" && (
                    <span className="text-xs ml-1" style={{ color: "var(--text-muted)" }}>/mes</span>
                  )}
                </div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {info.description}
                </p>
              </button>
            )
          })}
        </div>

        {/* Features del plan seleccionado */}
        <div className="rounded-xl p-4" style={{ background: "var(--bg-primary)", border: "1px solid var(--border-light)" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>
              FEATURES INCLUIDAS
            </p>
            {isCurrentPlan && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: "#ECFDF5", color: "#16A34A" }}>
                Ya tienes este plan
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {ALL_FEATURES.map((feature) => {
              const included = PLAN_FEATURES[selectedPlan].includes(feature)
              const wasIncluded = PLAN_FEATURES[currentPlan].includes(feature)
              const isHighlighted = highlightFeature === feature
              const isNew = included && !wasIncluded

              return (
                <div
                  key={feature}
                  className="flex items-center gap-2 py-1"
                  style={{
                    background: isHighlighted ? "var(--accent-light)" : "transparent",
                    borderRadius: 6,
                    padding: isHighlighted ? "4px 8px" : "0",
                  }}
                >
                  {included ? (
                    <Check size={14} style={{ color: "#16A34A", flexShrink: 0 }} />
                  ) : (
                    <X size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                  )}
                  <span
                    className="text-sm"
                    style={{
                      color: included ? "var(--text-primary)" : "var(--text-muted)",
                      textDecoration: included ? "none" : "line-through",
                    }}
                  >
                    {FEATURE_LABELS[feature]}
                  </span>
                  {isNew && (
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded-full shrink-0"
                      style={{ background: "var(--accent-light)", color: "var(--accent-text)" }}>
                      Nuevo
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="flex justify-between items-center">
          <Button variant="ghost" onClick={close}>
            Cerrar
          </Button>
          {isCurrentPlan ? (
            <Button variant="primary" disabled>
              <CheckCircle2 size={14} className="mr-1.5" />
              Ya tienes este plan
            </Button>
          ) : isDowngrade ? (
            <Button variant="primary" disabled>
              No se permite downgrade
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={() => {
                // TODO: integrar con pasarela de pago
                close()
              }}
            >
              {selectedPlan === "free" ? "Plan actual" : `Actualizar a ${PLAN_DETAILS[selectedPlan].name}`}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
