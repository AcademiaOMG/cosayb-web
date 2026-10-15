// Persistencia del modo mock (localStorage con respaldo en memoria).
// Solo se usa cuando NEXT_PUBLIC_SAAS_MODE=mock; nunca guarda datos sensibles.

import { createInitialState, type MockState } from "./mockEngine"
import { createPlatformState, type PlatformState } from "./mockPlatform"

const KEY = "cosayb.saas.mock.v1"
const PLATFORM_KEY = "cosayb.saas.mock.platform.v1"

let memState: MockState | null = null
let memPlatform: PlatformState | null = null

function read<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* almacenamiento no disponible: queda en memoria */
  }
}

export function loadMock(): MockState {
  if (!memState) memState = (typeof window !== "undefined" ? read<MockState>(KEY) : null) ?? createInitialState()
  return memState
}

/** Aplica una transición pura; si lanza, el estado no cambia. */
export function mutateMock(fn: (s: MockState, now: Date) => MockState): MockState {
  const next = fn(loadMock(), new Date())
  memState = next
  if (typeof window !== "undefined") write(KEY, next)
  return next
}

export function loadPlatformMock(): PlatformState {
  if (!memPlatform) {
    memPlatform = (typeof window !== "undefined" ? read<PlatformState>(PLATFORM_KEY) : null) ?? createPlatformState()
  }
  return memPlatform
}

export function mutatePlatformMock(fn: (s: PlatformState, now: Date) => PlatformState): PlatformState {
  const next = fn(loadPlatformMock(), new Date())
  memPlatform = next
  if (typeof window !== "undefined") write(PLATFORM_KEY, next)
  return next
}

export function resetMock() {
  memState = null
  memPlatform = null
  try {
    window.localStorage.removeItem(KEY)
    window.localStorage.removeItem(PLATFORM_KEY)
  } catch {
    /* noop */
  }
}
