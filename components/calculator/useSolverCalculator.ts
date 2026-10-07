"use client"

import { useCallback, useMemo, useState } from "react"
import { parseEntry, type EntryKey, type EntryOptions } from "@/lib/calculator/entry"
import { useCalcRegisters } from "./useCalcRegisters"

/** Lo mínimo que el panel necesita saber de un resultado. */
export type SolverOutcome<F extends string> = { ok: true } | { ok: false; field: F; message: string }

interface SolverConfig<F extends string, O extends SolverOutcome<F>> {
  entry: Record<F, EntryOptions>
  initial: Record<F, string>
  /** Registro activo al abrir */
  first: F
  /** Fórmulas (puras) del módulo: valores numéricos → resultado o qué corregir */
  solve: (values: Record<F, number | null>) => O
}

/**
 * Estado de una calculadora de "datos → resultado" sobre useCalcRegisters:
 * registros, resultado, y la regla de que editar un dato invalida el
 * resultado anterior. Cada módulo aporta solo sus campos y su `solve`.
 */
export function useSolverCalculator<F extends string, O extends SolverOutcome<F>>({
  entry,
  initial,
  first,
  solve,
}: SolverConfig<F, O>) {
  const regs = useCalcRegisters<F>(entry, initial, first)
  const [outcome, setOutcome] = useState<O | null>(null)

  const inputs = useMemo(() => {
    const out = {} as Record<F, number | null>
    for (const f of Object.keys(entry) as F[]) out[f] = parseEntry(regs.values[f])
    return out
  }, [entry, regs.values])

  /** Resultado "en seco" con los datos de ahora: guía qué falta antes de calcular. */
  const preview = useMemo(() => solve(inputs), [solve, inputs])

  const press = useCallback(
    (key: EntryKey) => {
      setOutcome(null)
      regs.press(key)
    },
    [regs],
  )

  const setRaw = useCallback(
    (field: F, raw: string) => {
      setOutcome(null)
      regs.setRaw(field, raw)
    },
    [regs],
  )

  const calculate = useCallback(() => {
    const r = solve(inputs)
    setOutcome(r)
    if (!r.ok) regs.activate(r.field)
    return r
  }, [solve, inputs, regs])

  const clearAll = useCallback(() => {
    const blank = {} as Record<F, string>
    for (const f of Object.keys(entry) as F[]) blank[f] = ""
    regs.assign(blank)
    regs.activate(first)
    setOutcome(null)
  }, [entry, first, regs])

  /** Escribe datos desde fuera (ej. los valores que ya tiene el formulario). */
  const fill = useCallback(
    (patch: Partial<Record<F, string>>) => {
      regs.assign(patch)
      setOutcome(null)
    },
    [regs],
  )

  return {
    entry,
    values: regs.values,
    active: regs.active,
    fresh: regs.fresh,
    activate: regs.activate,
    press,
    setRaw,
    calculate,
    clearAll,
    fill,
    inputs,
    outcome,
    preview,
  }
}

export type SolverCalculator<F extends string, O extends SolverOutcome<F>> = ReturnType<typeof useSolverCalculator<F, O>>
