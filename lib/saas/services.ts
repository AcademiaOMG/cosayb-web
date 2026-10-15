// ÚNICA frontera mock/real de las funciones SaaS (facturación, notificaciones,
// soporte, exportación y panel de plataforma). Se elige con:
//   NEXT_PUBLIC_SAAS_MODE=mock | real        (por defecto: mock)
// El checkout y la suscripción inicial siguen en lib/commerce/services.ts, que ya
// habla con el API (el pago simulado vive en el backend).

import * as engine from "./mockEngine"
import * as platform from "./mockPlatform"
import { loadMock, loadPlatformMock, mutateMock, mutatePlatformMock, resetMock } from "./mockStore"
import { ENDPOINTS, json, put, qs, saasData } from "./real"
import { buildAccountExport } from "./accountExport"
import { billingQueries } from "@/lib/commerce/services"
import type {
  AccountExport, AppNotification, BillingOverview, Invoice, OrgSupportAction, PaymentMethodInput, PaymentStatus,
  PlanChangePreview, PlanId, PlatformPayment, PlatformSaasMetrics, PlatformSubscription, PlatformTicket,
  SubscriptionStatus, SupportTicket, SupportTicketInput, TicketStatus,
} from "./types"
import { SaasError } from "./types"

export type SaasMode = "mock" | "real"

export function getSaasMode(): SaasMode {
  return process.env.NEXT_PUBLIC_SAAS_MODE === "real" ? "real" : "mock"
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
    metrics(): Promise<PlatformSaasMetrics>
    subscriptions(f?: platform.SubscriptionFilters): Promise<PlatformSubscription[]>
    payments(f?: platform.PaymentFilters): Promise<PlatformPayment[]>
    orgAction(orgId: string, action: OrgSupportAction, seed?: { name: string; plan: PlanId }): Promise<void>
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
          tickets: [{ ...ticket, id: `u-${ticket.id}`, number: ticket.number, organizationName: null }, ...p.tickets],
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
    metrics: () => mock(() => platform.computeMetrics(loadPlatformMock())),
    subscriptions: (f) => mock(() => platform.listSubscriptions(loadPlatformMock(), f)),
    payments: (f) => mock(() => platform.listPayments(loadPlatformMock(), f)),
    orgAction: (orgId, action, seed) =>
      mock(() => void mutatePlatformMock((s, now) => platform.applyOrgAction(s, orgId, action, now, seed))),
    tickets: (status) =>
      mock(() => loadPlatformMock().tickets.filter((t) => (status && status !== "all" ? t.status === status : true))),
    setTicketStatus: (id, status) => mock(() => void mutatePlatformMock((s, now) => platform.setTicketStatus(s, id, status, now))),
  },
  dev: {
    simulatePaymentFailure: () => mock(() => void mutateMock((s, now) => engine.simulatePaymentFailure(s, now))),
    reset: () => mock(() => resetMock()),
  },
}

const realServices: SaasServices = {
  billing: {
    overview: () => saasData<BillingOverview>(ENDPOINTS.billingOverview),
    preview: (plan) => saasData<PlanChangePreview>(ENDPOINTS.billingPreview, json({ plan })),
    changePlan: (plan) => saasData<BillingOverview>(ENDPOINTS.billingChangePlan, json({ plan })),
    cancel: () => saasData<BillingOverview>(ENDPOINTS.billingCancel, json({})),
    resume: () => saasData<BillingOverview>(ENDPOINTS.billingResume, json({})),
    setPaymentMethod: (input) => saasData<BillingOverview>(ENDPOINTS.billingPaymentMethod, put(input)),
    retryPayment: () => saasData<BillingOverview>(ENDPOINTS.billingRetry, json({})),
    invoices: () => saasData<Invoice[]>(ENDPOINTS.invoices),
  },
  notifications: {
    list: () => saasData<AppNotification[]>(ENDPOINTS.notifications),
    markRead: async (id) => {
      await saasData<unknown>(`${ENDPOINTS.notifications}/${encodeURIComponent(id)}/read`, json({}))
    },
    markAllRead: async () => {
      await saasData<unknown>(ENDPOINTS.notificationsReadAll, json({}))
    },
  },
  support: {
    submit: (input) => saasData<SupportTicket>(ENDPOINTS.supportTickets, json(input)),
    mine: () => saasData<SupportTicket[]>(ENDPOINTS.supportMine),
  },
  account: {
    exportData: () => saasData<AccountExport>(ENDPOINTS.accountExport),
  },
  platform: {
    metrics: () => saasData<PlatformSaasMetrics>(ENDPOINTS.platformMetrics),
    subscriptions: (f) =>
      saasData<PlatformSubscription[]>(
        `${ENDPOINTS.platformSubscriptions}${qs({ status: f?.status as SubscriptionStatus | undefined, plan: f?.plan, search: f?.search })}`,
      ),
    payments: (f) =>
      saasData<PlatformPayment[]>(
        `${ENDPOINTS.platformPayments}${qs({ status: f?.status as PaymentStatus | undefined, search: f?.search })}`,
      ),
    orgAction: async (orgId, action) => {
      await saasData<unknown>(`/api/v1/platform/organizations/${encodeURIComponent(orgId)}/support-action`, json(action))
    },
    tickets: (status) => saasData<PlatformTicket[]>(`${ENDPOINTS.platformTickets}${qs({ status })}`),
    setTicketStatus: async (id, status) => {
      await saasData<unknown>(`${ENDPOINTS.platformTickets}/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ status }) })
    },
  },
  dev: {
    simulatePaymentFailure: () => Promise.reject(new SaasError("NOT_AVAILABLE", "Solo disponible en modo mock.")),
    reset: () => Promise.reject(new SaasError("NOT_AVAILABLE", "Solo disponible en modo mock.")),
  },
}

export const saas: SaasServices = getSaasMode() === "real" ? realServices : mockServices

/** Mensaje legible para mostrar al usuario a partir de cualquier error. */
export function saasErrorMessage(err: unknown, fallback = "No pudimos completar la operación. Inténtalo de nuevo."): string {
  if (err instanceof SaasError) return err.message
  if (err instanceof Error && err.message) return err.message
  return fallback
}

export type { SubscriptionFilters, PaymentFilters } from "./mockPlatform"
export { describeAction } from "./mockPlatform"
