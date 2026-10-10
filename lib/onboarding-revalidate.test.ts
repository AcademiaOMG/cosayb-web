import { describe, it, expect } from "vitest"
import { createElement } from "react"
import { renderToString } from "react-dom/server"
import { SWRConfig, mutate as defaultCacheMutate } from "swr"
import { SWRGlobalState, revalidateEvents } from "swr/_internal"
import { useRevalidateOnboarding } from "@/hooks/useRevalidateOnboarding"
import { DASHBOARD_SUMMARY_KEY } from "./onboarding"

// Revalidator registrado en el provider activo (el cache con localStorage
// sobre el que corre SidebarChecklist en la app).
type Revalidator = (event: string) => unknown

const capture: { cb?: () => void } = {}

function Probe() {
  // Prueba: capturar el resultado del hook bajo renderToString. Los effects
  // no corren en SSR, así que no existe otra vía de obtener el callback —
  // desactivación quirúrgica de la regla de pureza del compilador.
  // eslint-disable-next-line react-hooks/immutability
  capture.cb = useRevalidateOnboarding()
  return null
}

function setup() {
  capture.cb = undefined
  const store = new Map<string, object>()
  const provider = () => store

  renderToString(
    createElement(SWRConfig, { value: { provider } }, createElement(Probe)),
  )

  // state del provider: [EVENT_REVALIDATORS, MUTATION, FETCH, PRELOAD, mutate, setter, subscribe]
  const state = SWRGlobalState.get(store) as unknown as [
    Record<string, Revalidator[]>,
    unknown,
    unknown,
    unknown,
    (...args: unknown[]) => unknown,
    ...unknown[],
  ]
  const events: string[] = []
  state[0][DASHBOARD_SUMMARY_KEY] = [
    (event) => {
      events.push(event)
      return Promise.resolve()
    },
  ]

  return { callback: capture.cb!, events, providerMutate: state[4] }
}

describe("useRevalidateOnboarding — progreso x/3 inmediato", () => {
  it("el callback del hook revalida el checklist EN el provider de la app", () => {
    const { callback, events } = setup()

    callback()

    expect(events).toEqual([revalidateEvents.MUTATE_EVENT])
  })

  it("reproduce el bug original: el mutate global de 'swr' NO alcanza al provider", async () => {
    const { events, providerMutate } = setup()

    // Esto es exactamente lo que hacía el código viejo (globalMutate de "swr"):
    void defaultCacheMutate(DASHBOARD_SUMMARY_KEY)
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(events).toEqual([]) // no revalida → el usuario veía el cambio recién al navegar

    // Mismo key, mutate del provider (lo que hace el hook): sí revalida.
    void providerMutate(DASHBOARD_SUMMARY_KEY)
    expect(events).toEqual([revalidateEvents.MUTATE_EVENT])
  })

  it("el mutate global y el del provider son funciones distintas (caches distintas)", () => {
    const { providerMutate } = setup()
    expect(providerMutate).not.toBe(defaultCacheMutate)
  })
})
