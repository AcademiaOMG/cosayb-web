import { describe, it, expect, vi } from "vitest"
import {
  safeReturnTo,
  resolvePostLoginPath,
  buildLoginUrl,
  checkServerSession,
  DEFAULT_POST_LOGIN_PATH,
} from "./authRedirect"

describe("safeReturnTo (caracteres de control)", () => {
  it("rechaza tab/salto de línea: el navegador los elimina y '/\\t/evil.com' pasa a '//evil.com'", () => {
    expect(safeReturnTo("/\t/evil.com")).toBeNull()
    expect(safeReturnTo("/\n/evil.com")).toBeNull()
    expect(safeReturnTo("/\r/evil.com")).toBeNull()
    expect(safeReturnTo("/ok\u0000")).toBeNull()
  })
})

describe("safeReturnTo", () => {
  it("acepta rutas internas", () => {
    expect(safeReturnTo("/recetas?x=1")).toBe("/recetas?x=1")
  })
  it("rechaza externas, protocolo-relativas y vacías", () => {
    expect(safeReturnTo("https://evil.com")).toBeNull()
    expect(safeReturnTo("//evil.com")).toBeNull()
    expect(safeReturnTo("/" + String.fromCharCode(92) + "evil.com")).toBeNull()
    expect(safeReturnTo("")).toBeNull()
    expect(safeReturnTo(null)).toBeNull()
  })
})

describe("resolvePostLoginPath", () => {
  it("sin returnTo ni compra pendiente va directo al dashboard (no a /onboarding)", () => {
    expect(resolvePostLoginPath({})).toBe(DEFAULT_POST_LOGIN_PATH)
    expect(DEFAULT_POST_LOGIN_PATH).toBe("/dashboard")
  })
  it("prioriza returnTo, luego la compra pendiente", () => {
    expect(resolvePostLoginPath({ returnTo: "/menu", pendingPath: "/checkout/book" })).toBe("/menu")
    expect(resolvePostLoginPath({ pendingPath: "/checkout/book?format=digital" })).toBe(
      "/checkout/book?format=digital",
    )
  })
  it("ignora returnTo inseguro", () => {
    expect(resolvePostLoginPath({ returnTo: "//evil.com" })).toBe("/dashboard")
  })
})

describe("buildLoginUrl", () => {
  it("conserva la ruta interna solicitada", () => {
    expect(buildLoginUrl("/recetas", "?a=1")).toBe("/login?returnTo=%2Frecetas%3Fa%3D1")
  })
  it("no genera bucles con /login ni con /", () => {
    expect(buildLoginUrl("/login")).toBe("/login")
    expect(buildLoginUrl("/")).toBe("/login")
  })
})

describe("checkServerSession", () => {
  const mk = (status: number) => vi.fn().mockResolvedValue({ ok: status >= 200 && status < 300, status }) as unknown as typeof fetch
  it("200 → valid", async () => {
    expect(await checkServerSession("http://api", mk(200))).toBe("valid")
  })
  it("401 → invalid (cookie caché obsoleta: /login NO debe redirigir)", async () => {
    expect(await checkServerSession("http://api", mk(401))).toBe("invalid")
  })
  it("500 y red caída → unknown", async () => {
    expect(await checkServerSession("http://api", mk(500))).toBe("unknown")
    const boom = vi.fn().mockRejectedValue(new Error("net")) as unknown as typeof fetch
    expect(await checkServerSession("http://api", boom)).toBe("unknown")
  })
})
