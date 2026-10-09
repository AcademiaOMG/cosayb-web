import { describe, it, expect, vi } from "vitest"
import { renderToString } from "react-dom/server"
import type { ReactNode } from "react"
import { SWRConfig } from "swr"
import SidebarChecklist from "@/components/app/SidebarChecklist"
import type { AuthzContext, DashboardSummary } from "./api"
import { DASHBOARD_SUMMARY_KEY } from "./onboarding"

/**
 * Render (SSR) del checklist "Primeros pasos" en sus dos superficies.
 * El orden/gating/progreso como lógica pura viven en onboarding.test.ts;
 * acá solo se cubre el contrato de render: variante surface de Inicio
 * móvil, variante inverse del sidebar, ocultado al completar y skeleton
 * durante la carga inicial.
 */

const { pathnameState } = vi.hoisted(() => ({ pathnameState: { current: "/inventario" } }))

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameState.current,
}))

vi.mock("next/link", async () => {
  const { createElement } = await import("react")
  return {
    default: ({
      href,
      children,
      ...rest
    }: {
      href?: unknown
      children?: ReactNode
      [key: string]: unknown
    }) =>
      createElement(
        "a",
        { href: typeof href === "string" ? href : "/", ...rest },
        children,
      ),
  }
})

function fullContext(): AuthzContext {
  return {
    scope: "organization",
    identityType: "tenant",
    roles: ["owner"],
    permissions: ["list:ingredients", "list:recipes", "list:menus"],
    organization: {
      id: "org_test",
      name: "Org Test",
      membership: "pro",
      features: [
        { key: "module_ingredients", enabled: true, limit: null, lockedMessage: null },
        { key: "module_recipes", enabled: true, limit: null, lockedMessage: null },
        { key: "module_menus", enabled: true, limit: null, lockedMessage: null },
      ],
    },
    memberships: [],
    platformRoles: [],
    platformPermissions: [],
    impersonation: null,
  }
}

function summary(checklist: DashboardSummary["checklist"]): DashboardSummary {
  return {
    counts: {
      ingredients: checklist.hasIngredients ? 1 : 0,
      recipes: checklist.hasRecipes ? 1 : 0,
      menus: checklist.hasMenus ? 1 : 0,
    },
    team: { members: 1, limit: null },
    avgCostPerServing: null,
    topRecipes: [],
    recentRecipes: [],
    checklist,
    onboardingComplete:
      checklist.hasIngredients && checklist.hasRecipes && checklist.hasMenus,
  }
}

const EMPTY_CHECKLIST: DashboardSummary["checklist"] = {
  hasIngredients: false,
  hasRecipes: false,
  hasMenus: false,
  hasTeam: false,
}

const DONE_CHECKLIST: DashboardSummary["checklist"] = {
  hasIngredients: true,
  hasRecipes: true,
  hasMenus: true,
  hasTeam: true,
}

function renderWith(
  ui: ReactNode,
  opts: {
    checklist?: DashboardSummary["checklist"]
    pathname?: string
    /** Sin fallback de dashboard-summary → estado de carga (skeleton). */
    skipSummary?: boolean
  } = {},
) {
  pathnameState.current = opts.pathname ?? "/dashboard"
  const html = renderToString(
    <SWRConfig
      value={{
        provider: () => new Map<string, never>(),
        // Con fallback y revalidateIfStale (default true) SWR marca
        // isLoading=true incluso en SSR y los componentes retornan null.
        revalidateIfStale: false,
        fallback: {
          "me/context": fullContext(),
          ...(opts.skipSummary
            ? {}
            : {
                [DASHBOARD_SUMMARY_KEY]: summary(opts.checklist ?? EMPTY_CHECKLIST),
              }),
        },
      }}
    >
      {ui}
    </SWRConfig>,
  )
  return html.replace(/<!--.*?-->/g, "")
}

describe("SidebarChecklist", () => {
  it("variante surface (Inicio móvil/tablet): glass del dashboard, orden y x/3", () => {
    const html = renderWith(<SidebarChecklist variant="surface" />)

    expect(html).toContain("glass")
    expect(html).toContain("Primeros pasos")
    expect(html).toContain("0/3")
    expect(html).toContain('aria-valuenow="0"')

    const pos = [
      html.indexOf('href="/inventario"'),
      html.indexOf('href="/recetas"'),
      html.indexOf('href="/menu"'),
    ]
    expect(pos[0]).toBeGreaterThan(-1)
    expect(pos[1]).toBeGreaterThan(pos[0])
    expect(pos[2]).toBeGreaterThan(pos[1])

    // La paleta del sidebar oscuro no debe filtrarse sobre fondo claro.
    expect(html).not.toContain("rgba(255,255,255,0.04)")
    expect(html).not.toContain("#8FA0BC")
  })

  it("sin datos de summary muestra skeleton (animate-pulse) sin cifras, y no con datos", () => {
    const surface = renderWith(<SidebarChecklist variant="surface" />, { skipSummary: true })
    const inverse = renderWith(<SidebarChecklist />, { skipSummary: true })

    expect(surface).toContain("animate-pulse")
    expect(surface).toContain('aria-busy="true"')
    expect(surface).not.toContain("0/3")
    expect(inverse).toContain("animate-pulse")
    expect(inverse).toContain('aria-busy="true"')
    expect(inverse).not.toContain("0/3")

    // Con datos ya cargados no debe quedar rastro del skeleton.
    expect(renderWith(<SidebarChecklist variant="surface" />)).not.toContain("animate-pulse")
    expect(renderWith(<SidebarChecklist />)).not.toContain("animate-pulse")
  })

  it("oculta el checklist con onboarding completo (3/3) en ambas variantes", () => {
    expect(renderWith(<SidebarChecklist variant="surface" />, { checklist: DONE_CHECKLIST })).toBe("")
    expect(renderWith(<SidebarChecklist />, { checklist: DONE_CHECKLIST })).toBe("")
  })

  it("por defecto (sidebar) conserva la paleta del aside oscuro", () => {
    const html = renderWith(<SidebarChecklist />)

    expect(html).toContain("0/3")
    expect(html).toContain("rgba(255,255,255,0.04)")
    expect(html).toContain("#8FA0BC")
    expect(html).not.toContain("glass px-4")
  })
})
