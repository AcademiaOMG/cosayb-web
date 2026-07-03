"use client"

import useSWR from "swr"
import { useState } from "react"
import Link from "next/link"
import { usePermissions } from "@/hooks/usePermissions"
import { platformListUsers } from "@/lib/api"
import { Search, ChevronRight } from "lucide-react"

export default function UsuariosPage() {
  const { platformCan } = usePermissions()
  const [search, setSearch] = useState("")
  const { data, isLoading } = useSWR(["platform-users", search], () =>
    platformListUsers(search || undefined)
  )

  const canRead = platformCan("platform_users", "read")

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold console-title">Usuarios</h1>
        <p className="text-sm console-muted mt-1">
          {data ? `${data.total} usuarios registrados` : "Cargando…"}
        </p>
      </div>

      <div className="relative" style={{ maxWidth: 340 }}>
        <Search size={14} className="console-muted" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
        <input
          type="search"
          placeholder="Buscar por email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="console-input w-full text-sm"
          style={{ height: 38, paddingLeft: 34, paddingRight: 12 }}
        />
      </div>

      {isLoading && !data && (
        <div className="flex flex-col gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse console-row" style={{ height: 62 }} />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {(data?.data ?? []).map((u) => {
          const row = (
            <div
              className="console-row flex items-center gap-4 px-4 py-3.5"
              style={{ cursor: canRead ? "pointer" : "default" }}
            >
              <div
                className="w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: "var(--accent-light)", color: "var(--accent)" }}
              >
                {u.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold console-title truncate">{u.name}</p>
                <p className="text-xs console-muted truncate">{u.email}</p>
              </div>

              {/* Roles actuales del usuario */}
              <div className="flex gap-1.5 flex-wrap justify-end shrink-0" style={{ maxWidth: 320 }}>
                {u.platformRoles.map((r) => (
                  <span
                    key={r}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide"
                    style={{ background: "var(--accent-light)", color: "var(--accent)" }}
                  >
                    {r.replace("platform_", "⚡ ")}
                  </span>
                ))}
                {u.orgRoles.map((r, i) => (
                  <span
                    key={`${r.orgName}-${i}`}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border-light)" }}
                    title={r.orgName ?? undefined}
                  >
                    {r.roleName}{r.orgName ? ` · ${r.orgName}` : ""}
                  </span>
                ))}
                {u.platformRoles.length === 0 && u.orgRoles.length === 0 && (
                  <span className="text-[10px] console-muted">sin roles</span>
                )}
              </div>

              <span className="text-xs console-muted shrink-0">
                {new Date(u.createdAt).toLocaleDateString("es-CO")}
              </span>
              {canRead && <ChevronRight size={16} className="console-muted" />}
            </div>
          )

          return canRead ? (
            <Link key={u.id} href={`/plataforma/usuarios/${u.id}`}>{row}</Link>
          ) : (
            <div key={u.id}>{row}</div>
          )
        })}

        {data && data.data.length === 0 && (
          <p className="text-sm text-center py-10 console-muted">Sin resultados.</p>
        )}
      </div>
    </div>
  )
}
