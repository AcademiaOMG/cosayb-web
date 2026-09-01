"use client"

import Link from "next/link"
import useSWR from "swr"
import { Loader2 } from "lucide-react"
import { billingQueries } from "@/lib/commerce/services"
import { PLAN_CATALOG, formatCOP, type PaidPlanId } from "@/lib/commerce/catalog"

export default function SubscriptionPage() {
  const { data, error, isLoading } = useSWR("billing/my-subscription", () => billingQueries.mySubscription(), {
    revalidateOnFocus: false,
  })

  return (
    <main className="min-h-screen bg-[#F5F0E8] px-4 py-10 text-[#12213A]">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1B4FD8]">Suscripción</p>
        <h1 className="mt-2 text-4xl font-extrabold">Mi suscripción</h1>

        <div className="mt-8 rounded-3xl border border-[#DDD6C8] bg-white p-8 shadow-sm">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-[#1B4FD8]" />
            </div>
          ) : error ? (
            <div className="text-center">
              <p className="text-[#4A4438]">No pudimos cargar tu suscripción.</p>
              <Link href="/dashboard" className="mt-4 inline-block rounded-xl bg-[#1B4FD8] px-5 py-3 font-semibold text-white">
                Ir a mi cuenta
              </Link>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3 rounded-2xl border border-[#DDD6C8] bg-[#FAF8F4] p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-[#7A6E60]">Plan actual</p>
                  <p className="text-2xl font-extrabold">
                    {PLAN_CATALOG[(data?.effectiveMembership ?? "free") as PaidPlanId]?.label ?? "Free"}
                  </p>
                  {data?.isTrialing && data.daysLeft > 0 && (
                    <p className="mt-1 text-xs text-[#7A6E60]">Prueba Pro · {data.daysLeft} días restantes</p>
                  )}
                </div>
                <span className="w-fit rounded-full bg-[#E9F3FF] px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-[#1434A4]">
                  {data?.isTrialing ? "En prueba" : data?.effectiveMembership === "free" ? "Gratis" : "Activo"}
                </span>
              </div>

              {data?.subscription ? (
                <div className="mt-6 space-y-1 rounded-2xl border border-[#DDD6C8] bg-white p-6 text-sm">
                  <Row k="Valor" v={`${formatCOP(data.subscription.amount)} / mes`} />
                  <Row k="Estado" v={data.subscription.status === "ACTIVE" ? "Activa" : data.subscription.status} />
                  <Row k="Método" v={data.subscription.method.toUpperCase()} />
                  <Row
                    k="Desde"
                    v={new Date(data.subscription.createdAt).toLocaleDateString("es-CO", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  />
                  <Row k="Número de operación" v={data.subscription.operationNo} />
                  <p className="pt-3 text-xs text-[#7A6E60]">
                    Esta operación corresponde a una simulación. No se realizó ningún cobro real.
                  </p>
                </div>
              ) : (
                <p className="mt-6 text-sm text-[#4A4438]">
                  Aún no tienes una suscripción paga. Explora los planes para adquirir Pro o Academia.
                </p>
              )}

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/planes" className="rounded-xl bg-[#1B4FD8] px-5 py-3 text-center font-semibold text-white">
                  Ver planes
                </Link>
                <Link
                  href="/dashboard"
                  className="rounded-xl border border-[#DDD6C8] bg-white px-5 py-3 text-center font-semibold text-[#12213A]"
                >
                  Ir a mi cuenta
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <span className="text-[#7A6E60]">{k}</span>
      <span className="font-semibold">{v}</span>
    </div>
  )
}
