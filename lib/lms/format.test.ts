import { describe, expect, it } from "vitest"
import { durationLabel, isNew, pct, secondsLabel, toneForPct } from "./format"

describe("format LMS", () => {
  it("duración legible", () => {
    expect(durationLabel(0)).toBe("A tu ritmo")
    expect(durationLabel(45)).toBe("45 min")
    expect(durationLabel(120)).toBe("2 h")
    expect(durationLabel(150)).toBe("2 h 30 min")
  })
  it("porcentaje acotado", () => {
    expect(pct(0, 0)).toBe(0)
    expect(pct(1, 3)).toBe(33)
    expect(pct(9, 3)).toBe(100)
  })
  it("tono según avance y novedad", () => {
    expect(toneForPct(100)).toBe("mint")
    expect(toneForPct(10)).toBe("rose")
    expect(isNew(new Date().toISOString())).toBe(true)
    expect(isNew("2020-01-01T00:00:00Z")).toBe(false)
  })
  it("tiempo mm:ss", () => {
    expect(secondsLabel(0)).toBe("—")
    expect(secondsLabel(125)).toBe("2:05")
  })
})
