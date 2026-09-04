"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { ArrowRight, Check, Loader2, ShieldCheck } from "lucide-react"
import { usePermissions } from "@/hooks/usePermissions"
import { getCurrentPlan } from "@/lib/api"
import { PLAN_CATALOG, formatCOP, type PlanId, type PaidPlanId } from "@/lib/commerce/catalog"
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
            Adquisición realista con autenticación, validaciones y confirmación. El pago es simulado — no hay cobro real.
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
