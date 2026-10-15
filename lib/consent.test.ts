import { describe, it, expect } from "vitest"
import { parseConsent, serializeConsent, readCookie, CONSENT_COOKIE } from "./consent"

describe("consent", () => {
  it("serializa y parsea la decisión", () => {
    const raw = serializeConsent(true, new Date("2026-10-15T00:00:00Z"))
    const parsed = parseConsent(raw)
    expect(parsed).toEqual({ v: 1, analytics: true, decidedAt: "2026-10-15T00:00:00.000Z" })
    expect(parseConsent(serializeConsent(false))?.analytics).toBe(false)
  })

  it("ignora valores vacíos, corruptos o de otra versión", () => {
    expect(parseConsent(null)).toBeNull()
    expect(parseConsent("")).toBeNull()
    expect(parseConsent("%7Bno-json")).toBeNull()
    expect(parseConsent(encodeURIComponent(JSON.stringify({ v: 99, analytics: true })))).toBeNull()
    expect(parseConsent(encodeURIComponent(JSON.stringify({ v: 1, analytics: "si" })))).toBeNull()
  })

  it("lee una cookie concreta de document.cookie", () => {
    const value = serializeConsent(true)
    expect(readCookie(`a=1; ${CONSENT_COOKIE}=${value}; b=2`, CONSENT_COOKIE)).toBe(value)
    expect(readCookie("a=1; b=2", CONSENT_COOKIE)).toBeNull()
  })
})
