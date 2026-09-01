"use client"

import { useEffect } from "react"
import Link from "next/link"

export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Checkout error:", error)
  }, [error])

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F0E8] px-4">
      <div className="w-full max-w-md rounded-3xl border border-[#DDD6C8] bg-white p-8 text-center shadow-sm">
        <div className="text-4xl">⚠️</div>
        <h1 className="mt-4 text-2xl font-extrabold text-[#12213A]">Algo salió mal</h1>
        <p className="mt-2 text-sm text-[#4A4438]">
          No pudimos completar la operación. Inténtalo nuevamente.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            onClick={reset}
            className="rounded-xl bg-[#1B4FD8] px-5 py-3 text-sm font-semibold text-white"
          >
            Intentar nuevamente
          </button>
          <Link
            href="/planes"
            className="rounded-xl border border-[#DDD6C8] bg-white px-5 py-3 text-sm font-semibold text-[#12213A]"
          >
            Volver
          </Link>
        </div>
      </div>
    </main>
  )
}
