"use client"

// DEBUG TEMPORAL — Validar conexión con el backend
// Eliminar este archivo y reemplazar por la UI real una vez validada la conexión.

import { useEffect, useState } from "react"
import { getIngredientes, type ListResponse } from "@/lib/api"
import type { Ingrediente } from "@/types/domain"

export default function InventarioDebugPage() {
  const [result, setResult] = useState<ListResponse<Ingrediente> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getIngredientes()
      .then((data) => setResult(data))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : String(err))
      )
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ fontFamily: "monospace", padding: "1.5rem" }}>
      <h1 style={{ marginBottom: "1rem", fontSize: "1.1rem", fontWeight: 700 }}>
        🔌 DEBUG — GET /api/v1/ingredients
      </h1>

      {loading && <p style={{ color: "var(--text-muted)" }}>Cargando…</p>}

      {error && (
        <pre
          style={{
            background: "#2d1212",
            color: "#f87171",
            padding: "1rem",
            borderRadius: "8px",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
          }}
        >
          ❌ Error: {error}
        </pre>
      )}

      {result && (
        <>
          <p style={{ color: "var(--text-muted)", marginBottom: "0.5rem" }}>
            ✅ total: <strong>{result.total}</strong>
          </p>
          <pre
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-light)",
              padding: "1rem",
              borderRadius: "8px",
              overflow: "auto",
              maxHeight: "70vh",
              fontSize: "0.75rem",
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
            }}
          >
            {JSON.stringify(result, null, 2)}
          </pre>
        </>
      )}
    </div>
  )
}
