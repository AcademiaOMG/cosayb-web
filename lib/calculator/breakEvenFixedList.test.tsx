import { describe, expect, it } from "vitest"
import { renderToString } from "react-dom/server"
import BreakEvenCalculator, { solveLive } from "@/app/(app)/punto-equilibrio/BreakEvenCalculator"
import {
  fixedCostsFromFields,
  prefillCostFields,
  presetCostFields,
  sumCostFields,
} from "@/lib/calculator/breakEvenFields"
import type { BreakEvenRecord } from "@/types/domain"

/**
 * "Nuevo cálculo": la calculadora del kit en dos columnas (un campo LCD por
 * concepto) con el boleto de resultados al lado. Se protege el contrato de
 * render (SSR) y la lógica pura; teclear no se cubre sin DOM.
 */

const render = (initialRecord: BreakEvenRecord | null = null) =>
  renderToString(<BreakEvenCalculator initialRecord={initialRecord} onSubmit={async () => {}} onDone={() => {}} />)

const RUBROS = ["Arriendo", "Sueldos", "Agua", "Energía", "Gas", "Teléfonos", "Marketing digital", "Impuestos", "Otros"]

// Los 9 rubros del Excel (suman 6.585.000)
const excel = {
  id: "be_x",
  organizationId: "org_1",
  fixedCosts: [
    { name: "Arriendo", amount: 2000000 },
    { name: "Sueldos", amount: 3000000 },
    { name: "Agua", amount: 100000 },
    { name: "Energía", amount: 350000 },
    { name: "Gas", amount: 185000 },
    { name: "Teléfonos", amount: 100000 },
    { name: "Marketing digital", amount: 450000 },
    { name: "Impuestos", amount: 250000 },
    { name: "Otros", amount: 150000 },
  ],
  totalFixedCosts: 6585000,
  salePrice: 28500,
  variableCost: 9000,
  contributionMargin: 19500,
  breakEvenUnits: 337.6923,
  breakEvenRevenue: 9624230.77,
  createdAt: "2026-01-01T00:00:00.000Z",
} as BreakEvenRecord

const guardarDisabled = (html: string) => /<button[^>]*disabled[^>]*>Guardar<\/button>/.test(html)

describe("BreakEvenCalculator — vista inicial en blanco", () => {
  const html = render()

  it("es la calculadora del kit en una columna, con teclado numérico y sin cuadros de texto sueltos", () => {
    expect(html).toContain('aria-label="Calculadora de punto de equilibrio"')
    expect(html).toContain("calc-device")
    expect(html).toContain('aria-label="Teclado numérico"')
    expect(html).toContain("COSTOS FIJOS DEL MES")
    // Los campos son registros LCD (inputMode none), no inputs de pesos normales
    expect(html).not.toContain('inputMode="decimal"')
    expect(html).toContain('inputMode="none"')
    for (const t of ["Continuar", "Siguiente", "Resultado en vivo"]) expect(html).not.toContain(t)
  })

  it("trae los 9 rubros del Excel como campos LCD, cada uno con su lápiz para renombrar", () => {
    for (const n of RUBROS) {
      expect(html).toMatch(new RegExp(`<label[^>]*calc-register-label[^>]*>${n}</label>`))
      expect(html).toContain(`aria-label="Renombrar ${n}"`)
    }
    // Los predefinidos no se quitan; solo los añadidos
    expect(html).not.toContain('aria-label="Quitar')
    expect(html).toContain("Otro costo")
  })

  it("después de los costos: separador «Tu producto», precio y costo variable", () => {
    const sep = html.indexOf("Tu producto")
    expect(sep).toBeGreaterThan(html.indexOf(">Otros</label>"))
    expect(html.indexOf(">Precio de venta</label>")).toBeGreaterThan(sep)
    expect(html.indexOf(">Costo variable por unidad</label>")).toBeGreaterThan(html.indexOf(">Precio de venta</label>"))
    expect(html).toContain("0 si no tiene insumos")
  })

  it("orden del DOM = orden de Tab: pantalla y costos (izquierda), luego producto, teclado y Guardar (derecha)", () => {
    const at = (t: string) => html.indexOf(t)
    const seq = ["COSTOS FIJOS DEL MES", ">Arriendo</label>", ">Otros</label>", "Otro costo", "Tu producto", ">Precio de venta</label>", ">Costo variable por unidad</label>", "Teclado numérico", ">Guardar</button>"]
    const pos = seq.map(at)
    expect(pos.every((n) => n >= 0)).toBe(true)
    expect([...pos].sort((a, b) => a - b)).toEqual(pos)
    // El boleto va después de toda la carcasa
    expect(at("Unidades por día")).toBeGreaterThan(at(">Guardar</button>"))
  })

  it("lleva el boleto de resultados con todas sus filas y Guardar deshabilitado", () => {
    expect(html).toContain("Punto de equilibrio")
    for (const t of [
      "Costos fijos del mes",
      "Margen por unidad",
      "Unidades por día",
      "Ventas del mes",
      "Ventas del día",
      "Unidades para cubrir costos al mes",
    ]) {
      expect(html).toContain(t)
    }
    expect(guardarDisabled(html)).toBe(true)
    expect(html).toContain("Limpiar")
  })

  it("sin datos: guiones y el motivo, nunca cifras ni NaN ni Infinity", () => {
    expect(html).toContain("—")
    expect(html).toContain("Agrega al menos un costo fijo")
    expect(html).not.toContain("NaN")
    expect(html).not.toContain("Infinity")
    expect(html).not.toContain("337,69")
  })
})

describe("BreakEvenCalculator — precarga", () => {
  it("con los datos del Excel rellena los campos por nombre y calcula en vivo", () => {
    const html = render(excel)
    expect(html).toContain('value="$ 2.000.000"') // Arriendo
    expect(html).toContain('value="$ 3.000.000"') // Sueldos
    expect(html).toContain('value="$ 150.000"') // Otros
    expect(html).toContain('value="$ 28.500"')
    expect(html).toContain('value="$ 9.000"')
    expect(html).toContain("$ 6.585.000") // total de fijos
    expect(html).toContain("$ 19.500") // margen
    expect(html).toContain("337,69") // unidades al mes
    expect(html).toContain("11,26") // por día
    expect(html).toContain("$ 9.624.231") // ventas del mes
    expect(html).toContain("$ 320.808") // ventas del día
    expect(html).toContain("Listo para guardar")
    expect(guardarDisabled(html)).toBe(false)
  })

  it("un costo con otro nombre crea un campo añadido que se puede quitar", () => {
    const html = render({ ...excel, fixedCosts: [{ name: "Arriendo", amount: 2000000 }, { name: "Seguro del local", amount: 80000 }] })
    expect(html).toMatch(/calc-register-label[^>]*>Seguro del local<\/label>/)
    expect(html).toContain('aria-label="Quitar Seguro del local"')
    expect(html).toContain('value="$ 80.000"')
    expect(html).toContain("$ 2.080.000")
  })

  it("si el precio no supera el costo variable no muestra ninguna cifra de resultado", () => {
    const html = render({ ...excel, salePrice: 9000 })
    expect(html).toContain("debe ser mayor al costo variable")
    expect(html).not.toContain("337,69")
    expect(html).not.toContain("NaN")
    expect(html).not.toContain("Infinity")
    expect(guardarDisabled(html)).toBe(true)
  })

  it("faltan el precio y el costo variable: los fijos se ven, el resultado es «—» con el motivo", () => {
    const html = render({ ...excel, salePrice: 0, variableCost: 0 })
    expect(html).toContain("$ 6.585.000")
    expect(html).toContain("Escribe el precio de venta")
    expect(html).not.toContain("337,69")
    expect(guardarDisabled(html)).toBe(true)
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
    expect(solveLive(1000, 100, 0).ok).toBe(true)
  })

  it("falta un dato: motivo claro y ninguna cifra", () => {
    expect(solveLive(0, 28500, 9000)).toMatchObject({ ok: false, kind: "empty", message: "Agrega al menos un costo fijo" })
    expect(solveLive(6585000, null, 9000)).toMatchObject({ ok: false, kind: "empty", message: "Escribe el precio de venta" })
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
    expect(solveLive(Number.MAX_VALUE, 3, 1).ok).toBe(false)
  })
})

describe("campos de costos fijos (breakEvenFields)", () => {
  it("los predefinidos son los 9 rubros del Excel, en orden y vacíos", () => {
    const { fields, values } = prefillCostFields()
    expect(fields.map((f) => f.name)).toEqual(RUBROS)
    expect(fields.every((f) => f.preset)).toBe(true)
    expect(Object.values(values).every((v) => v === "")).toBe(true)
    expect(sumCostFields(fields, values)).toBe(0)
    expect(fixedCostsFromFields(fields, values)).toEqual([])
    expect(presetCostFields()).toEqual(fields)
  })

  it("el Excel suma 6.585.000 y guarda los 9 rubros", () => {
    const { fields, values } = prefillCostFields(excel.fixedCosts)
    expect(fields).toHaveLength(9)
    expect(sumCostFields(fields, values)).toBe(6585000)
    expect(fixedCostsFromFields(fields, values)).toEqual(excel.fixedCosts)
  })

  it("el nombre coincide sin importar tildes ni mayúsculas; lo que no coincide se añade; repetidos suman", () => {
    const { fields, values } = prefillCostFields([
      { name: "energia", amount: 300000 },
      { name: "ENERGÍA", amount: 50000 },
      { name: "Seguros", amount: 70000 },
      { name: "  ", amount: 999 },
      { name: "Gas", amount: 0 },
    ])
    expect(fields).toHaveLength(10)
    expect(values.energy).toBe("350000")
    const extra = fields[9]
    expect(extra).toMatchObject({ name: "Seguros", preset: false })
    expect(values[extra.id]).toBe("70000")
    expect(values.gas).toBe("")
    expect(sumCostFields(fields, values)).toBe(420000)
  })

  it("una fila con monto 0 o vacío no se guarda ni suma", () => {
    const { fields, values } = prefillCostFields()
    const v = { ...values, rent: "0", salaries: "1500000", water: "" }
    expect(sumCostFields(fields, v)).toBe(1500000)
    expect(fixedCostsFromFields(fields, v)).toEqual([{ name: "Sueldos", amount: 1500000 }])
  })

  it("usa el nombre renombrado al guardar", () => {
    const { fields, values } = prefillCostFields([{ name: "Arriendo", amount: 100 }])
    const renamed = fields.map((f) => (f.id === "rent" ? { ...f, name: "  Local  " } : f))
    expect(fixedCostsFromFields(renamed, values)).toEqual([{ name: "Local", amount: 100 }])
  })
})
