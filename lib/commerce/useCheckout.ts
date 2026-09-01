"use client"

import { useCallback, useEffect, useReducer, useRef, useState } from "react"
import { useSWRConfig } from "swr"
import {
  checkoutReducer,
  initCheckout,
  reviewIndex,
  sanitizeForPersist,
  PROCESSING_STEPS,
  PROCESSING_STEPS_BOOK,
  type CheckoutState,
  type CheckoutAction,
  type InitOptions,
} from "./machine"
import { draftKey, saveDraft, loadDraft, clearDraft } from "./persistence"
import { CommerceRequestError } from "./services"
import type { SubscriptionResult, BookOrderResult } from "./types"

type AnyResult = SubscriptionResult | BookOrderResult

interface UseCheckoutOptions extends InitOptions {
  discriminator: string
  onSubmit: (state: CheckoutState, idempotencyKey: string) => Promise<AnyResult>
}

export interface UseCheckoutReturn {
  state: CheckoutState
  dispatch: React.Dispatch<CheckoutAction>
  submit: () => Promise<void>
  result: AnyResult | null
  isDirty: boolean
  reset: () => void
}

export function useCheckout(opts: UseCheckoutOptions): UseCheckoutReturn {
  const key = draftKey(opts.kind, opts.discriminator)
  const resultKey = `${key}.result`
  const { mutate } = useSWRConfig()

  const [state, dispatch] = useReducer(
    checkoutReducer,
    opts,
    (o) => initCheckout(o)
  )
  const [result, setResult] = useState<AnyResult | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const idempotencyKey = useRef<string>(
    typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now())
  )

  // Hidratación (una sola vez, en cliente)
  useEffect(() => {
    try {
      const savedResult = window.sessionStorage.getItem(resultKey)
      if (savedResult) {
        setResult(JSON.parse(savedResult))
        dispatch({ type: "HYDRATE", state: { ...state, status: "success" } })
        setHydrated(true)
        return
      }
    } catch {
      /* noop */
    }
    const draft = loadDraft(key)
    if (draft && draft.kind === opts.kind) {
      dispatch({ type: "HYDRATE", state: draft })
    }
    setHydrated(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persistencia en cada cambio (después de hidratar)
  useEffect(() => {
    if (!hydrated) return
    if (state.status === "success") return
    saveDraft(key, state)
  }, [state, hydrated, key])

  const submit = useCallback(async () => {
    dispatch({ type: "PROCESS_START" })
    const labels = opts.kind === "book" ? PROCESSING_STEPS_BOOK : PROCESSING_STEPS
    let i = 0
    const interval = setInterval(() => {
      i = Math.min(i + 1, labels.length - 1)
      dispatch({ type: "PROCESS_LABEL", label: labels[i] })
    }, 420)

    const startedAt = Date.now()
    try {
      const res = await opts.onSubmit(state, idempotencyKey.current)
      // Asegura que el usuario vea el ciclo de procesamiento (mín. ~1.4s)
      const elapsed = Date.now() - startedAt
      if (elapsed < 1400) await new Promise((r) => setTimeout(r, 1400 - elapsed))
      clearInterval(interval)
      setResult(res)
      try {
        window.sessionStorage.setItem(resultKey, JSON.stringify(res))
      } catch {
        /* noop */
      }
      clearDraft(key)
      dispatch({ type: "PROCESS_OK" })
      // Refleja el plan nuevo en toda la app
      mutate("me/context")
      mutate("current-plan")
      mutate("all-plans")
    } catch (err) {
      clearInterval(interval)
      const message =
        err instanceof CommerceRequestError
          ? err.message
          : "No pudimos completar la operación. Inténtalo nuevamente."
      dispatch({ type: "PROCESS_FAIL", message })
    }
  }, [state, opts, key, resultKey, mutate])

  const reset = useCallback(() => {
    clearDraft(key)
    try {
      window.sessionStorage.removeItem(resultKey)
    } catch {
      /* noop */
    }
    dispatch({ type: "HYDRATE", state: initCheckout(opts) })
  }, [key, resultKey, opts])

  const isDirty =
    state.status === "form" &&
    state.stepIndex > 0 &&
    state.stepIndex < reviewIndex(state) + 1 &&
    JSON.stringify(sanitizeForPersist(state).data) !== JSON.stringify(initCheckout(opts).data)

  return { state, dispatch, submit, result, isDirty, reset }
}
