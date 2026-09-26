import { describe, expect, it } from "vitest"
import { MODE_ORDER, calcPricing, nextMode, solveValuation } from "@/app/(app)/valoracion/lib"

const base = { costoMP: null, pctMP: null, precioVenta: null, margin: 3 }

describe("solveValuation", () => {
  it("precio de materia prima: despeja el costo desde precio de venta y % MP", () => {
    const r = solveValuation("precio-mp", { ...base, precioVenta: 25000, pctMP: 22 })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(Math.round(r.costoMP)).toBe(5340)
    expect(r.value).toBe(r.costoMP)
    // coherente con la fórmula directa que se guarda en el historial
    expect(Math.round(calcPricing(r.costoMP, 22, 3)!.suggested)).toBe(25000)
  })

  it("% de materia prima: despeja el % desde costo y precio", () => {
    const r = solveValuation("porcentaje-mp", { ...base, costoMP: 5340, precioVenta: 25000 })
    expect(r.ok && r.pctMP.toFixed(1)).toBe("22.0")
  })

  it("precio de venta: despeja el precio desde costo y % MP", () => {
    const r = solveValuation("precio-venta", { ...base, costoMP: 5000, pctMP: 35 })
    expect(r.ok && Math.round(r.precioVenta)).toBe(14714)
  })

  it("explica qué falta en vez de fallar en silencio", () => {
    const r = solveValuation("precio-mp", { ...base, precioVenta: 25000 })
    expect(r).toMatchObject({ ok: false, reason: "missing", field: "pctMP" })
  })

  it("rechaza un % de materia prima fuera de rango con un mensaje", () => {
    const r = solveValuation("precio-mp", { ...base, precioVenta: 25000, pctMP: 2235 })
    expect(r).toMatchObject({ ok: false, reason: "invalid", field: "pctMP" })
  })

  it("rechaza un precio de venta menor al costo con margen", () => {
    const r = solveValuation("porcentaje-mp", { ...base, costoMP: 10000, precioVenta: 9000 })
    expect(r).toMatchObject({ ok: false, reason: "invalid", field: "precioVenta" })
  })
})

describe("orden de los modos", () => {
  it("va del costo al precio de venta, y cada paso alimenta al siguiente", () => {
    expect(MODE_ORDER).toEqual(["precio-mp", "porcentaje-mp", "precio-venta"])
    expect(nextMode("precio-mp")).toBe("porcentaje-mp")
    expect(nextMode("porcentaje-mp")).toBe("precio-venta")
    expect(nextMode("precio-venta")).toBeNull()
  })
})
