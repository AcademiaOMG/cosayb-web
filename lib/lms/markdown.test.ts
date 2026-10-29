import { describe, expect, it } from "vitest"
import { parseMarkdown } from "./markdown"

describe("mini-markdown seguro", () => {
  it("parsea títulos, listas, negrita y código", () => {
    const b = parseMarkdown("## Título\nTexto con **negrita** y `code`.\n\n- uno\n- dos\n\n1. a\n2. b")
    expect(b.map((x) => x.t)).toEqual(["h2", "p", "ul", "ol"])
    const p = b[1] as { c: { t: string; v: string }[] }
    expect(p.c.map((i) => i.t)).toEqual(["text", "strong", "text", "code", "text"])
  })

  it("nunca genera HTML: las etiquetas quedan como texto literal", () => {
    const payload = '<script>alert(1)</script><img src=x onerror=alert(1)> **<b>x</b>**'
    const json = JSON.stringify(parseMarkdown(payload))
    // El árbol solo tiene tipos conocidos; el HTML viaja como valor de texto (React lo escapa)
    expect(parseMarkdown(payload).every((n) => ["h2", "h3", "p", "quote", "ul", "ol"].includes(n.t))).toBe(true)
    expect(json).toContain("<script>")
    expect(json).not.toMatch(/"t":"(html|raw|dangerous)/)
  })

  it("los enlaces y la sintaxis de imagen no se interpretan", () => {
    const b = parseMarkdown("[click](javascript:alert(1)) ![x](http://evil/x.png)")
    expect(JSON.stringify(b)).toContain("javascript:alert(1)")
    expect(b).toHaveLength(1)
    expect((b[0] as { c: { t: string }[] }).c.every((i) => i.t === "text")).toBe(true)
  })

  it("texto vacío y saltos de línea Windows", () => {
    expect(parseMarkdown("")).toEqual([])
    expect(parseMarkdown("a\r\nb\r\n\r\nc")).toHaveLength(2)
  })

  it("entrada enorme no se cuelga", () => {
    const t = Date.now()
    parseMarkdown("**a**".repeat(20000) + "\n" + "- x\n".repeat(5000))
    expect(Date.now() - t).toBeLessThan(1500)
  })
})
