import type { PlanId, PaidPlanId } from "./catalog"

// ── Intención de compra según el plan actual ────────────────────────────────
// Espeja billing.logic.ts (resolvePlanIntent) en el backend. Se mantiene puro
// para poder testearlo sin red.

export type PlanIntent = "new" | "upgrade" | "blocked" | "trial-activate"

export interface PlanContext {
  /** membership persistida en la organización */
  membership: PlanId
  /** membership efectiva (aplica downgrade por trial vencido) */
  effectiveMembership: PlanId
  isTrialing: boolean
  hasOrganization: boolean
}

const RANK: Record<PlanId, number> = { free: 0, pro: 1, academia: 2 }

/**
 * Qué significa que este usuario pulse "Elegir/Actualizar a `target`".
 *
 *  - "new"            → adquisición desde cero (sin plan pago)
 *  - "trial-activate" → está en trial del mismo plan y quiere pagarlo definitivo
 *  - "upgrade"        → paga un plan inferior y sube (pro → academia)
 *  - "blocked"        → ya tiene ese plan pago, o intenta bajar de nivel
 */
export function resolvePlanIntent(ctx: PlanContext, target: PaidPlanId): PlanIntent {
  if (!ctx.hasOrganization) return "new"

  if (ctx.isTrialing) {
    // El trial Pro no es un plan pago: comprar cualquier plago es adquisición.
    return target === "pro" ? "trial-activate" : "new"
  }

  const current = ctx.effectiveMembership
  if (current === target) return "blocked"
  if (RANK[target] > RANK[current]) {
    return current === "free" ? "new" : "upgrade"
  }
  return "blocked" // downgrade
}

/** Texto del CTA en /planes y el modal de upgrade. */
export function planCtaLabel(intent: PlanIntent, target: PaidPlanId): string {
  const label = target === "pro" ? "Pro" : "Academia"
  switch (intent) {
    case "upgrade":
      return `Actualizar a ${label}`
    case "blocked":
      return "Ver mi suscripción"
    case "trial-activate":
      return `Activar ${label}`
    default:
      return `Elegir ${label}`
  }
}

/** ¿El intento debe llevar al checkout, o solo mostrar contexto informativo? */
export function intentAllowsCheckout(intent: PlanIntent): boolean {
  return intent !== "blocked"
}
