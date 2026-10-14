import { describe, expect, it } from "vitest"
import { renderToString } from "react-dom/server"
import BreakEvenCalculator, { solveLive, sumFixedRows } from "@/app/(app)/punto-equilibrio/BreakEvenCalculator"
import type { BreakEvenRecord } from "@/types/domain"

/**
 * Pantalla única en vivo: costos fijos, producto y resultado siempre a la
 * vista. Se protege el contrato de render (SSR) y la lógica en vivo (pura);
 * las interacciones de teclear no se cubren sin DOM.
 */

const render = (initialRecord: BreakEvenRecord | null = null) =>
  renderToString(<BreakEvenCalculator initialRecord={initialRecord} onSubmit={async () => {}} onDone={() => {}} />)

const excel = {
  id: "be_x",
  organizationId: "org_1",
  fixedCosts: [
    { name: "Arriendo", amount: 4000000 },
    { name: "Sueldos", amount: 2585000 },
  ],
  totalFixedCosts: 6585000,
  salePrice: 28500,
  variableCost: 9000,
  contributionMargin: 19500,
  breakEvenUnits: 337.6923,
  breakEvenRevenue: 9624230.77,
  createdAt: "2026-01-01T00:00:00.000Z",
} as BreakEvenRecord

describe("BreakEvenCalculator — vista inicial en blanco", () => {
  const html = render()

  it("muestra los tres bloques a la vez, sin pasos, Continuar, Calcular ni modal de resultado", () => {
    for (const t of ["Costos fijos", "Tu producto", "Resultado en vivo", "Total al mes", "Margen por unidad"]) {
      expect(html).toContain(t)
    }
    expect(html).toContain("Precio de venta")
    expect(html).toContain("Costo variable por unidad")
    for (const t of ["Continuar", "Siguiente", "Calcular<", "Resultado del cálculo", "Pasos del cálculo", 'aria-label="Teclado numérico"']) {
      expect(html).not.toContain(t)
    }
  })

  it("ofrece los 9 rubros del Excel como chips y la acción de otro costo", () => {
    for (const n of ["Arriendo", "Sueldos", "Agua", "Energía", "Gas", "Teléfonos", "Marketing digital", "Impuestos", "Otros"]) {
      expect(html).toContain(`>${n}</button>`)
    }
    expect(html).toContain("Otro costo")
  })

  it("usa campos numéricos accesibles (inputMode decimal, etiquetas) y Guardar deshabilitado", () => {
    expect(html).toContain('inputMode="decimal"')
    expect(html).toMatch(/<label[^>]*for="[^"]*-price"[^>]*>Precio de venta<\/label>/)
    expect(html).toMatch(/<button[^>]*disabled[^>]*>Guardar<\/button>/)
    expect(html).toContain("Limpiar")
  })

  it("sin datos: guiones y el motivo, nunca ceros, NaN ni Infinity", () => {
    expect(html).toContain("UNIDADES AL MES")
    expect(html).toContain("UNIDADES AL DÍA")
    expect(html).toContain("VENTAS DEL MES")
    expect(html).toContain("VENTAS DEL DÍA")
    expect(html).toContain("—")
    expect(html).toContain("Agrega al menos un costo fijo")
    expect(html).not.toContain("NaN")
    expect(html).not.toContain("Infinity")
  })
})

describe("BreakEvenCalculator — precarga", () => {
  it("con los datos del Excel calcula en vivo sin pulsar nada", () => {
    const html = render(excel)
    expect(html).toContain('value="Arriendo"')
    expect(html).toContain('aria-label="Quitar Sueldos"')
    expect(html).toMatch(/6[.,]585[.,]000/)
    expect(html).toMatch(/19[.,]500/) // margen
    expect(html).toContain("337,69") // unidades al mes
    expect(html).toContain("11,26") // unidades al día
    expect(html).toContain("Listo para guardar")
    expect(html).not.toMatch(/<button[^>]*disabled[^>]*>Guardar<\/button>/)
  })

  it("si el precio no supera el costo variable no muestra ninguna cifra", () => {
    const html = render({ ...excel, salePrice: 9000 })
    expect(html).toContain("debe ser mayor al costo variable")
    expect(html).not.toContain("337,69")
    expect(html).not.toContain("NaN")
    expect(html).toMatch(/<button[^>]*disabled[^>]*>Guardar<\/button>/)
  })
})

describe("solveLive — valores de la hoja PUNTOEKILIBRIO", () => {
  it("fijos 6.585.000, precio 28.500, variable 9.000", () => {
    const r = solveLive(6585000, 28500, 9000)
    if (!r.ok) throw new Error(r.message)
    expect(r.result.contributionMargin).toBe(19500)
    expect(r.result.unitsPerMonth).toBeCloseTo(337.6923, 4)
    expect(r.result.unitsPerDay).toBeCloseTo(11.2564, 4)
    expect(r.result.revenuePerMonth).toBeCloseTo(9624230.77, 2)
    expect(r.result.revenuePerDay).toBeCloseTo(320807.69, 2)
  })

  it("costo variable 0 es válido (producto sin insumos)", () => {
    const r = solveLive(1000, 100, 0)
    expect(r.ok).toBe(true)
  })

  it("falta un dato: motivo claro y ninguna cifra", () => {
    const a = solveLive(0, 28500, 9000)
    expect(a).toMatchObject({ ok: false, kind: "empty", message: "Agrega al menos un costo fijo" })
    const b = solveLive(6585000, null, 9000)
    expect(b).toMatchObject({ ok: false, kind: "empty", message: "Escribe el precio de venta" })
    const c = solveLive(6585000, 28500, null)
    expect(c).toMatchObject({ ok: false, kind: "empty" })
    expect(c.ok === false && c.message).toContain("costo variable")
    const d = solveLive(0, null, null)
    expect(d.ok === false && d.message).toBe("Agrega al menos un costo fijo y escribe el precio de venta y escribe el costo variable (0 si no tiene insumos)")
  })

  it("margen cero o negativo: no calcula", () => {
    for (const price of [9000, 5000]) {
      const r = solveLive(6585000, price, 9000)
      expect(r).toMatchObject({ ok: false, kind: "invalid" })
      expect(r.ok === false && r.message).toContain("debe ser mayor al costo variable")
    }
  })

  it("valores inválidos o desborde: no calcula", () => {
    expect(solveLive(NaN, 28500, 9000).ok).toBe(false)
    expect(solveLive(6585000, -1, 9000).ok).toBe(false)
    expect(solveLive(6585000, 28500, -5).ok).toBe(false)
    const big = solveLive(Number.MAX_VALUE, 3, 1)
    expect(big.ok).toBe(false)
  })
})

describe("sumFixedRows", () => {
  it("suma solo montos válidos (vacíos y 0 no cuentan)", () => {
    expect(
      sumFixedRows([
        { id: 1, name: "Arriendo", amount: "4000000" },
        { id: 2, name: "Sueldos", amount: "2585000" },
        { id: 3, name: "Agua", amount: "" },
        { id: 4, name: "Gas", amount: "0" },
      ]),
    ).toBe(6585000)
    expect(sumFixedRows([])).toBe(0)
  })
})
