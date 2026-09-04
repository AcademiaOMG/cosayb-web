"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { CheckCircle, Loader2 } from "lucide-react"
import { getMyProfile } from "@/lib/api"
import { BOOK, formatCOP, type BookFormat } from "@/lib/commerce/catalog"
import { useCheckout } from "@/lib/commerce/useCheckout"
import {
  currentStep,
  reviewIndex,
  PROCESSING_STEPS_BOOK,
  type CheckoutState,
  type CheckoutAction,
  type StepId,
} from "@/lib/commerce/machine"
import { orderService } from "@/lib/commerce/services"
import { clearPendingCheckout } from "@/lib/commerce/pending"
import { useCommerceSession } from "@/lib/commerce/session"
import type { BookOrderResult } from "@/lib/commerce/types"
import { useBeforeUnloadGuard } from "./useAbandonGuard"
import { CustomerStep, MethodPicker, PaymentDetails } from "./PaymentStep"
import { Stepper, OrderSummary, FieldError, ExitConfirmModal, GlobalError } from "./ui"

const GROUPS = ["Formato", "Datos", "Pago", "Revisión", "Confirmación"]

function activeGroup(step: StepId, status: string): number {
  if (status === "success") return 4
  return { format: 0, customer: 1, method: 2, payment: 2, review: 3, business: 0, plan: 0 }[step]
}

export default function BookCheckout({ initialFormat }: { initialFormat: BookFormat }) {
  const router = useRouter()
  const { isAuthenticated } = useCommerceSession()
  const { data: profile } = useSWR(
    isAuthenticated ? "me-profile" : null,
    () => getMyProfile().then((r) => r.data),
    { revalidateOnFocus: false }
  )

  const prefill = useMemo(
    () => ({ fullName: profile?.name ?? "", email: profile?.email ?? "", country: "Colombia" }),
    [profile]
  )

  const { state, dispatch, submit, result, isDirty } = useCheckout({
    kind: "book",
    format: initialFormat,
    discriminator: "libro",
    prefill,
    onSubmit: async (s: CheckoutState, idempotencyKey): Promise<BookOrderResult> =>
      orderService.checkout({
        format: s.format!,
        method: s.data.method!,
        cardLast4: s.cardLast4,
        buyer: {
          fullName: s.data.customer.fullName,
          email: s.data.customer.email,
          phone: s.data.customer.phone,
          city: s.data.customer.city,
          country: s.data.customer.country,
          comments: s.data.customer.comments || undefined,
        },
        idempotencyKey,
      }),
  })

  const [exitOpen, setExitOpen] = useState(false)
  const exitHref = useMemo(() => ({ current: "/libro" }), [])
  const step = currentStep(state)
  const rIndex = reviewIndex(state)
  const inForm = state.status === "form"
  const amount = BOOK.prices[state.format ?? initialFormat]
  const money = formatCOP(amount)
  useBeforeUnloadGuard(inForm && isDirty)

  const leaveTo = (href: string) => {
    if (isDirty && inForm) {
      exitHref.current = href
      setExitOpen(true)
    } else router.push(href)
  }

  if (state.status === "success" && result && result.kind === "book") {
    return <BookSuccess result={result} />
  }

  return (
    <main className="min-h-screen bg-[#F5F0E8] px-4 py-8 text-[#12213A]">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <button onClick={() => leaveTo("/libro")} className="text-sm font-semibold text-[#1B4FD8]">
            ← Volver al libro
          </button>
          <span className="rounded-full bg-[#E9F3FF] px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-[#1434A4]">
            Compra del libro
          </span>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.5fr_0.9fr]">
          <section className="rounded-3xl border border-[#DDD6C8] bg-white p-6 shadow-sm lg:p-8">
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1B4FD8]">Checkout</p>
              <h1 className="mt-2 text-3xl font-extrabold">Compra el libro</h1>
            </div>

            {state.status !== "processing" && (
              <div className="mb-8">
                <Stepper steps={GROUPS} activeIndex={activeGroup(step, state.status)} />
              </div>
            )}

            {state.status === "error" && (
              <GlobalError
                message={state.globalError ?? "No pudimos completar la operación."}
                onRetry={() => submit()}
                onBack={() => dispatch({ type: "RETRY" })}
              />
            )}

            {state.status === "processing" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-2xl bg-[#EEF5FF] p-4 text-[#1434A4]">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="font-semibold">{state.processingLabel}</span>
                </div>
                <ul className="space-y-2 rounded-2xl border border-[#DDD6C8] bg-[#FAF8F4] p-4 text-sm">
                  {PROCESSING_STEPS_BOOK.map((s, i) => {
                    const cur = Math.max(0, PROCESSING_STEPS_BOOK.indexOf(state.processingLabel))
                    return (
                      <li key={s} className={i === cur ? "font-semibold text-[#12213A]" : "text-[#7A6E60]"}>
                        {i < cur ? "✓ " : "• "}
                        {s}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            {inForm && (
              <>
                {step === "format" && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold">Selecciona el formato</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                      {(["fisico", "digital"] as BookFormat[]).map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => dispatch({ type: "SELECT_FORMAT", format: f })}
                          className={`rounded-2xl border p-5 text-left ${
                            state.format === f ? "border-[#1B4FD8] bg-[#EDF3FF]" : "border-[#DDD6C8] bg-[#F7F5F2]"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-extrabold">
                              {f === "fisico" ? "Libro físico" : "Libro digital"}
                            </span>
                            <span className="font-semibold">{formatCOP(BOOK.prices[f])}</span>
                          </div>
                          <p className="mt-2 text-sm text-[#4A4438]">
                            {f === "fisico"
                              ? "Entrega física a tu dirección. Coordinamos por WhatsApp."
                              : "Descarga en PDF disponible desde tu cuenta."}
                          </p>
                        </button>
                      ))}
                    </div>
                    <FieldError msg={state.errors.format} />
                  </div>
                )}

                {step === "customer" && <CustomerStep state={state} dispatch={dispatch} withComments />}
                {step === "method" && <MethodPicker state={state} dispatch={dispatch} />}
                {step === "payment" && <PaymentDetails state={state} dispatch={dispatch} />}
                {step === "review" && (
                  <BookReview state={state} money={money} dispatch={dispatch} />
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
                      onClick={() => leaveTo("/libro")}
                      className="rounded-xl border border-[#DDD6C8] bg-white px-5 py-3 text-sm font-semibold text-[#12213A]"
                    >
                      Volver al libro
                    </button>
                  )}
                  {state.stepIndex < rIndex && (
                    <button
                      onClick={() => dispatch({ type: "NEXT" })}
                      className="rounded-xl bg-[#1B4FD8] px-5 py-3 text-sm font-semibold text-white sm:ml-auto"
                    >
                      {step === "customer" ? "Continuar al pago" : "Continuar"}
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
            title={`Libro ${state.format === "fisico" ? "físico" : "digital"}`}
            rows={[
              { label: "Producto", value: BOOK.title },
              { label: "Formato", value: state.format === "fisico" ? "Físico" : "Digital" },
              { label: "Precio", value: money },
            ]}
            total={money}
          />
        </div>
      </div>

      <ExitConfirmModal
        open={exitOpen}
        onStay={() => setExitOpen(false)}
        onLeave={() => {
          setExitOpen(false)
          router.push(exitHref.current)
        }}
      />
    </main>
  )
}

function BookReview({
  state,
  money,
  dispatch,
}: {
  state: CheckoutState
  money: string
  dispatch: React.Dispatch<CheckoutAction>
}) {
  const c = state.data.customer
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
  const Edit = ({ step }: { step: StepId }) => (
    <button onClick={() => dispatch({ type: "GOTO", step })} className="text-xs font-semibold text-[#1B4FD8]">
      Editar
    </button>
  )
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold">Revisa tu compra</h2>
      <div className="rounded-2xl border border-[#DDD6C8] bg-[#FAF8F4] p-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#7A6E60]">Producto</span>
          <Edit step="format" />
        </div>
        <Row k="Producto" v={BOOK.title} />
        <Row k="Formato" v={state.format === "fisico" ? "Físico" : "Digital"} />
        <Row k="Precio" v={money} />
      </div>
      <div className="rounded-2xl border border-[#DDD6C8] bg-[#FAF8F4] p-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#7A6E60]">Comprador</span>
          <Edit step="customer" />
        </div>
        <Row k="Nombre" v={c.fullName} />
        <Row k="Correo" v={c.email} />
        <Row k="Teléfono" v={c.phone} />
        <Row k="Ciudad / País" v={`${c.city} / ${c.country}`} />
      </div>
      <div className="rounded-2xl border border-[#DDD6C8] bg-[#FAF8F4] p-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#7A6E60]">Método de pago</span>
          <Edit step="method" />
        </div>
        <Row k="Método" v={methodLabel} />
      </div>
      <div className="rounded-2xl border border-[#DDD6C8] bg-white p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#7A6E60]">Total</span>
          <span className="text-lg font-extrabold">{money}</span>
        </div>
      </div>
      <label className="flex items-start gap-3 rounded-xl border border-[#DDD6C8] bg-[#F7F5F2] p-3 text-sm text-[#4A4438]">
        <input
          type="checkbox"
          checked={state.data.acceptedTerms}
          onChange={(e) => dispatch({ type: "SET_FIELD", path: "acceptedTerms", value: e.target.checked })}
          className="mt-1 h-4 w-4 accent-[#1B4FD8]"
        />
        <span>Acepto los términos de compra y autorizo el contacto por Academia OMG.</span>
      </label>
      <FieldError msg={state.errors.acceptedTerms} />
    </div>
  )
}

function BookSuccess({ result }: { result: BookOrderResult }) {
  const date = new Date(result.createdAt).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
  return (
    <main className="min-h-screen bg-[#F5F0E8] px-4 py-10 text-[#12213A]">
      <div className="mx-auto max-w-2xl rounded-3xl border border-[#B7E7CB] bg-white p-8 text-center shadow-sm">
        <CheckCircle className="mx-auto h-14 w-14 text-[#15803D]" />
        <h1 className="mt-4 text-3xl font-extrabold">¡Compra confirmada!</h1>
        <p className="mt-2 text-[#4A4438]">
          {result.format === "fisico"
            ? "Nuestro equipo se pondrá en contacto contigo para coordinar la entrega."
            : "El libro digital estará disponible desde tu cuenta."}
        </p>
        <div className="mt-6 grid gap-3 rounded-2xl bg-[#FAF8F4] p-5 text-left text-sm sm:grid-cols-2">
          <div><span className="text-[#7A6E60]">Producto</span><p className="font-semibold">{BOOK.title}</p></div>
          <div><span className="text-[#7A6E60]">Formato</span><p className="font-semibold">{result.format === "fisico" ? "Físico" : "Digital"}</p></div>
          <div><span className="text-[#7A6E60]">Valor</span><p className="font-semibold">{formatCOP(result.amount)}</p></div>
          <div><span className="text-[#7A6E60]">Fecha</span><p className="font-semibold">{date}</p></div>
          <div><span className="text-[#7A6E60]">Número de orden</span><p className="font-semibold">{result.operationNo}</p></div>
          <div><span className="text-[#7A6E60]">Método</span><p className="font-semibold">{result.methodLabel}</p></div>
        </div>
        <p className="mt-4 text-xs text-[#7A6E60]">
          Esta operación corresponde a una simulación. No se realizó ningún cobro real.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            onClick={() => {
              clearPendingCheckout()
              window.location.href = `/order/${encodeURIComponent(result.operationNo)}`
            }}
            className="rounded-xl bg-[#1B4FD8] px-5 py-3 text-sm font-semibold text-white"
          >
            Ver mi compra
          </button>
          <button
            onClick={() => {
              clearPendingCheckout()
              window.location.href = "/"
            }}
            className="rounded-xl border border-[#DDD6C8] bg-white px-5 py-3 text-sm font-semibold text-[#12213A]"
          >
            Ir al inicio
          </button>
        </div>
      </div>
    </main>
  )
}
