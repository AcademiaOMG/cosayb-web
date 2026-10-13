import { describe, it, expect } from "vitest"
import { NAV_GROUPS, MOBILE_PRIMARY_HREFS, CONFIG_ITEM, ACCOUNT_ITEM, isNavActive } from "./navigation"

const allHrefs = NAV_GROUPS.flatMap((g) => g.items.map((i) => i.href))

describe("navigation config", () => {
  it("no repite rutas", () => {
    const all = [...allHrefs, CONFIG_ITEM.href, ACCOUNT_ITEM.href]
    expect(new Set(all).size).toBe(all.length)
  })

  it("incluye todas las secciones del producto", () => {
    for (const h of [
      "/dashboard", "/inventario", "/factor-rendimiento", "/recetas", "/menu",
      "/valoracion", "/punto-equilibrio", "/precios-mercado", "/configuracion", "/cuenta",
    ]) {
      expect([...allHrefs, CONFIG_ITEM.href, ACCOUNT_ITEM.href]).toContain(h)
    }
  })

  it("la barra móvil fija 4 destinos que existen en la config", () => {
    expect(MOBILE_PRIMARY_HREFS).toHaveLength(4)
    for (const h of MOBILE_PRIMARY_HREFS) expect(allHrefs).toContain(h)
  })

  it("isNavActive coincide por prefijo de segmento, no de texto", () => {
    expect(isNavActive("/menu", "/menu")).toBe(true)
    expect(isNavActive("/menu/123", "/menu")).toBe(true)
    expect(isNavActive("/menus-otro", "/menu")).toBe(false)
  })
})
