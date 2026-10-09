import { describe, it, expect, vi } from "vitest"
import { renderToString } from "react-dom/server"
import PuntoEquilibrioPage from "@/app/(app)/punto-equilibrio/page"

// Store controlado: la página (y usePermissions) leen de useSWR, que en SSR
// nunca termina de cargar — con fallback de SWR isLoading sigue en true.
const store = vi.hoisted(() => ({ data: {} as Record<string, unknown> }))

vi.mock("swr", () => {
  const useSWR = (key: string) => ({
    data: store.data[key],
    error: undefined,
    isLoading: false,
    mutate: async () => undefined,
  })
  return { default: useSWR, useSWR }
})

// Contexto de autorización mínimo: módulo y exports habilitados.
const authzContext = {
  scope: "organization",
  permissions: ["list:breakEven", "read:breakEven", "create:breakEven"],
  roles: ["org_owner"],
  platformRoles: [],
  platformPermissions: [],
  organization: {
    id: "3f1b7a2e-0000-4000-8000-000000000010",
    name: "Negocio de prueba",
    features: [
      { key: "module_breakEven", enabled: true, limit: null, lockedMessage: null },
      { key: "exports", enabled: true, limit: null, lockedMessage: null },
    ],
  },
  memberships: [],
}

const historyRecord = {
  id: "3f1b7a2e-0000-4000-8000-000000000011",
  organizationId: "3f1b7a2e-0000-4000-8000-000000000010",
  fixedCosts: [{ name: "Arriendo", amount: 6585000 }],
  totalFixedCosts: 6585000,
  salePrice: 28500,
  variableCost: 9000,
  contributionMargin: 19500,
  breakEvenUnits: 337.69,
  breakEvenRevenue: 9624230.77,
  createdAt: "2026-05-01T12:00:00Z",
}

function renderPage(history: unknown[]) {
  store.data = {
    "me/context": authzContext,
    "break-even-history": history,
  }
  return renderToString(<PuntoEquilibrioPage />)
}

describe("Punto de Equilibrio — header con pestañas", () => {
  it("muestra las pestañas Calculadora/Historial y arranca en la calculadora en blanco", () => {
    const html = renderPage([historyRecord])

    expect(html).toContain("Punto de Equilibrio")
    expect(html).toContain("Calculadora")
    expect(html).toContain("Historial")
    // Vista inicial: la calculadora, no el historial
    expect(html).toContain("Calculadora de punto de equilibrio")
    expect(html).not.toContain("Unidades al mes")
    expect(html).not.toContain("Exportar Excel")
  })

  it("un cálculo nuevo no precarga costos del último cálculo guardado", () => {
    const html = renderPage([historyRecord])

    // Sin datos de ejemplo ni del historial: lista vacía y total en cero
    expect(html).not.toContain('aria-label="Quitar Arriendo"')
    expect(html).not.toContain("6.585.000")
    expect(html).toContain("Aún no has agregado costos")
    expect(html).not.toContain("Empezar en blanco")
  })
})
