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
})
