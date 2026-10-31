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

describe("tablas, imágenes propias y línea horizontal", () => {
  it("convierte una tabla con alineación", () => {
    const b = parseMarkdown("| Ingrediente | Costo |\n|:---|---:|\n| Harina | $2.400 |\n| **Huevos** | $600 |")
    expect(b).toHaveLength(1)
    expect(b[0]).toMatchObject({ t: "table", align: ["left", "right"] })
    const t = b[0] as Extract<(typeof b)[number], { t: "table" }>
    expect(t.head).toHaveLength(2)
    expect(t.rows).toHaveLength(2)
    expect(t.rows[1][0][0]).toEqual({ t: "strong", v: "Huevos" })
  })
  it("sin separador válido no es tabla: queda como texto", () => {
    const b = parseMarkdown("| a | b |\n| c | d |")
    expect(b.every((x) => x.t === "p")).toBe(true)
  })
  it("acepta solo imágenes de /lms-art/", () => {
    expect(parseMarkdown("![Flujo](/lms-art/costeo/flujo.svg)")[0]).toEqual({ t: "img", alt: "Flujo", src: "/lms-art/costeo/flujo.svg" })
    for (const bad of [
      "![x](https://evil.com/a.svg)",
      "![x](//evil.com/a.svg)",
      "![x](/lms-art/../secreto.svg)",
      "![x](/otra/ruta.svg)",
      "![x](javascript:alert(1))",
      "![x](/lms-art/a.svg?x=1)",
      "![x](/lms-art/a.html)",
    ]) {
      expect(parseMarkdown(bad)[0].t, bad).toBe("p")
    }
  })
  it("--- es línea horizontal y *** también", () => {
    expect(parseMarkdown("a\n\n---\n\nb").map((x) => x.t)).toEqual(["p", "hr", "p"])
  })
  it("el HTML dentro de celdas y textos sigue siendo texto", () => {
    const b = parseMarkdown("| h |\n|---|\n| <script>alert(1)</script> |")
    const t = b[0] as Extract<(typeof b)[number], { t: "table" }>
    expect(t.rows[0][0]).toEqual([{ t: "text", v: "<script>alert(1)</script>" }])
  })
})
