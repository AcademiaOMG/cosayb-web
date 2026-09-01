import { getActiveOrgId } from "@/lib/activeOrg"
import type {
  SubscriptionResult,
  BookOrderResult,
  EnrollmentResult,
  OperationSummary,
  CustomerData,
} from "./types"
import type { PaidPlanId, BookFormat, PaymentMethodId, ProgramId } from "./catalog"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"

export class CommerceRequestError extends Error {
  constructor(
    public code: string,
    message: string,
    public fieldErrors?: Record<string, string>
  ) {
    super(message)
    this.name = "CommerceRequestError"
  }
}

async function billingFetch<T>(endpoint: string, options: RequestInit & { idempotencyKey?: string } = {}): Promise<T> {
  const activeOrg = getActiveOrgId()
  const { idempotencyKey, ...rest } = options
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(activeOrg ? { "X-Organization-Id": activeOrg } : {}),
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
      ...rest.headers,
    },
    credentials: "include",
  })

  if (!res.ok) {
    let code = `HTTP_${res.status}`
    let message = "No pudimos completar la operación. Inténtalo nuevamente."
    let fieldErrors: Record<string, string> | undefined
    try {
      const body = await res.json()
      if (body.code) code = body.code
      if (body.error) message = body.error
      const fe = body.details?.fieldErrors as Record<string, string[]> | undefined
      if (fe) {
        fieldErrors = Object.fromEntries(Object.entries(fe).map(([k, v]) => [k, v.join(" ")]))
      }
    } catch {
      /* respuesta no-JSON */
    }
    throw new CommerceRequestError(code, message, fieldErrors)
  }

  return res.json() as Promise<T>
}

// ── Servicios: única frontera mock/real. Cambiar a pasarela = tocar solo esto ──

export interface SubscriptionCheckoutInput {
  plan: PaidPlanId
  method: PaymentMethodId
  cardLast4: string | null
  customer: CustomerData
  businessName?: string | null
  idempotencyKey: string
}

export const subscriptionService = {
  async checkout(input: SubscriptionCheckoutInput): Promise<SubscriptionResult> {
    const { idempotencyKey, ...body } = input
    const { data } = await billingFetch<{ data: SubscriptionResult }>(
      "/api/v1/billing/checkout/subscription",
      { method: "POST", body: JSON.stringify(body), idempotencyKey }
    )
    return data
  },
}

export interface BookCheckoutInput {
  format: BookFormat
  method: PaymentMethodId
  cardLast4: string | null
  buyer: CustomerData
  idempotencyKey: string
}

export const orderService = {
  async checkout(input: BookCheckoutInput): Promise<BookOrderResult> {
    const { idempotencyKey, ...body } = input
    const { data } = await billingFetch<{ data: BookOrderResult }>(
      "/api/v1/billing/checkout/book",
      { method: "POST", body: JSON.stringify(body), idempotencyKey }
    )
    return data
  },
}

export interface EnrollmentInput {
  program: ProgramId
  courseId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  city: string
  country: string
  message?: string
  consent: boolean
}

export const enrollmentService = {
  async create(input: EnrollmentInput): Promise<EnrollmentResult> {
    const { data } = await billingFetch<{ data: EnrollmentResult }>(
      "/api/v1/billing/enrollments",
      { method: "POST", body: JSON.stringify(input) }
    )
    return data
  },
}

export interface MySubscription {
  membership: string
  effectiveMembership: string
  isTrialing: boolean
  trialExpired: boolean
  daysLeft: number
  trialEndsAt: string | null
  subscription: {
    operationNo: string
    plan: string
    amount: number
    status: string
    method: string
    previousPlan: string | null
    createdAt: string
  } | null
}

export const billingQueries = {
  async mySubscription(): Promise<MySubscription> {
    const { data } = await billingFetch<{ data: MySubscription }>("/api/v1/billing/me/subscription")
    return data
  },
  async myOperations(): Promise<OperationSummary[]> {
    const { data } = await billingFetch<{ data: OperationSummary[] }>("/api/v1/billing/me/operations")
    return data
  },
  async order(operationNo: string): Promise<BookOrderResult & { comments: string | null }> {
    const { data } = await billingFetch<{ data: BookOrderResult & { comments: string | null } }>(
      `/api/v1/billing/orders/${encodeURIComponent(operationNo)}`
    )
    return data
  },
}
