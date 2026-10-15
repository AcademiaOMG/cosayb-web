import { describe, it, expect } from "vitest"
import { deviceLabel, lastSeenLabel, parseOrgFilters, parseUserFilters, toUrlParams, totalPages, withFilter } from "./clientes"

describe("filtros de clientes", () => {
  it("ignora valores inválidos y aplica los por defecto", () => {
    const f = parseOrgFilters(new URLSearchParams("plan=oro&sort=zzz&page=-3&trial=expired&dir=asc"))
    expect(f).toMatchObject({ plan: undefined, sort: "created", page: 1, trial: "expired", dir: "asc", search: "" })
  })

  it("ida y vuelta estado ↔ URL, sin parámetros por defecto", () => {
    const f = parseOrgFilters(new URLSearchParams("q=caf%C3%A9&plan=pro&billing=past_due&sort=members&page=3"))
    expect(new URLSearchParams(toUrlParams(f)).get("q")).toBe("café")
    expect(parseOrgFilters(new URLSearchParams(toUrlParams(f)))).toEqual(f)
    expect(toUrlParams(parseOrgFilters(new URLSearchParams("")))).toBe("")
  })

  it("cambiar un filtro vuelve a la página 1", () => {
    const f = parseUserFilters(new URLSearchParams("page=4"))
    expect(withFilter(f, { verified: "no" })).toMatchObject({ verified: "no", page: 1 })
  })

  it("calcula páginas y textos de fechas/dispositivos", () => {
    expect(totalPages(0, 25)).toBe(1)
    expect(totalPages(51, 25)).toBe(3)
    const now = new Date("2026-10-15T12:00:00Z")
    expect(lastSeenLabel(null, now)).toBe("Sin accesos")
    expect(lastSeenLabel("2026-10-15T01:00:00Z", now)).toBe("Hoy")
    expect(lastSeenLabel("2026-10-12T12:00:00Z", now)).toBe("Hace 3 días")
    expect(lastSeenLabel("2026-07-01T12:00:00Z", now)).toBe("Hace 3 meses")
    expect(deviceLabel("Mozilla/5.0 (Windows NT 10.0) Chrome/120 Safari/537")).toBe("Chrome en Windows")
    expect(deviceLabel(null)).toBe("Dispositivo desconocido")
  })
})
