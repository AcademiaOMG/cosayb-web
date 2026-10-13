import { describe, expect, it } from "vitest"
import { renderToString } from "react-dom/server"
import BreakEvenCalculator from "@/app/(app)/punto-equilibrio/BreakEvenCalculator"
import type { BreakEvenRecord } from "@/types/domain"

/**
 * Render (SSR) del paso 1 con lista libre: nombre + monto + "Agregar a la
 * lista" reemplazan a los 9 rubros fijos, y la lista agregada se renderiza
 * en la columna derecha (no dentro del aparato). El flujo de agregar/quitar
 * es interacción (no cubierta sin DOM); acá se protege el contrato de render.
 */

const render = (initialRecord: BreakEvenRecord | null = null) =>
  renderToString(<BreakEvenCalculator initialRecord={initialRecord} onSubmit={async () => {}} onDone={() => {}} />)

describe("BreakEvenCalculator — paso 1 con lista libre de costos fijos", () => {
  it("ofrece nombre + monto + Agregar a la lista en lugar de los 9 rubros", () => {
    const html = render()
    expect(html).toContain("NOMBRE DEL COSTO")
    expect(html).toContain('aria-label="Nombre del costo fijo"')
    expect(html).toContain("Ej. Arriendo")
    expect(html).toContain("Agregar a la lista")
    expect(html).toContain("MONTO AL MES")
    expect(html).toContain('aria-label="Teclado numérico"')
    expect(html).toContain("COSTOS FIJOS DEL MES")
    expect(html).toContain("Aún no has agregado costos")
    // Los aria-labels de los rubros fijos ya no existen.
    expect(html).not.toContain("(pesos al mes)")
  })

  it("muestra los costos precargados tal cual y precarga el producto", () => {
    const html = render({
      id: "be_1",
      organizationId: "org_1",
      fixedCosts: [
        { name: "Arriendo local", amount: 1500000 },
        { name: "Marketing", amount: 300000 },
      ],
      totalFixedCosts: 1800000,
      salePrice: 25000,
      variableCost: 9000,
      contributionMargin: 16000,
      breakEvenUnits: 113,
      breakEvenRevenue: 2825000,
      createdAt: "2026-01-01T00:00:00.000Z",
    })
    expect(html).toContain("Arriendo local")
    expect(html).toContain("Marketing")
    expect(html).toContain('aria-label="Quitar Arriendo local"')
    // La lista vive en la columna derecha (después de la calculadora), no dentro del aparato.
    expect(html.indexOf("Quitar Arriendo local")).toBeGreaterThan(html.indexOf("Siguiente: tu producto"))
    // Total de la lista en pantalla y precio precargado en el registro del paso 2.
    expect(html).toMatch(/1[.,]500[.,]000/)
    expect(html).toMatch(/25[.,]000/)
    expect(html).not.toContain("(pesos al mes)")
  })

  it("en blanco ofrece los rubros del Excel y la fórmula sin cifras inventadas", () => {
    const html = render()
    for (const n of ["Arriendo", "Sueldos", "Agua", "Energía", "Gas", "Teléfonos", "Marketing digital", "Impuestos", "Otros"]) {
      expect(html).toContain(`>${n}</button>`)
    }
    expect(html).toContain("Tu cálculo")
    expect(html).toContain("Agrega al menos un costo fijo")
    // Sin datos no hay margen ni unidades: guiones, nunca ceros ni NaN
    expect(html).toContain("—")
    expect(html).not.toContain("NaN")
    expect(html).not.toContain("Infinity")
  })

  it("con los datos del Excel muestra margen 19.500 y 337,69 unidades; si el precio no supera el costo variable, ninguna cifra", () => {
    const base = {
      id: "be_x", organizationId: "org_1",
      fixedCosts: [{ name: "Costos del mes", amount: 6585000 }],
      totalFixedCosts: 6585000, salePrice: 28500, variableCost: 9000,
      contributionMargin: 19500, breakEvenUnits: 337.6923, breakEvenRevenue: 9624230.77,
      createdAt: "2026-01-01T00:00:00.000Z",
    } as BreakEvenRecord
    const ok = render(base)
    expect(ok).toMatch(/19[.,]500/)
    expect(ok).toContain("337,69")
    const bad = render({ ...base, salePrice: 9000 })
    expect(bad).toContain("debe ser mayor al costo variable")
    expect(bad).not.toContain("337,69")
    expect(bad).not.toContain("NaN")
  })
})
