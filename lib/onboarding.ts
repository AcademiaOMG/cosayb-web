import type { Resource, Action, DashboardSummary } from "./api"

/** Clave SWR compartida del resumen del dashboard (checklist de onboarding). */
export const DASHBOARD_SUMMARY_KEY = "dashboard-summary"

export type Checklist = DashboardSummary["checklist"]

export interface OnboardingStep {
  id: "ingredients" | "recipes" | "menus"
  /** Número de orden sugerido (1-based). */
  order: number
  title: string
  href: string
  done: boolean
}

export type PermCheck = (resource: Resource, action: Action) => boolean
export type FeatureCheck = (key: string) => boolean

/**
 * Pasos de onboarding en el orden sugerido: 1 Inventario → 2 Recetas → 3 Menú.
 * Un paso solo se muestra si el usuario tiene permiso de rol Y la membresía
 * habilita el módulo — mismo criterio que el Sidebar, para no ofrecer un
 * atajo a algo que está bloqueado.
 */
export function buildSteps(
  checklist: Checklist,
  can: PermCheck,
  hasFeature: FeatureCheck,
): OnboardingStep[] {
  const gated: Array<{
    step: Omit<OnboardingStep, "order">
    resource: Resource
    feature: string
  }> = [
    {
      step: {
        id: "ingredients",
        title: "Inventario",
        href: "/inventario",
        done: checklist.hasIngredients,
      },
      resource: "ingredients",
      feature: "module_ingredients",
    },
    {
      step: {
        id: "recipes",
        title: "Recetas",
        href: "/recetas",
        done: checklist.hasRecipes,
      },
      resource: "recipes",
      feature: "module_recipes",
    },
    {
      step: {
        id: "menus",
        title: "Menú",
        href: "/menu",
        done: checklist.hasMenus,
      },
      resource: "menus",
      feature: "module_menus",
    },
  ]

  return gated
    .filter((g) => can(g.resource, "list") && hasFeature(g.feature))
    .map((g, i) => ({ ...g.step, order: i + 1 }))
}

export interface OnboardingProgress {
  done: number
  required: number
  pct: number
  /** true cuando todos los pasos visibles están completos (o no hay pasos). */
  complete: boolean
}

export function computeProgress(steps: OnboardingStep[]): OnboardingProgress {
  const required = steps.length
  const done = steps.filter((s) => s.done).length
  return {
    done,
    required,
    pct: required === 0 ? 0 : Math.round((done / required) * 100),
    complete: required === 0 || done === required,
  }
}
