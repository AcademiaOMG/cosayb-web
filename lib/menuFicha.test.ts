import { describe, it, expect } from "vitest"
import { buildFichaItems, buildFichaPrecio, calcularCosto, pesoPorcionG } from "@/lib/menuFicha"

// Fixture: hoja FORMATOMENU del Excel APPAYB002, menú "Cumpleaños Tuty"
// (10 personas, margen de seguridad 5 %, materia prima 31 %).
const ITEMS = [
  { key: "1", nombre: "Salmon en salsa de Coco", costoUnit: 3.0870850432851062 },
  { key: "2", nombre: "Arroz con pimenton", costoUnit: 2.97 },
  { key: "3", nombre: "salsa de Tres Acidos y tequila", costoUnit: 1.97 },
  { key: "4", nombre: "Verduras al Wok", costoUnit: 2.5 },
  { key: "5", nombre: "Postre de chocolate", costoUnit: 4 },
].map((i) => ({ ...i, extra: false, cantidad: 200, unidad: "g" as const }))

const costo = calcularCosto(
  ITEMS.map((i) => ({ cantidadGramos: i.cantidad, costoGramo: i.costoUnit })),
  10, 5, 31,
)!

describe("Menú — cálculos iguales a FORMATOMENU", () => {
  it("coincide con las celdas del Excel", () => {
    expect(costo.costoTotalPorcion).toBeCloseTo(2905.4170086570211, 6) // F22
    expect(costo.costoTotalPersonas).toBeCloseTo(29054.170086570211, 6) // H22
    expect(costo.margenAplicadoPorcion).toBeCloseTo(145.27085043285106, 6) // E23
    expect(costo.costoConMargenPorcion).toBeCloseTo(3050.6878590898723, 6) // E24
    expect(costo.precioPotencialVentaPorcion).toBeCloseTo(9840.9285777092664, 6) // D28
    expect(costo.pctCostosFijos).toBeCloseTo(38.3333333, 5) // D27
    expect(costo.pctGanancia).toBeCloseTo(30.6666667, 5) // D29
    expect(costo.indicator).toBe("MUY_BUENO") // E26
  })

  it("peso, costo por gramo y totales por persona como en el Excel", () => {
    const items = buildFichaItems(ITEMS, 10)
    expect(pesoPorcionG(items)).toBe(1000) // D22
    expect(costo.costoTotalPorcion / pesoPorcionG(items)).toBeCloseTo(2.9054170086570212, 8) // F4
    expect(items[0].cantidadTotal).toBe(2000) // G16
    expect(items[0].costoTotal).toBeCloseTo(6174.1700865702123, 6) // H16
  })

  it("los extras (unidades) no suman al peso", () => {
    expect(pesoPorcionG([{ cantidad: 200, unidad: "g" }, { cantidad: 2, unidad: "und" }])).toBe(200)
  })

  it("«cómo se arma el precio» reproduce fijos y ganancia en $ del Excel y suma al precio", () => {
    const l = Object.fromEntries(buildFichaPrecio(costo, 10, 5, 31).map((x) => [x.key, x]))
    expect(l.fijos.porPorcion).toBeCloseTo(3772.355954788552, 6) // E27
    expect(l.ganancia.porPorcion).toBeCloseTo(3017.8847638308416, 6) // E29
    expect(l.conMargen.porPorcion + l.fijos.porPorcion + l.ganancia.porPorcion)
      .toBeCloseTo(l.precio.porPorcion, 6)
    expect(l.precio.total).toBeCloseTo(l.precio.porPorcion * 10, 6)
    expect(l.margen.label).toContain("5%")
  })
})
