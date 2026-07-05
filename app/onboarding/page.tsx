"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import { authClient } from "@/lib/auth"
import { setActiveOrgId, getLastSurface } from "@/lib/surface"

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"

type Step = 1 | 2 | 3

const BUSINESS_TYPES = [
  { id: "restaurante", label: "Restaurante", icon: "🍽️", description: "Comida completa para sentarse a comer" },
  { id: "cafeteria", label: "Cafetería", icon: "☕", description: "Bebidas y snacks rápidos" },
  { id: "panaderia", label: "Panadería", icon: "🥐", description: "Pan, pasteles y repostería" },
  { id: "foodtruck", label: "Food Truck", icon: "🚚", description: "Comida móvil o callejera" },
  { id: "cloudkitchen", label: "Cloud Kitchen", icon: "☁️", description: "Solo delivery, sin local físico" },
  { id: "catering", label: "Catering", icon: "🎉", description: "Eventos y banquetes" },
  { id: "otro", label: "Otro", icon: "📦", description: "Otro tipo de negocio" },
]

function setOnboardingCookie() {
  document.cookie = "cosayb.onboarding=true; path=/; max-age=31536000; SameSite=Lax"
}

export default function OnboardingPage() {
  const router = useRouter()
  // ?new=1 → crear un negocio ADICIONAL (multi-org): salta los checks de
  // "ya completaste el onboarding" y siempre crea una organización nueva
  const [isNewOrgFlow] = useState(() =>
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("new") === "1"
  )
  const [step, setStep] = useState<Step>(1)
  const [orgName, setOrgName] = useState("")
  const [city, setCity] = useState("")
  const [businessType, setBusinessType] = useState("")
  const [selectedPlan, setSelectedPlan] = useState<"free" | "pro">("free")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function check() {
      try {
        const { data } = await authClient.getSession()

        if (!data?.session) {
          router.replace("/login")
          return
        }

        // Flujo "crear otro negocio": mostrar siempre el formulario
        if (isNewOrgFlow) {
          setChecking(false)
          return
        }

        // Usuarios de plataforma: aterrizan en la consola si es su último
        // contexto o si no tienen negocio propio (ej. platform_chef puro)
        try {
          const ctxRes = await fetch(`${API}/api/v1/me/context`, { credentials: "include" })
          if (ctxRes.ok) {
            const ctxBody = await ctxRes.json()
            const platformRoles: string[] = ctxBody.data?.platformRoles ?? []
            const hasOrg = !!ctxBody.data?.organization
            if (
              platformRoles.length > 0 &&
              (getLastSurface() === "platform" || !hasOrg)
            ) {
              router.replace("/plataforma")
              return
            }
          }
        } catch {
          // sin contexto — continuar flujo normal
        }

        // Fast path: cookie local indica que el onboarding ya fue completado
        if (document.cookie.includes("cosayb.onboarding=true")) {
          router.replace("/dashboard")
          return
        }

        // Verificar en backend si ya completó onboarding
        try {
          const res = await fetch(`${API}/api/v1/organizations/me`, { credentials: "include" })
          if (res.ok) {
            const body = await res.json()
            if (body.data?.onboardingCompleted) {
              setOnboardingCookie()
              router.replace("/dashboard")
              return
            }
          }
        } catch {
          // API no disponible — mostrar form (usuario sí está autenticado)
        }

        setChecking(false)
      } catch {
        setChecking(false)
      }
    }

    check()
  }, [router])

  function handleStep1() {
    if (!orgName.trim()) return
    setStep(2)
  }

  const CITIES = [
    { value: "bogota", label: "Bogotá" },
    { value: "medellin", label: "Medellín" },
    { value: "cali", label: "Cali" },
    { value: "barranquilla", label: "Barranquilla" },
    { value: "cartagena", label: "Cartagena" },
    { value: "otra", label: "Otra ciudad" },
  ]

  function handleStep2() {
    if (!businessType) return
    setStep(3)
  }

  async function handleFinish() {
    setIsLoading(true)
    setError(null)

    try {
      // 1. ¿Ya tiene organización activa? (invitado que aceptó, o re-onboarding)
      //    En el flujo "crear otro negocio" se salta: siempre se crea una nueva.
      let orgId: string | null = null

      if (!isNewOrgFlow) {
        const orgRes = await fetch(`${API}/api/v1/organizations/me`, { credentials: "include" })
        if (orgRes.ok) {
          const orgBody = await orgRes.json()
          orgId = orgBody.data?.id
        }
      }

      // 2. Si no tiene, crear el negocio (onboarding explícito).
      //    Toda org nueva arranca con 14 días de trial Pro; al expirar cae a Free.
      if (!orgId) {
        const createRes = await fetch(`${API}/api/v1/organizations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ name: orgName }),
        })

        if (!createRes.ok) throw new Error("Error al crear la organización")
        const createBody = await createRes.json()
        orgId = createBody.data?.id
        // Activar la org recién creada (multi-org: header X-Organization-Id)
        if (orgId) setActiveOrgId(orgId)
      }

      // 3. Marcar onboarding como completado y guardar datos del onboarding
      if (orgId) {
        await fetch(`${API}/api/v1/organizations/${orgId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-Organization-Id": orgId,
          },
          credentials: "include",
          body: JSON.stringify({
            name: orgName,
            onboardingCompleted: true,
            ...(businessType && { businessType }),
            ...(city && { city }),
          }),
        })
      }

      // 4. Setear cookie y aterrizar en el dashboard del negocio
      setOnboardingCookie()
      window.location.href = "/dashboard"
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado")
    } finally {
      setIsLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-primary)" }}>
        <div className="animate-pulse text-lg" style={{ color: "var(--text-muted)" }}>Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ background: "var(--bg-primary)" }}>
      <div
        className="w-full max-w-xl flex flex-col gap-8 rounded-2xl p-10"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-light)",
          boxShadow: "0 4px 24px rgba(18, 33, 58, 0.08)",
        }}
      >
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
            Configura tu cuenta
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Solo necesitamos unos datos para personalizar tu experiencia
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3">
          <StepDot active={step >= 1} done={step > 1} label="1" />
          <div className="flex-1 h-px" style={{ background: step > 1 ? "var(--accent)" : "var(--border-light)" }} />
          <StepDot active={step >= 2} done={step > 2} label="2" />
          <div className="flex-1 h-px" style={{ background: step > 2 ? "var(--accent)" : "var(--border-light)" }} />
          <StepDot active={step >= 3} done={false} label="3" />
        </div>

        {/* Step 1: Nombre del negocio */}
        {step === 1 && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
                ¿Cómo se llama tu negocio?
              </h2>
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
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                Ciudad principal
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-light)",
                  color: city ? "var(--text-primary)" : "var(--text-muted)",
                }}
              >
                <option value="">Selecciona tu ciudad</option>
                {CITIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <Button variant="primary" size="lg" onClick={handleStep1} disabled={!orgName.trim()}>
              Continuar
            </Button>
          </div>
        )}

        {/* Step 2: Tipo de negocio */}
        {step === 2 && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
                ¿Qué tipo de negocio manejas?
              </h2>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Esto nos ayudará a personalizar las funciones para ti.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {BUSINESS_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setBusinessType(type.id)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all text-center"
                  style={{
                    background: businessType === type.id ? "var(--accent-light)" : "var(--bg-secondary)",
                    border: businessType === type.id ? "2px solid var(--accent)" : "2px solid var(--border-light)",
                    cursor: "pointer",
                  }}
                >
                  <span className="text-2xl">{type.icon}</span>
                  <span className="font-medium text-sm" style={{ color: businessType === type.id ? "var(--accent)" : "var(--text-primary)" }}>
                    {type.label}
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {type.description}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep(1)}>Atrás</Button>
              <Button variant="primary" size="lg" onClick={handleStep2} disabled={!businessType} className="flex-1">
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Selección de plan */}
        {step === 3 && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
                Elige tu plan
              </h2>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Comienza gratis o activa Pro para funciones completas.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <PlanCard
                selected={selectedPlan === "free"}
                onSelect={() => setSelectedPlan("free")}
                title="Free"
                price="Gratis"
                features={["Hasta 30 ingredientes", "5 recetas", "1 menú", "Soporte básico"]}
              />
              <PlanCard
                selected={selectedPlan === "pro"}
                onSelect={() => setSelectedPlan("pro")}
                title="Pro"
                price="$30.000 / mes"
                features={[
                  "Ingredientes ilimitados", "Recetas ilimitadas", "Menús ilimitados",
                  "Valoración A&B", "Punto de equilibrio", "Exportar PDFs", "Soporte prioritario",
                ]}
                highlighted
              />
            </div>
            {selectedPlan === "pro" && (
              <div className="p-3 rounded-lg text-sm" style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
                <strong>14 días gratis</strong> de Pro al registrarte. Sin compromiso.
              </div>
            )}
            {error && <p className="text-sm text-center" style={{ color: "#E24B4A" }}>{error}</p>}
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep(2)}>Atrás</Button>
              <Button variant="primary" size="lg" loading={isLoading} onClick={handleFinish} className="flex-1">
                {selectedPlan === "pro" ? "Comenzar prueba gratis" : "Empezar gratis"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StepDot({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 transition-all"
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
  selected, onSelect, title, price, features, highlighted = false,
}: {
  selected: boolean; onSelect: () => void
  title: string; price: string; features: string[]; highlighted?: boolean
}) {
  return (
    <button
      onClick={onSelect}
      className="w-full text-left rounded-xl p-5 flex flex-col gap-3 transition-all"
      style={{
        background: selected ? "var(--accent-light)" : "var(--bg-surface)",
        border: selected ? "2px solid var(--accent)" : "2px solid var(--border-light)",
        cursor: "pointer",
      }}
    >
      <div className="flex items-center justify-between">
        <span className="font-display text-xl font-bold" style={{ color: selected ? "var(--accent)" : "var(--text-primary)" }}>
          {title}
          {highlighted && (
            <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--accent)", color: "#fff" }}>
              RECOMENDADO
            </span>
          )}
        </span>
        <span className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>{price}</span>
      </div>
      <ul className="flex flex-col gap-1">
        {features.map((f) => (
          <li key={f} className="text-sm flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
            <span style={{ color: "var(--accent)" }}>✓</span> {f}
          </li>
        ))}
      </ul>
    </button>
  )
}
