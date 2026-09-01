import { describe, it, expect } from "vitest"
import { resolvePlanIntent, planCtaLabel, intentAllowsCheckout } from "./planState"
import { deriveCardLast4, formatCardInput, formatExpiryInput, maskedCardLabel } from "./mask"
import { pendingToPath, pendingContextLine } from "./pending"
import {
  initCheckout,
  checkoutReducer,
  computeSteps,
  validateStep,
  sanitizeForPersist,
  currentStep,
  type CheckoutState,
} from "./machine"

// ─── planState ──────────────────────────────────────────────────────────────

describe("resolvePlanIntent", () => {
  const base = { membership: "free", effectiveMembership: "free", isTrialing: false, hasOrganization: true } as const

  it("sin organización siempre es adquisición nueva", () => {
    expect(resolvePlanIntent({ ...base, hasOrganization: false }, "pro")).toBe("new")
  })
  it("free → pro/academia es new", () => {
    expect(resolvePlanIntent(base, "pro")).toBe("new")
    expect(resolvePlanIntent(base, "academia")).toBe("new")
  })
  it("trial Pro + target pro = trial-activate", () => {
    expect(resolvePlanIntent({ ...base, membership: "pro", effectiveMembership: "pro", isTrialing: true }, "pro")).toBe("trial-activate")
  })
  it("trial Pro + target academia = new", () => {
    expect(resolvePlanIntent({ ...base, membership: "pro", effectiveMembership: "pro", isTrialing: true }, "academia")).toBe("new")
  })
  it("pro pago → academia = upgrade", () => {
    expect(resolvePlanIntent({ ...base, membership: "pro", effectiveMembership: "pro" }, "academia")).toBe("upgrade")
  })
  it("mismo plan pago = blocked", () => {
    expect(resolvePlanIntent({ ...base, membership: "pro", effectiveMembership: "pro" }, "pro")).toBe("blocked")
    expect(resolvePlanIntent({ ...base, membership: "academia", effectiveMembership: "academia" }, "academia")).toBe("blocked")
  })
  it("downgrade academia → pro = blocked", () => {
    expect(resolvePlanIntent({ ...base, membership: "academia", effectiveMembership: "academia" }, "pro")).toBe("blocked")
  })
})

describe("planCtaLabel / intentAllowsCheckout", () => {
  it("upgrade dice 'Actualizar a Academia'", () => {
    expect(planCtaLabel("upgrade", "academia")).toBe("Actualizar a Academia")
  })
  it("blocked no permite checkout", () => {
    expect(intentAllowsCheckout("blocked")).toBe(false)
    expect(intentAllowsCheckout("new")).toBe(true)
    expect(intentAllowsCheckout("upgrade")).toBe(true)
  })
})

// ─── mask ───────────────────────────────────────────────────────────────────

describe("mask", () => {
  it("deriveCardLast4", () => {
    expect(deriveCardLast4("4242 4242 4242 4242")).toBe("4242")
    expect(deriveCardLast4("12")).toBeNull()
  })
  it("formatCardInput agrupa de 4 en 4 y corta en 16", () => {
    expect(formatCardInput("4242424242424242999")).toBe("4242 4242 4242 4242")
  })
  it("formatExpiryInput MM/AA", () => {
    expect(formatExpiryInput("1228")).toBe("12/28")
    expect(formatExpiryInput("1")).toBe("1")
  })
  it("maskedCardLabel nunca muestra el número completo", () => {
    const label = maskedCardLabel("4242 4242 4242 4242")
    expect(label).toBe("Tarjeta terminada en **** 4242")
    expect(label).not.toContain("4242 4242")
  })
})

// ─── pending ────────────────────────────────────────────────────────────────

describe("pending", () => {
  it("pendingToPath para suscripción upgrade", () => {
    expect(pendingToPath({ kind: "subscription", plan: "academia", mode: "upgrade" })).toBe(
      "/checkout/subscription/academia?mode=upgrade"
    )
    expect(pendingToPath({ kind: "subscription", plan: "pro", mode: "new" })).toBe("/checkout/subscription/pro")
  })
  it("pendingToPath para libro e inscripción", () => {
    expect(pendingToPath({ kind: "book", format: "fisico" })).toBe("/checkout/book?format=fisico")
    expect(pendingToPath({ kind: "enrollment", program: "La Receta", courseId: "receta" })).toBe(
      "/courses/receta/enrollment"
    )
  })
  it("pendingContextLine explica la compra", () => {
    expect(pendingContextLine({ kind: "subscription", plan: "pro", mode: "new" })).toContain("$30.000")
  })
})

// ─── machine ────────────────────────────────────────────────────────────────

describe("computeSteps", () => {
  it("suscripción sin negocio: plan → customer → method → payment → review", () => {
    expect(computeSteps("subscription", false)).toEqual(["plan", "customer", "method", "payment", "review"])
  })
  it("suscripción con negocio antepone 'business'", () => {
    expect(computeSteps("subscription", true)[0]).toBe("business")
  })
  it("libro: format → customer → method → payment → review", () => {
    expect(computeSteps("book", false)).toEqual(["format", "customer", "method", "payment", "review"])
  })
})

function sub(needsBusiness = false): CheckoutState {
  return initCheckout({ kind: "subscription", plan: "pro", needsBusiness })
}

describe("checkoutReducer — navegación", () => {
  it("NEXT no avanza si el paso actual es inválido", () => {
    let s = sub()
    s = checkoutReducer(s, { type: "NEXT" }) // plan → customer (plan no valida nada)
    expect(currentStep(s)).toBe("customer")
    s = checkoutReducer(s, { type: "NEXT" }) // customer inválido
    expect(currentStep(s)).toBe("customer")
    expect(Object.keys(s.errors).length).toBeGreaterThan(0)
  })

  it("no se puede saltar pasos: llegar a review exige method y payment válidos", () => {
    let s = sub()
    s = checkoutReducer(s, { type: "NEXT" }) // → customer
    for (const [path, value] of [
      ["customer.fullName", "Ana Pérez"],
      ["customer.email", "ana@example.com"],
      ["customer.phone", "3001234567"],
      ["customer.city", "Bogotá"],
      ["customer.country", "Colombia"],
    ] as const) {
      s = checkoutReducer(s, { type: "SET_FIELD", path, value })
    }
    s = checkoutReducer(s, { type: "NEXT" }) // → method
    s = checkoutReducer(s, { type: "NEXT" }) // method inválido (sin seleccionar)
    expect(currentStep(s)).toBe("method")
    s = checkoutReducer(s, { type: "SELECT_METHOD", method: "nequi" })
    s = checkoutReducer(s, { type: "NEXT" }) // → payment
    s = checkoutReducer(s, { type: "NEXT" }) // payment inválido
    expect(currentStep(s)).toBe("payment")
    s = checkoutReducer(s, { type: "SET_FIELD", path: "payment.nequiPhone", value: "3009998888" })
    s = checkoutReducer(s, { type: "SET_FIELD", path: "payment.nequiName", value: "Ana Pérez" })
    s = checkoutReducer(s, { type: "NEXT" }) // → review
    expect(currentStep(s)).toBe("review")
  })

  it("BACK conserva los datos", () => {
    let s = sub()
    s = checkoutReducer(s, { type: "NEXT" })
    s = checkoutReducer(s, { type: "SET_FIELD", path: "customer.fullName", value: "Ana" })
    s = checkoutReducer(s, { type: "BACK" })
    s = checkoutReducer(s, { type: "NEXT" })
    expect(s.data.customer.fullName).toBe("Ana")
  })

  it("GOTO solo salta a pasos ya disponibles hasta review", () => {
    let s = sub()
    s = checkoutReducer(s, { type: "GOTO", step: "customer" })
    expect(currentStep(s)).toBe("customer")
    const before = s.stepIndex
    s = checkoutReducer(s, { type: "GOTO", step: "business" }) // no existe en steps
    expect(s.stepIndex).toBe(before)
  })

  it("review exige aceptar términos", () => {
    const s = sub()
    const errors = validateStep({ ...s, data: { ...s.data, acceptedTerms: false } }, "review")
    expect(errors.acceptedTerms).toBeTruthy()
  })

  it("tarjeta: valida formato de número, MM/AA y CVV", () => {
    const s = sub()
    const withCard: CheckoutState = {
      ...s,
      data: {
        ...s.data,
        method: "tarjeta",
        payment: { ...s.data.payment, cardNumber: "123", cardName: "", expiry: "13/2", cvv: "1" },
      },
    }
    const errors = validateStep(withCard, "payment")
    expect(errors["payment.cardNumber"]).toBeTruthy()
    expect(errors["payment.cardName"]).toBeTruthy()
    expect(errors["payment.expiry"]).toBeTruthy()
    expect(errors["payment.cvv"]).toBeTruthy()
  })
})

describe("checkoutReducer — procesamiento", () => {
  it("PROCESS_START entra a 'processing' con el primer mensaje", () => {
    const s = checkoutReducer(sub(), { type: "PROCESS_START" })
    expect(s.status).toBe("processing")
    expect(s.processingLabel).toBe("Procesando pago...")
  })
  it("PROCESS_FAIL deja un error global y permite reintentar hacia review", () => {
    let s = checkoutReducer(sub(), { type: "PROCESS_START" })
    s = checkoutReducer(s, { type: "PROCESS_FAIL", message: "boom" })
    expect(s.status).toBe("error")
    expect(s.globalError).toBe("boom")
    s = checkoutReducer(s, { type: "RETRY" })
    expect(s.status).toBe("form")
    expect(currentStep(s)).toBe("review")
  })
})

describe("sanitizeForPersist", () => {
  it("nunca serializa el PAN ni el CVV", () => {
    let s = sub()
    s = { ...s, cardLast4: "4242", data: { ...s.data, method: "tarjeta", payment: { ...s.data.payment, cardNumber: "4242 4242 4242 4242", cvv: "123", documentNumber: "999" } } }
    const clean = sanitizeForPersist(s)
    const json = JSON.stringify(clean)
    expect(json).not.toContain("4242 4242 4242 4242")
    expect(clean.data.payment.cvv).toBe("")
    expect(clean.data.payment.cardNumber).toBe("")
    expect(clean.cardLast4).toBe("4242") // el hint sí se conserva
  })
})
