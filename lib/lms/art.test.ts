import { describe, expect, it } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import path from "node:path"

// Los diagramas de los cursos son archivos propios servidos desde /public/lms-art y mostrados con <img>:
// deben ser accesibles, sin scripts ni referencias externas, y sin morado.
const ROOT = path.resolve(__dirname, "..", "..", "public", "lms-art")
const files = readdirSync(ROOT, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? readdirSync(path.join(ROOT, d.name)).map((f) => path.join(ROOT, d.name, f)) : []))

describe("diagramas de los cursos (/public/lms-art)", () => {
  it("hay diagramas", () => expect(files.length).toBeGreaterThanOrEqual(12))
  it.each(files.map((f) => [path.relative(ROOT, f).replace(/\\/g, "/"), f] as const))("%s es un SVG accesible y seguro", (_n, f) => {
    const svg = readFileSync(f, "utf8")
    expect(f.endsWith(".svg")).toBe(true)
    expect(svg).toMatch(/^<svg [^>]*role="img"/)
    expect(svg).toMatch(/<title id="t">[^<]{5,}<\/title>/)
    expect(svg).toMatch(/<desc id="d">[^<]{20,}<\/desc>/)
    expect(svg).not.toMatch(/<script|<foreignObject|onload=|onclick=|javascript:|href=|xlink:/i) // sin scripts ni recursos externos
    expect(svg).not.toMatch(/#(7c3aed|8b5cf6|6d28d9|a78bfa|6a45f2|7c5cf5|5532d6)/i) // sin morado
  })
})
