import Badge, { type BadgeVariant } from "@/components/ui/Badge"
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_TONES, STATUS_LABELS, STATUS_TONES, type Tone } from "@/lib/saas/billing"
import type { InvoiceStatus, PaymentStatus, SubscriptionStatus, TicketStatus } from "@/lib/saas/types"

const TONE_TO_VARIANT: Record<Tone, BadgeVariant> = {
  success: "success",
  warning: "warning",
  accent: "accent",
  muted: "muted",
}

export function SubscriptionStatusBadge({ status }: { status: SubscriptionStatus }) {
  return <Badge variant={TONE_TO_VARIANT[STATUS_TONES[status]]}>{STATUS_LABELS[status]}</Badge>
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return <Badge variant={TONE_TO_VARIANT[INVOICE_STATUS_TONES[status]]}>{INVOICE_STATUS_LABELS[status]}</Badge>
}

const PAYMENT_LABELS: Record<PaymentStatus, [string, BadgeVariant]> = {
  paid: ["Pagado", "success"],
  failed: ["Fallido", "warning"],
  refunded: ["Reembolsado", "muted"],
  pending: ["Pendiente", "accent"],
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const [label, variant] = PAYMENT_LABELS[status]
  return <Badge variant={variant}>{label}</Badge>
}

const TICKET_LABELS: Record<TicketStatus, [string, BadgeVariant]> = {
  open: ["Abierto", "warning"],
  pending: ["En curso", "accent"],
  closed: ["Cerrado", "muted"],
}

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  const [label, variant] = TICKET_LABELS[status]
  return <Badge variant={variant}>{label}</Badge>
}
