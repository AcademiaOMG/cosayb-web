import { afterEach, describe, expect, it, vi } from "vitest"
import { DEFAULT_BRANDING, brandingStyle, resolveBranding } from "./resolve"
import { DEFAULT_BRAND_THEME } from "./types"

const enabledPayload = {
  data: {
    enabled: true,
    version: 3,
    theme: { ...DEFAULT_BRAND_THEME, colors: { ...DEFAULT_BRAND_THEME.colors, accent: "#E11D48" } },
    assets: { logoPrimary: "/api/v1/organizations/me/branding/assets/logoPrimary?v=3", logoAlt: null, icon: "javascript:alert(1)" },
    displayName: "  Mi Marca  ",
  },
}

describe("resolveBranding", () => {
  it("entradas inválidas caen al estado por defecto", () => {
    for (const bad of [null, undefined, "x", 42, {}, { data: null }]) {
      expect(resolveBranding(bad)).toEqual(DEFAULT_BRANDING)
    }
  })
  it("enabled=false no expone tema ni assets", () => {
    const r = resolveBranding({ data: { enabled: false, version: 2, theme: DEFAULT_BRAND_THEME, displayName: "X" } })
    expect(r.enabled).toBe(false)
    expect(r.theme).toBeNull()
    expect(r.displayName).toBeNull()
  })
  it("resuelve URLs relativas contra el API y descarta esquemas peligrosos", () => {
    const r = resolveBranding(enabledPayload, "http://api.test/")
    expect(r.assets.logoPrimary).toBe("http://api.test/api/v1/organizations/me/branding/assets/logoPrimary?v=3")
    expect(r.assets.icon).toBeNull()
    expect(r.displayName).toBe("Mi Marca")
    expect(r.theme?.colors.accent).toBe("#E11D48")
  })
  it("un tema corrupto se normaliza o se ignora, sin lanzar", () => {
    const r = resolveBranding({ data: { enabled: true, version: 1, theme: { colors: { accent: "#E11D48", bg: "nope" }, font: "x" } } })
    expect(r.theme?.colors.bg).toBe(DEFAULT_BRAND_THEME.colors.bg)
    expect(r.theme?.font).toBe("manrope")
    expect(resolveBranding({ data: { enabled: true, theme: { colors: {} } } }).theme).toBeNull()
  })
})

describe("brandingStyle", () => {
  it("sin marca activa no emite CSS (la app queda idéntica)", () => {
    expect(brandingStyle(DEFAULT_BRANDING)).toBeNull()
    expect(brandingStyle({ ...DEFAULT_BRANDING, enabled: true })).toBeNull()
  })
  it("con marca emite :root,.app-theme-neutral con el acento", () => {
    const css = brandingStyle(resolveBranding(enabledPayload, ""))!
    expect(css.startsWith(":root,.app-theme-neutral{")).toBe(true)
    expect(css).toContain("--accent:#E11D48")
    expect(css).not.toContain("</style")
  })
})

describe("getServerBranding (tolerancia a fallos)", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.resetModules()
    vi.doUnmock("next/headers")
  })
  const load = async (cookie = "better-auth.session_token=abc") => {
    vi.doMock("next/headers", () => ({ cookies: async () => ({ toString: () => cookie }) }))
    return (await import("./server")).getServerBranding
  }

  it("error de red -> marca por defecto", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("boom")))
    expect(await (await load())()).toEqual(DEFAULT_BRANDING)
  })
  it("HTTP 500/403 -> marca por defecto", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }))
    expect(await (await load())()).toEqual(DEFAULT_BRANDING)
  })
  it("sin cookie no llama al API", async () => {
    const f = vi.fn()
    vi.stubGlobal("fetch", f)
    expect(await (await load(""))()).toEqual(DEFAULT_BRANDING)
    expect(f).not.toHaveBeenCalled()
  })
  it("enabled=false -> por defecto; enabled=true -> marca, y reenvía la cookie", async () => {
    const f = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { enabled: false, version: 1 } }) })
    vi.stubGlobal("fetch", f)
    expect((await (await load())()).theme).toBeNull()
    expect(f.mock.calls[0][1].headers.cookie).toContain("session_token=abc")

    vi.resetModules()
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => enabledPayload }))
    const r = await (await load())()
    expect(r.enabled).toBe(true)
    expect(r.theme?.colors.accent).toBe("#E11D48")
  })
})
