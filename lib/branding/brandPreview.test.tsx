import { describe, it, expect } from "vitest"
import { renderToString } from "react-dom/server"
import BrandPreview from "@/components/branding/editor/BrandPreview"
import PaletteSection from "@/components/branding/editor/PaletteSection"
import IdentitySection from "@/components/branding/editor/IdentitySection"
import { DEFAULT_BRAND_THEME } from "./types"

describe("BrandPreview", () => {
  it("aplica los tokens del borrador al contenedor aislado y muestra el nombre", () => {
    const theme = { ...DEFAULT_BRAND_THEME, colors: { ...DEFAULT_BRAND_THEME.colors, accent: "#AA00CC" } }
    const html = renderToString(<BrandPreview theme={theme} logoUrl={null} iconUrl={null} displayName="Café Sol" />)
    expect(html).toContain("--accent:#AA00CC")
    expect(html).toContain("Café Sol")
    expect(html).toContain('aria-label="Vista previa de la marca"')
  })
})

describe("PaletteSection", () => {
  it("ofrece corrección automática solo cuando hay problemas de contraste", () => {
    const noop = () => {}
    const ok = renderToString(<PaletteSection theme={DEFAULT_BRAND_THEME} onColor={noop} onAutoFix={noop} />)
    expect(ok).not.toContain("Corregir automáticamente")
    const bad = { ...DEFAULT_BRAND_THEME, colors: { ...DEFAULT_BRAND_THEME.colors, text: "#EEEEEE" } }
    expect(renderToString(<PaletteSection theme={bad} onColor={noop} onAutoFix={noop} />)).toContain("Corregir automáticamente")
  })
})

describe("IdentitySection", () => {
  it("lista las 8 tipografías curadas con radios etiquetados", () => {
    const noop = () => {}
    const html = renderToString(
      <IdentitySection theme={DEFAULT_BRAND_THEME} displayName="" onRadius={noop} onShadow={noop} onFont={noop} onDisplayName={noop} />
    )
    for (const f of ["Manrope", "Inter", "Poppins", "DM Sans", "Nunito", "Lato", "Montserrat", "Source Sans 3"]) expect(html).toContain(f)
    expect(html).toContain('type="radio"')
  })
})
