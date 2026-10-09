import { describe, it, expect, vi } from "vitest"
import { renderToString } from "react-dom/server"
import MenuPage from "@/app/(app)/menu/page"

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
  // useRevalidateOnboarding usa useSWRConfig().mutate
  const useSWRConfig = () => ({ mutate: async () => undefined, cache: new Map() })
  return { default: useSWR, useSWR, useSWRConfig }
})

// Contexto de autorización mínimo: módulo de menús habilitado.
const authzContext = {
  scope: "organization",
  permissions: ["list:menus", "read:menus", "create:menus"],
  roles: ["org_owner"],
  platformRoles: [],
  platformPermissions: [],
  organization: {
    id: "3f1b7a2e-0000-4000-8000-000000000010",
    name: "Negocio de prueba",
    features: [
      { key: "module_menus", enabled: true, limit: null, lockedMessage: null },
    ],
  },
  memberships: [],
}

const menuRecord = {
  id: "3f1b7a2e-0000-4000-8000-000000000011",
  nombre: "Menú de prueba",
  fecha: "2026-05-01",
  numPersonas: 20,
  pctMateriaPrima: "30",
  recetas: [],
}

function renderPage(menus: unknown[], permissions = authzContext.permissions) {
  store.data = {
    "me/context": { ...authzContext, permissions },
    menus,
  }
  return renderToString(<MenuPage />)
}

// Rol que puede listar menús pero no crearlos: no tiene calculadora
const READ_ONLY = ["list:menus", "read:menus"]

describe("Menús — header con pestañas", () => {
  it("muestra las pestañas Calculadora/Historial y arranca en la calculadora", () => {
    const html = renderPage([])

    expect(html).toContain("Menús")
    expect(html).toContain("Calculadora")
    expect(html).toContain("Historial")
    // La calculadora (pantalla + botón Calcular) es lo primero que se ve
    expect(html).toContain("Calculadora del menú")
    expect(html).not.toContain("No hay menús creados")
    expect(html).not.toContain("Nuevo menú")
  })

  it("sin permiso para crear arranca en el historial", () => {
    const html = renderPage([], READ_ONLY)

    expect(html).toContain("No hay menús creados")
    expect(html).not.toContain("Calculadora del menú")
  })

  it("lista los menús guardados en el historial", () => {
    const html = renderPage([menuRecord], READ_ONLY)

    expect(html).toContain("Menú de prueba")
  })
})
