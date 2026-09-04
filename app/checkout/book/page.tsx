"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import BookCheckout from "@/components/commerce/BookCheckout"
import type { BookFormat } from "@/lib/commerce/catalog"

function Inner() {
  const sp = useSearchParams()
  const raw = sp.get("format")
  const initialFormat: BookFormat = raw === "fisico" ? "fisico" : "digital"
  return <BookCheckout initialFormat={initialFormat} />
}

export default function BookCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center bg-[#F5F0E8]">
          <Loader2 className="h-6 w-6 animate-spin text-[#1B4FD8]" />
        </div>
      }
    >
      <Inner />
    </Suspense>
  )
}
