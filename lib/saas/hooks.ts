"use client"

import useSWR, { mutate } from "swr"
import { saas } from "./services"
import type { AppNotification } from "./types"

const KEYS = {
  billing: "saas/billing",
  invoices: "saas/invoices",
  notifications: "saas/notifications",
  tickets: "saas/tickets",
} as const

const opts = { revalidateOnFocus: false } as const

export function useBillingOverview() {
  return useSWR(KEYS.billing, () => saas.billing.overview(), opts)
}

export function useInvoices() {
  return useSWR(KEYS.invoices, () => saas.billing.invoices(), opts)
}

export function useNotifications() {
  // Se refresca al volver a la pestaña y cada 60 s (sin websockets)
  return useSWR(KEYS.notifications, () => saas.notifications.list(), {
    revalidateOnFocus: true,
    refreshInterval: 60_000,
  })
}

export function useMyTickets() {
  return useSWR(KEYS.tickets, () => saas.support.mine(), opts)
}

/** Revalida todo lo que depende de facturación tras una mutación. */
export function refreshBilling() {
  return Promise.all([mutate(KEYS.billing), mutate(KEYS.invoices), mutate(KEYS.notifications)])
}

/**
 * Marca una notificación (o todas, sin id) como leída: la lista se actualiza al instante y luego se
 * confirma con el servidor. Si el API la rechaza, se restaura la lista real y el error se propaga.
 */
export async function markNotificationsRead(id?: string) {
  const now = new Date().toISOString()
  await mutate(
    KEYS.notifications,
    (cur?: AppNotification[]) => cur?.map((n) => ((!id || n.id === id) && !n.readAt ? { ...n, readAt: now } : n)),
    { revalidate: false },
  )
  try {
    if (id) await saas.notifications.markRead(id)
    else await saas.notifications.markAllRead()
  } finally {
    await mutate(KEYS.notifications)
  }
}

export function refreshNotifications() {
  return mutate(KEYS.notifications)
}

export function refreshTickets() {
  return Promise.all([mutate(KEYS.tickets), mutate(KEYS.notifications)])
}
