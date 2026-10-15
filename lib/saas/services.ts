// ÚNICA frontera mock/real de las funciones SaaS (facturación, notificaciones,
// soporte, exportación y panel de plataforma). Se elige con:
//   NEXT_PUBLIC_SAAS_MODE=mock | real        (por defecto: mock)
// El checkout y la suscripción inicial siguen en lib/commerce/services.ts, que ya
// habla con el API (el pago simulado vive en el backend).
// Las operaciones sobre entidades reales (borrar cuenta, organización, invitaciones,
// uso del plan) no se simulan: viven en lib/saas/account.ts y siempre llaman al API.

import { billingQueries } from "@/lib/commerce/services"
import { buildAccountExport } from "./accountExport"
import {
  PAYMENT_STATUS_TO_API, SUB_STATUS_TO_API, invoiceFromApi, metricsFromApi, notificationFromApi, orgBillingFromApi,
  overviewFromApi, platformPaymentFromApi, platformSubscriptionFromApi, platformTicketFromApi, previewFromOverview,
  ticketFromApi, type RawInvoice, type RawMySubscription, type RawNotification, type RawPlatformPayment,
  type RawPlatformSubscription, type RawSaasMetrics, type RawTicket,
} from "./adapters"
import * as engine from "./mockEngine"
import * as platform from "./mockPlatform"
import { loadMock, loadPlatformMock, mutateMock, mutatePlatformMock, resetMock } from "./mockStore"
import { json, qs, saasData, saasFetch } from "./real"
import type {
  AccountExport, AppNotification, BillingOverview, Invoice, OrgBilling, OrgSupportAction, PaymentMethodInput,
  PlanChangePreview, PlanId, PlatformPayment, PlatformSaasMetrics, PlatformSubscription, PlatformTicket,
  SaasCapabilities, SupportTicket, SupportTicketInput, TicketStatus,
} from "./types"
import { SaasError } from "./types"
import { resolveSaasMode, type SaasMode } from "./mode"

export type { SaasMode }

export function getSaasMode(): SaasMode {
  // Las dos variables se leen literales para que Next las incruste en el build del cliente
  return resolveSaasMode(process.env.NEXT_PUBLIC_SAAS_MODE, process.env.NODE_ENV)
}

export const isMockMode = () => getSaasMode() === "mock"

export interface SaasServices {
  billing: {
    overview(): Promise<BillingOverview>
    preview(plan: PlanId): Promise<PlanChangePreview>
    changePlan(plan: PlanId): Promise<BillingOverview>
    cancel(): Promise<BillingOverview>
    resume(): Promise<BillingOverview>
    setPaymentMethod(input: PaymentMethodInput): Promise<BillingOverview>
    retryPayment(): Promise<BillingOverview>
    invoices(): Promise<Invoice[]>
  }
  notifications: {
    list(): Promise<AppNotification[]>
    markRead(id: string): Promise<void>
    markAllRead(): Promise<void>
  }
  support: {
    submit(input: SupportTicketInput): Promise<SupportTicket>
    mine(): Promise<SupportTicket[]>
  }
  account: {
    exportData(): Promise<AccountExport>
  }
  platform: {
    metrics(days?: number): Promise<PlatformSaasMetrics>
    subscriptions(f?: platform.SubscriptionFilters): Promise<PlatformSubscription[]>
    payments(f?: platform.PaymentFilters): Promise<PlatformPayment[]>
    orgBilling(orgId: string): Promise<OrgBilling>
    setOrgPlan(orgId: string, action: OrgSupportAction, seed?: { name: string; plan: PlanId }): Promise<void>
    tickets(status?: TicketStatus | "all"): Promise<PlatformTicket[]>
    setTicketStatus(id: string, status: TicketStatus): Promise<void>
  }
  /** Solo mock: simulaciones para revisar estados (pago fallido, reinicio). */
  dev: {
    simulatePaymentFailure(): Promise<void>
    reset(): Promise<void>
  }
}

const wait = <T,>(value: T, ms = 220): Promise<T> => new Promise((r) => setTimeout(() => r(value), ms))

/** Ejecuta una transición mock con latencia simulada y errores tipados. */
async function mock<T>(fn: () => T): Promise<T> {
  await wait(null)
  return fn()
}

// ── Mock ─────────────────────────────────────────────────────────────────────

const mockServices: SaasServices = {
  billing: {
    overview: async () => {
      // Incorpora la suscripción real del checkout (si el API responde); si no, sigue con lo local
      const real = await billingQueries.mySubscription().catch(() => null)
      if (real) mutateMock((s, now) => engine.syncFromReal(s, real, now))
      return mock(() => loadMock().billing)
    },
    preview: (plan) => mock(() => engine.preview(loadMock(), plan, new Date())),
    changePlan: (plan) => mock(() => mutateMock((s, now) => engine.changePlan(s, plan, now)).billing),
    cancel: () => mock(() => mutateMock((s, now) => engine.cancelSubscription(s, now)).billing),
    resume: () => mock(() => mutateMock((s, now) => engine.resumeSubscription(s, now)).billing),
    setPaymentMethod: (input) => mock(() => mutateMock((s, now) => engine.setPaymentMethod(s, input, now)).billing),
    retryPayment: () => mock(() => mutateMock((s, now) => engine.retryPayment(s, now)).billing),
    invoices: () => mock(() => loadMock().invoices),
  },
  notifications: {
    list: () => mock(() => loadMock().notifications),
    markRead: (id) => mock(() => void mutateMock((s, now) => engine.markNotificationRead(s, id, now))),
    markAllRead: () => mock(() => void mutateMock((s, now) => engine.markAllNotificationsRead(s, now))),
  },
  support: {
    submit: (input) =>
      mock(() => {
        let ticket!: SupportTicket
        mutateMock((s, now) => {
          const r = engine.submitTicket(s, input, now)
          ticket = r.ticket
          return r.state
        })
        // también llega a la bandeja de soporte de la plataforma
        mutatePlatformMock((p) => ({
          ...p,
          tickets: [{ ...ticket, id: `u-${ticket.id}`, organizationName: null }, ...p.tickets],
        }))
        return ticket
      }),
    // el estado lo gestiona soporte (plataforma): se refleja aquí
    mine: () =>
      mock(() => {
        const managed = new Map(loadPlatformMock().tickets.map((t) => [t.id, t.status]))
        return loadMock().tickets.map((t) => ({ ...t, status: managed.get(`u-${t.id}`) ?? t.status }))
      }),
  },
  account: {
    exportData: () => buildAccountExport(),
  },
  platform: {
    metrics: (days) => mock(() => platform.computeMetrics(loadPlatformMock(), new Date(), days)),
    subscriptions: (f) => mock(() => platform.listSubscriptions(loadPlatformMock(), f)),
    payments: (f) => mock(() => platform.listPayments(loadPlatformMock(), f)),
    orgBilling: (orgId) => mock(() => platform.orgBilling(loadPlatformMock(), orgId)),
    setOrgPlan: (orgId, action, seed) =>
      mock(() => void mutatePlatformMock((s, now) => platform.applyOrgPlan(s, orgId, action, now, seed))),
    tickets: (status) =>
      mock(() => loadPlatformMock().tickets.filter((t) => (status && status !== "all" ? t.status === status : true))),
    setTicketStatus: (id, status) => mock(() => void mutatePlatformMock((s, now) => platform.setTicketStatus(s, id, status, now))),
  },
  dev: {
    simulatePaymentFailure: () => mock(() => void mutateMock((s, now) => engine.simulatePaymentFailure(s, now))),
    reset: () => mock(() => resetMock()),
  },
}

// ── Real (contrato: docs/SAAS_API_CONTRATO.md del repo del API) ─────────────

const API = "/api/v1"
const NOT_AVAILABLE = () => Promise.reject(new SaasError("NOT_AVAILABLE", "Esta función no está disponible todavía."))

async function realOverview(): Promise<BillingOverview> {
  return overviewFromApi(await saasData<RawMySubscription>(`${API}/billing/me/subscription`))
}

const realServices: SaasServices = {
  billing: {
    overview: realOverview,
    // El API no tiene vista previa: se calcula igual que el cobro del checkout (plan completo, sin prorrateo)
    preview: async (plan) => previewFromOverview(await realOverview(), plan),
    // Subir de plan = checkout (ver capabilities.planChange); no hay endpoint de cambio directo
    changePlan: () => Promise.reject(new SaasError("USE_CHECKOUT", "Para cambiar de plan usa el checkout.")),
    cancel: async () => {
      await saasData<unknown>(`${API}/billing/subscription/cancel`, json({}))
      return realOverview()
    },
    resume: async () => {
      await saasData<unknown>(`${API}/billing/subscription/resume`, json({}))
      return realOverview()
    },
    // Si el cobro estaba fallido, el API reintenta al instante con el método nuevo (402 si lo rechazan)
    setPaymentMethod: async (input) => {
      await saasData<unknown>(
        `${API}/billing/subscription/payment-method`,
        json({ method: input.type, ...(input.type === "tarjeta" && input.last4 ? { cardLast4: input.last4 } : {}) }),
      )
      return realOverview()
    },
    retryPayment: NOT_AVAILABLE,
    invoices: async () => (await saasData<RawInvoice[]>(`${API}/billing/invoices`)).map(invoiceFromApi),
  },
  notifications: {
    list: async () => (await saasData<RawNotification[]>(`${API}/notifications?limit=30`)).map(notificationFromApi),
    markRead: async (id) => {
      await saasData<unknown>(`${API}/notifications/${encodeURIComponent(id)}/read`, json({}))
    },
    markAllRead: async () => {
      await saasData<unknown>(`${API}/notifications/read-all`, json({}))
    },
  },
  support: {
    submit: async (input) => {
      const created = await saasData<{ id: string; ticketNo: string; status: string }>(`${API}/support/contact`, json(input))
      const now = new Date().toISOString()
      return {
        ...input, id: created.id, number: created.ticketNo, status: "open",
        createdAt: now, updatedAt: now,
      }
    },
    mine: async () => (await saasData<RawTicket[]>(`${API}/support/tickets`)).map(ticketFromApi),
  },
  account: {
    // El API responde con el JSON como descarga; se lee el cuerpo tal cual
    exportData: () => saasFetch<AccountExport>(`${API}/me/export`),
  },
  platform: {
    metrics: async (days = 30) =>
      metricsFromApi(await saasData<RawSaasMetrics>(`${API}/platform/metrics/saas${qs({ days })}`)),
    subscriptions: async (f) => {
      const q = qs({
        status: f?.status && f.status !== "all" ? SUB_STATUS_TO_API[f.status] : undefined,
        plan: f?.plan,
        limit: 200,
      })
      const rows = (await saasData<RawPlatformSubscription[]>(`${API}/platform/subscriptions${q}`)).map(platformSubscriptionFromApi)
      const term = f?.search?.trim().toLowerCase()
      return term ? rows.filter((r) => r.organizationName.toLowerCase().includes(term)) : rows
    },
    payments: async (f) => {
      const q = qs({ status: f?.status && f.status !== "all" ? PAYMENT_STATUS_TO_API[f.status] : undefined, limit: 200 })
      const rows = (await saasData<RawPlatformPayment[]>(`${API}/platform/payments${q}`)).map(platformPaymentFromApi)
      const term = f?.search?.trim().toLowerCase()
      return term
        ? rows.filter((r) => r.organizationName.toLowerCase().includes(term) || r.invoiceNumber.toLowerCase().includes(term))
        : rows
    },
    orgBilling: async (orgId) =>
      orgBillingFromApi(await saasData(`${API}/platform/organizations/${encodeURIComponent(orgId)}/billing`)),
    setOrgPlan: async (orgId, action) => {
      await saasData<unknown>(`${API}/platform/organizations/${encodeURIComponent(orgId)}/plan`, json(action))
    },
    tickets: async (status) =>
      (await saasData<RawTicket[]>(`${API}/platform/support/tickets${qs({ status, limit: 200 })}`)).map(platformTicketFromApi),
    setTicketStatus: async (id, status) => {
      await saasData<unknown>(`${API}/platform/support/tickets/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      })
    },
  },
  dev: {
    simulatePaymentFailure: () => Promise.reject(new SaasError("NOT_AVAILABLE", "Solo disponible en modo mock.")),
    reset: () => Promise.reject(new SaasError("NOT_AVAILABLE", "Solo disponible en modo mock.")),
  },
}

const MOCK_CAPABILITIES: SaasCapabilities = { planChange: "inline", downgrade: true, paymentMethodUpdate: true, manualRetry: true }
// Real: el API cobra por checkout; no hay cambio directo de plan. Cambiar el método ya reintenta el cobro,
// por eso no hace falta un reintento manual aparte.
const REAL_CAPABILITIES: SaasCapabilities = { planChange: "checkout", downgrade: false, paymentMethodUpdate: true, manualRetry: false }

export const saas: SaasServices = getSaasMode() === "real" ? realServices : mockServices
export const capabilities: SaasCapabilities = getSaasMode() === "real" ? REAL_CAPABILITIES : MOCK_CAPABILITIES

/** Mensaje legible para mostrar al usuario a partir de cualquier error. */
export function saasErrorMessage(err: unknown, fallback = "No pudimos completar la operación. Inténtalo de nuevo."): string {
  if (err instanceof SaasError) return err.message
  if (err instanceof Error && err.message) return err.message
  return fallback
}

export type { SubscriptionFilters, PaymentFilters } from "./mockPlatform"
