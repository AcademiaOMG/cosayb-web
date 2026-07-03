"use client"

import useSWR from "swr"
import { useState } from "react"
import Link from "next/link"
import { usePermissions } from "@/hooks/usePermissions"
import { platformListOrgs } from "@/lib/api"
import { Search, ChevronRight } from "lucide-react"

const TIER_STYLE: Record<string, { bg: string; color: string }> = {
  free: { bg: "var(--bg-secondary)", color: "var(--text-muted)" },
  pro: { bg: "var(--accent-light)", color: "var(--accent)" },
  academia: { bg: "#ECFDF5", color: "#16A34A" },
}

export default function OrganizacionesPage() {
  const { platformCan } = usePermissions()
  const [search, setSearch] = useState("")
  const { data } = useSWR(["platform-orgs", search], () =>
    platformListOrgs(search || undefined)
  )

  const canRead = platformCan("platform_organizations", "read")

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold console-title">Organizaciones</h1>
        <p className="text-sm console-muted mt-1">
          {data ? `${data.total} negocios registrados` : "Cargando…"}
        </p>
      </div>

      <div className="relative" style={{ maxWidth: 340 }}>
        <Search size={14} className="console-muted" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
        <input
          type="search"
          placeholder="Buscar organización…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="console-input w-full text-sm"
          style={{ height: 38, paddingLeft: 34, paddingRight: 12 }}
        />
      </div>

      <div className="flex flex-col gap-2">
        {(data?.data ?? []).map((org) => {
          const tier = TIER_STYLE[org.membership] ?? TIER_STYLE.free
          const row = (
            <div
              className="console-row flex items-center gap-4 px-4 py-3.5 transition-colors"
              style={{ cursor: canRead ? "pointer" : "default" }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold console-title truncate">{org.name}</p>
                <p className="text-xs console-muted mt-0.5">
                  Creada el {new Date(org.createdAt).toLocaleDateString("es-CO")}
                </p>
              </div>

              {org.status === "suspended" && (
                <span
                  className="text-[10px] font-bold px-2 py-1 rounded-full tracking-wider"
                  style={{ background: "#FEE2E2", color: "#B91C1C" }}
                >
                  SUSPENDIDA
                </span>
              )}

              <span
                className="text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
                style={{ background: tier.bg, color: tier.color }}
              >
                {org.membership}
              </span>

              {canRead && <ChevronRight size={16} className="console-muted" />}
            </div>
          )

          return canRead ? (
            <Link key={org.id} href={`/plataforma/organizaciones/${org.id}`}>{row}</Link>
          ) : (
            <div key={org.id}>{row}</div>
          )
        })}

        {(data?.data ?? []).length === 0 && (
          <p className="text-sm text-center py-10 console-muted">Sin resultados.</p>
        )}
      </div>
    </div>
  )
}
