import { describe, expect, it } from "vitest"
import { filterOptions, moveHighlight, normalizeText, placeDropdown } from "./searchableSelect"

const opts = [
  { value: "1", label: "Café molido" },
  { value: "2", label: "Azúcar" },
  { value: "3", label: "Harina de trigo" },
]

describe("filterOptions", () => {
  it("ignora tildes y mayúsculas", () => {
    expect(filterOptions(opts, "CAFE").map((o) => o.value)).toEqual(["1"])
    expect(filterOptions(opts, "azucar").map((o) => o.value)).toEqual(["2"])
  })
  it("sin texto devuelve todo y sin coincidencias devuelve vacío", () => {
    expect(filterOptions(opts, "  ")).toHaveLength(3)
    expect(filterOptions(opts, "zzz")).toEqual([])
  })
  it("normaliza", () => expect(normalizeText(" Ñandú ")).toBe("nandu"))
})

describe("moveHighlight", () => {
  it("es circular", () => {
    expect(moveHighlight(2, 1, 3)).toBe(0)
    expect(moveHighlight(0, -1, 3)).toBe(2)
  })
  it("desde ninguna: abajo va al primero, arriba al último", () => {
    expect(moveHighlight(-1, 1, 3)).toBe(0)
    expect(moveHighlight(-1, -1, 3)).toBe(2)
  })
  it("sin opciones no resalta nada", () => expect(moveHighlight(0, 1, 0)).toBe(-1))
})

describe("placeDropdown", () => {
  const vp = { width: 390, height: 800 }
  it("abre hacia abajo si cabe", () => {
    const p = placeDropdown({ top: 100, bottom: 140, left: 16, width: 300 }, vp)
    expect(p.side).toBe("down")
    expect(p.maxHeight).toBe(320)
  })
  it("abre hacia arriba si abajo no cabe y arriba hay más espacio", () => {
    const p = placeDropdown({ top: 600, bottom: 640, left: 16, width: 300 }, { width: 390, height: 700 })
    expect(p.side).toBe("up")
    expect(p.maxHeight).toBeLessThanOrEqual(320)
  })
  it("no se sale del viewport en horizontal", () => {
    const p = placeDropdown({ top: 100, bottom: 140, left: 300, width: 300 }, vp)
    expect(p.left + p.width).toBeLessThanOrEqual(vp.width - 8)
  })
})
