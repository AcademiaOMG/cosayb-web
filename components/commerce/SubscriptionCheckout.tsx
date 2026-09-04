"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { CheckCircle, Loader2 } from "lucide-react"
import { getMyProfile, getCurrentOrganization } from "@/lib/api"
import { PLAN_CATALOG, formatCOP, type PaidPlanId } from "@/lib/commerce/catalog"
import { useCheckout } from "@/lib/commerce/useCheckout"
import {
  currentStep,
  reviewIndex,
  PROCESSING_STEPS,
  type CheckoutState,
  type StepId,
} from "@/lib/commerce/machine"
import { subscriptionService } from "@/lib/commerce/services"
import { clearPendingCheckout } from "@/lib/commerce/pending"
import type { PlanIntent } from "@/lib/commerce/planState"
import type { SubscriptionResult } from "@/lib/commerce/types"
import { useBeforeUnloadGuard } from "./useAbandonGuard"
import { CustomerStep, MethodPicker, PaymentDetails } from "./PaymentStep"
import { Stepper, OrderSummary, TextField, FieldError, ExitConfirmModal, GlobalError } from "./ui"

const STEP_LABELS: Record<StepId, string> = {
  business: "Tu negocio",
  plan: "Plan",
  format: "Formato",
  customer: "Datos",
  method: "Pago",
  payment: "Pago",
  review: "Revisión",
}

/** Grupos visibles del stepper (method+payment colapsan en "Pago"). */
function stepperGroups(steps: StepId[]): string[] {
  const out: string[] = []
  for (const s of steps) {
    const label = STEP_LABELS[s]
    if (out[out.length - 1] === label) continue
    out.push(label)
  }
  out.push("Confirmación")
  return out
}

/** groupIndex del paso activo. */
function activeGroupIndex(steps: StepId[], stepIndex: number, status: string): number {
  const groups = stepperGroups(steps)
  if (status === "success") return groups.length - 1
  const before = steps.slice(0, stepIndex)
  let g = 0
  let prev = ""
  for (const s of before) {
    if (STEP_LABELS[s] !== prev) g++
    prev = STEP_LABELS[s]
  }
  return g
}

export default function SubscriptionCheckout({
  plan,
  intent,
  mode,
  needsBusiness,
  previousPlanLabel,
  orgName,
}: {
  plan: PaidPlanId
  intent: PlanIntent
  mode: "new" | "upgrade"
  needsBusiness: boolean
  previousPlanLabel: string | null
  orgName: string | null
}) {
  const router = useRouter()
  const entry = PLAN_CATALOG[plan]

  const { data: profile } = useSWR("me-profile", () => getMyProfile().then((r) => r.data), {
    revalidateOnFocus: false,
  })
  const { data: org } = useSWR(
    needsBusiness ? null : "me-org",
    () => getCurrentOrganization().then((r) => r.data),
    { revalidateOnFocus: false }
  )

  const prefill = useMemo(
    () => ({
      fullName: profile?.name ?? "",
      email: profile?.email ?? "",
      country: "Colombia",
    }),
    [profile]
  )

  const { state, dispatch, submit, result, isDirty } = useCheckout({
    kind: "subscription",
    plan,
    mode,
    needsBusiness,
    discriminator: plan,
    prefill,
    onSubmit: async (s: CheckoutState, idempotencyKey: string): Promise<SubscriptionResult> => {
      return subscriptionService.checkout({
        plan,
        method: s.data.method!,
        cardLast4: s.cardLast4,
        customer: {
          fullName: s.data.customer.fullName,
          email: s.data.customer.email,
          phone: s.data.customer.phone,
          city: s.data.customer.city,
          country: s.data.customer.country,
        },
        businessName: needsBusiness ? s.data.business.name : null,
        idempotencyKey,
      })
    },
  })

  const [exitOpen, setExitOpen] = useState(false)
  const activeStep = currentStep(state)
  const rIndex = reviewIndex(state)
  const inForm = state.status === "form"
  useBeforeUnloadGuard(inForm && isDirty)

  const leaveTo = (href: string) => {
    if (isDirty && inForm) {
      setExitOpen(true)
      pendingHref.current = href
    } else {
      router.push(href)
    }
  }
  const pendingHref = useMemo(() => ({ current: "/planes" }), [])

  const money = formatCOP(entry.amount)

  // ─── Pantallas terminales ────────────────────────────────────────────────

  if (state.status === "success" && result && result.kind === "subscription") {
    return <SuccessScreen result={result} />
  }

  return (
    <main className="min-h-screen bg-[#F5F0E8] px-4 py-8 text-[#12213A]">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <button onClick={() => leaveTo("/planes")} className="text-sm font-semibold text-[#1B4FD8]">
            ← Volver a planes
          </button>
          <span className="rounded-full bg-[#E9F3FF] px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-[#1434A4]">
            {mode === "upgrade" ? `Actualizar a ${entry.label}` : `Adquirir ${entry.label}`}
          </span>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.5fr_0.9fr]">
          <section className="rounded-3xl border border-[#DDD6C8] bg-white p-6 shadow-sm lg:p-8">
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1B4FD8]">Checkout</p>
              <h1 className="mt-2 text-3xl font-extrabold">
                {mode === "upgrade" ? `Actualizar a ${entry.label}` : `Adquiere ${entry.label}`}
              </h1>
            </div>

            {state.status !== "processing" && (
              <div className="mb-8">
                <Stepper
                  steps={stepperGroups(state.steps)}
                  activeIndex={activeGroupIndex(state.steps, state.stepIndex, state.status)}
                />
              </div>
            )}

            {state.status === "error" && (
              <GlobalError
                message={state.globalError ?? "No pudimos completar la operación."}
                onRetry={() => submit()}
                onBack={() => dispatch({ type: "RETRY" })}
              />
            )}

            {state.status === "processing" && <Processing label={state.processingLabel} />}

            {inForm && (
              <>
                {activeStep === "business" && (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-xl font-bold">Registra tu negocio</h2>
                      <p className="mt-1 text-sm text-[#4A4438]">
                        Tu plan se activa sobre tu negocio. Podrás completar el resto de la configuración después.
                      </p>
                    </div>
                    <TextField
                      label="Nombre del negocio *"
                      placeholder="Ej. Restaurante La Candelaria"
                      value={state.data.business.name}
                      onChange={(v) => dispatch({ type: "SET_FIELD", path: "business.name", value: v })}
                      error={state.errors["business.name"]}
                    />
                  </div>
                )}

                {activeStep === "plan" && (
                  <div className="space-y-6">
                    {mode === "upgrade" && previousPlanLabel && (
                      <div className="rounded-2xl border border-[#1B4FD8]/30 bg-[#EDF3FF] p-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-[#4A4438]">Plan actual</span>
                          <span className="font-semibold">{previousPlanLabel}</span>
                        </div>
                        <div className="mt-2 flex justify-between">
                          <span className="text-[#4A4438]">Nuevo plan</span>
                          <span className="font-semibold">{entry.label}</span>
                        </div>
                        <div className="mt-2 flex justify-between">
                          <span className="text-[#4A4438]">Nuevo precio</span>
                          <span className="font-semibold">{money} COP / mes</span>
                        </div>
                      </div>
                    )}
                    <div className="rounded-2xl border border-[#DDD6C8] bg-[#FAF8F4] p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-2xl font-extrabold">{entry.label}</h2>
                          <p className="text-sm text-[#4A4438]">Renovación mensual</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-extrabold">{money}</p>
                          <p className="text-xs text-[#7A6E60]">COP / mes</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {entry.benefits.map((b) => (
                        <div key={b} className="flex items-start gap-3 text-sm">
                          <CheckCircle className="mt-0.5 h-5 w-5 text-[#1B4FD8]" />
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-2xl border border-[#DDD6C8] bg-[#F7F5F2] p-4 text-sm text-[#4A4438]">
                      <p>Subtotal: <strong>{money}</strong></p>
                      <p className="mt-1">Total: <strong>{money} COP / mes</strong></p>
                    </div>
                  </div>
                )}

                {activeStep === "customer" && <CustomerStep state={state} dispatch={dispatch} />}
                {activeStep === "method" && <MethodPicker state={state} dispatch={dispatch} />}
                {activeStep === "payment" && <PaymentDetails state={state} dispatch={dispatch} />}

                {activeStep === "review" && (
                  <Review state={state} plan={plan} money={money} dispatch={dispatch} orgName={orgName ?? state.data.business.name} />
                )}

                <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                  {state.stepIndex > 0 ? (
                    <button
                      onClick={() => dispatch({ type: "BACK" })}
                      className="rounded-xl border border-[#DDD6C8] bg-white px-5 py-3 text-sm font-semibold text-[#12213A]"
                    >
                      Volver
                    </button>
                  ) : (
                    <button
                      onClick={() => leaveTo("/planes")}
                      className="rounded-xl border border-[#DDD6C8] bg-white px-5 py-3 text-sm font-semibold text-[#12213A]"
                    >
                      Volver a planes
                    </button>
                  )}

                  {state.stepIndex < rIndex && (
                    <button
                      onClick={() => dispatch({ type: "NEXT" })}
                      className="rounded-xl bg-[#1B4FD8] px-5 py-3 text-sm font-semibold text-white sm:ml-auto"
                    >
                      {activeStep === "customer" ? "Continuar al pago" : "Continuar"}
                    </button>
                  )}
                  {state.stepIndex === rIndex && (
                    <button
                      onClick={() => submit()}
                      disabled={!state.data.acceptedTerms}
                      className="rounded-xl bg-[#1B4FD8] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60 sm:ml-auto"
                    >
                      Confirmar y pagar
                    </button>
                  )}
                </div>
              </>
            )}
          </section>

          <OrderSummary
            title={entry.label}
            rows={[
              { label: "Plan", value: entry.label },
              { label: "Precio", value: `${money} / mes` },
              { label: "Renovación", value: "Mensual" },
              ...(mode === "upgrade" && previousPlanLabel
                ? [{ label: "Desde", value: previousPlanLabel }]
                : []),
            ]}
            total={`${money} COP / mes`}
            totalNote="Se cobra al confirmar (simulado)."
          />
        </div>
      </div>

      <ExitConfirmModal
        open={exitOpen}
        onStay={() => setExitOpen(false)}
        onLeave={() => {
          setExitOpen(false)
          router.push(pendingHref.current)
        }}
      />
    </main>
  )
}

function Processing({ label }: { label: string }) {
  const current = Math.max(0, PROCESSING_STEPS.indexOf(label))
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-2xl bg-[#EEF5FF] p-4 text-[#1434A4]">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="font-semibold">{label}</span>
      </div>
      <ul className="space-y-2 rounded-2xl border border-[#DDD6C8] bg-[#FAF8F4] p-4 text-sm">
        {PROCESSING_STEPS.map((s, i) => (
          <li key={s} className={i === current ? "font-semibold text-[#12213A]" : "text-[#7A6E60]"}>
            {i < current ? "✓ " : "• "}
            {s}
          </li>
        ))}
      </ul>
      <p className="text-xs text-[#7A6E60]">Esto toma solo un momento. No cierres esta ventana.</p>
    </div>
  )
}

function Review({
  state,
  plan,
  money,
  dispatch,
  orgName,
}: {
  state: CheckoutState
  plan: PaidPlanId
  money: string
  dispatch: React.Dispatch<import("@/lib/commerce/machine").CheckoutAction>
  orgName: string
}) {
  const c = state.data.customer
  const entry = PLAN_CATALOG[plan]
  const methodLabel =
    state.data.method === "tarjeta"
      ? `Tarjeta terminada en **** ${state.cardLast4 ?? "----"}`
      : state.data.method === "pse"
        ? `PSE${state.data.payment.bank ? ` · ${state.data.payment.bank}` : ""}`
        : "Nequi / Daviplata"

  const Row = ({ k, v }: { k: string; v: string }) => (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="text-sm text-[#7A6E60]">{k}</span>
      <span className="text-right text-sm font-semibold">{v}</span>
    </div>
  )
  const EditBtn = ({ step }: { step: StepId }) => (
    <button
      onClick={() => dispatch({ type: "GOTO", step })}
      className="text-xs font-semibold text-[#1B4FD8]"
    >
      Editar
    </button>
  )

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold">Revisa tu compra</h2>

      <div className="rounded-2xl border border-[#DDD6C8] bg-[#FAF8F4] p-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#7A6E60]">Plan</span>
          <EditBtn step="plan" />
        </div>
        <Row k="Plan" v={entry.label} />
        <Row k="Precio" v={`${money} COP / mes`} />
        {orgName && <Row k="Negocio" v={orgName} />}
      </div>

      <div className="rounded-2xl border border-[#DDD6C8] bg-[#FAF8F4] p-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#7A6E60]">Cliente</span>
          <EditBtn step="customer" />
        </div>
        <Row k="Nombre" v={c.fullName} />
        <Row k="Correo" v={c.email} />
        <Row k="Teléfono" v={c.phone} />
        <Row k="Ciudad / País" v={`${c.city} / ${c.country}`} />
      </div>

      <div className="rounded-2xl border border-[#DDD6C8] bg-[#FAF8F4] p-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#7A6E60]">Método de pago</span>
          <EditBtn step="method" />
        </div>
        <Row k="Método" v={methodLabel} />
      </div>

      <div className="rounded-2xl border border-[#DDD6C8] bg-white p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#7A6E60]">Total</span>
          <span className="text-lg font-extrabold">{money} COP / mes</span>
        </div>
      </div>

      <label className="flex items-start gap-3 rounded-xl border border-[#DDD6C8] bg-[#F7F5F2] p-3 text-sm text-[#4A4438]">
        <input
          type="checkbox"
          checked={state.data.acceptedTerms}
          onChange={(e) => dispatch({ type: "SET_FIELD", path: "acceptedTerms", value: e.target.checked })}
          className="mt-1 h-4 w-4 accent-[#1B4FD8]"
        />
        <span>Acepto los términos y condiciones.</span>
      </label>
      <FieldError msg={state.errors.acceptedTerms} />
    </div>
  )
}

function SuccessScreen({ result }: { result: SubscriptionResult }) {
  const entry = PLAN_CATALOG[result.plan]
  const date = new Date(result.createdAt).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
  return (
    <main className="min-h-screen bg-[#F5F0E8] px-4 py-10 text-[#12213A]">
      <div className="mx-auto max-w-2xl rounded-3xl border border-[#B7E7CB] bg-white p-8 text-center shadow-sm">
        <CheckCircle className="mx-auto h-14 w-14 text-[#15803D]" />
        <h1 className="mt-4 text-3xl font-extrabold">¡Pago confirmado!</h1>
        <p className="mt-2 text-[#4A4438]">Tu suscripción al plan {entry.label} está activa.</p>

        <div className="mt-6 grid gap-3 rounded-2xl bg-[#FAF8F4] p-5 text-left text-sm sm:grid-cols-2">
          <div><span className="text-[#7A6E60]">Plan</span><p className="font-semibold">{entry.label}</p></div>
          <div><span className="text-[#7A6E60]">Estado</span><p className="font-semibold">Activo</p></div>
          <div><span className="text-[#7A6E60]">Valor</span><p className="font-semibold">{formatCOP(result.amount)} / mes</p></div>
          <div><span className="text-[#7A6E60]">Fecha</span><p className="font-semibold">{date}</p></div>
          <div><span className="text-[#7A6E60]">Número de operación</span><p className="font-semibold">{result.operationNo}</p></div>
          <div><span className="text-[#7A6E60]">Método</span><p className="font-semibold">{result.methodLabel}</p></div>
        </div>

        <p className="mt-4 text-xs text-[#7A6E60]">
          Esta operación corresponde a una simulación. No se realizó ningún cobro real.
        </p>

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <SuccessLink href="/dashboard" label="Ir a mi cuenta" primary />
          <SuccessLink href="/subscription" label="Ver mi suscripción" />
        </div>
      </div>
    </main>
  )
}

function SuccessLink({ href, label, primary }: { href: string; label: string; primary?: boolean }) {
  return (
    <button
      onClick={() => {
        clearPendingCheckout()
        window.location.href = href
      }}
      className={
        primary
          ? "rounded-xl bg-[#1B4FD8] px-5 py-3 text-sm font-semibold text-white"
          : "rounded-xl border border-[#DDD6C8] bg-white px-5 py-3 text-sm font-semibold text-[#12213A]"
      }
    >
      {label}
    </button>
  )
}
