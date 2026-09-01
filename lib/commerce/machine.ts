import type { PaidPlanId, BookFormat, PaymentMethodId } from "./catalog"
import { deriveCardLast4 } from "./mask"

// ═══════════════════════════════════════════════════════════════════════════
// Máquina de estados del checkout (suscripción y libro).
//
// Reducer PURO — sin fetch, sin efectos. El hook useCheckout() orquesta la
// persistencia y el procesamiento simulado alrededor de esto.
// ═══════════════════════════════════════════════════════════════════════════

export type CheckoutKind = "subscription" | "book"

export type StepId =
  | "business"
  | "plan"
  | "format"
  | "customer"
  | "method"
  | "payment"
  | "review"

export interface PaymentFields {
  cardNumber: string
  cardName: string
  expiry: string
  cvv: string
  bank: string
  docType: string
  documentNumber: string
  nequiPhone: string
  nequiName: string
}

export interface CheckoutData {
  business: { name: string }
  customer: {
    fullName: string
    email: string
    phone: string
    city: string
    country: string
    comments: string
  }
  method: PaymentMethodId | null
  payment: PaymentFields
  acceptedTerms: boolean
}

export interface CheckoutState {
  kind: CheckoutKind
  plan?: PaidPlanId
  format?: BookFormat
  mode: "new" | "upgrade"
  needsBusiness: boolean
  steps: StepId[]
  stepIndex: number
  data: CheckoutData
  /** Derivado al salir del paso de pago. Único fragmento de tarjeta que persiste. */
  cardLast4: string | null
  errors: Record<string, string>
  status: "form" | "processing" | "success" | "error"
  processingLabel: string
  globalError: string | null
}

export const PROCESSING_STEPS = [
  "Procesando pago...",
  "Validando información...",
  "Verificando método de pago...",
  "Activando tu suscripción...",
]

export const PROCESSING_STEPS_BOOK = [
  "Procesando compra...",
  "Validando información...",
  "Verificando método de pago...",
  "Confirmando tu orden...",
]

const emptyPayment: PaymentFields = {
  cardNumber: "",
  cardName: "",
  expiry: "",
  cvv: "",
  bank: "",
  docType: "Cédula de ciudadanía",
  documentNumber: "",
  nequiPhone: "",
  nequiName: "",
}

export interface InitOptions {
  kind: CheckoutKind
  plan?: PaidPlanId
  format?: BookFormat
  mode?: "new" | "upgrade"
  needsBusiness?: boolean
  prefill?: Partial<CheckoutData["customer"]>
}

export function computeSteps(kind: CheckoutKind, needsBusiness: boolean): StepId[] {
  if (kind === "subscription") {
    return [
      ...(needsBusiness ? (["business"] as StepId[]) : []),
      "plan",
      "customer",
      "method",
      "payment",
      "review",
    ]
  }
  return ["format", "customer", "method", "payment", "review"]
}

export function initCheckout(opts: InitOptions): CheckoutState {
  const needsBusiness = opts.kind === "subscription" && !!opts.needsBusiness
  return {
    kind: opts.kind,
    plan: opts.plan,
    format: opts.format ?? (opts.kind === "book" ? "digital" : undefined),
    mode: opts.mode ?? "new",
    needsBusiness,
    steps: computeSteps(opts.kind, needsBusiness),
    stepIndex: 0,
    data: {
      business: { name: "" },
      customer: {
        fullName: opts.prefill?.fullName ?? "",
        email: opts.prefill?.email ?? "",
        phone: opts.prefill?.phone ?? "",
        city: opts.prefill?.city ?? "",
        country: opts.prefill?.country ?? "Colombia",
        comments: "",
      },
      method: null,
      payment: { ...emptyPayment },
      acceptedTerms: false,
    },
    cardLast4: null,
    errors: {},
    status: "form",
    processingLabel: "",
    globalError: null,
  }
}

// ─── Validación por paso (pura) ─────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^[0-9+\s()-]{7,}$/

export function validateStep(state: CheckoutState, step: StepId): Record<string, string> {
  const e: Record<string, string> = {}
  const { data } = state

  if (step === "business") {
    if (data.business.name.trim().length < 2) e["business.name"] = "Ingresa el nombre de tu negocio."
  }

  if (step === "format") {
    if (!state.format) e.format = "Selecciona un formato."
  }

  if (step === "customer") {
    if (data.customer.fullName.trim().length < 2) e["customer.fullName"] = "El nombre debe tener mínimo 2 caracteres."
    if (!EMAIL_RE.test(data.customer.email.trim())) e["customer.email"] = "Ingresa un correo válido."
    if (!PHONE_RE.test(data.customer.phone.trim())) e["customer.phone"] = "Ingresa un teléfono válido."
    if (!data.customer.city.trim()) e["customer.city"] = "La ciudad es obligatoria."
    if (!data.customer.country.trim()) e["customer.country"] = "El país es obligatorio."
  }

  if (step === "method") {
    if (!data.method) e.method = "Debes seleccionar un método de pago."
  }

  if (step === "payment") {
    if (data.method === "tarjeta") {
      if (!/^\d{4}\s\d{4}\s\d{4}\s\d{4}$/.test(data.payment.cardNumber.trim()))
        e["payment.cardNumber"] = "Número de tarjeta inválido (XXXX XXXX XXXX XXXX)."
      if (!data.payment.cardName.trim()) e["payment.cardName"] = "El nombre del titular es obligatorio."
      if (!/^\d{2}\/\d{2}$/.test(data.payment.expiry.trim())) e["payment.expiry"] = "La fecha debe ser MM/AA."
      if (!/^\d{3,4}$/.test(data.payment.cvv.trim())) e["payment.cvv"] = "El CVV debe tener 3 o 4 dígitos."
    }
    if (data.method === "pse") {
      if (!data.payment.bank.trim()) e["payment.bank"] = "Selecciona un banco."
      if (!data.payment.documentNumber.trim()) e["payment.documentNumber"] = "El número de documento es obligatorio."
    }
    if (data.method === "nequi") {
      if (!/^\d{10}$/.test(data.payment.nequiPhone.trim())) e["payment.nequiPhone"] = "Ingresa un número de celular válido (10 dígitos)."
      if (!data.payment.nequiName.trim()) e["payment.nequiName"] = "El nombre del titular es obligatorio."
    }
  }

  if (step === "review") {
    if (!data.acceptedTerms) e.acceptedTerms = "Debes aceptar los términos y condiciones."
  }

  return e
}

// ─── Acciones ──────────────────────────────────────────────────────────────

export type CheckoutAction =
  | { type: "HYDRATE"; state: CheckoutState }
  | { type: "SET_FIELD"; path: string; value: string | boolean }
  | { type: "SELECT_METHOD"; method: PaymentMethodId }
  | { type: "SELECT_FORMAT"; format: BookFormat }
  | { type: "NEXT" }
  | { type: "BACK" }
  | { type: "GOTO"; step: StepId }
  | { type: "PROCESS_START" }
  | { type: "PROCESS_LABEL"; label: string }
  | { type: "PROCESS_OK" }
  | { type: "PROCESS_FAIL"; message: string }
  | { type: "RETRY" }

function setPath(data: CheckoutData, path: string, value: string | boolean): CheckoutData {
  const next = structuredClone(data) as CheckoutData
  const parts = path.split(".")
  let cur: Record<string, unknown> = next as unknown as Record<string, unknown>
  for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]] as Record<string, unknown>
  cur[parts[parts.length - 1]] = value
  return next
}

export const currentStep = (s: CheckoutState): StepId => s.steps[s.stepIndex]
export const reviewIndex = (s: CheckoutState): number => s.steps.indexOf("review")

export function checkoutReducer(state: CheckoutState, action: CheckoutAction): CheckoutState {
  switch (action.type) {
    case "HYDRATE":
      return action.state

    case "SET_FIELD":
      return { ...state, data: setPath(state.data, action.path, action.value), errors: {}, globalError: null }

    case "SELECT_METHOD":
      return { ...state, data: { ...state.data, method: action.method }, errors: {} }

    case "SELECT_FORMAT":
      return { ...state, format: action.format, errors: {} }

    case "NEXT": {
      const step = currentStep(state)
      const errors = validateStep(state, step)
      if (Object.keys(errors).length > 0) return { ...state, errors }
      const cardLast4 =
        step === "payment" && state.data.method === "tarjeta"
          ? deriveCardLast4(state.data.payment.cardNumber)
          : state.cardLast4
      return {
        ...state,
        cardLast4,
        stepIndex: Math.min(state.stepIndex + 1, state.steps.length - 1),
        errors: {},
      }
    }

    case "BACK":
      return { ...state, stepIndex: Math.max(state.stepIndex - 1, 0), errors: {} }

    case "GOTO": {
      const idx = state.steps.indexOf(action.step)
      if (idx < 0 || idx > reviewIndex(state)) return state
      return { ...state, stepIndex: idx, errors: {} }
    }

    case "PROCESS_START":
      return {
        ...state,
        status: "processing",
        processingLabel: (state.kind === "book" ? PROCESSING_STEPS_BOOK : PROCESSING_STEPS)[0],
        globalError: null,
      }

    case "PROCESS_LABEL":
      return { ...state, processingLabel: action.label }

    case "PROCESS_OK":
      return { ...state, status: "success" }

    case "PROCESS_FAIL":
      return { ...state, status: "error", globalError: action.message }

    case "RETRY":
      return { ...state, status: "form", stepIndex: reviewIndex(state), globalError: null }

    default:
      return state
  }
}

/**
 * Payload sanitizado para persistir en sessionStorage.
 * NUNCA se guarda el número de tarjeta ni el CVV — solo los últimos 4 dígitos
 * (en `cardLast4`) y los campos no sensibles del método.
 */
export function sanitizeForPersist(state: CheckoutState): CheckoutState {
  return {
    ...state,
    status: state.status === "processing" ? "form" : state.status,
    globalError: null,
    data: {
      ...state.data,
      payment: {
        ...state.data.payment,
        cardNumber: "",
        cvv: "",
        documentNumber: "",
      },
    },
  }
}
