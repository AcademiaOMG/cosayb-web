import { describe, it, expect } from "vitest"
import { buildEvent, parseDsn } from "./monitoring"

describe("parseDsn", () => {
  it("construye el endpoint de store", () => {
    expect(parseDsn("https://abc123@o1.ingest.sentry.io/456")).toEqual({
      endpoint: "https://o1.ingest.sentry.io/api/456/store/",
      publicKey: "abc123",
    })
  })
  it("soporta Sentry self-hosted con prefijo", () => {
    expect(parseDsn("https://k@sentry.miempresa.co/prefijo/7")?.endpoint).toBe("https://sentry.miempresa.co/prefijo/api/7/store/")
  })
  it("rechaza vacío o inválido", () => {
    expect(parseDsn(undefined)).toBeNull()
    expect(parseDsn("")).toBeNull()
    expect(parseDsn("no-es-url")).toBeNull()
    expect(parseDsn("https://o1.ingest.sentry.io/456")).toBeNull()
  })
})

describe("buildEvent", () => {
  it("normaliza errores y strings", () => {
    const e = buildEvent(new TypeError("boom"), { where: "/dashboard", digest: "d1" }, new Date("2026-10-15T00:00:00Z"))
    expect(e.exception.values[0]).toMatchObject({ type: "TypeError", value: "boom" })
    expect(e.tags).toEqual({ where: "/dashboard", digest: "d1" })
    expect(e.timestamp).toBe(Math.floor(new Date("2026-10-15T00:00:00Z").getTime() / 1000))
    expect(buildEvent("texto").exception.values[0].value).toBe("texto")
    expect(buildEvent(undefined).exception.values[0].value).toBe("Error desconocido")
  })
})
