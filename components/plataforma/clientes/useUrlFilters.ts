"use client"

import { useCallback, useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

/** Estado de filtros guardado en la URL: se puede compartir, y «atrás» lo respeta. */
export function useUrlFilters<F>(parse: (p: URLSearchParams) => F, serialize: (f: F) => string): [F, (next: F) => void] {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const filters = useMemo(() => parse(new URLSearchParams(params.toString())), [params, parse])
  const set = useCallback(
    (next: F) => {
      const qs = serialize(next)
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [router, pathname, serialize]
  )
  return [filters, set]
}
