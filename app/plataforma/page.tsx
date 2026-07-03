"use client"

import useSWR from "swr"
import { platformGetMetrics } from "@/lib/api"
import { Building2, Users, CreditCard } from "lucide-react"

export default function MetricasPage() {
  const { data } = useSWR("platform-metrics", () =>
    platformGetMetrics().then((r) => r.data)
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold console-title">Métricas</h1>
        <p className="text-sm console-muted mt-1">Estado global de Cosayb</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="console-card">
          <div className="flex items-center gap-2 mb-3">
            <Building2 size={15} className="console-muted" />
            <p className="text-[11px] font-bold tracking-widest console-muted">ORGANIZACIONES</p>
          </div>
          <p className="text-4xl font-bold console-title">
            {data?.totalOrganizations ?? "—"}
          </p>
        </div>

        <div className="console-card">
          <div className="flex items-center gap-2 mb-3">
            <Users size={15} className="console-muted" />
            <p className="text-[11px] font-bold tracking-widest console-muted">USUARIOS</p>
          </div>
          <p className="text-4xl font-bold console-title">
            {data?.totalUsers ?? "—"}
          </p>
        </div>

        <div className="console-card">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard size={15} className="console-muted" />
            <p className="text-[11px] font-bold tracking-widest console-muted">POR MEMBRESÍA</p>
          </div>
          <div className="flex flex-col gap-1.5">
            {data?.organizationsByMembership.map((m) => (
              <div key={m.membership} className="flex justify-between items-center text-sm">
                <span className="console-muted capitalize">{m.membership}</span>
                <span className="font-bold console-title">{m.total}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
