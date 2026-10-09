"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Check, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePermissions } from "@/hooks/usePermissions"
import { useOnboardingChecklist } from "@/hooks/useOnboardingChecklist"
import { buildSteps, computeProgress } from "@/lib/onboarding"

/**
 * Checklist "Primeros pasos" (orden sugerido 1 Inventario → 2 Recetas →
 * 3 Menú + progreso x/3) en dos superficies:
 *
 * - `inverse` (default): Sidebar oscuro (desktop lg+), lista vertical,
 *   visible desde cualquier sección.
 * - `surface`: Inicio en móvil/tablet (debajo de lg, donde no existe
 *   Sidebar) como mini cards con el check de cada paso, en el lenguaje
 *   del dashboard (glass + píldora de acento).
 *
 * Se oculta cuando el onboarding está completo o hay error; mientras
 * carga muestra un skeleton con el mismo layout (sin cifras reales).
 */
type ChecklistVariant = "inverse" | "surface"

const INVERSE = {
  track: "rgba(255,255,255,0.08)",
  fill: "var(--accent)",
  stepActive: { background: "rgba(255,255,255,0.08)", color: "#fff" },
  stepIdle: "#8FA0BC",
  stepDone: "#4ADE80",
  badge: { background: "rgba(255,255,255,0.08)", color: "#8FA0BC" },
} as const

export default function SidebarChecklist({
  variant = "inverse",
  className,
}: {
  variant?: ChecklistVariant
  /** Clases extra del raíz (p. ej. `lg:hidden` en Inicio móvil). */
  className?: string
}) {
  const pathname = usePathname()
  const { can, hasFeature, isLoading: permsLoading } = usePermissions()
  const { data, error } = useOnboardingChecklist()

  // Error → nada (un skeleton eterno daría a entender carga infinita).
  if (error) return null
  // Carga inicial → skeleton con el mismo layout para que el espacio se vea
  // de inmediato en lugar de aparecer de golpe cuando responde el server.
  if (permsLoading || !data)
    return <ChecklistSkeleton variant={variant} className={className} />

  const steps = buildSteps(data.checklist, can, hasFeature)
  const progress = computeProgress(steps)
  if (progress.complete) return null

  const isActiveStep = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`)

  // ── Inicio móvil/tablet: sección con mini cards ───────────────────────────
  if (variant === "surface") {
    return (
      <div
        className={cn("flex flex-col gap-3", className)}
        aria-label="Primeros pasos"
      >
        <div className="flex items-center justify-between">
          <p
            className="font-display text-[15px] font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Primeros pasos
          </p>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: "var(--accent-light)", color: "var(--accent-text)" }}
          >
            {progress.done}/{progress.required}
          </span>
        </div>

        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ background: "var(--bg-secondary)" }}
          role="progressbar"
          aria-valuenow={progress.done}
          aria-valuemin={0}
          aria-valuemax={progress.required}
          aria-label={`Progreso del onboarding: ${progress.done} de ${progress.required}`}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${progress.pct}%`, background: "var(--accent)" }}
          />
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {steps.map((step) => {
            const active = isActiveStep(step.href)
            return (
              <Link
                key={step.id}
                href={step.href}
                className="glass flex flex-col items-center gap-2 py-3.5 px-2 text-center"
                style={{
                  borderRadius: "var(--radius-md)",
                  boxShadow: active
                    ? "var(--shadow-sm), 0 0 0 2px var(--accent)"
                    : undefined,
                }}
                aria-current={active ? "page" : undefined}
              >
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={
                    step.done
                      ? { background: "var(--success)" }
                      : { background: "var(--accent-light)", color: "var(--accent-text)" }
                  }
                  aria-hidden
                >
                  {step.done ? (
                    <Check size={15} color="#fff" />
                  ) : (
                    <span className="text-xs font-bold">{step.order}</span>
                  )}
                </span>
                <span
                  className="text-xs font-semibold leading-tight"
                  style={{
                    color: step.done ? "var(--text-muted)" : "var(--text-primary)",
                    textDecoration: step.done ? "line-through" : "none",
                  }}
                >
                  {step.title}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Sidebar oscuro: lista vertical ────────────────────────────────────────
  return (
    <div
      className="px-3 py-3 rounded-xl mx-3 mt-5 mb-4 shrink-0"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
      aria-label="Primeros pasos"
    >
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={13} style={{ color: "var(--accent)" }} aria-hidden />
        <p
          className="text-[10px] font-bold tracking-[0.14em] uppercase"
          style={{ color: "#5B6B85" }}
        >
          Primeros pasos
        </p>
        <span
          className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md"
          style={{ background: "rgba(255,255,255,0.08)", color: "#8FA0BC" }}
        >
          {progress.done}/{progress.required}
        </span>
      </div>

      <div
        className="h-1.5 rounded-full overflow-hidden mb-3"
        style={{ background: INVERSE.track }}
        role="progressbar"
        aria-valuenow={progress.done}
        aria-valuemin={0}
        aria-valuemax={progress.required}
        aria-label={`Progreso del onboarding: ${progress.done} de ${progress.required}`}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${progress.pct}%`, background: INVERSE.fill }}
        />
      </div>

      <ul className="flex flex-col gap-1" role="list">
        {steps.map((step) => {
          const isActive = isActiveStep(step.href)
          return (
            <li key={step.id}>
              <Link
                href={step.href}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{
                  background: isActive ? INVERSE.stepActive.background : "transparent",
                  color: step.done
                    ? INVERSE.stepDone
                    : isActive
                      ? INVERSE.stepActive.color
                      : INVERSE.stepIdle,
                }}
                aria-current={isActive ? "page" : undefined}
              >
                {step.done ? (
                  <Check size={14} className="shrink-0" aria-hidden />
                ) : (
                  <span
                    className="shrink-0 w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={INVERSE.badge}
                    aria-hidden
                  >
                    {step.order}
                  </span>
                )}
                <span style={{ textDecoration: step.done ? "line-through" : "none" }}>
                  {step.title}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/**
 * Esqueleto de carga: imita el layout real de cada variante para que el
 * espacio reserve de inmediato y la comprobación no "salte" al llegar los
 * datos. Sin datos no se sabe el progreso → nunca muestra cifras reales.
 */
function ChecklistSkeleton({
  variant,
  className,
}: {
  variant: ChecklistVariant
  className?: string
}) {
  if (variant === "surface") {
    return (
      <div
        className={cn("flex flex-col gap-3", className)}
        aria-label="Primeros pasos"
        aria-busy="true"
      >
        <div className="flex items-center justify-between">
          <div
            className="h-4 w-28 rounded animate-pulse"
            style={{ background: "var(--bg-secondary)" }}
          />
          <div
            className="h-4 w-9 rounded-full animate-pulse"
            style={{ background: "var(--bg-secondary)" }}
          />
        </div>
        <div
          className="h-1.5 rounded-full animate-pulse"
          style={{ background: "var(--bg-secondary)" }}
        />
        <div className="grid grid-cols-3 gap-2.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-2 py-3.5 px-2 animate-pulse"
              style={{
                background: "var(--bg-secondary)",
                borderRadius: "var(--radius-md)",
              }}
            >
              <span
                className="w-7 h-7 rounded-full"
                style={{ background: "var(--bg-primary)" }}
              />
              <span
                className="h-3 w-12 rounded"
                style={{ background: "var(--bg-primary)" }}
              />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      className="px-3 py-3 rounded-xl mx-3 mt-5 mb-4 shrink-0"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
      aria-label="Primeros pasos"
      aria-busy="true"
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="h-3 w-24 rounded animate-pulse"
          style={{ background: "rgba(255,255,255,0.06)" }}
        />
        <div
          className="ml-auto h-3.5 w-8 rounded-md animate-pulse"
          style={{ background: "rgba(255,255,255,0.08)" }}
        />
      </div>
      <div
        className="h-1.5 rounded-full mb-3 animate-pulse"
        style={{ background: "rgba(255,255,255,0.08)" }}
      />
      <ul className="flex flex-col gap-1" role="list">
        {[1, 2, 3].map((i) => (
          <li key={i} className="flex items-center gap-2.5 px-2 py-1.5">
            <span
              className="shrink-0 w-[18px] h-[18px] rounded-full animate-pulse"
              style={{ background: "rgba(255,255,255,0.08)" }}
            />
            <span
              className="h-3 w-24 rounded animate-pulse"
              style={{ background: "rgba(255,255,255,0.06)" }}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
