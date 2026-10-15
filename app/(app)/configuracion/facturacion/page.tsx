"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { AlertTriangle, CalendarClock, CreditCard, FileText, Receipt, RefreshCw } from "lucide-react"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Badge from "@/components/ui/Badge"
import Table from "@/components/ui/Table"
import EmptyState from "@/components/ui/EmptyState"
import ErrorState from "@/components/ui/ErrorState"
import LoadingBlock from "@/components/ui/LoadingBlock"
import { useConfirm } from "@/components/ui/ConfirmDialog"
import PaymentMethodModal from "@/components/saas/PaymentMethodModal"
import PlanChangeModal from "@/components/saas/PlanChangeModal"
import { InvoiceStatusBadge, SubscriptionStatusBadge } from "@/components/saas/StatusBadge"
import { PLAN_CATALOG, type PlanId } from "@/lib/commerce/catalog"
import { checkoutPathForPlan, daysUntil, planLabel } from "@/lib/saas/billing"
import { fmtDate, formatCOP } from "@/lib/saas/format"
import { refreshBilling, useBillingOverview, useInvoices } from "@/lib/saas/hooks"
import { capabilities, isMockMode, saas, saasErrorMessage } from "@/lib/saas/services"
import { methodLabel } from "@/lib/saas/mockEngine"
import type { Invoice } from "@/lib/saas/types"
import { usePermissions } from "@/hooks/usePermissions"
import { toast } from "@/lib/toast"

const PLANS: PlanId[] = ["free", "pro", "academia"]
const RANK: Record<PlanId, number> = { free: 0, pro: 1, academia: 2 }

export default function FacturacionPage() {
  const { data: overview, error, isLoading, mutate } = useBillingOverview()
  const { data: invoices, error: invoicesError, mutate: mutateInvoices } = useInvoices()
  const { can } = usePermissions()
  const canManage = can("billing", "update") || can("billing", "read")
  const confirm = useConfirm()
  const router = useRouter()

  const [target, setTarget] = useState<PlanId | null>(null)
  const [pmOpen, setPmOpen] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)

  if (isLoading) return <LoadingBlock label="Cargando facturación…" />
  if (error || !overview) {
    return <ErrorState title="No pudimos cargar tu facturación" onRetry={() => mutate()} />
  }

  const paid = overview.plan !== "free"
  const price = PLAN_CATALOG[overview.plan].amount

  async function run(key: string, fn: () => Promise<unknown>, ok: string) {
    setBusy(key)
    try {
      await fn()
      await refreshBilling()
      toast.success(ok)
    } catch (err) {
      toast.error("No se pudo completar la acción", { description: saasErrorMessage(err) })
    } finally {
      setBusy(null)
    }
  }

  async function handleCancel() {
    const ok = await confirm({
      title: "Cancelar suscripción",
      description: `Conservarás el plan ${planLabel(overview!.plan)} hasta el ${fmtDate(overview!.currentPeriodEnd)}. Después pasarás al plan Free y no se harán más cobros.`,
      confirmLabel: "Cancelar suscripción",
      variant: "danger",
    })
    if (ok) await run("cancel", () => saas.billing.cancel(), "Suscripción cancelada")
  }

  /** Elegir un plan: inline (mock) o checkout (API real, que cobra en el checkout). */
  async function choosePlan(id: PlanId) {
    if (capabilities.planChange === "inline") {
      setTarget(id)
      return
    }
    if (id === "free") {
      await handleCancel()
      return
    }
    const path = checkoutPathForPlan(overview!, id)
    if (path) router.push(path)
  }

  function planBlocked(id: PlanId): boolean {
    // Sin cambio directo a un plan de pago menor (se hace cancelando y contratando de nuevo)
    return !capabilities.downgrade && id !== "free" && RANK[id] < RANK[overview!.plan]
  }

  function handleRetry() {
    if (!overview!.paymentMethod) {
      setPmOpen(true)
      return
    }
    return run("retry", () => saas.billing.retryPayment(), "Pago recibido")
  }

  const columns = [
    { key: "number", header: "Factura", render: (_: unknown, r: Record<string, unknown>) => <span className="font-medium">{(r as unknown as Invoice).number}</span> },
    { key: "issuedAt", header: "Fecha", render: (v: unknown) => fmtDate(String(v), "short") },
    { key: "description", header: "Concepto" },
    { key: "total", header: "Total", render: (v: unknown) => formatCOP(Number(v)) },
    { key: "status", header: "Estado", render: (v: unknown) => <InvoiceStatusBadge status={v as Invoice["status"]} /> },
    {
      key: "actions",
      render: (_: unknown, r: Record<string, unknown>) => (
        <Link
          href={`/configuracion/facturacion/${(r as unknown as Invoice).id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium underline"
          style={{ color: "var(--accent)" }}
        >
          <Receipt size={14} aria-hidden="true" /> Recibo
        </Link>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      {overview.status === "past_due" && (
        <div
          role="alert"
          className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center rounded-2xl"
          style={{ background: "#FEF3C7", border: "1px solid #F59E0B" }}
        >
          <AlertTriangle size={20} aria-hidden="true" style={{ color: "#92400E" }} className="shrink-0" />
          <div className="flex-1 text-sm" style={{ color: "#78350F" }}>
            <p className="font-semibold">No pudimos cobrar tu suscripción</p>
            <p>
              {overview.pastDue?.graceEndsAt
                ? `Tienes hasta el ${fmtDate(overview.pastDue.graceEndsAt)} (${daysUntil(overview.pastDue.graceEndsAt)} días) para regularizar el pago; si no, pasarás al plan Free.`
                : overview.pastDue?.nextRetryAt
                  ? `Reintentaremos el cobro el ${fmtDate(overview.pastDue.nextRetryAt)}. Si falla varias veces, tu plan pasará a Free.`
                  : "Reintentaremos el cobro automáticamente. Si falla varias veces, tu plan pasará a Free."}
              {!capabilities.paymentMethodUpdate && (
                <> ¿Necesitas cambiar tu método de pago? <Link href="/soporte" className="underline font-semibold">Escríbenos</Link>.</>
              )}
            </p>
          </div>
          {(capabilities.paymentMethodUpdate || capabilities.manualRetry) && (
            <div className="flex gap-2">
              {capabilities.paymentMethodUpdate && (
                <Button variant="ghost" size="sm" onClick={() => setPmOpen(true)}>Cambiar método</Button>
              )}
              {capabilities.manualRetry && (
                <Button size="sm" onClick={handleRetry} loading={busy === "retry"}>
                  <RefreshCw size={14} aria-hidden="true" /> Reintentar pago
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Plan actual */}
      <Card>
        <div className="flex items-center gap-3 mb-5">
          <CalendarClock size={18} style={{ color: "var(--accent)" }} aria-hidden="true" />
          <p className="text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>PLAN ACTUAL</p>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-display text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                Plan {planLabel(overview.plan)}
              </p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {paid ? `${formatCOP(price)} / mes` : "Sin costo"}
              </p>
            </div>
            <SubscriptionStatusBadge status={overview.status} />
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {overview.status === "trialing" && (
              <Info k="La prueba termina" v={`${fmtDate(overview.trialEndsAt)} (${daysUntil(overview.trialEndsAt)} días)`} />
            )}
            {paid && overview.currentPeriodEnd && (
              <Info
                k={overview.cancelAtPeriodEnd ? "Acceso hasta" : "Próxima renovación"}
                v={fmtDate(overview.currentPeriodEnd)}
              />
            )}
            {overview.scheduledPlan && !overview.cancelAtPeriodEnd && (
              <Info k="Cambio programado" v={`Plan ${planLabel(overview.scheduledPlan)} el ${fmtDate(overview.currentPeriodEnd)}`} />
            )}
          </dl>

          {overview.cancelAtPeriodEnd && (
            <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl text-sm" style={{ background: "var(--bg-primary)", border: "1px solid var(--border-light)", color: "var(--text-secondary)" }}>
              <span className="flex-1">Tu suscripción está cancelada y no se renovará.</span>
              <Button size="sm" variant="ghost" loading={busy === "resume"} onClick={() => run("resume", () => saas.billing.resume(), "Suscripción reanudada")}>
                Reanudar
              </Button>
            </div>
          )}

          {paid && !overview.cancelAtPeriodEnd && canManage && (
            <div>
              <Button variant="ghost" size="sm" loading={busy === "cancel"} onClick={handleCancel}>
                Cancelar suscripción
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Cambiar de plan */}
      <Card>
        <div className="flex items-center gap-3 mb-5">
          <FileText size={18} style={{ color: "var(--accent)" }} aria-hidden="true" />
          <p className="text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>CAMBIAR DE PLAN</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PLANS.map((id) => {
            const entry = PLAN_CATALOG[id]
            const current = overview.plan === id && overview.status !== "trialing"
            const scheduled = overview.scheduledPlan === id
            return (
              <div
                key={id}
                className="flex flex-col gap-2 p-4 rounded-xl"
                style={{
                  border: `1px solid ${current ? "var(--accent)" : "var(--border-light)"}`,
                  background: current ? "var(--accent-light)" : "var(--bg-surface)",
                }}
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{entry.label}</p>
                  {current && <Badge variant="accent">Actual</Badge>}
                  {scheduled && <Badge variant="warning">Programado</Badge>}
                </div>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {entry.amount ? `${formatCOP(entry.amount)} / mes` : "Sin costo"}
                </p>
                <Button
                  size="sm"
                  variant={current ? "ghost" : "primary"}
                  disabled={current || scheduled || overview.status === "past_due" || !canManage || planBlocked(id)}
                  onClick={() => choosePlan(id)}
                  className="mt-auto"
                  title={planBlocked(id) ? "Para bajar de plan cancela tu suscripción y contrata el plan menor al terminar el periodo." : undefined}
                >
                  {current
                    ? "Plan actual"
                    : scheduled
                      ? "Programado"
                      : id === "free"
                        ? capabilities.downgrade ? "Bajar a Free" : "Cancelar y pasar a Free"
                        : "Elegir"}
                </Button>
              </div>
            )
          })}
        </div>
        <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
          Al subir de plan pagas el valor completo y tu periodo de 30 días empieza hoy. Al bajar, el cambio se aplica al terminar el periodo pagado.
          {!capabilities.downgrade && " Para bajar a un plan de pago menor, cancela y contrátalo de nuevo cuando termine tu periodo."}{" "}
          <Link href="/planes" className="underline">Ver comparativa de planes</Link>.
        </p>
      </Card>

      {/* Método de pago */}
      <Card>
        <div className="flex items-center gap-3 mb-5">
          <CreditCard size={18} style={{ color: "var(--accent)" }} aria-hidden="true" />
          <p className="text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>MÉTODO DE PAGO</p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm" style={{ color: "var(--text-primary)" }}>
            {overview.paymentMethod ? (
              <>
                <p className="font-medium">{methodLabel(overview.paymentMethod)}</p>
                {overview.paymentMethod.expMonth && (
                  <p style={{ color: "var(--text-muted)" }}>
                    Vence {String(overview.paymentMethod.expMonth).padStart(2, "0")}/{overview.paymentMethod.expYear}
                  </p>
                )}
              </>
            ) : (
              <p style={{ color: "var(--text-muted)" }}>Aún no has agregado un método de pago.</p>
            )}
          </div>
          {canManage && capabilities.paymentMethodUpdate ? (
            <Button variant="ghost" size="sm" onClick={() => setPmOpen(true)}>
              {overview.paymentMethod ? "Cambiar" : "Agregar método de pago"}
            </Button>
          ) : (
            <p className="text-xs max-w-xs" style={{ color: "var(--text-muted)" }}>
              Tu método de pago se registra al contratar un plan.{" "}
              <Link href="/soporte" className="underline">Escríbenos</Link> si necesitas cambiarlo.
            </p>
          )}
        </div>
      </Card>

      {/* Facturas */}
      <section aria-labelledby="facturas-titulo" className="flex flex-col gap-3">
        <h2 id="facturas-titulo" className="text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>
          HISTORIAL DE FACTURAS
        </h2>
        {invoicesError ? (
          <ErrorState title="No pudimos cargar tus facturas" onRetry={() => mutateInvoices()} />
        ) : !invoices ? (
          <LoadingBlock label="Cargando facturas…" className="py-8" />
        ) : (
          <Table
            columns={columns}
            data={invoices as unknown as Record<string, unknown>[]}
            rowKey="id"
            emptyState={
              <EmptyState
                icon={<Receipt size={28} />}
                title="Aún no tienes facturas"
                description="Cuando contrates un plan de pago, tus recibos aparecerán aquí."
                action={<Link href="/planes"><Button size="sm">Ver planes</Button></Link>}
              />
            }
          />
        )}
      </section>

      {isMockMode() && (
        <Card className="flex flex-col gap-3">
          <p className="text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>MODO DEMOSTRACIÓN</p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Esta facturación es simulada (NEXT_PUBLIC_SAAS_MODE=mock). Usa estas acciones para revisar los estados.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="ghost"
              size="sm"
              loading={busy === "fail"}
              onClick={() => run("fail", () => saas.dev.simulatePaymentFailure(), "Cobro fallido simulado")}
            >
              Simular pago fallido
            </Button>
            <Button
              variant="ghost"
              size="sm"
              loading={busy === "reset"}
              onClick={() => run("reset", () => saas.dev.reset(), "Demostración reiniciada")}
            >
              Reiniciar demostración
            </Button>
          </div>
        </Card>
      )}

      <PlanChangeModal target={target} onClose={() => setTarget(null)} onNeedPaymentMethod={() => setPmOpen(true)} />
      <PaymentMethodModal open={pmOpen} onClose={() => setPmOpen(false)} />
    </div>
  )
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex flex-col gap-0.5 p-3 rounded-xl" style={{ background: "var(--bg-primary)", border: "1px solid var(--border-light)" }}>
      <dt className="text-xs" style={{ color: "var(--text-muted)" }}>{k}</dt>
      <dd className="font-medium" style={{ color: "var(--text-primary)" }}>{v}</dd>
    </div>
  )
}
