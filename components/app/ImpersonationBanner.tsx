"use client"

import { useState, useEffect } from "react"
import { ShieldAlert } from "lucide-react"
import { usePermissions } from "@/hooks/usePermissions"
import { elevateImpersonation, endImpersonation } from "@/lib/api"

function formatRemaining(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now()
  if (ms <= 0) return "00:00"
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

export default function ImpersonationBanner() {
  const { impersonation, mutate } = usePermissions()
  const [, forceTick] = useState(0)
  const [elevating, setElevating] = useState(false)
  const [reason, setReason] = useState("")
  const [ending, setEnding] = useState(false)

  useEffect(() => {
    if (!impersonation?.active) return
    const interval = setInterval(() => forceTick((n) => n + 1), 1000)
    return () => clearInterval(interval)
  }, [impersonation?.active])

  if (!impersonation?.active) return null

  async function handleElevate() {
    if (reason.trim().length < 10) return
    await elevateImpersonation(reason.trim())
    setElevating(false)
    setReason("")
    await mutate()
  }

  async function handleEnd() {
    if (ending) return
    setEnding(true)
    try {
      await endImpersonation()
    } catch (err) {
      setEnding(false)
      throw err
    }
    window.location.href = "/plataforma"
  }

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2 text-sm font-medium"
      style={{ background: "#F0B429", color: "#1F2937" }}
    >
      <div className="flex items-center gap-2">
        <ShieldAlert size={16} />
        <span>
          Viendo como soporte de Cosayb ({impersonation.mode === "write" ? "edición" : "solo lectura"}) — expira en{" "}
          {formatRemaining(impersonation.expiresAt)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {impersonation.mode === "read_only" && !elevating && (
          <button
            onClick={() => setElevating(true)}
            className="px-3 py-1 rounded-lg text-xs font-semibold"
            style={{ background: "#1F2937", color: "#fff", border: "none", cursor: "pointer" }}
          >
            Habilitar edición
          </button>
        )}
        {elevating && (
          <>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Motivo (mínimo 10 caracteres)" aria-label="Motivo (mínimo 10 caracteres)"
              className="px-2 py-1 rounded-lg text-xs"
              style={{ border: "1px solid #1F2937", minWidth: 0, flex: "1 1 200px" }}
            />
            <button
              onClick={handleElevate}
              disabled={reason.trim().length < 10}
              className="px-3 py-1 rounded-lg text-xs font-semibold disabled:opacity-50"
              style={{ background: "#1F2937", color: "#fff", border: "none", cursor: "pointer" }}
            >
              Confirmar
            </button>
          </>
        )}
        <button
          onClick={handleEnd}
          disabled={ending}
          className="px-3 py-1 rounded-lg text-xs font-semibold"
          style={{ background: "transparent", color: "#1F2937", border: "1px solid #1F2937", cursor: "pointer" }}
        >
          Salir
        </button>
      </div>
    </div>
  )
}
