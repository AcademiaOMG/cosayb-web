"use client"

import { Suspense } from "react"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import useSWR from "swr"
import { Loader2 } from "lucide-react"
import CheckoutGuard from "@/components/commerce/CheckoutGuard"
import SubscriptionCheckout from "@/components/commerce/SubscriptionCheckout"
import { usePermissions } from "@/hooks/usePermissions"
import { getCurrentPlan } from "@/lib/api"
import { PLAN_CATALOG, type PaidPlanId } from "@/lib/commerce/catalog"
import { resolvePlanIntent } from "@/lib/commerce/planState"

const PAID: PaidPlanId[] = ["pro", "academia"]

function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-[#F5F0E8]">
      <Loader2 className="h-6 w-6 animate-spin text-[#1B4FD8]" />
    </div>
  )
}

function CheckoutResolver({ plan }: { plan: PaidPlanId }) {
  useSearchParams() // mantiene la ruta como dinámica; el modo real lo deriva `intent`

  const { organization, hasOrganization, isLoading: permsLoading } = usePermissions()
  const { data: currentPlan, isLoading: planLoading } = useSWR(
    "current-plan",
    () => getCurrentPlan().then((r) => r.data),
    { revalidateOnFocus: false }
  )

  if (permsLoading || (hasOrganization && planLoading)) return <Loading />

  const ctx = {
    membership: (currentPlan?.membership ?? "free") as PaidPlanId | "free",
    effectiveMembership: (currentPlan?.effectiveMembership ?? "free") as PaidPlanId | "free",
    isTrialing: currentPlan?.isTrialing ?? false,
    hasOrganization,
  }
  const intent = resolvePlanIntent(ctx, plan)

  if (intent === "blocked") {
    return <AlreadyOnPlan plan={plan} currentPlan={ctx.effectiveMembership} />
  }

  const mode: "new" | "upgrade" = intent === "upgrade" ? "upgrade" : "new"

  return (
    <CheckoutGuard
      pending={{ kind: "subscription", plan, mode }}
      returnTo={`/checkout/subscription/${plan}${mode === "upgrade" ? "?mode=upgrade" : ""}`}
    >
      <SubscriptionCheckout
        plan={plan}
        intent={intent}
        mode={mode}
        needsBusiness={!hasOrganization}
        previousPlanLabel={
          ctx.effectiveMembership === "free" ? null : PLAN_CATALOG[ctx.effectiveMembership].label
        }
        orgName={organization?.name ?? null}
      />
    </CheckoutGuard>
  )
}

export default function SubscriptionCheckoutPage() {
  const params = useParams<{ plan: string }>()
  const plan = (params?.plan ?? "").toLowerCase()

  if (!PAID.includes(plan as PaidPlanId)) return <InvalidPlan />

  return (
    <Suspense fallback={<Loading />}>
      <CheckoutResolver plan={plan as PaidPlanId} />
    </Suspense>
  )
}

function InfoShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#F5F0E8] px-4 py-10 text-[#12213A]">
      <div className="mx-auto max-w-xl rounded-3xl border border-[#DDD6C8] bg-white p-8 text-center shadow-sm">
        {children}
      </div>
    </main>
  )
}

function InvalidPlan() {
  return (
    <InfoShell>
      <h1 className="text-3xl font-extrabold">Plan no encontrado</h1>
      <p className="mt-3 text-[#4A4438]">Ese plan no existe o no está disponible para adquirir.</p>
      <Link href="/planes" className="mt-6 inline-block rounded-xl bg-[#1B4FD8] px-5 py-3 font-semibold text-white">
        Ver planes
      </Link>
    </InfoShell>
  )
}

function AlreadyOnPlan({ plan, currentPlan }: { plan: PaidPlanId; currentPlan: string }) {
  return (
    <InfoShell>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1B4FD8]">Suscripción</p>
      <h1 className="mt-3 text-3xl font-extrabold">Ya tienes este plan activo</h1>
      <p className="mt-3 text-[#4A4438]">
        Tu negocio ya está en el plan{" "}
        <strong>{PLAN_CATALOG[currentPlan as PaidPlanId]?.label ?? currentPlan}</strong>
        {currentPlan === "academia" && plan === "pro"
          ? ". No es posible bajar de Academia a Pro desde aquí."
          : "."}
      </p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/subscription" className="rounded-xl bg-[#1B4FD8] px-5 py-3 font-semibold text-white">
          Ver mi suscripción
        </Link>
        <Link href="/planes" className="rounded-xl border border-[#DDD6C8] bg-white px-5 py-3 font-semibold text-[#12213A]">
          Ver planes
        </Link>
      </div>
    </InfoShell>
  )
}
