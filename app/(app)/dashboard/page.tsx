"use client"

import useSWR from "swr"
import Link from "next/link"
import PageHeader from "@/components/ui/PageHeader"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import { usePermissions } from "@/hooks/usePermissions"
import { getDashboardSummary } from "@/lib/api"
import type { Resource, Action } from "@/lib/api"
import {
  Package, ChefHat, UtensilsCrossed, Users, Coins, Clock,
  CheckCircle2, Circle, ArrowRight, Plus, TrendingUp, Scale, Send, Sparkles,
} from "lucide-react"

const COP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
})

export default function DashboardPage() {
  const { organization, can, hasFeature, isLoading: permsLoading } = usePermissions()
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
            ? "Así va tu costeo hoy"
            : "Completa estos pasos para dominar tus costos"
        }
      />

      {(isLoading || permsLoading) && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4">
            <div className="animate-pulse rounded-2xl h-36" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-light)" }} />
            <div className="animate-pulse rounded-2xl h-36" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-light)" }} />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl h-[52px]" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-light)" }} />
            ))}
          </div>
        </div>
      )}

      {!isLoading && !permsLoading && data && !data.onboardingComplete && (
        <OnboardingChecklist
          checklist={data.checklist}
          canCreate={can("recipes", "create")}
          can={can}
          hasFeature={hasFeature}
        />
      )}

      {!isLoading && !permsLoading && data && data.onboardingComplete && (
        <>
          {/* ── Hero: costo + panorama del negocio ──────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 items-stretch">
            <AvgCostHero value={data.avgCostPerServing} />
            <StatStrip
              ingredients={data.counts.ingredients}
              recipes={data.counts.recipes}
              menus={data.counts.menus}
              team={data.team}
              can={can}
              hasFeature={hasFeature}
            />
          </div>

          {/* ── Accesos rápidos ──────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {can("recipes", "create") && hasFeature("module_recipes") && (
              <QuickAction icon={ChefHat} label="Nueva receta" href="/recetas" bg="#EDE9FE" color="#6D28D9" />
            )}
            {can("ingredients", "create") && hasFeature("module_ingredients") && (
              <QuickAction icon={Package} label="Nuevo ingrediente" href="/inventario" bg="#DCFCE7" color="#16A34A" />
            )}
            {can("yieldFactors", "create") && hasFeature("module_yieldFactors") && (
              <QuickAction icon={Scale} label="Nuevo factor de rendimiento" href="/factor-rendimiento" bg="var(--accent-light)" color="var(--accent)" />
            )}
            {can("invitations", "create") && (
              <QuickAction icon={Send} label="Invitar al equipo" href="/configuracion/equipo" bg="#FEF3C7" color="#92400E" />
            )}
          </div>

          {/* ── Recientes + más costosas ─────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <Clock size={16} style={{ color: "var(--accent)" }} />
                <p className="text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>
                  RECETAS RECIENTES
                </p>
              </div>
              {data.recentRecipes.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {data.recentRecipes.map((r) => (
                    <Link
                      key={r.id}
                      href={`/recetas?id=${r.id}`}
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
              ) : (
                <EmptyMiniState
                  text="Aún no has creado recetas propias."
                  href="/recetas"
                  cta="Crear receta"
                  canCreate={can("recipes", "create")}
                />
              )}
            </Card>

            <Card>
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp size={16} style={{ color: "var(--accent)" }} />
                <p className="text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>
                  RECETAS MÁS COSTOSAS / PORCIÓN
                </p>
              </div>
              {data.topRecipes.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {data.topRecipes.map((r, i) => (
                    <Link
                      key={r.id}
                      href={`/recetas?id=${r.id}`}
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
              ) : (
                <EmptyMiniState
                  text="Agrega ingredientes con costo a tus recetas para ver un ranking aquí."
                  href="/recetas"
                  cta="Ir a Recetas"
                  canCreate={can("recipes", "create")}
                />
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Estado vacío liviano dentro de una tarjeta ──────────────────────────────

function EmptyMiniState({
  text,
  href,
  cta,
  canCreate,
}: {
  text: string
  href: string
  cta: string
  canCreate: boolean
}) {
  return (
    <div className="flex flex-col items-center text-center gap-3 py-6">
      <p className="text-sm max-w-[240px]" style={{ color: "var(--text-muted)" }}>{text}</p>
      {canCreate && (
        <Link href={href}>
          <Button variant="ghost" size="sm">
            {cta}
            <ArrowRight size={13} />
          </Button>
        </Link>
      )}
    </div>
  )
}

// ─── Hero: costo promedio por porción ────────────────────────────────────────

function AvgCostHero({ value }: { value: number | null }) {
  return (
    <div
      className="rounded-2xl p-6 flex flex-col justify-center gap-1.5 h-full"
      style={{ background: "var(--accent-light)", border: "1px solid var(--accent)" }}
    >
      <div className="flex items-center gap-2">
        <Coins size={14} style={{ color: "var(--accent)" }} />
        <p className="text-xs font-semibold tracking-widest" style={{ color: "var(--accent-text)" }}>
          COSTO PROMEDIO POR PORCIÓN
        </p>
      </div>
      {value != null ? (
        <>
          <p className="font-display text-5xl font-bold tabular-nums" style={{ color: "var(--accent-text)", lineHeight: 1.05 }}>
            {COP.format(value)}
          </p>
          <p className="text-sm" style={{ color: "var(--accent-text)", opacity: 0.75 }}>
            Materia prima en tus recetas costeadas
          </p>
        </>
      ) : (
        <>
          <p className="font-display text-3xl font-bold" style={{ color: "var(--accent-text)", opacity: 0.5 }}>
            —
          </p>
          <p className="text-sm" style={{ color: "var(--accent-text)", opacity: 0.75 }}>
            Agrega ingredientes con costo a tus recetas para ver esta cifra
          </p>
        </>
      )}
    </div>
  )
}

// ─── Panorama: franja de conteos unida (no tarjetas sueltas) ─────────────────

function StatStrip({
  ingredients,
  recipes,
  menus,
  team,
  can,
  hasFeature,
}: {
  ingredients: number
  recipes: number
  menus: number
  team: { members: number; limit: number | null }
  can: (resource: Resource, action: Action) => boolean
  hasFeature: (key: string) => boolean
}) {
  const allSegments = [
    { icon: Package, label: "Ingredientes", value: String(ingredients), href: "/inventario", resource: "ingredients" as const, feature: "module_ingredients" },
    { icon: ChefHat, label: "Recetas propias", value: String(recipes), href: "/recetas", resource: "recipes" as const, feature: "module_recipes" },
    { icon: UtensilsCrossed, label: "Menús", value: String(menus), href: "/menu", resource: "menus" as const, feature: "module_menus" },
    {
      icon: Users,
      label: "Equipo",
      value: team.limit != null ? `${team.members}/${team.limit}` : String(team.members),
      href: "/configuracion/equipo",
      progress: team.limit != null ? team.members / team.limit : undefined,
      resource: "members" as const,
      feature: undefined,
    },
  ]

  const segments = allSegments.filter(
    (s) => can(s.resource, "list") && (!s.feature || hasFeature(s.feature))
  )

  return (
    <div
      className="rounded-2xl flex flex-col sm:flex-row h-full"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border-light)" }}
    >
      {segments.map((s, i) => (
        <Link
          key={s.label}
          href={s.href}
          className={`flex-1 flex flex-col gap-2 p-4 transition-colors hover:bg-[var(--bg-secondary)] ${
            i > 0 ? "border-t sm:border-t-0 sm:border-l border-[var(--border-light)]" : ""
          }`}
        >
          <div className="flex items-center gap-2">
            <s.icon size={14} style={{ color: "var(--text-muted)" }} />
            <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{s.label}</p>
          </div>
          <p className="text-2xl font-bold font-mono tabular-nums" style={{ color: "var(--text-primary)" }}>{s.value}</p>
          {s.progress !== undefined && (
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-secondary)" }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.min(100, s.progress * 100)}%`, background: s.progress >= 1 ? "#EF4444" : "var(--accent)" }}
              />
            </div>
          )}
        </Link>
      ))}
    </div>
  )
}

// ─── Checklist de onboarding ──────────────────────────────────────────────────

function OnboardingChecklist({
  checklist,
  canCreate,
  can,
  hasFeature,
}: {
  checklist: { hasIngredients: boolean; hasRecipes: boolean; hasMenus: boolean; hasTeam: boolean }
  canCreate: boolean
  can: (resource: Resource, action: Action) => boolean
  hasFeature: (key: string) => boolean
}) {
  const allSteps = [
    {
      done: checklist.hasIngredients,
      title: "Agrega tu primer ingrediente",
      description: "Registra los insumos de tu cocina con su costo, o importa del banco público.",
      href: "/inventario",
      cta: "Ir a Inventario",
      resource: "ingredients" as const,
      feature: "module_ingredients",
    },
    {
      done: checklist.hasRecipes,
      title: "Crea tu primera receta",
      description: "Arma la ficha técnica con componentes y calcula su costo exacto.",
      href: "/recetas",
      cta: "Ir a Recetas",
      resource: "recipes" as const,
      feature: "module_recipes",
    },
    {
      done: checklist.hasMenus,
      title: "Arma tu primer menú",
      description: "Combina recetas y calcula el costo por persona de un evento.",
      href: "/menu",
      cta: "Ir a Menús",
      resource: "menus" as const,
      feature: "module_menus",
    },
    {
      done: checklist.hasTeam,
      title: "Invita a tu equipo",
      description: "Suma a tu chef o analista con el rol adecuado. (Opcional)",
      href: "/configuracion/equipo",
      cta: "Invitar",
      optional: true,
      resource: "invitations" as const,
      feature: undefined,
    },
  ]

  // Un paso solo aparece si el usuario tiene permiso de rol Y la membresía
  // habilita ese módulo — igual que el Sidebar, para que el checklist nunca
  // ofrezca un atajo a algo que está bloqueado.
  const steps = allSteps.filter(
    (s) => can(s.resource, "list") && (!s.feature || hasFeature(s.feature))
  )

  const required = steps.filter((s) => !s.optional)
  const doneCount = required.filter((s) => s.done).length
  const progress = (doneCount / required.length) * 100

  return (
    <Card>
      {/* Barra de progreso */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2 shrink-0">
          <Sparkles size={16} style={{ color: "var(--accent)" }} />
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Primeros pasos</span>
        </div>
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
        {steps.map((step, i) => (
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
              <div
                className="shrink-0 w-[22px] h-[22px] rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                style={{ background: "var(--accent-light)", color: "var(--accent)" }}
              >
                {i + 1}
              </div>
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
  bg,
  color,
}: {
  icon: typeof Package
  label: string
  href: string
  bg: string
  color: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl px-4 h-[56px] transition-all hover:border-[var(--accent)] hover:shadow-[0_2px_12px_rgba(18,33,58,0.08)]"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border-light)" }}
    >
      <span
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: bg }}
      >
        <Plus size={14} style={{ color }} />
      </span>
      <span className="flex items-center gap-2 text-sm font-medium min-w-0" style={{ color: "var(--text-primary)" }}>
        <Icon size={14} style={{ color: "var(--text-muted)" }} className="shrink-0" />
        <span className="truncate">{label}</span>
      </span>
    </Link>
  )
}
