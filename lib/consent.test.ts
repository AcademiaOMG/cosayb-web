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

describe("store de consentimiento (con un document.cookie simulado)", () => {
  // Simula lo esencial de document.cookie: guarda «nombre=valor» y descarta los atributos
  function fakeBrowser() {
    const jar = new Map<string, string>()
    const doc = {
      get cookie() {
        return [...jar].map(([k, v]) => `${k}=${v}`).join("; ")
      },
      set cookie(s: string) {
        const [pair] = s.split(";")
        const i = pair.indexOf("=")
        jar.set(pair.slice(0, i).trim(), pair.slice(i + 1))
      },
    }
    Object.assign(globalThis, { document: doc, location: { protocol: "http:" } })
    return () => {
      delete (globalThis as Record<string, unknown>).document
      delete (globalThis as Record<string, unknown>).location
    }
  }

  it("guardar «solo necesarias» y «aceptar todas» se refleja al leer y avisa a los suscriptores", async () => {
    const restore = fakeBrowser()
    try {
      const { getConsent, setConsent, subscribeConsent } = await import("./consent")
      let avisos = 0
      const off = subscribeConsent(() => { avisos++ })
      expect(getConsent()).toBeNull()

      setConsent(false)
      expect(getConsent()?.analytics).toBe(false)
      expect(avisos).toBe(1)

      setConsent(true)
      expect(getConsent()?.analytics).toBe(true)
      expect(avisos).toBe(2)

      // useSyncExternalStore exige el MISMO objeto mientras nada cambie (si no, entra en bucle)
      expect(getConsent()).toBe(getConsent())
      off()
    } finally {
      restore()
    }
  })
})
