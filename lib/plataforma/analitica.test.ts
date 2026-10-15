import { describe, it, expect } from "vitest"
import { adoptionText, barWidth, canCompare, heatLevel, historyNotice, trendText, weekRangeLabel, type Capture } from "./analitica"
import { funnelStepLabel } from "./labels"

const cap = (over: Partial<Capture>): Capture => ({ startedAt: "2026-10-10T15:00:00Z", historyDays: 6, totalEvents: 40, enough: false, ...over })

describe("aviso de poca historia", () => {
  it("sin eventos explica que aún no hay uso", () => {
    expect(historyNotice(cap({ startedAt: null, historyDays: 0, totalEvents: 0 }))).toMatch(/Todavía no hay uso registrado/)
  })
  it("con menos de 7 días dice cuándo empezó y cuántos días hay", () => {
    const t = historyNotice(cap({}))!
    expect(t).toMatch(/La captura de uso empezó el 10 de octubre de 2026; hay 6 días de historia/)
    expect(historyNotice(cap({ historyDays: 1 }))).toMatch(/hay 1 día de historia/)
  })
  it("con historia suficiente no avisa", () => {
    expect(historyNotice(cap({ historyDays: 20, enough: true }))).toBeNull()
  })
  it("solo compara con el periodo anterior si la captura cubre ambos", () => {
    expect(canCompare(cap({ historyDays: 59 }), 30)).toBe(false)
    expect(canCompare(cap({ historyDays: 60 }), 30)).toBe(true)
  })
})

describe("retención: intensidad de color", () => {
  it("clasifica por tramos y distingue «sin dato» de 0 %", () => {
    expect([null, 0, 4.9, 10, 24.9, 25, 49.9, 50, 100].map(heatLevel)).toEqual([-1, 0, 1, 2, 2, 3, 3, 4, 4])
  })
  it("rotula la semana de lunes a domingo", () => {
    expect(weekRangeLabel("2026-09-14")).toMatch(/14 de sept.*20 de sept/)
    expect(weekRangeLabel("2026-09-28")).toMatch(/28 de sept.*4 de oct/)
  })
})

describe("textos de cifras", () => {
  it("tendencia con flecha y sin base", () => {
    expect(trendText(150, true)).toBe("▲ 150 %")
    expect(trendText(-22.2, true)).toBe("▼ 22,2 %")
    expect(trendText(null, true)).toBe("Nuevo")
    expect(trendText(0, true)).toBe("Igual")
    expect(trendText(10, false)).toBe("Sin comparación")
  })
  it("barras proporcionales con mínimo visible", () => {
    expect(barWidth(50, 200)).toBe(25)
    expect(barWidth(1, 1000)).toBe(2)
    expect(barWidth(0, 10)).toBe(0)
    expect(barWidth(5, 0)).toBe(0)
  })
  it("adopción en lenguaje claro y pasos del embudo", () => {
    expect(adoptionText(3, 5)).toBe("3 de 5 negocios activos")
    expect(adoptionText(1, 1)).toBe("1 de 1 negocio activo")
    expect(funnelStepLabel("paid")).toBe("Pasaron a un plan de pago")
    expect(funnelStepLabel("otro_paso")).toBe("Otro paso")
  })
})
