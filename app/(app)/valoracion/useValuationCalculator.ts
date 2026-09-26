"use client"

import { useCallback, useMemo, useState } from "react"
import { useCalcRegisters } from "@/components/calculator"
import { parseEntry, type EntryKey, type EntryOptions } from "@/lib/calculator/entry"
import { getRecipeCost } from "@/lib/api"
import {
  MODE_META,
  getStored,
  missingInputs,
  saveStored,
  solveValuation,
  type CalculatorMode,
  type SolveOutcome,
  type ValuationField,
  type ValuationInputs,
} from "./lib"

export type RegisterField = ValuationField | "margin"

const PCT_MP_KEY = "cosayb_pct_mp"
const MARGIN_KEY = "cosayb_margin"
const MODE_KEY = "cosayb_calc_mode"

const ENTRY: Record<RegisterField, EntryOptions> = {
  costoMP: { decimals: false },
  precioVenta: { decimals: false },
  pctMP: { decimals: true, maxDigits: 5, maxDecimals: 2 },
  margin: { decimals: true, maxDigits: 5, maxDecimals: 2 },
}

export interface ValuationCalculatorInit {
  mode?: CalculatorMode
  costoMP?: number
  pctMP?: number
  precioVenta?: number
  margin?: number
  /** Resolver de una vez con los valores iniciales (ej. reutilizar del historial) */
  autoCalculate?: boolean
}

export interface LinkedRecipe {
  id: string
  name: string
}

const toRaw = (n: number | undefined, decimals: boolean) =>
  n == null || !Number.isFinite(n) ? "" : decimals ? String(Number(n.toFixed(2))) : String(Math.round(n))

function parseInputs(values: Record<RegisterField, string>): ValuationInputs {
  return {
    costoMP: parseEntry(values.costoMP),
    pctMP: parseEntry(values.pctMP),
    precioVenta: parseEntry(values.precioVenta),
    margin: parseEntry(values.margin),
  }
}

function storedMode(): CalculatorMode {
  const m = getStored(MODE_KEY, "precio-venta")
  return m in MODE_META ? (m as CalculatorMode) : "precio-venta"
}

/**
 * Estado completo de la calculadora de valoración, sin UI. Los tres modos
 * comparten los mismos registros: lo que se ingresa o se calcula en uno queda
 * disponible en los demás, así un resultado alimenta el cálculo siguiente.
 */
export function useValuationCalculator(init: ValuationCalculatorInit = {}) {
  // Estado de arranque, calculado una sola vez.
  const [boot] = useState(() => {
    const mode = init.mode ?? storedMode()
    // El % de MP y el margen son políticas del negocio: se recuerdan entre visitas.
    const values: Record<RegisterField, string> = {
      costoMP: toRaw(init.costoMP, false),
      precioVenta: toRaw(init.precioVenta, false),
      pctMP: init.pctMP != null ? toRaw(init.pctMP, true) : getStored(PCT_MP_KEY, "35"),
      margin: init.margin != null ? toRaw(init.margin, true) : getStored(MARGIN_KEY, "3"),
    }
    const outcome = init.autoCalculate ? solveValuation(mode, parseInputs(values)) : null
    if (outcome?.ok) {
      const solved = MODE_META[mode].solves
      values[solved] = toRaw(outcome.value, ENTRY[solved].decimals)
    }
    return { mode, values, outcome }
  })

  const [mode, setModeState] = useState<CalculatorMode>(boot.mode)
  const regs = useCalcRegisters<RegisterField>(ENTRY, boot.values, MODE_META[boot.mode].inputs[0])
  const [outcome, setOutcome] = useState<SolveOutcome | null>(boot.outcome)
  /** En mobile el teclado se guarda al mostrar un resultado; vuelve al editar. */
  const [keypadOpen, setKeypadOpen] = useState(!init.autoCalculate)
  const [recipe, setRecipe] = useState<LinkedRecipe | null>(null)
  const [recipeStatus, setRecipeStatus] = useState<"idle" | "loading" | "error">("idle")

  const inputs = useMemo(() => parseInputs(regs.values), [regs.values])
  const missing = missingInputs(mode, inputs)

  /** Un dato cambió a mano: el resultado anterior ya no corresponde. */
  const invalidate = useCallback((field: RegisterField) => {
    setOutcome(null)
    setKeypadOpen(true)
    if (field === "costoMP") {
      setRecipe(null)
      setRecipeStatus("idle")
    }
  }, [])

  const press = useCallback(
    (key: EntryKey) => {
      invalidate(regs.active)
      regs.press(key)
    },
    [invalidate, regs],
  )

  const setRaw = useCallback(
    (field: RegisterField, raw: string) => {
      invalidate(field)
      regs.setRaw(field, raw)
    },
    [invalidate, regs],
  )

  const activate = useCallback(
    (field: RegisterField) => {
      regs.activate(field)
      setKeypadOpen(true)
    },
    [regs],
  )

  const calculate = useCallback(() => {
    const r = solveValuation(mode, inputs)
    setOutcome(r)
    if (!r.ok) {
      regs.activate(r.field)
      setKeypadOpen(true)
      return r
    }
    // El valor despejado queda en su registro: es dato de entrada del paso siguiente.
    const solved = MODE_META[mode].solves
    regs.assign({ [solved]: toRaw(r.value, ENTRY[solved].decimals) })
    if (solved === "costoMP") setRecipe(null)
    saveStored(PCT_MP_KEY, regs.values.pctMP)
    saveStored(MARGIN_KEY, regs.values.margin)
    setKeypadOpen(false)
    return r
  }, [mode, inputs, regs])

  const setMode = useCallback(
    (m: CalculatorMode) => {
      setModeState(m)
      saveStored(MODE_KEY, m)
      setOutcome(null)
      setKeypadOpen(true)
      const next = parseInputs(regs.values)
      const firstMissing = MODE_META[m].inputs.find((f) => next[f] == null || next[f] === 0)
      regs.activate(firstMissing ?? MODE_META[m].inputs[0])
    },
    [regs],
  )

  const clearAll = useCallback(() => {
    regs.assign({ costoMP: "", precioVenta: "", pctMP: "" })
    regs.activate(MODE_META[mode].inputs[0])
    setOutcome(null)
    setKeypadOpen(true)
    setRecipe(null)
    setRecipeStatus("idle")
  }, [mode, regs])

  const loadRecipe = useCallback(
    async (r: LinkedRecipe) => {
      setOutcome(null)
      setKeypadOpen(true)
      setRecipe(r)
      setRecipeStatus("loading")
      regs.activate("costoMP")
      try {
        const res = await getRecipeCost(r.id)
        const cost = res.data?.rawCostPerServing
        if (cost == null || !(cost > 0)) throw new Error("sin costo")
        regs.assign({ costoMP: String(Math.round(cost)) })
        setRecipeStatus("idle")
      } catch {
        // El usuario puede seguir ingresando el costo a mano.
        setRecipe(null)
        setRecipeStatus("error")
      }
    },
    [regs],
  )

  const unlinkRecipe = useCallback(() => {
    setRecipe(null)
    setRecipeStatus("idle")
  }, [])

  return {
    mode,
    setMode,
    values: regs.values,
    active: regs.active,
    fresh: regs.fresh,
    activate,
    press,
    setRaw,
    calculate,
    clearAll,
    inputs,
    missing,
    outcome,
    keypadOpen,
    recipe,
    recipeStatus,
    loadRecipe,
    unlinkRecipe,
    entry: ENTRY,
  }
}

export type ValuationCalculatorState = ReturnType<typeof useValuationCalculator>
