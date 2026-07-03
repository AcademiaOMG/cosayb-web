"use client"

import { useEffect, useSyncExternalStore } from "react"

let count = 0
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
  return count > 0
}

function getServerSnapshot() {
  return false
}

/**
 * Call this hook at the top of any page that has a help modal.
 * The Topbar will only render the ? button when at least one page has registered.
 */
export function useHelpAvailable() {
  useEffect(() => {
    count++
    emit()
    return () => {
      count--
      emit()
    }
  }, [])

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
