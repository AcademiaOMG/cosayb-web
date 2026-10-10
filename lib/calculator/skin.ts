"use client"

import { useSyncExternalStore } from "react"

// ─── Piel de la calculadora ─────────────────────────────────────────────────
// Conviven dos diseños para poder mostrárselos al cliente y quedarse con uno:
//   green = el de producción (cuerpo gunmetal, LCD verde)
//   blue  = el nuevo (skill calculadora-fisica: carcasa azul, LCD de 7 segmentos)
// La elección se guarda en localStorage y vale para todas las calculadoras.

export type CalcSkin = "green" | "blue"

const STORAGE_KEY = "calc-skin"
const DEFAULT_SKIN: CalcSkin = "blue"

let skin: CalcSkin = DEFAULT_SKIN
let loaded = false
const listeners = new Set<() => void>()

function load() {
  if (loaded || typeof window === "undefined") return
  loaded = true
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved === "green" || saved === "blue") skin = saved
  } catch {
    /* sin almacenamiento: queda el valor por defecto */
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

export function getCalcSkin(): CalcSkin {
  load()
  return skin
}

export function setCalcSkin(next: CalcSkin) {
  load()
  skin = next
  try {
    window.localStorage.setItem(STORAGE_KEY, next)
  } catch {
    /* ignorar */
  }
  listeners.forEach((l) => l())
}

export function useCalcSkin(): CalcSkin {
  return useSyncExternalStore(subscribe, getCalcSkin, () => DEFAULT_SKIN)
}
