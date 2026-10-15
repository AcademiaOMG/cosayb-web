import { describe, expect, it, vi } from "vitest"
import { createIdleTracker, type IdleStorage } from "./sessionIdle"

const MIN = 60_000
const IDLE = 120 * MIN
const KEEPALIVE = 5 * MIN

function setup(shared?: { value: number | null }) {
  const clock = { t: Date.UTC(2026, 9, 14, 8, 0, 0) }
  const box = shared ?? { value: null as number | null }
  const storage: IdleStorage = { get: () => box.value, set: (v) => (box.value = v) }
  const ping = vi.fn()
  const onExpire = vi.fn()
  const make = () => createIdleTracker({ idleMs: IDLE, keepAliveMs: KEEPALIVE, now: () => clock.t, storage, ping, onExpire })
  return { clock, box, storage, ping, onExpire, make }
}

describe("cierre de sesión por inactividad", () => {
  it("usando la app (un clic por minuto) durante 8 horas NUNCA cierra la sesión y la renueva cada 5 min", () => {
    const s = setup()
    const tracker = s.make()
    for (let m = 1; m <= 8 * 60; m++) {
      s.clock.t += MIN
      tracker.activity()
      if (m % 1 === 0) tracker.check()
    }
    expect(s.onExpire).not.toHaveBeenCalled()
    expect(s.ping.mock.calls.length).toBeGreaterThanOrEqual(8 * 12 - 1)
  })

  it("leyendo sin tocar nada durante menos del límite (119 min) no cierra", () => {
    const s = setup()
    const tracker = s.make()
    s.clock.t += 119 * MIN
    expect(tracker.check()).toBe(false)
    expect(s.onExpire).not.toHaveBeenCalled()
  })

  it("tras más de 120 min sin tocar la app, cierra la sesión una sola vez", () => {
    const s = setup()
    const tracker = s.make()
    s.clock.t += 121 * MIN
    expect(tracker.check()).toBe(true)
    tracker.check()
    tracker.activity()
    expect(s.onExpire).toHaveBeenCalledTimes(1)
  })

  it("una hora vieja guardada de otra sesión NO hace que se cierre al volver a entrar", () => {
    const s = setup({ value: Date.UTC(2026, 9, 13, 8, 0, 0) }) // ayer
    const tracker = s.make()
    s.clock.t += MIN
    expect(tracker.check()).toBe(false)
    expect(s.onExpire).not.toHaveBeenCalled()
  })

  it("dos pestañas: la actividad en una mantiene viva la otra", () => {
    const shared = { value: null as number | null }
    const s = setup(shared)
    const a = s.make() // pestaña en segundo plano
    const b = s.make() // pestaña en uso
    for (let m = 1; m <= 6 * 60; m++) {
      s.clock.t += MIN
      b.activity()
      a.check()
      b.check()
    }
    expect(s.onExpire).not.toHaveBeenCalled()
  })
})
