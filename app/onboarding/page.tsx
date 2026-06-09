"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import type { Plan } from "@/types/domain"

type Step = 1 | 2

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [orgName, setOrgName] = useState("")
  const [selectedPlan, setSelectedPlan] = useState<Plan>("free")
  const [isLoading, setIsLoading] = useState(false)

  function handleStep1() {
    if (!orgName.trim()) return
    setStep(2)
  }

  async function handleFinish() {
    setIsLoading(true)
    // TODO: POST /api/organizations { name: orgName, plan: selectedPlan }
    // TODO: Set cosayb.org_id cookie
    await new Promise((r) => setTimeout(r, 600))
    router.push("/inventario")
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--bg-primary)" }}
    >
      <div
        className="w-full max-w-lg flex flex-col gap-8 rounded-2xl p-10"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-light)",
          boxShadow: "0 4px 24px rgba(18, 33, 58, 0.08)",
        }}
      >
        {/* Progress */}
        <div className="flex items-center gap-3">
          <StepDot active={step >= 1} done={step > 1} label="1" />
          <div
            className="flex-1 h-px"
            style={{ background: step > 1 ? "var(--accent)" : "var(--border-light)" }}
          />
          <StepDot active={step >= 2} done={false} label="2" />
        </div>

        {step === 1 && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <h1
                className="text-2xl font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                ¿Cómo se llama tu negocio?
              </h1>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Puede ser el nombre de tu restaurante, cocina o empresa.
              </p>
            </div>
            <Input
              label="Nombre del negocio"
              placeholder="Ej. Restaurante La Candelaria"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleStep1()}
            />
            <Button
              variant="primary"
              size="lg"
              onClick={handleStep1}
              disabled={!orgName.trim()}
            >
              Continuar
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <h1
                className="text-2xl font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Elige tu plan
              </h1>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Puedes cambiar en cualquier momento.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <PlanCard
                plan="free"
                selected={selectedPlan === "free"}
                onSelect={() => setSelectedPlan("free")}
                title="Free"
                price="Gratis"
                features={["Hasta 30 ingredientes", "5 recetas", "1 menú"]}
              />
              <PlanCard
                plan="pro"
                selected={selectedPlan === "pro"}
                onSelect={() => setSelectedPlan("pro")}
                title="Pro"
                price="$ 49.900 / mes"
                features={[
                  "Ingredientes ilimitados",
                  "Recetas ilimitadas",
                  "Menús ilimitados",
                  "Valoración A&B",
                  "Punto de equilibrio",
                ]}
                highlighted
              />
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep(1)}>
                Atrás
              </Button>
              <Button
                variant="primary"
                size="lg"
                loading={isLoading}
                onClick={handleFinish}
                className="flex-1"
              >
                Empezar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StepDot({
  active,
  done,
  label,
}: {
  active: boolean
  done: boolean
  label: string
}) {
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
      style={{
        background: active ? "var(--accent)" : "var(--bg-secondary)",
        color: active ? "#fff" : "var(--text-muted)",
      }}
    >
      {done ? "✓" : label}
    </div>
  )
}

function PlanCard({
  plan,
  selected,
  onSelect,
  title,
  price,
  features,
  highlighted = false,
}: {
  plan: Plan
  selected: boolean
  onSelect: () => void
  title: string
  price: string
  features: string[]
  highlighted?: boolean
}) {
  return (
    <button
      onClick={onSelect}
      className="w-full text-left rounded-xl p-5 flex flex-col gap-3 transition-all"
      style={{
        background: selected ? "var(--accent-light)" : "var(--bg-surface)",
        border: selected
          ? "2px solid var(--accent)"
          : "2px solid var(--border-light)",
        cursor: "pointer",
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="font-display text-xl font-bold"
          style={{ color: selected ? "var(--accent)" : "var(--text-primary)" }}
        >
          {title}
          {highlighted && (
            <span
              className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              RECOMENDADO
            </span>
          )}
        </span>
        <span
          className="text-sm font-semibold"
          style={{ color: "var(--text-secondary)" }}
        >
          {price}
        </span>
      </div>
      <ul className="flex flex-col gap-1">
        {features.map((f) => (
          <li
            key={f}
            className="text-sm flex items-center gap-2"
            style={{ color: "var(--text-secondary)" }}
          >
            <span style={{ color: "var(--accent)" }}>✓</span> {f}
          </li>
        ))}
      </ul>
    </button>
  )
}
