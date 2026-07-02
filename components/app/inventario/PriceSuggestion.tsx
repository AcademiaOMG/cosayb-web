"use client"

import { useEffect, useState } from "react"
import Button from "@/components/ui/Button"

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"

interface PriceRef {
  pricePerKg: string
  variationPct: string | null
  market: string | null
  fetchedAt: string
}

interface CommunityPrice {
  avgPricePerKg: number
  confirmationCount: number
}

export interface PriceSuggestionProps {
  ingredientName: string
  onAccept: (pricePerUnit: number, weightGrams: number, source: string) => void
}

function useDebounce<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return debounced
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { credentials: "include" })
    if (!res.ok) return null
    const body = await res.json()
    return body.data ?? null
  } catch {
    return null
  }
}

export default function PriceSuggestion({ ingredientName, onAccept }: PriceSuggestionProps) {
  const name = useDebounce(ingredientName.trim(), 600)
  const [ref, setRef] = useState<PriceRef | null>(null)
  const [community, setCommunity] = useState<CommunityPrice | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (name.length < 3) {
      setRef(null)
      setCommunity(null)
      return
    }

    let cancelled = false
    setLoading(true)

    Promise.all([
      fetchJson<PriceRef>(`${API}/api/v1/ingredients/precio-referencia?nombre=${encodeURIComponent(name)}`),
      fetchJson<CommunityPrice>(`${API}/api/v1/ingredients/precio-comunidad?nombre=${encodeURIComponent(name)}`),
    ]).then(([refData, communityData]) => {
      if (cancelled) return
      setRef(refData)
      setCommunity(communityData && communityData.confirmationCount >= 3 ? communityData : null)
      setLoading(false)
    })

    return () => { cancelled = true }
  }, [name])

  if (name.length < 3 || (!loading && !ref && !community)) return null

  if (loading) {
    return (
      <div
        className="rounded-xl px-3 py-2.5 text-xs animate-pulse"
        style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}
      >
        Buscando referencia de precio...
      </div>
    )
  }

  const pricePerKg = ref ? parseFloat(ref.pricePerKg) : null
  const variation = ref?.variationPct ? parseFloat(ref.variationPct) : null

  return (
    <div className="flex flex-col gap-2">
      {ref && pricePerKg !== null && (
        <div
          className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5"
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-light)" }}
        >
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              Referencia de mercado
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold font-mono" style={{ color: "var(--text-primary)" }}>
                ${pricePerKg.toLocaleString("es-CO")}/kg
              </span>
              {variation !== null && (
                <span
                  className="text-xs font-medium px-1.5 py-0.5 rounded-md"
                  style={{
                    background: variation >= 0 ? "#FEF3C7" : "#D1FAE5",
                    color: variation >= 0 ? "#92400E" : "#065F46",
                  }}
                >
                  {variation >= 0 ? "+" : ""}{variation.toFixed(1)}%
                </span>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={() => onAccept(pricePerKg, 1000, "referencia_mercado")}
          >
            Usar
          </Button>
        </div>
      )}

      {community && (
        <div
          className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5"
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-light)" }}
        >
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              Precio reportado por usuarios ({community.confirmationCount} confirmaciones)
            </span>
            <span className="text-sm font-semibold font-mono" style={{ color: "var(--text-primary)" }}>
              ${community.avgPricePerKg.toLocaleString("es-CO")}/kg
            </span>
          </div>
          <Button
            variant="ghost"
            onClick={() => onAccept(community.avgPricePerKg, 1000, "comunidad")}
          >
            Usar
          </Button>
        </div>
      )}
    </div>
  )
}
