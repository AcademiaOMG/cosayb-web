import { describe, expect, it } from "vitest"
import { renderToString } from "react-dom/server"
import BrandLogo from "@/components/branding/BrandLogo"
import BrandProvider from "@/components/branding/BrandProvider"
import { DEFAULT_BRANDING } from "./resolve"

describe("BrandLogo", () => {
  it("sin proveedor ni marca muestra el nombre actual (ACADEMIA OMG)", () => {
    expect(renderToString(<BrandLogo variant="alt" />)).toContain("ACADEMIA OMG")
  })
  it("con marca y logo usa la imagen; alt cae al logo primario", () => {
    const initial = {
      ...DEFAULT_BRANDING,
      enabled: true,
      version: 2,
      displayName: "Mi Marca",
      assets: { logoPrimary: "https://api.test/p.png", logoAlt: null, icon: null },
    }
    const html = renderToString(
      <BrandProvider initial={initial}>
        <BrandLogo variant="alt" />
      </BrandProvider>,
    )
    expect(html).toContain('src="https://api.test/p.png"')
    expect(html).toContain('alt="Mi Marca"')
  })
  it("con marca sin logo muestra el nombre visible", () => {
    const html = renderToString(
      <BrandProvider initial={{ ...DEFAULT_BRANDING, enabled: true, displayName: "Mi Marca" }}>
        <BrandLogo />
      </BrandProvider>,
    )
    expect(html).toContain("Mi Marca")
  })
})
