import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { TOKEN_GROUPS, REQUIRED_CSS_VARS } from "./tokens"

const root = join(__dirname, "..", "..")
const read = (p: string) => readFileSync(join(root, p), "utf8")

describe("calculadora: lee los tokens --calc-* con el valor actual como respaldo", () => {
  const css = read("components/calculator/calculator-blue.css")
  const calcVars = TOKEN_GROUPS.find((g) => g.id === "calculator")!.tokens.flatMap((t) => t.cssVars)

  it("cada token --calc-* del contrato se consume con fallback (excepto los que la carcasa no usa 1:1)", () => {
    // key/body-2 etc. se leen con var(--calc-x, <default>)
    const all = css + read("components/calculator/calcReceipt.css")
    const used = calcVars.filter((v) => new RegExp(`var\\(${v},\\s*[^)]+\\)`).test(all))
    expect(used.sort()).toEqual(
      [
        "--calc-accent", "--calc-body", "--calc-body-2", "--calc-display-bg", "--calc-display-text",
        "--calc-key", "--calc-key-equals", "--calc-key-equals-text", "--calc-key-op", "--calc-key-op-text",
        "--calc-key-text", "--calc-ring",
      ].sort(),
    )
  })
  it("la piel no deja hex de marca en teclas ni pantalla fuera de los fallbacks", () => {
    const keyRules = css.split("\n").filter((l) => /--(k|f|c|lcd)-(top|bot|side2?|ink|1|2|mid)\s*:/.test(l))
    for (const l of keyRules) expect(l).toMatch(/var\(--calc-|color-mix|var\(--(k|f|c|lcd)-/)
  })
})

describe("defaults de las variables nuevas en :root (la app sin marca se ve igual)", () => {
  const globals = read("app/globals.css")
  const mine = [
    "--sidebar-hover-bg", "--sidebar-active-bg", "--sidebar-active-text", "--header-bg", "--header-text",
    "--header-border", "--chip-bg", "--chip-text", "--chip-border", "--on-surface", "--on-secondary",
    "--brand-primary", "--secondary-light", "--focus-ring", "--info", "--info-bg", "--info-text",
    "--info-border", "--success-border",
  ]
  it.each(mine)("%s tiene valor por defecto", (v) => {
    expect(globals).toMatch(new RegExp(`^\\s*${v}:`, "m"))
  })
  it("todas las variables del contrato (salvo --calc-*, con fallback en uso) existen en :root", () => {
    const missing = REQUIRED_CSS_VARS.filter((v) => !v.startsWith("--calc-") && !v.startsWith("--brand-secondary") && !new RegExp(`^\\s*${v}:`, "m").test(globals))
    // --bg-primary etc. ya existían; --accent-* también. Lo que falte debe ser solo lo que la app nunca lee.
    expect(missing).toEqual([])
  })
})
