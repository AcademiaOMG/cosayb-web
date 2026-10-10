import { describe, it, expect } from "vitest"
import { renderToString } from "react-dom/server"
import MenuCalculator from "@/app/(app)/menu/MenuCalculator"

const noop = () => {}

function render(props?: Partial<Parameters<typeof MenuCalculator>[0]>) {
  return renderToString(
    <MenuCalculator
      values={{ persons: "10", margin: "5", pctMP: "31" }}
      resetValues={{ persons: "10", margin: "5", pctMP: "31" }}
      itemCount={2}
      costoPorcion={12500}
      recipes={[{ id: "r1", name: "Bandeja paisa" }]}
      ingredients={[{ id: "i1", name: "Gaseosa 400ml" }]}
      onChange={noop}
      onAddItem={noop}
      onCalculate={noop}
      {...props}
    />,
  )
}

describe("Calculadora del módulo Menú", () => {
  it("muestra los registros, la pantalla y las opciones para agregar", () => {
    const html = render()

    expect(html).toContain("TOTAL POR PORCIÓN")
    expect(html).toContain("N° DE PERSONAS")
    expect(html).toContain("MARGEN DE SEGURIDAD")
    expect(html).toContain("% MATERIA PRIMA")
    expect(html).toContain("GRAMOS POR PORCIÓN")
    expect(html).toContain("Recetas")
    expect(html).toContain("Ingredientes")
    expect(html).toContain("Agregar a la lista")
    expect(html).not.toContain("Agregar extra")
    expect(html).toContain("Calcular")
    expect(html).toContain("2 en la lista · 10 personas")
  })

  it("explica qué falta cuando la lista está vacía", () => {
    const html = render({ itemCount: 0, costoPorcion: null })

    expect(html).toContain("Agrega platos con el botón Agregar a la lista")
  })
})
