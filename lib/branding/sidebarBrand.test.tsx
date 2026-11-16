import { describe, expect, it } from "vitest"
import { renderToString } from "react-dom/server"
import BrandProvider from "@/components/branding/BrandProvider"
import BrandLogo from "@/components/branding/BrandLogo"
import SidebarBrand, { hasCustomIdentity } from "@/components/app/SidebarBrand"
import { needsLightPlate, pickLogo } from "@/components/branding/logoSource"
import { DEFAULT_BRANDING } from "./resolve"

const A = { logoPrimary: "https://x/p.png", logoAlt: "https://x/a.png", icon: "https://x/i.png" }
const none = { logoPrimary: null, logoAlt: null, icon: null }

describe("pickLogo (cadena de respaldo)", () => {
  it("alt: logoAlt → logoPrimary → icono → nada", () => {
    expect(pickLogo("alt", A)).toEqual({ src: A.logoAlt, source: "logoAlt" })
    expect(pickLogo("alt", { ...A, logoAlt: null }).source).toBe("logoPrimary")
    expect(pickLogo("alt", { ...none, icon: A.icon }).source).toBe("icon")
    expect(pickLogo("alt", none)).toEqual({ src: null, source: null })
  })
  it("primary: logoPrimary primero; icon solo icono", () => {
    expect(pickLogo("primary", A).source).toBe("logoPrimary")
    expect(pickLogo("primary", { ...A, logoPrimary: null }).source).toBe("logoAlt")
    expect(pickLogo("icon", { ...A, icon: null }).src).toBeNull()
  })
  it("placa clara solo cuando alt cae a un logo no alterno", () => {
    expect(needsLightPlate("alt", pickLogo("alt", A))).toBe(false)
    expect(needsLightPlate("alt", pickLogo("alt", { ...A, logoAlt: null }))).toBe(true)
    expect(needsLightPlate("primary", pickLogo("primary", A))).toBe(false)
  })
})

describe("SidebarBrand", () => {
  const withBrand = (over: object) =>
    renderToString(
      <BrandProvider initial={{ ...DEFAULT_BRANDING, enabled: true, version: 1, ...over }}>
        <SidebarBrand />
      </BrandProvider>,
    )
  it("sin marca: logo de la plataforma (isotipo + «ACADEMIA OMG»), sin la línea «by»", () => {
    const html = renderToString(<SidebarBrand />)
    expect(html).toContain("ACADEMIA OMG")
    expect(html).toContain("data-platform-mark")
    expect(html).not.toContain("data-sidebar-brand")
  })
  it("con marca: cabecera centrada, sin divisor interno y con el isotipo en la firma", () => {
    const html = withBrand({ displayName: "Mi Marca", assets: { ...none, logoAlt: A.logoAlt } })
    expect(html).toContain("data-sidebar-brand")
    expect(html).toContain("items-center")
    expect(html).toContain("data-platform-mark")
    // el divisor interno entre logo y firma ya no existe (solo queda el borde inferior de la cabecera)
    expect(html).not.toContain("h-px")
  })
  it("con logo: imagen con alt del negocio y «by Academia OMG»", () => {
    const html = withBrand({ displayName: "Mi Marca", assets: { ...none, logoAlt: A.logoAlt } })
    expect(html).toContain('src="https://x/a.png"')
    expect(html).toContain('alt="Mi Marca"')
    expect(html).toContain("Academia OMG")
    expect(html).toContain("by")
    expect(html).not.toContain("data-logo-plate")
  })
  it("solo logo primario: va sobre placa clara", () => {
    const html = withBrand({ displayName: "Mi Marca", assets: { ...none, logoPrimary: A.logoPrimary } })
    expect(html).toContain("data-logo-plate")
  })
  it("marca con nombre y sin logo: nombre en texto, sin imagen", () => {
    const html = withBrand({ displayName: "Mi Marca" })
    expect(html).toContain("Mi Marca")
    expect(html).not.toContain("<img")
  })
  it("hasCustomIdentity", () => {
    expect(hasCustomIdentity({ enabled: false, displayName: "X", ...none })).toBe(false)
    expect(hasCustomIdentity({ enabled: true, displayName: null, ...none })).toBe(false)
    expect(hasCustomIdentity({ enabled: true, displayName: null, ...A })).toBe(true)
  })
  it("BrandLogo icon sin icono: inicial del nombre", () => {
    expect(renderToString(<BrandLogo variant="icon" />)).toContain(">A<")
  })
})
