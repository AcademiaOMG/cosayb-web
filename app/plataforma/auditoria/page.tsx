"use client"

import useSWR from "swr"
import { platformListAudit } from "@/lib/api"
import { ScrollText } from "lucide-react"

export default function AuditoriaPage() {
  const { data, isLoading } = useSWR("platform-audit", () =>
    platformListAudit().then((r) => r.data)
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold console-title">Auditoría</h1>
        <p className="text-sm console-muted mt-1">
          Registro de acciones administrativas y accesos de plataforma a datos de tenants
        </p>
      </div>

      {isLoading && !data && (
        <div className="flex flex-col gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse console-row" style={{ height: 58 }} />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {(data ?? []).map((log) => (
          <div key={log.id} className="console-row flex items-start gap-3 px-4 py-3">
            <ScrollText size={14} className="console-muted mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold console-title">
                <span style={{ fontFamily: "monospace" }}>{log.action}</span>
              </p>
              <p className="text-xs console-muted mt-0.5">
                Actor: {log.actorUserId}
                {log.actorRoles.length > 0 && ` (${log.actorRoles.join(", ")})`}
                {" · "}{log.resourceType}
                {log.resourceId ? ` · ${log.resourceId}` : ""}
              </p>
              {log.justification && (
                <p className="text-xs mt-1 italic" style={{ color: "var(--accent)" }}>
                  &ldquo;{log.justification}&rdquo;
                </p>
              )}
            </div>
            <span className="text-[11px] console-muted shrink-0" style={{ fontFamily: "monospace" }}>
              {new Date(log.createdAt).toLocaleString("es-CO")}
            </span>
          </div>
        ))}
        {data && data.length === 0 && (
          <p className="text-sm text-center py-10 console-muted">Sin entradas de auditoría.</p>
        )}
      </div>
    </div>
  )
}
