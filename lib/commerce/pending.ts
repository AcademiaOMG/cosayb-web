import type { PaidPlanId, BookFormat, ProgramId } from "./catalog"

// ── Intención de compra que sobrevive al ida-y-vuelta por login/registro ─────

export type PendingCheckout =
  | { kind: "subscription"; plan: PaidPlanId; mode: "new" | "upgrade" }
  | { kind: "book"; format: BookFormat }
  | { kind: "enrollment"; program: ProgramId; courseId: string }

const KEY = "cosayb.pendingCheckout"

export function getPendingCheckout(): PendingCheckout | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as PendingCheckout) : null
  } catch {
    return null
  }
}

export function setPendingCheckout(pending: PendingCheckout | null): void {
  if (typeof window === "undefined") return
  if (!pending) {
    window.localStorage.removeItem(KEY)
    return
  }
  window.localStorage.setItem(KEY, JSON.stringify(pending))
}

export function clearPendingCheckout(): void {
  setPendingCheckout(null)
}

/** Ruta canónica a la que se retoma el flujo tras autenticarse. */
export function pendingToPath(pending: PendingCheckout): string {
  switch (pending.kind) {
    case "subscription":
      return `/checkout/subscription/${pending.plan}${pending.mode === "upgrade" ? "?mode=upgrade" : ""}`
    case "book":
      return `/checkout/book?format=${pending.format}`
    case "enrollment":
      return `/courses/${pending.courseId}/enrollment`
  }
}

/** Frase de contexto para las pantallas de login/registro. */
export function pendingContextLine(pending: PendingCheckout): string {
  switch (pending.kind) {
    case "subscription": {
      const label = pending.plan === "pro" ? "Pro" : "Academia"
      const price = pending.plan === "pro" ? "$30.000" : "$50.000"
      return pending.mode === "upgrade"
        ? `Vas a actualizar tu plan a ${label} por ${price} COP/mes.`
        : `Estás adquiriendo el plan ${label} por ${price} COP/mes.`
    }
    case "book":
      return pending.format === "fisico"
        ? "Estás comprando el libro físico por $250.000 COP."
        : "Estás comprando el libro digital por $100.000 COP."
    case "enrollment":
      return `Estás completando tu inscripción a ${pending.program}.`
  }
}
