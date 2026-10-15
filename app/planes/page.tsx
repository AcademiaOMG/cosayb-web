"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { ArrowRight, Check, Loader2, Minus, ShieldCheck } from "lucide-react"
import { usePermissions } from "@/hooks/usePermissions"
import { getCurrentPlan } from "@/lib/api"
import { PLAN_CATALOG, PLAN_COMPARISON, PLAN_FAQ, formatCOP, type PlanId, type PaidPlanId } from "@/lib/commerce/catalog"
import { setPendingCheckout } from "@/lib/commerce/pending"
import { fetchCommerceSession } from "@/lib/commerce/session"
import { resolvePlanIntent, planCtaLabel, type PlanContext } from "@/lib/commerce/planState"

const ORDER: PlanId[] = ["free", "pro", "academia"]

export default function PlanesPage() {
  const router = useRouter()
  const { hasOrganization, isLoading: permsLoading } = usePermissions()
  const { data: current, isLoading: planLoading } = useSWR(
    "current-plan",
    () => getCurrentPlan().then((r) => r.data).catch(() => null),
    { revalidateOnFocus: false }
  )

  const loading = permsLoading || planLoading

  const ctx: PlanContext = {
    membership: (current?.membership ?? "free") as PlanId,
    effectiveMembership: (current?.effectiveMembership ?? "free") as PlanId,
    isTrialing: current?.isTrialing ?? false,
    hasOrganization,
  }

  async function choosePaid(plan: PaidPlanId) {
    const intent = resolvePlanIntent(ctx, plan)
    if (intent === "blocked") {
      router.push("/subscription")
      return
    }
    const mode = intent === "upgrade" ? "upgrade" : "new"
    setPendingCheckout({ kind: "subscription", plan, mode })
    const dest = `/checkout/subscription/${plan}${mode === "upgrade" ? "?mode=upgrade" : ""}`

    const session = await fetchCommerceSession()
    if (!session.isAuthenticated) {
      router.push(`/login?returnTo=${encodeURIComponent(dest)}`)
      return
    }
    router.push(dest)
  }

  async function startFree() {
    const session = await fetchCommerceSession()
    if (!session.isAuthenticated) {
      router.push("/login?returnTo=/onboarding")
      return
    }
    // Autenticado con plan pago → no permitir "bajar" por botón
    if (!ctx.isTrialing && (ctx.effectiveMembership === "pro" || ctx.effectiveMembership === "academia")) {
      router.push("/subscription")
      return
    }
    if (!hasOrganization) {
      router.push("/onboarding")
      return
    }
    router.push("/dashboard")
  }

  return (
    <main className="min-h-screen bg-[#F5F0E8] px-6 py-16 text-[#12213A]">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#1B4FD8]">Planes</p>
          <h1 className="font-display text-4xl font-extrabold sm:text-5xl">
            Elige el plan que encaja con tu negocio
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-[#4A4438]">
            14 días de prueba sin tarjeta, precios en pesos colombianos y cancelación cuando quieras.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-[#1B4FD8]" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {ORDER.map((id) => {
              const entry = PLAN_CATALOG[id]
              const isCurrent =
                !ctx.isTrialing && ctx.effectiveMembership === id && id !== "free"
              const featured = id === "pro"
              return (
                <div
                  key={id}
                  className={`flex flex-col rounded-3xl border p-7 ${
                    featured ? "border-[#1B4FD8] bg-[#12213A] text-white shadow-xl" : "border-[#DDD6C8] bg-white"
                  }`}
                >
                  {featured && (
                    <div className="mb-4 inline-flex w-fit rounded-full bg-[#1B4FD8]/20 px-3 py-1 text-xs font-semibold text-[#7AAEFF]">
                      Más popular
                    </div>
                  )}
                  <p className={`text-sm font-medium ${featured ? "text-[#C8D5E8]" : "text-[#4A4438]"}`}>Plan</p>
                  <h2 className="mt-1 text-3xl font-extrabold">{entry.label}</h2>
                  <div className="mt-4 flex items-end gap-2">
                    <span className="text-4xl font-extrabold">
                      {id === "free" ? "$0" : formatCOP(entry.amount).replace(/\s?COP/, "")}
                    </span>
                    <span className={`text-sm ${featured ? "text-[#C8D5E8]" : "text-[#4A4438]"}`}>{entry.period}</span>
                  </div>

                  <ul className="mt-6 mb-8 space-y-3">
                    {entry.benefits.map((b) => (
                      <li key={b} className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full ${
                            featured ? "bg-[#1B4FD8]" : "bg-[#DEEAFF]"
                          }`}
                        >
                          <Check size={13} className={featured ? "text-white" : "text-[#1434A4]"} />
                        </span>
                        <span className={featured ? "text-[#E5EEF9]" : "text-[#12213A]"}>{b}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto">
                    {id === "free" ? (
                      <button
                        onClick={startFree}
                        className="w-full rounded-xl bg-[#E9F3FF] px-4 py-3 font-semibold text-[#12213A] transition hover:bg-[#DDEBFF]"
                      >
                        Empezar gratis
                      </button>
                    ) : isCurrent ? (
                      <Link
                        href="/subscription"
                        className={`block w-full rounded-xl px-4 py-3 text-center font-semibold ${
                          featured ? "bg-white/15 text-white" : "bg-[#EEF5FF] text-[#1434A4]"
                        }`}
                      >
                        Ya tienes este plan · Ver mi suscripción
                      </Link>
                    ) : (
                      <button
                        onClick={() => choosePaid(id as PaidPlanId)}
                        className="w-full rounded-xl bg-[#1B4FD8] px-4 py-3 font-semibold text-white transition hover:bg-[#163FB9]"
                      >
                        {planCtaLabel(resolvePlanIntent(ctx, id as PaidPlanId), id as PaidPlanId)}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <section aria-labelledby="comparativa" className="mt-16">
          <h2 id="comparativa" className="font-display text-2xl font-extrabold text-center sm:text-3xl">
            Compara los planes
          </h2>
          <div className="mt-6 overflow-x-auto rounded-3xl border border-[#DDD6C8] bg-white">
            <table className="w-full min-w-[640px] text-left text-sm">
              <caption className="sr-only">Comparativa de funciones por plan</caption>
              <thead>
                <tr className="border-b border-[#DDD6C8] bg-[#FAF8F4]">
                  <th scope="col" className="px-5 py-4 font-semibold">Funciones</th>
                  {ORDER.map((id) => (
                    <th key={id} scope="col" className="px-5 py-4 text-center font-semibold">
                      {PLAN_CATALOG[id].label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PLAN_COMPARISON.map((row) => (
                  <tr key={row.label} className="border-b border-[#EFE9DD] last:border-0">
                    <th scope="row" className="px-5 py-3.5 font-normal text-[#12213A]">{row.label}</th>
                    {ORDER.map((id) => {
                      const v = row.values[id]
                      return (
                        <td key={id} className="px-5 py-3.5 text-center text-[#4A4438]">
                          {v === true ? (
                            <>
                              <Check className="mx-auto h-4 w-4 text-[#1B4FD8]" aria-hidden="true" />
                              <span className="sr-only">Incluido</span>
                            </>
                          ) : v === false ? (
                            <>
                              <Minus className="mx-auto h-4 w-4 text-[#B7AE9C]" aria-hidden="true" />
                              <span className="sr-only">No incluido</span>
                            </>
                          ) : (
                            v
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-center text-xs text-[#7A6E60]">
            Los límites exactos de tu plan se muestran en Configuración &gt; Membresía.
          </p>
        </section>

        <section aria-labelledby="faq-precios" className="mt-16 mx-auto max-w-3xl">
          <h2 id="faq-precios" className="font-display text-2xl font-extrabold text-center sm:text-3xl">
            Preguntas sobre precios
          </h2>
          <div className="mt-6 flex flex-col gap-3">
            {PLAN_FAQ.map(({ q, a }) => (
              <details key={q} className="group rounded-2xl border border-[#DDD6C8] bg-white px-5 py-4">
                <summary className="cursor-pointer list-none font-semibold text-[#12213A] flex items-center justify-between gap-4">
                  {q}
                  <span aria-hidden="true" className="text-[#1B4FD8] transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-[#4A4438]">{a}</p>
              </details>
            ))}
          </div>
          <p className="mt-4 text-center text-sm text-[#4A4438]">
            ¿Más dudas? Revisa el <Link href="/ayuda" className="font-semibold text-[#1B4FD8] underline">centro de ayuda</Link>{" "}
            o la <Link href="/refunds" className="font-semibold text-[#1B4FD8] underline">política de reembolso</Link>.
          </p>
        </section>

        <div className="mt-10 flex items-center justify-center gap-3 text-sm text-[#4A4438]">
          <ShieldCheck className="h-4 w-4 text-[#1B4FD8]" />
          <span>Pago simulado. Sin cobro real ni integración de pasarela.</span>
        </div>

        <div className="mt-10 text-center">
          <Link href="/" className="inline-flex items-center gap-2 font-semibold text-[#1B4FD8]">
            Volver al inicio <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  )
}
