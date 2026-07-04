"use client"

import useSWR from "swr"
import Link from "next/link"
import PageHeader from "@/components/ui/PageHeader"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import { usePermissions } from "@/hooks/usePermissions"
import { getDashboardSummary } from "@/lib/api"
import {
  Package, ChefHat, UtensilsCrossed, Users, Coins, Clock,
  CheckCircle2, Circle, ArrowRight, Plus, TrendingUp, Scale, Send,
} from "lucide-react"

const COP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
})

export default function DashboardPage() {
  const { organization, can } = usePermissions()
  const { data, isLoading } = useSWR(
    "dashboard-summary",
    () => getDashboardSummary().then((r) => r.data),
    { revalidateOnFocus: false }
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={organization ? `Hola, ${organization.name}` : "Inicio"}
        subtitle={
          data?.onboardingComplete
            ? "Resumen de tu negocio"
            : "Completa estos pasos para dominar tus costos"
        }
      />

      {isLoading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl h-28"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border-light)" }}
            />
          ))}
        </div>
      )}

      {!isLoading && data && !data.onboardingComplete && (
        <OnboardingChecklist checklist={data.checklist} canCreate={can("recipes", "create")} />
      )}

      {!isLoading && data && data.onboardingComplete && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <KpiCard icon={Package} label="Ingredientes" value={String(data.counts.ingredients)} href="/inventario" />
            <KpiCard icon={ChefHat} label="Recetas" value={String(data.counts.recipes)} href="/recetas" />
            <KpiCard icon={UtensilsCrossed} label="Menús" value={String(data.counts.menus)} href="/menu" />
            <KpiCard
              icon={Users}
              label="Equipo"
              value={data.team.limit != null ? `${data.team.members}/${data.team.limit}` : String(data.team.members)}
              progress={data.team.limit != null ? data.team.members / data.team.limit : undefined}
            />
            <KpiCard
              icon={Coins}
              label="Costo prom. / porción"
              value={data.avgCostPerServing != null ? COP.format(data.avgCostPerServing) : "—"}
              accent
            />
          </div>

          {/* Accesos rápidos */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {can("recipes", "create") && (
              <QuickAction icon={ChefHat} label="Nueva receta" href="/recetas" />
            )}
            {can("ingredients", "create") && (
              <QuickAction icon={Package} label="Nuevo ingrediente" href="/inventario" />
            )}
            {can("yieldFactors", "create") && (
              <QuickAction icon={Scale} label="Nuevo factor de rendimiento" href="/factor-rendimiento" />
            )}
            {can("invitations", "create") && (
              <QuickAction icon={Send} label="Invitar al equipo" href="/configuracion/equipo" />
            )}
          </div>

          {/* Dos columnas: recientes + más costosas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            {data.recentRecipes.length > 0 && (
              <Card>
                <div className="flex items-center gap-3 mb-4">
                  <Clock size={16} style={{ color: "var(--accent)" }} />
                  <p className="text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>
                    RECETAS RECIENTES
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  {data.recentRecipes.map((r) => (
                    <Link
                      key={r.id}
                      href="/recetas"
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors hover:bg-[var(--bg-secondary)]"
                      style={{ color: "var(--text-primary)" }}
                    >
                      <span className="text-sm font-medium truncate">{r.name}</span>
                      <span className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>
                        {new Date(r.updatedAt).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
                      </span>
                    </Link>
                  ))}
                </div>
              </Card>
            )}

            {data.topRecipes.length > 0 && (
              <Card>
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp size={16} style={{ color: "var(--accent)" }} />
                  <p className="text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>
                    RECETAS MÁS COSTOSAS / PORCIÓN
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  {data.topRecipes.map((r, i) => (
                    <Link
                      key={r.id}
                      href="/recetas"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-[var(--bg-secondary)]"
                      style={{ color: "var(--text-primary)" }}
                    >
                      <span
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0"
                        style={{ background: "var(--accent-light)", color: "var(--accent)" }}
                      >
                        {i + 1}
                      </span>
                      <span className="flex-1 text-sm font-medium truncate">{r.name}</span>
                      <span className="text-xs font-semibold shrink-0 font-mono" style={{ color: "var(--accent)" }}>
                        {COP.format(r.costPerServing)}
                      </span>
                    </Link>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Checklist de onboarding ──────────────────────────────────────────────────

function OnboardingChecklist({
  checklist,
  canCreate,
}: {
  checklist: { hasIngredients: boolean; hasRecipes: boolean; hasMenus: boolean; hasTeam: boolean }
  canCreate: boolean
}) {
  const steps = [
    {
      done: checklist.hasIngredients,
      title: "Agrega tu primer ingrediente",
      description: "Registra los insumos de tu cocina con su costo, o importa del banco público.",
      href: "/inventario",
      cta: "Ir a Inventario",
    },
    {
      done: checklist.hasRecipes,
      title: "Crea tu primera receta",
      description: "Arma la ficha técnica con componentes y calcula su costo exacto.",
      href: "/recetas",
      cta: "Ir a Recetas",
    },
    {
      done: checklist.hasMenus,
      title: "Arma tu primer menú",
      description: "Combina recetas y calcula el costo por persona de un evento.",
      href: "/menu",
      cta: "Ir a Menús",
    },
    {
      done: checklist.hasTeam,
      title: "Invita a tu equipo",
      description: "Suma a tu chef o analista con el rol adecuado. (Opcional)",
      href: "/configuracion/equipo",
      cta: "Invitar",
      optional: true,
    },
  ]

  const required = steps.filter((s) => !s.optional)
  const doneCount = required.filter((s) => s.done).length
  const progress = (doneCount / required.length) * 100

  return (
    <Card>
      {/* Barra de progreso */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-secondary)" }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${Math.max(4, progress)}%`, background: "var(--accent)" }}
          />
        </div>
        <span className="text-xs font-semibold shrink-0" style={{ color: "var(--text-muted)" }}>
          {doneCount}/{required.length} completados
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {steps.map((step) => (
          <div
            key={step.title}
            className="flex items-start gap-4 p-4 rounded-xl"
            style={{
              background: step.done ? "#F0FDF4" : "var(--bg-primary)",
              border: `1px solid ${step.done ? "#BBF7D0" : "var(--border-light)"}`,
              opacity: step.done ? 0.75 : 1,
            }}
          >
            {step.done ? (
              <CheckCircle2 size={22} className="shrink-0 mt-0.5" style={{ color: "#16A34A" }} />
            ) : (
              <Circle size={22} className="shrink-0 mt-0.5" style={{ color: "var(--text-muted)" }} />
            )}
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-semibold"
                style={{
                  color: step.done ? "#166534" : "var(--text-primary)",
                  textDecoration: step.done ? "line-through" : "none",
                }}
              >
                {step.title}
                {step.optional && (
                  <span className="ml-2 text-xs font-normal" style={{ color: "var(--text-muted)" }}>
                    opcional
                  </span>
                )}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                {step.description}
              </p>
            </div>
            {!step.done && canCreate && (
              <Link href={step.href}>
                <Button variant="primary" size="sm">
                  {step.cta}
                  <ArrowRight size={13} />
                </Button>
              </Link>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}

// ─── Acceso rápido ───────────────────────────────────────────────────────────

function QuickAction({
  icon: Icon,
  label,
  href,
}: {
  icon: typeof Package
  label: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl px-4 h-[52px] transition-all hover:border-[var(--accent)] hover:shadow-[0_2px_12px_rgba(18,33,58,0.08)]"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border-light)" }}
    >
      <span
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: "var(--accent-light)" }}
      >
        <Plus size={14} style={{ color: "var(--accent)" }} />
      </span>
      <span className="flex items-center gap-2 text-sm font-medium min-w-0" style={{ color: "var(--text-primary)" }}>
        <Icon size={14} style={{ color: "var(--text-muted)" }} className="shrink-0" />
        <span className="truncate">{label}</span>
      </span>
    </Link>
  )
}

// ─── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon,
  label,
  value,
  href,
  progress,
  accent = false,
}: {
  icon: typeof Package
  label: string
  value: string
  href?: string
  progress?: number
  accent?: boolean
}) {
  const content = (
    <div
      className="rounded-2xl p-4 flex flex-col gap-2 h-full transition-shadow"
      style={{
        background: accent ? "var(--accent-light)" : "var(--bg-surface)",
        border: `1px solid ${accent ? "var(--accent)" : "var(--border-light)"}`,
        cursor: href ? "pointer" : "default",
      }}
    >
      <div className="flex items-center gap-2">
        <Icon size={15} style={{ color: accent ? "var(--accent)" : "var(--text-muted)" }} />
        <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
          {label}
        </p>
      </div>
      <p
        className="text-2xl font-bold"
        style={{ color: accent ? "var(--accent)" : "var(--text-primary)" }}
      >
        {value}
      </p>
      {progress !== undefined && (
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-secondary)" }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min(100, progress * 100)}%`,
              background: progress >= 1 ? "#EF4444" : "var(--accent)",
            }}
          />
        </div>
      )}
    </div>
  )

  return href ? <Link href={href}>{content}</Link> : content
}
