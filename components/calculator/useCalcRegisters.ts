"use client"

import { useCallback, useReducer } from "react"
import { applyEntryKey, sanitizeEntry, type EntryKey, type EntryOptions } from "@/lib/calculator/entry"

interface RegistersState<F extends string> {
  values: Record<F, string>
  active: F
  /** El valor del registro activo es "fresco": la próxima tecla lo reemplaza */
  fresh: boolean
}

type Action<F extends string> =
  | { type: "activate"; field: F }
  | { type: "press"; key: EntryKey; config: Record<F, EntryOptions> }
  | { type: "setRaw"; field: F; raw: string; config: Record<F, EntryOptions> }
  | { type: "assign"; patch: Partial<Record<F, string>> }

function reducer<F extends string>(state: RegistersState<F>, action: Action<F>): RegistersState<F> {
  switch (action.type) {
    case "activate":
      return { ...state, active: action.field, fresh: true }
    case "press": {
      const { active, fresh, values } = state
      const next = applyEntryKey(values[active], action.key, fresh, action.config[active])
      return { ...state, values: { ...values, [active]: next }, fresh: false }
    }
    case "setRaw":
      return {
        ...state,
        values: { ...state.values, [action.field]: sanitizeEntry(action.raw, action.config[action.field]) },
        fresh: false,
      }
    case "assign":
      return { ...state, values: { ...state.values, ...action.patch } }
  }
}

/**
 * Estado de un conjunto de registros de calculadora: valores crudos, cuál
 * está activo y si su valor está "fresco" (la próxima tecla lo reemplaza).
 * Genérico: cada calculadora define sus campos y sus reglas de entrada.
 *
 * Es un reducer (no varios useState) para que cada tecla opere sobre el
 * estado más reciente aunque se pulsen varias antes de un re-render.
 */
export function useCalcRegisters<F extends string>(
  config: Record<F, EntryOptions>,
  initialValues: Record<F, string>,
  initialActive: F,
) {
  const [state, dispatch] = useReducer(
    reducer as (s: RegistersState<F>, a: Action<F>) => RegistersState<F>,
    { values: initialValues, active: initialActive, fresh: true },
  )

  const activate = useCallback((field: F) => dispatch({ type: "activate", field }), [])
  /** Aplica una tecla al registro activo. */
  const press = useCallback((key: EntryKey) => dispatch({ type: "press", key, config }), [config])
  /** Reemplaza un registro con texto pegado / autocompletado. */
  const setRaw = useCallback((field: F, raw: string) => dispatch({ type: "setRaw", field, raw, config }), [config])
  /** Escribe valores desde fuera (resultado de un cálculo, una receta…). */
  const assign = useCallback((patch: Partial<Record<F, string>>) => dispatch({ type: "assign", patch }), [])

  return { values: state.values, active: state.active, fresh: state.fresh, activate, press, setRaw, assign }
}
