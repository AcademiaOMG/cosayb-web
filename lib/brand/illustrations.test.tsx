import { describe, expect, it } from "vitest"
import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { join } from "node:path"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { MODULE_ILLUSTRATIONS, ModuleIllustration, type ModuleKey } from "@/components/brand/illustrations"

const DIR = join(process.cwd(), "components/brand/illustrations")
const CSS = readFileSync(join(DIR, "illustrations.css"), "utf8")
const KEYS = Object.keys(MODULE_ILLUSTRATIONS) as ModuleKey[]

/* ── Mini evaluador de CSS (var + color-mix in oklab) para comprobar la paleta ── */
type RGBA = [number, number, number, number]
const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const unlin = (c: number) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055)
function toOklab([r, g, b]: RGBA) {
  const [R, G, B] = [lin(r / 255), lin(g / 255), lin(b / 255)]
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B)
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B)
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B)
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s]
}
function fromOklab([L, a, b]: number[], alpha: number): RGBA {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  const ch = (x: number) => Math.round(Math.min(1, Math.max(0, unlin(x))) * 255)
  return [
    ch(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    ch(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    ch(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
    alpha,
  ]
}
function hex(h: string): RGBA {
  let x = h.replace("#", "")
  if (x.length === 3) x = [...x].map((c) => c + c).join("")
  return [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2, 4), 16), parseInt(x.slice(4, 6), 16), 1]
}
function splitTop(s: string): string[] {
  const out: string[] = []
  let depth = 0
  let cur = ""
  for (const ch of s) {
    if (ch === "(") depth++
    if (ch === ")") depth--
    if (ch === "," && depth === 0) {
      out.push(cur.trim())
      cur = ""
    } else cur += ch
  }
  out.push(cur.trim())
  return out
}
function evalCss(expr: string, env: Record<string, string>): RGBA {
  const e = expr.trim()
  if (e.startsWith("var(")) {
    const [name, ...fb] = splitTop(e.slice(4, -1))
    const val = env[name]
    if (val !== undefined) return evalCss(val, env)
    if (fb.length) return evalCss(fb.join(","), env)
    throw new Error(`var sin valor: ${name}`)
  }
  if (e.startsWith("color-mix(")) {
    const [, ...parts] = splitTop(e.slice(10, -1))
    const items = parts.map((p) => {
      const m = p.match(/^(.*?)(?:\s+(\d+(?:\.\d+)?)%)?$/)!
      return { c: m[1].trim(), p: m[2] === undefined ? null : Number(m[2]) }
    })
    let [p1, p2] = [items[0].p, items[1].p]
    if (p1 === null && p2 === null) [p1, p2] = [50, 50]
    else if (p1 === null) p1 = 100 - p2!
    else if (p2 === null) p2 = 100 - p1
    const A = evalCss(items[0].c, env)
    const B = evalCss(items[1].c, env)
    const w1 = p1! / (p1! + p2!)
    const w2 = 1 - w1
    const alpha = A[3] * w1 + B[3] * w2
    // premultiplicado: un color transparente no aporta su croma
    const pa = A[3] * w1
    const pb = B[3] * w2
    const oa = toOklab(A)
    const ob = toOklab(B)
    const k = pa + pb || 1
    return fromOklab(oa.map((v, i) => (v * pa + ob[i] * pb) / k), alpha)
  }
  if (e === "transparent") return [0, 0, 0, 0]
  if (e === "#fff") return [255, 255, 255, 1]
  if (e === "#000") return [0, 0, 0, 1]
  if (e.startsWith("#")) return hex(e)
  throw new Error(`valor no soportado: ${e}`)
}
const toCss = ([r, g, b, a]: RGBA) => (a >= 0.999 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${+a.toFixed(3)})`)
const toHex = ([r, g, b]: RGBA) => "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("").toUpperCase()

const DECLS: Record<string, string> = {}
for (const m of CSS.matchAll(/(--ill-[a-z0-9-]+):\s*([^;]+);/g)) DECLS[m[1]] = m[2].replace(/\s+/g, " ").trim()

/** Resuelve todas las --ill-* dado un entorno de tokens de marca. */
function palette(brand: Record<string, string> = {}) {
  const env = { ...brand, ...DECLS }
  return Object.fromEntries(Object.keys(DECLS).map((k) => [k, evalCss(`var(${k})`, env)]))
}

const html = (key: ModuleKey, className?: string) =>
  renderToStaticMarkup(createElement(ModuleIllustration, { module: key, className }))

describe("ilustraciones de módulo", () => {
  it("cubre los 8 módulos con componentes distintos", () => {
    expect(KEYS).toHaveLength(8)
    expect(new Set(Object.values(MODULE_ILLUSTRATIONS)).size).toBe(8)
  })

  it.each(KEYS)("%s: SVG cuadrado, decorativo y sin colores fijos", (key) => {
    const out = html(key, "foo")
    const vb = out.match(/viewBox="0 0 (\d+) (\d+)"/)!
    expect(vb[1]).toBe(vb[2])
    expect(out).toContain('aria-hidden="true"')
    expect(out).not.toContain("role=")
    expect(out).toContain('class="ill foo"')
    // sin hex / rgb / nombres fuera de var()
    const sinVars = out.replace(/var\(--ill-[a-z0-9-]+\)/g, "")
    expect(sinVars).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    expect(sinVars).not.toMatch(/rgba?\(|hsla?\(/)
    expect(sinVars).not.toMatch(/(fill|stroke|stop-color)(="|:)\s*(white|black|red|blue|gray|grey|navy)/i)
  })

  it("con title deja de ser decorativa", () => {
    const out = renderToStaticMarkup(createElement(MODULE_ILLUSTRATIONS.inventory, { title: "Inventario" }))
    expect(out).toContain('role="img"')
    expect(out).toContain('aria-label="Inventario"')
    expect(out).not.toContain("aria-hidden")
  })

  it("todas las variables usadas están definidas en illustrations.css", () => {
    const used = new Set<string>()
    for (const key of KEYS) for (const m of html(key).matchAll(/var\((--ill-[a-z0-9-]+)\)/g)) used.add(m[1])
    expect(used.size).toBeGreaterThan(8)
    for (const name of used) expect(DECLS, name).toHaveProperty(name)
  })

  it("los ids de gradiente son únicos entre varias instancias", () => {
    const out = renderToStaticMarkup(
      createElement("div", null, ...KEYS.flatMap((k, i) => [createElement(ModuleIllustration, { key: `a${i}`, module: k }), createElement(ModuleIllustration, { key: `b${i}`, module: k })])),
    )
    const ids = [...out.matchAll(/ id="([^"]+)"/g)].map((m) => m[1])
    expect(ids.length).toBeGreaterThan(30)
    expect(new Set(ids).size).toBe(ids.length)
    // toda referencia url(#x) apunta a un id existente
    for (const m of out.matchAll(/url\(#([^)]+)\)/g)) expect(ids).toContain(m[1])
  })
})

describe("paleta --ill-*", () => {
  it("sin tokens de marca usa los fallbacks (aspecto por defecto, azules navy y grises)", () => {
    const p = palette({ "--text-primary": "#12213A", "--brand-primary": "#1B4FD8" })
    const hexOf = (k: string) => toHex(p[k])
    // se comporta igual con y sin los tokens por defecto declarados
    for (const k of Object.keys(DECLS)) expect(toCss(palette()[k])).toBe(toCss(p[k]))
    // ink: navy oscuro; 1: índigo; 2: azul claro; neutral: gris azulado; paper: casi blanco
    const lum = (c: RGBA) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
    expect(lum(p["--ill-ink"])).toBeLessThan(60)
    expect(p["--ill-ink"][2]).toBeGreaterThan(p["--ill-ink"][0])
    expect(p["--ill-1"][2]).toBeGreaterThan(p["--ill-1"][0] + 40)
    expect(lum(p["--ill-2"])).toBeGreaterThan(150)
    expect(p["--ill-2"][2]).toBeGreaterThan(p["--ill-2"][0])
    expect(lum(p["--ill-paper"])).toBeGreaterThan(225)
    expect(lum(p["--ill-neutral"])).toBeGreaterThan(100)
    expect(lum(p["--ill-neutral"])).toBeLessThan(180)
    expect(hexOf("--ill-ink")).toMatch(/^#[0-9A-F]{6}$/)
  })

  it("una marca naranja recolorea la paleta (el tono dominante deja de ser azul)", () => {
    const p = palette({ "--text-primary": "#2B1A0E", "--brand-primary": "#E8590C", "--brand-secondary": "#F59F00" })
    expect(p["--ill-1"][0]).toBeGreaterThan(p["--ill-1"][2])
    expect(p["--ill-2"][0]).toBeGreaterThan(p["--ill-2"][2])
  })
})

/* ── Volcado opcional para comparar visualmente (ILL_DUMP=<dir>) ── */
const DUMP = process.env.ILL_DUMP
describe.runIf(DUMP)("volcado", () => {
  const BRANDS: Record<string, Record<string, string>> = {
    default: {},
    orange: { "--text-primary": "#2B1A0E", "--brand-primary": "#E8590C", "--brand-secondary": "#F59F00" },
    green: { "--text-primary": "#0F2A1C", "--brand-primary": "#15803D", "--brand-secondary": "#65A30D" },
    red: { "--text-primary": "#2A0F14", "--brand-primary": "#C81E3A", "--brand-secondary": "#F43F5E" },
  }
  it("escribe SVG con variables resueltas", () => {
    mkdirSync(DUMP!, { recursive: true })
    writeFileSync(join(DUMP!, "default-palette.json"), JSON.stringify(Object.fromEntries(Object.entries(palette()).map(([k, c]) => [k, toHex(c)])), null, 1))
    for (const [name, brand] of Object.entries(BRANDS)) {
      const p = palette(brand)
      for (const key of KEYS) {
        const svg = html(key).replace(/var\((--ill-[a-z0-9-]+)\)/g, (_, k) => toCss(p[k]))
        writeFileSync(join(DUMP!, `${name}-${key}.svg`), svg)
      }
    }
  })
})
