import { describe, it, expect } from "vitest"
import { visibleGroups, firstSectionFor, landingRedirect, breadcrumbsFor, isSectionActive, SECTIONS } from "./nav"

const hrefs = (roles: string[]) => visibleGroups(roles).flatMap((g) => g.items.map((i) => i.href))

describe("visibilidad por rol", () => {
  it("el dueño ve todo", () => {
    expect(hrefs(["platform_owner"])).toHaveLength(SECTIONS.length)
  })
  it("soporte ve organizaciones, usuarios y soporte", () => {
    expect(hrefs(["platform_support"])).toEqual([
      "/plataforma/organizaciones",
      "/plataforma/usuarios",
      "/plataforma/soporte",
    ])
  })
  it("facturación ve ingresos y organizaciones", () => {
    expect(hrefs(["platform_billing"])).toEqual([
      "/plataforma/organizaciones",
      "/plataforma/suscripciones",
      "/plataforma/pagos",
      "/plataforma/membresias",
    ])
  })
  it("chef solo ve el catálogo", () => {
    expect(visibleGroups(["platform_chef"]).map((g) => g.label)).toEqual(["Catálogo"])
  })
  it("solo el dueño ve roles y permisos", () => {
    expect(hrefs(["platform_admin"])).not.toContain("/plataforma/roles")
    expect(hrefs(["platform_owner"])).toContain("/plataforma/roles")
  })
  it("sin roles no ve nada", () => {
    expect(visibleGroups([])).toEqual([])
  })
})

describe("landing", () => {
  it("primera sección visible", () => {
    expect(firstSectionFor(["platform_chef"])).toBe("/plataforma/banco/recetas")
    expect(firstSectionFor(["platform_support"])).toBe("/plataforma/organizaciones")
    expect(firstSectionFor([])).toBe("/plataforma")
  })
  it("redirige solo desde /plataforma cuando el rol no ve el resumen", () => {
    expect(landingRedirect("/plataforma", ["platform_chef"])).toBe("/plataforma/banco/recetas")
    expect(landingRedirect("/plataforma", ["platform_owner"])).toBeNull()
    expect(landingRedirect("/plataforma/usuarios", ["platform_chef"])).toBeNull()
    expect(landingRedirect("/plataforma", [])).toBeNull()
  })
})

describe("sección activa", () => {
  it("el resumen solo coincide exacto", () => {
    expect(isSectionActive("/plataforma", "/plataforma")).toBe(true)
    expect(isSectionActive("/plataforma/pagos", "/plataforma")).toBe(false)
    expect(isSectionActive("/plataforma/pagos/abc", "/plataforma/pagos")).toBe(true)
  })
})

describe("migas de pan", () => {
  it("resumen", () => {
    expect(breadcrumbsFor("/plataforma")).toEqual([{ label: "Resumen" }])
  })
  it("sección con grupo", () => {
    expect(breadcrumbsFor("/plataforma/organizaciones")).toEqual([
      { label: "Plataforma", href: "/plataforma" },
      { label: "Clientes" },
      { label: "Organizaciones" },
    ])
  })
  it("detalle no muestra identificadores", () => {
    const c = breadcrumbsFor("/plataforma/organizaciones/3f9a-uuid/")
    expect(c.map((x) => x.label)).toEqual(["Plataforma", "Clientes", "Organizaciones", "Detalle"])
    expect(c[2].href).toBe("/plataforma/organizaciones")
    expect(c[3].href).toBeUndefined()
  })
  it("banco", () => {
    expect(breadcrumbsFor("/plataforma/banco/recetas/nuevo").map((x) => x.label)).toEqual([
      "Plataforma", "Catálogo", "Banco de recetas", "Nuevo",
    ])
  })
  it("ruta desconocida", () => {
    expect(breadcrumbsFor("/plataforma/xyz").map((x) => x.label)).toEqual(["Plataforma", "Página no encontrada"])
  })
})
