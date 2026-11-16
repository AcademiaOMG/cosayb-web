import { describe, it, expect } from "vitest"
import { renderToString } from "react-dom/server"
import BrandPreview from "@/components/branding/editor/BrandPreview"
import PaletteSection from "@/components/branding/editor/PaletteSection"
import IdentitySection from "@/components/branding/editor/IdentitySection"
import { DEFAULT_BRAND_THEME } from "./types"
import { TOKEN_GROUPS } from "./tokens"

const noop = () => {}
const palette = (theme: typeof DEFAULT_BRAND_THEME) =>
  renderToString(
    <PaletteSection theme={theme} onColor={noop} onCalculator={noop} onOverride={noop} onClearOverride={noop} onSuggest={noop} onAutoFix={noop} />,
  )

describe("BrandPreview", () => {
  it("aplica los tokens del borrador (y de la calculadora) al contenedor aislado y muestra el nombre", () => {
    const theme = { ...DEFAULT_BRAND_THEME, colors: { ...DEFAULT_BRAND_THEME.colors, accent: "#AA00CC" } }
    const html = renderToString(<BrandPreview theme={theme} logoUrl={null} iconUrl={null} displayName="Café Sol" />)
    expect(html).toContain("--accent:#AA00CC")
    expect(html).toContain("--calc-body:")
    expect(html).toContain("Café Sol")
    expect(html).toContain('aria-label="Vista previa de la marca"')
  })

  it("replica la plataforma: sidebar de marca, encabezado con plan, grilla de módulos y pestañas", () => {
    const html = renderToString(<BrandPreview theme={DEFAULT_BRAND_THEME} logoUrl="/logo.png" iconUrl={null} displayName="Café Sol" />)
    expect(html).toContain("Academia OMG")
    expect(html).toContain("Primeros pasos")
    expect(html).toContain("Plan Pro")
    expect(html).toContain("¿Qué quieres revisar?")
    expect(html).toContain("glass glass-card")
    for (const t of ["Inicio", "Recetas", "Calculadora"]) expect(html).toContain(t)
    expect(html).toContain("scale(")
  })

  it("la calculadora del borrador sigue al color principal salvo que se fije", () => {
    const a = renderToString(<BrandPreview theme={DEFAULT_BRAND_THEME} logoUrl={null} iconUrl={null} displayName="" />)
    const b = renderToString(<BrandPreview theme={{ ...DEFAULT_BRAND_THEME, calculator: "#B45309" }} logoUrl={null} iconUrl={null} displayName="" />)
    const calc = (h: string) => /--calc-body:(#[0-9A-F]{6})/.exec(h)?.[1]
    expect(calc(a)).toBeTruthy()
    expect(calc(a)).not.toBe(calc(b))
  })
})

describe("PaletteSection", () => {
  it("ofrece corrección automática solo cuando hay problemas", () => {
    expect(palette(DEFAULT_BRAND_THEME)).not.toContain("Corregir automáticamente")
    const bad = { ...DEFAULT_BRAND_THEME, colors: { ...DEFAULT_BRAND_THEME.colors, text: "#EEEEEE" } }
    expect(palette(bad)).toContain("Corregir automáticamente")
  })

  it("muestra los grupos, las etiquetas y «Cambia:» / «No cambia:» de cada entrada", () => {
    const html = palette(DEFAULT_BRAND_THEME)
    for (const g of TOKEN_GROUPS.filter((g) => g.tokens.some((t) => t.source === "input"))) expect(html).toContain(g.title)
    expect(html).toContain("Texto principal")
    expect(html).toContain("Cambia:")
    expect(html).toContain("No cambia:")
    expect(html).toContain("Botones primarios")
    expect(html).toContain("Color de la calculadora")
    expect(html).toContain("sigue a tu color principal")
  })

  it("agrupa los derivados en «Avanzado» con estado Automático, contraste en vivo y fijar a mano", () => {
    const html = palette(DEFAULT_BRAND_THEME)
    expect(html).toContain("<details")
    expect(html).toContain("Avanzado")
    expect(html).toContain("Automático")
    expect(html).toContain("Fijar a mano")
    expect(html).toContain("Contraste")
    expect(html).not.toContain("Volver a automático")
  })

  it("un override muestra «Volver a automático» y el contador", () => {
    const html = palette({ ...DEFAULT_BRAND_THEME, overrides: { sidebarText: "#FFFFFF" } })
    expect(html).toContain("Volver a automático")
    expect(html).toContain("fijado(s) a mano")
  })

  it("incluye el selector de armonía y estilo de sidebar y el botón de sugerir", () => {
    const html = palette(DEFAULT_BRAND_THEME)
    expect(html).toContain("Sugerir paleta desde mi color principal")
    expect(html).toContain("Armonía de colores")
    expect(html).toContain("Estilo de la barra lateral")
    expect(html).not.toContain("Deshacer sugerencia")
  })

  it("avisa de colores fluorescentes con acción de corregir", () => {
    const html = palette({ ...DEFAULT_BRAND_THEME, colors: { ...DEFAULT_BRAND_THEME.colors, accent: "#00FF00" } })
    expect(html).toContain("fluorescente")
    expect(html).toMatch(/Usar (<!-- -->)?#[0-9A-F]{6}/)
  })
})

describe("IdentitySection", () => {
  it("lista las 8 tipografías curadas con radios etiquetados", () => {
    const html = renderToString(
      <IdentitySection theme={DEFAULT_BRAND_THEME} displayName="" onRadius={noop} onShadow={noop} onFont={noop} onDisplayName={noop} />
    )
    for (const f of ["Manrope", "Inter", "Poppins", "DM Sans", "Nunito", "Lato", "Montserrat", "Source Sans 3"]) expect(html).toContain(f)
    expect(html).toContain('type="radio"')
  })
})
