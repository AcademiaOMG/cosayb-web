import { describe, expect, it } from "vitest"
import { renderToString } from "react-dom/server"
import BreakEvenCalculator, { solveLive } from "@/app/(app)/punto-equilibrio/BreakEvenCalculator"
import {
  calcPhase,
  fixedCostsFromFields,
  inputsSignature,
  prefillCostFields,
  presetCostFields,
  sumCostFields,
} from "@/lib/calculator/breakEvenFields"
import type { BreakEvenRecord } from "@/types/domain"

/**
 * "Nuevo cálculo": la calculadora del kit en dos pasos (costos fijos elegidos por
 * rubro y agregados a una lista; luego precio y costo variable) con el boleto de
 * resultados que aparece al pulsar Calcular. Se protege el contrato de
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

const calcularBtn = (html: string) => html.includes(">Calcular</button>")
const guardarDisabled = (html: string) => /<button[^>]*disabled[^>]*>Guardar<[/]button>/.test(html)

describe("BreakEvenCalculator — paso 1 en blanco", () => {
  const html = render()

  it("es la calculadora del kit con teclado numérico y los dos pasos a la vista", () => {
    expect(html).toContain('aria-label="Calculadora de punto de equilibrio"')
    expect(html).toContain("calc-device")
    expect(html).toContain('aria-label="Teclado numérico"')
    expect(html).toContain("COSTOS FIJOS DEL MES")
    expect(html).toContain('aria-label="Pasos del cálculo"')
    expect(html).toContain(">Costos fijos</span>")
    expect(html).toContain(">Tu producto</span>")
    expect(html).toContain('inputMode="none"')
    expect(html).not.toContain('inputMode="decimal"')
  })

  it("los 9 rubros se eligen como botones (no hay lista larga de campos ni nombres que escribir)", () => {
    // Teclas de función del aparato (no pastillas): una por rubro, en rejilla
    for (const n of RUBROS) expect(html).toMatch(new RegExp(`<button[^>]*calc-key-fn[^>]*aria-pressed[^>]*aria-label="${n}"`))
    expect(html).toContain("Marketing<")
    expect(html).toContain('aria-label="Tipo de costo fijo"')
    // Un solo campo de monto, el del rubro elegido (Arriendo al inicio)
    expect(html).toMatch(/calc-register-label[^>]*>ARRIENDO<[/]label>/)
    expect(html).not.toContain("Renombrar")
    expect(html).not.toContain("Otro costo")
    expect(html).not.toContain(">Precio de venta</label>")
  })

  it("«Agregar a la lista» y la lista vacía a la derecha, sin textos de instrucciones", () => {
    expect(html).toContain(">Agregar a la lista</button>")
    expect(html).toContain("Sin costos todavía")
    for (const t of ["Cómo se calcula", "pulsa", "Pulsa", "Continuar", "Resultado en vivo", "Listo para guardar"]) expect(html).not.toContain(t)
    // «Tu producto →» solo aparece cuando ya hay algún costo en la lista
    expect(html).not.toContain("Tu producto →")
  })

  it("sin resultado: pregunta y recuadro punteado, pero sin boleto, cifras ni ranura de impresora", () => {
    expect(html).toContain("¿Cuántas unidades debo vender?")
    expect(html).toContain("El resultado aparecerá aquí cuando pulses Calcular")
    expect(html).not.toContain("calc-printer-slot")
    for (const t of [
      "calc-receipt-print",
      "Margen por unidad",
      "Unidades por día",
      "Ventas del mes",
      "Ventas del día",
      "Unidades para cubrir costos al mes",
      "NaN",
      "Infinity",
    ]) {
      expect(html).not.toContain(t)
    }
    expect(calcularBtn(html)).toBe(false) // «Calcular» vive en el paso 2
    expect(html).not.toContain(">Guardar</button>")
    expect(html).toContain("Limpiar")
  })
})

describe("BreakEvenCalculator — precarga", () => {
  it("con los datos del Excel: lista con los 9 costos, total, paso 2 y boleto ya calculado", () => {
    const html = render(excel)
    for (const n of RUBROS) expect(html).toContain(`aria-label="Quitar ${n}"`)
    expect(html).toContain("$ 2.000.000") // Arriendo en la lista
    expect(html).toContain("$ 3.000.000") // Sueldos
    expect(html).toContain("$ 150.000") // Otros
    expect(html).toContain('value="$ 28.500"')
    expect(html).toContain('value="$ 9.000"')
    expect(html).toContain("$ 6.585.000") // total de fijos
    expect(html).toContain("$ 19.500") // margen
    expect(html).toContain("337,69") // unidades al mes
    expect(html).toContain("11,26") // por día
    expect(html).toContain("$ 9.624.231") // ventas del mes
    expect(html).toContain("$ 320.808") // ventas del día
    expect(html).toContain("calc-receipt-print")
    expect(calcularBtn(html)).toBe(false)
    expect(guardarDisabled(html)).toBe(false)
  })

  it("la lista conserva el orden del registro y un costo con otro nombre también aparece", () => {
    const html = render({ ...excel, fixedCosts: [{ name: "Arriendo", amount: 2000000 }, { name: "Seguro del local", amount: 80000 }] })
    expect(html).toContain('aria-label="Quitar Seguro del local"')
    expect(html.indexOf('aria-label="Quitar Arriendo"')).toBeLessThan(html.indexOf('aria-label="Quitar Seguro del local"'))
    expect(html).toContain("$ 2.080.000")
  })

  it("si el precio no supera el costo variable no hay boleto: aviso del motivo y Calcular", () => {
    const html = render({ ...excel, salePrice: 9000 })
    expect(html).toContain("debe ser mayor al costo variable")
    expect(html).not.toContain("calc-receipt-print")
    expect(html).not.toContain("337,69")
    expect(html).not.toContain("NaN")
    expect(html).not.toContain("Infinity")
    expect(calcularBtn(html)).toBe(true)
  })

  it("faltan el precio y el costo variable: la lista se ve, no hay boleto y se empieza por el paso 1", () => {
    const html = render({ ...excel, salePrice: 0, variableCost: 0 })
    expect(html).toContain("$ 6.585.000")
    expect(html).not.toContain("calc-receipt-print")
    expect(html).not.toContain("337,69")
    expect(html).toContain(">Agregar a la lista</button>")
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

describe("fase del boleto: calculado / obsoleto (calcPhase)", () => {
  const { fields, values } = prefillCostFields(excel.fixedCosts)
  const vals = { ...values, price: "28500", variable: "9000" }
  const sig = inputsSignature(fields, vals)

  it("sin haber calculado: en reposo, sin boleto", () => {
    expect(calcPhase(null, sig)).toBe("idle")
  })

  it("calculado con los mismos datos: listo (boleto visible) y con las cifras del Excel", () => {
    expect(calcPhase(sig, inputsSignature(fields, { ...vals }))).toBe("ready")
    const r = solveLive(sumCostFields(fields, vals), 28500, 9000)
    if (!r.ok) throw new Error(r.message)
    expect(r.result.unitsPerMonth).toBeCloseTo(337.69, 2)
    expect(r.result.unitsPerDay).toBeCloseTo(11.26, 2)
    expect(r.result.revenuePerMonth).toBeCloseTo(9624230.77, 2)
    expect(r.result.revenuePerDay).toBeCloseTo(320807.69, 2)
  })

  it("cualquier cambio de dato después de calcular lo vuelve obsoleto", () => {
    expect(calcPhase(sig, inputsSignature(fields, { ...vals, price: "29000" }))).toBe("stale")
    expect(calcPhase(sig, inputsSignature(fields, { ...vals, variable: "0" }))).toBe("stale")
    expect(calcPhase(sig, inputsSignature(fields, { ...vals, rent: "2000001" }))).toBe("stale")
    expect(calcPhase(sig, inputsSignature(fields.map((f) => (f.id === "rent" ? { ...f, name: "Local" } : f)), vals))).toBe("stale")
    // Volver al valor original lo deja listo otra vez
    expect(calcPhase(sig, inputsSignature(fields, { ...vals, price: "28500" }))).toBe("ready")
  })

  it("casos inválidos: no hay resultado que mostrar aunque se pulse Calcular", () => {
    expect(solveLive(0, 28500, 9000).ok).toBe(false)
    expect(solveLive(6585000, 9000, 9000).ok).toBe(false)
    expect(solveLive(6585000, null, null).ok).toBe(false)
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
