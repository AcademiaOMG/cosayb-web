import type { PaidPlanId, BookFormat, PaymentMethodId, PlanId } from "./catalog"

// ── Contratos de las operaciones comerciales (espejo del backend billing) ────

export type SubscriptionStatus = "PENDING" | "ACTIVE" | "CANCELLED"
export type PaymentStatus = "PENDING" | "PROCESSING" | "APPROVED" | "FAILED"
export type OrderStatus = "PENDING" | "PAID_SIMULATED" | "CANCELLED"
export type EnrollmentStatus = "PENDING" | "REGISTERED" | "CONTACTED"

export interface CustomerData {
  fullName: string
  email: string
  phone: string
  city: string
  country: string
  comments?: string
}

export interface SubscriptionResult {
  operationNo: string
  kind: "subscription"
  plan: PaidPlanId
  previousPlan: PlanId | null
  amount: number
  status: SubscriptionStatus
  method: PaymentMethodId
  methodLabel: string
  intent: "new" | "upgrade"
  organizationId: string
  createdAt: string
  paymentId: string
  simulated: true
}

export interface BookOrderResult {
  operationNo: string
  kind: "book"
  format: BookFormat
  amount: number
  status: OrderStatus
  method: PaymentMethodId
  methodLabel: string
  buyer: { name: string; email: string; phone: string; city: string; country: string }
  createdAt: string
  paymentId: string
  simulated: true
}

export interface EnrollmentResult {
  operationNo: string
  kind: "enrollment"
  program: string
  status: EnrollmentStatus
  createdAt: string
}

export interface OperationSummary {
  operationNo: string
  kind: "subscription" | "book" | "enrollment"
  title: string
  amount: number
  status: string
  createdAt: string
}

export interface CommerceError {
  code: string
  message: string
  fieldErrors?: Record<string, string>
}
