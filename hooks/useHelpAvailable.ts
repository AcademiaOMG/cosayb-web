"use client"

import { useEffect, useSyncExternalStore } from "react"

let _count = 0
let listeners: Array<() => void> = []

function emit() {
  for (const l of listeners) l()
}

function subscribe(listener: () => void) {
  listeners = [...listeners, listener]
  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}

function getSnapshot() {
  return _count
}

function getServerSnapshot() {
  return 0
}

/**
 * Call this hook at the top of any page that has a help modal.
 * Increments a global counter on mount and decrements on unmount.
 */
export function useHelpAvailable() {
  useEffect(() => {
    _count++
    emit()
    return () => {
      _count--
      emit()
    }
  }, [])

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) > 0
}

/**
 * Read-only selector — does NOT register. Use in Topbar or any
 * component that just needs to know if a help modal is available.
 */
export function useHelpAvailableSnapshot() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) > 0
}
