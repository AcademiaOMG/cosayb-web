"use client"

import { use } from "react"
import Link from "next/link"
import useSWR from "swr"
import { Loader2 } from "lucide-react"
import { billingQueries } from "@/lib/commerce/services"
import { BOOK, formatCOP } from "@/lib/commerce/catalog"

export default function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data, error, isLoading } = useSWR(id ? `billing/order/${id}` : null, () => billingQueries.order(id), {
    revalidateOnFocus: false,
  })

  return (
    <main className="min-h-screen bg-[#F5F0E8] px-4 py-10 text-[#12213A]">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1B4FD8]">Detalle de compra</p>
        <div className="mt-6 rounded-3xl border border-[#DDD6C8] bg-white p-8 shadow-sm">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-[#1B4FD8]" />
            </div>
          ) : error || !data ? (
            <div className="text-center">
              <h1 className="text-2xl font-extrabold">No encontramos esta compra</h1>
              <p className="mt-2 text-sm text-[#4A4438]">
                El número de orden no existe o no está asociado a tu cuenta.
              </p>
              <Link href="/" className="mt-6 inline-block rounded-xl bg-[#1B4FD8] px-5 py-3 font-semibold text-white">
                Volver al inicio
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-extrabold">Orden {data.operationNo}</h1>
              <div className="mt-6 space-y-1 rounded-2xl border border-[#DDD6C8] bg-[#FAF8F4] p-6 text-sm">
                <Row k="Producto" v={BOOK.title} />
                <Row k="Formato" v={data.format === "fisico" ? "Físico" : "Digital"} />
                <Row k="Valor" v={formatCOP(data.amount)} />
                <Row k="Estado" v={data.status === "PAID_SIMULATED" ? "Pagada (simulado)" : data.status} />
                <Row k="Método" v={data.method.toUpperCase()} />
                <Row
                  k="Fecha"
                  v={new Date(data.createdAt).toLocaleDateString("es-CO", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                />
              </div>
              <p className="mt-4 text-sm text-[#4A4438]">
                {data.format === "fisico"
                  ? "Nuestro equipo se pondrá en contacto contigo para coordinar la entrega."
                  : "El libro digital estará disponible desde tu cuenta."}
              </p>
              <p className="mt-2 text-xs text-[#7A6E60]">
                Esta operación corresponde a una simulación. No se realizó ningún cobro real.
              </p>
              <Link href="/" className="mt-6 inline-block rounded-xl bg-[#1B4FD8] px-5 py-3 font-semibold text-white">
                Volver al inicio
              </Link>
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
