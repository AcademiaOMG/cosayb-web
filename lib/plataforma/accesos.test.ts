import { describe, expect, it } from "vitest"
import {
  accessApiQuery, accessCsvName, accessToUrl, activityApiQuery, activityToUrl, deviceText, parseAccessFilters,
  parseActivityFilters, resultInfo, withAccessFilter,
} from "./accesos"
import { relativeTime } from "./auditView"

const parse = (q: string) => parseAccessFilters(new URLSearchParams(q))

describe("filtros de últimos accesos", () => {
  it("valores por defecto y basura en la URL", () => {
    expect(parse("")).toEqual({ search: "", days: 0, team: false, status: undefined, inactiveDays: 30, sort: "last_access", dir: "desc", page: 1 })
    expect(parse("dias=5&estado=x&orden=raro&page=-3&inactivos=3").days).toBe(0)
    expect(parse("estado=x&orden=raro&page=-3&inactivos=3")).toMatchObject({ status: undefined, sort: "last_access", page: 1, inactiveDays: 30 })
  })

  it("ida y vuelta URL ↔ filtros, omitiendo lo que es por defecto", () => {
    const f = parse("q=ana&dias=30&equipo=1&estado=inactive&inactivos=60&orden=name&dir=asc&page=2")
    expect(f).toEqual({ search: "ana", days: 30, team: true, status: "inactive", inactiveDays: 60, sort: "name", dir: "asc", page: 2 })
    expect(parse(accessToUrl(f))).toEqual(f)
    expect(accessToUrl(parse(""))).toBe("")
  })

  it("cambiar un filtro vuelve a la primera página", () => {
    expect(withAccessFilter(parse("page=4"), { team: true }).page).toBe(1)
  })

  it("el API recibe inactiveDays solo con el filtro de inactivos", () => {
    expect(accessApiQuery(parse("estado=never&inactivos=60"), { page: 1 })).not.toContain("inactiveDays")
    expect(accessApiQuery(parse("estado=inactive&inactivos=60"))).toContain("inactiveDays=60")
  })
})

describe("filtros de actividad", () => {
  it("ida y vuelta", () => {
    const f = parseActivityFilters(new URLSearchParams("q=pan&modulo=recipes&accion=create&resultado=blocked&persona=u1&dias=30&page=3"))
    expect(f).toEqual({ search: "pan", module: "recipes", action: "create", result: "blocked", userId: "u1", days: 30, page: 3 })
    expect(parseActivityFilters(new URLSearchParams(activityToUrl(f)))).toEqual(f)
    expect(activityToUrl(parseActivityFilters(new URLSearchParams("")))).toBe("")
  })
  it("el periodo por defecto son 7 días y rechaza valores raros", () => {
    expect(parseActivityFilters(new URLSearchParams("dias=11")).days).toBe(7)
    expect(activityApiQuery(parseActivityFilters(new URLSearchParams("")), 30)).toContain("days=7")
  })
})

describe("presentación", () => {
  it("dispositivo desconocido si no hay dato", () => {
    expect(deviceText(null)).toBe("Dispositivo desconocido")
    expect(deviceText("  ")).toBe("Dispositivo desconocido")
    expect(deviceText("Chrome en Windows")).toBe("Chrome en Windows")
  })
  it("resultado en español claro, sin códigos", () => {
    expect(resultInfo(200)).toEqual({ label: "Correcto", tone: "success" })
    expect(resultInfo(403).tone).toBe("warning")
    expect(resultInfo(429).label).not.toMatch(/\d/)
    expect(resultInfo(500).tone).toBe("danger")
    expect(resultInfo(null).tone).toBe("neutral")
  })
  it("nombre del CSV con la fecha", () => {
    expect(accessCsvName(new Date(2026, 9, 5))).toBe("accesos-2026-10-05.csv")
  })
  it("tiempo relativo en español", () => {
    const now = new Date("2026-10-15T12:00:00Z")
    expect(relativeTime("2026-10-15T11:55:00Z", now)).toBe("hace 5 minutos")
    expect(relativeTime("2026-10-14T12:00:00Z", now)).toBe("ayer")
    expect(relativeTime("2026-10-15T11:59:50Z", now)).toBe("hace unos segundos")
  })
})
