import { describe, expect, it } from "vitest"
import {
  apca, contrastRatio, ensureContrast, fromOklch, isFluorescent, maxChroma, mix, normalizeHex, onColor, tameChroma, toHex, toOklch,
} from "./color"

describe("color: conversiones", () => {
  it("hex ida y vuelta por OKLCH (error <=1 por canal)", () => {
    for (const hex of ["#000000", "#FFFFFF", "#1B4FD8", "#FF6A00", "#12213A", "#808080", "#00FF00", "#FDE047", "#B42020"]) {
      const back = fromOklch(toOklch(hex))
      const a = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
      const b = [1, 3, 5].map((i) => parseInt(back.slice(i, i + 2), 16))
      a.forEach((v, i) => expect(Math.abs(v - b[i]), hex).toBeLessThanOrEqual(1))
    }
  })
  it("valores de referencia OKLCH", () => {
    expect(toOklch("#FFFFFF").l).toBeCloseTo(1, 2)
    expect(toOklch("#000000").l).toBeCloseTo(0, 3)
    const red = toOklch("#FF0000")
    expect(red.l).toBeCloseTo(0.628, 2)
    expect(red.c).toBeCloseTo(0.2577, 2)
    expect(red.h).toBeCloseTo(29.2, 0)
  })
  it("gamut mapping: croma imposible se reduce y devuelve hex valido con el mismo matiz", () => {
    const out = fromOklch({ l: 0.5, c: 0.5, h: 140 })
    expect(out).toMatch(/^#[0-9A-F]{6}$/)
    const back = toOklch(out)
    expect(back.c).toBeLessThan(0.5)
    expect(Math.abs(back.h - 140)).toBeLessThan(6)
    expect(back.l).toBeCloseTo(0.5, 1)
  })
  it("extremos de L", () => {
    expect(fromOklch({ l: 0, c: 0.2, h: 30 })).toBe("#000000")
    expect(fromOklch({ l: 1.2, c: 0.2, h: 30 })).toBe("#FFFFFF")
    expect(maxChroma(0.5, 260)).toBeGreaterThan(0.1)
  })
  it("normalizeHex", () => {
    expect(normalizeHex("#abc")).toBe("#AABBCC")
    expect(normalizeHex("nope")).toBeNull()
    expect(toHex([300, -4, 15.6])).toBe("#FF0010")
  })
})

describe("color: contraste", () => {
  it("WCAG", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 0)
    expect(contrastRatio("#777777", "#FFFFFF")).toBeCloseTo(4.48, 1)
  })
  it("APCA tiene signo y magnitud razonables", () => {
    expect(apca("#000000", "#FFFFFF")).toBeGreaterThan(100)
    expect(apca("#FFFFFF", "#000000")).toBeLessThan(-100)
    expect(apca("#777777", "#777777")).toBe(0)
  })
  it("onColor: siempre >=4.5 y conserva reglas previas", () => {
    expect(onColor("#1B4FD8")).toBe("#FFFFFF")
    expect(onColor("#FDE047")).toBe("#12213A")
    for (let i = 0; i < 4096; i += 7) {
      const hex = toHex([(i * 37) % 256, (i * 91) % 256, (i * 53) % 256])
      expect(contrastRatio(onColor(hex), hex), hex).toBeGreaterThanOrEqual(4.5)
    }
  })
  it("onColor prefer", () => {
    expect(onColor("#F0F0F0", { prefer: "light" })).toBe("#12213A") // el preferido no cumple
    expect(onColor("#223366", { prefer: "dark" })).toBe("#FFFFFF")
    expect(onColor("#223366", { prefer: "light" })).toBe("#FFFFFF")
  })
  it("ensureContrast conserva matiz y respeta la direccion", () => {
    const out = ensureContrast("#7DD3FC", "#FFFFFF", 4.5)
    expect(contrastRatio(out, "#FFFFFF")).toBeGreaterThanOrEqual(4.5)
    expect(Math.abs(toOklch(out).h - toOklch("#7DD3FC").h)).toBeLessThan(8)
    const light = ensureContrast("#334477", "#12213A", 4.5)
    expect(toOklch(light).l).toBeGreaterThan(toOklch("#334477").l)
    expect(contrastRatio(light, "#12213A")).toBeGreaterThanOrEqual(4.5)
    expect(ensureContrast("#123456", "#FFFFFF", 4.5)).toBe("#123456")
  })
  it("ensureContrast sobre fondos medios siempre llega", () => {
    for (const bg of ["#808080", "#777777", "#7F7F7F", "#6F6F6F"]) {
      expect(contrastRatio(ensureContrast("#888888", bg, 4.5), bg), bg).toBeGreaterThanOrEqual(4.5)
    }
  })
})

describe("color: mezcla y fluorescentes", () => {
  it("mix extremos y punto medio perceptual", () => {
    expect(mix("#000000", "#FFFFFF", 0)).toBe("#000000")
    expect(mix("#000000", "#FFFFFF", 1)).toBe("#FFFFFF")
    expect(toOklch(mix("#000000", "#FFFFFF", 0.5)).l).toBeCloseTo(0.5, 1)
  })
  it("isFluorescent / tameChroma", () => {
    for (const f of ["#00FF00", "#FF00FF", "#FFFF00", "#00FFFF"]) expect(isFluorescent(f), f).toBe(true)
    for (const f of ["#1B4FD8", "#12213A", "#B42020", "#808080"]) expect(isFluorescent(f), f).toBe(false)
    const t = tameChroma("#00FF00")
    expect(toOklch(t).c).toBeLessThanOrEqual(0.155)
    expect(tameChroma("#4F6FB0")).toBe("#4F6FB0")
    expect(toOklch(tameChroma("#1B4FD8")).c).toBeLessThanOrEqual(0.195)
  })
})
