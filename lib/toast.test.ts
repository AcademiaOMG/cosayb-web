import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { toast, getSnapshot, dismiss, __resetToasts, MAX_TOASTS, TOAST_DURATIONS, TOAST_EXIT_MS } from "./toast"

beforeEach(() => {
  vi.useFakeTimers()
  __resetToasts()
})
afterEach(() => vi.useRealTimers())

describe("toast store", () => {
  it("crea avisos con duración por tipo (errores más largos)", () => {
    toast.success("ok")
    toast.error("mal")
    const [s, e] = getSnapshot()
    expect(s.duration).toBe(TOAST_DURATIONS.success)
    expect(e.duration).toBe(TOAST_DURATIONS.error)
    expect(e.duration).toBeGreaterThan(s.duration)
  })

  it("deduplica el mismo aviso visible: cuenta y reinicia", () => {
    toast.error("Sin conexión")
    const first = getSnapshot()[0].stamp
    toast.error("Sin conexión")
    const list = getSnapshot()
    expect(list).toHaveLength(1)
    expect(list[0].count).toBe(2)
    expect(list[0].stamp).toBeGreaterThan(first)
  })

  it("mismo mensaje con distinto tipo no se deduplica", () => {
    toast.success("Listo")
    toast.info("Listo")
    expect(getSnapshot()).toHaveLength(2)
  })

  it("limita a MAX_TOASTS descartando los más antiguos", () => {
    for (let i = 0; i < MAX_TOASTS + 2; i++) toast.info(`m${i}`)
    const list = getSnapshot()
    expect(list).toHaveLength(MAX_TOASTS)
    expect(list[0].message).toBe("m2")
  })

  it("dismiss anima la salida y luego retira", () => {
    const id = toast.success("x")
    dismiss(id)
    expect(getSnapshot()[0].leaving).toBe(true)
    vi.advanceTimersByTime(TOAST_EXIT_MS + 1)
    expect(getSnapshot()).toHaveLength(0)
  })
})
