import { describe, expect, it } from "vitest"
import { IND, indicatorFromMC, indicatorFromPctMP } from "./indicator"

describe("rangos PO del semáforo (% de materia prima)", () => {
  it("respeta los límites 32/37 (verde / ámbar / rojo)", () => {
    expect(indicatorFromPctMP(31.9)).toBe("MUY BUENO")
    expect(indicatorFromPctMP(32)).toBe("REGULAR")
    expect(indicatorFromPctMP(37)).toBe("REGULAR")
    expect(indicatorFromPctMP(37.1)).toBe("MALO")
  })
})

describe("espejo MC% 68/63 (Punto de Equilibrio)", () => {
  it("respeta los límites 68/63", () => {
    expect(indicatorFromMC(68.1)).toBe("MUY BUENO")
    expect(indicatorFromMC(68)).toBe("REGULAR")
    expect(indicatorFromMC(63)).toBe("REGULAR")
    expect(indicatorFromMC(62.9)).toBe("MALO")
  })

  it("es el espejo exacto de %MP (MC = 100 − %costo)", () => {
    for (const pct of [10, 31.5, 32, 34, 37, 37.5, 55, 90]) {
      expect(indicatorFromMC(100 - pct)).toBe(indicatorFromPctMP(pct))
    }
  })
})

describe("colores del semáforo", () => {
  it("los tres niveles tienen color, fondo y sublabel propios", () => {
    const colors = [IND["MUY BUENO"].color, IND["REGULAR"].color, IND["MALO"].color]
    expect(new Set(colors).size).toBe(3)
    for (const key of ["MUY BUENO", "REGULAR", "MALO"] as const) {
      expect(IND[key].bg).toBeTruthy()
      expect(IND[key].sublabel).toBeTruthy()
    }
  })
})
